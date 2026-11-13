# Website public tĩnh trên Cloudflare Free

Đăng nhập CRM hiện mặc định dùng email/mật khẩu lưu hash trong D1. Xem [hướng dẫn password](ADMIN_PASSWORD_SIGN_IN.md), gồm tạo/reset tài khoản và cách tạo/reset tài khoản và nghiệm thu Worker Free. Các bước Sanity bridge bên dưới chỉ áp dụng khi chủ động chọn mode `sanity`.

Profile `free` build website public bằng `output: 'export'` của Next.js.
Cloudflare phục vụ HTML, CSS, JS và payload chuyển trang trực tiếp từ Static Assets.
Các lượt truy cập này không cần gọi Worker để render trang hoặc đọc incremental cache.
Không thêm dịch vụ trả phí, R2 hay KV.

## Phạm vi

| Đường dẫn | Xử lý |
| --- | --- |
| Home, landing, blog, category, product, collection | HTML và navigation payload tĩnh |
| `/search`, `/checkout` | Giao diện tĩnh; search và submit gọi HTTP API |
| Sitemap, robots, RSS, llms.txt | File tĩnh cập nhật khi build |
| `/api`, `/admin`, `/quote`, `/order-success`, `/studio` và đường dẫn con | Worker, giữ kiểm tra session/quyền/receipt hiện có |
| Public URL chưa có trong bản build | Trang 404, không render Next.js theo request |

Nội dung chỉ lấy từ perspective `published`; preview/Live Content không nằm trong
bản export. API nhận lead, tìm kiếm, checkout, admin và cron vẫn chịu giới hạn
CPU/request, số request và quota D1 của Free. Việc tách trang tĩnh không chứng minh
các API này đã đáp ứng ngân sách tài nguyên.

## Build và kiểm tra

Giữ `NEXT_PUBLIC_DEPLOYMENT_PROFILE=free` đồng nhất trong môi trường build và
`wrangler.jsonc`. Chạy từ thư mục gốc:

```bash
npm run typecheck
npm test
npm run verify:studio-boundary
npm run lint:security
npm run verify:migrations
npm run build:cf
node scripts/verify-static-storefront.cjs
npm run verify:production -- --artifact
npm run dry-run:cf
npm run perf:check -- --ci
```

Build gồm hai bước: OpenNext tạo Worker cho các route runtime; Next.js export
website public trong `.static-storefront-build/` sau khi loại các route riêng tư.
Các thư mục nguồn đang làm việc không bị di chuyển hoặc xóa.

Artifact cuối:

- `.open-next/free-assets/`: assets của cả public export và Worker.
- `.open-next/free-static-manifest.json`: danh sách HTML, build ID và hash cấu hình.
- `.open-next/deployment-profile.json`: profile, auth mode và cờ static storefront.
- `wrangler.free.generated.json`: cấu hình triển khai sinh từ `wrangler.jsonc`.

Cấu hình sinh dùng `worker-free.ts`, assets-first, HTML bỏ trailing slash và
static 404. Chỉ các prefix runtime trong `shared/runtime-routes.json` chạy Worker
trước assets. Public URL không khớp file sẽ trả 404; không fallback vào Next.js.
Generated config và staging directory đã được gitignore; không sửa tay.

Gate từ chối cấu hình đã thay đổi, build Worker khác build ID, thiếu HTML/payload
navigation hoặc HTML riêng tư. Redirect CMS dạng đường dẫn tĩnh và named parameter
được chuyển sang `_redirects`. Redirect có regex, wildcard hoặc điều kiện header/cookie
chưa được chuyển tự động: build sẽ báo lỗi để xử lý mapping cụ thể.

## Preview và nghiệm thu

```bash
npm run preview:cf
```

Kiểm tra trong trình duyệt:

1. Mở trực tiếp home, blog, product, URL có query và URL có dấu tiếng Việt.
2. Click Link giữa các trang public. Network phải tải payload `.txt`/segment tĩnh;
   không gửi Server Action vào trang HTML và không cần render Next.js.
3. Search gọi `/api/search`; kết quả vẫn có debounce, pagination và chống response cũ.
4. Form gọi `/api/leads` hoặc API tương ứng. Checkout sang `/order-success` bằng
   document navigation để giữ receipt/query tại Worker.
5. Link sang admin/quote/Studio dùng document navigation. Không có file HTML của
   các route này trong public export; dữ liệu riêng tư không được public-cache.
6. Không có consent thì không ghi attribution. Sau khi đồng ý marketing, campaign
   được capture trong trình duyệt trên các navigation thật.
7. URL public không tồn tại trả 404, không trả trang chủ bằng status 200.

Để dùng D1 tạm khi kiểm tra local, thêm
`-- --persist-to=/private/tmp/deanflow-static-preview-state` vào lệnh preview.
Không dùng kết quả local để tuyên bố CPU trên production đã đạt Free.

## Deploy và cập nhật nội dung

Sau khi các bước kiểm tra đạt và deployment được cho phép:

```bash
npm run deploy:cf
```

Luôn dùng các script `preview:cf`, `dry-run:cf`, `deploy:cf`: chúng chọn đúng cấu
hình theo artifact. **Không dùng `npx wrangler deploy` trực tiếp với
`wrangler.jsonc` cho Free**, vì cấu hình đó phục vụ Worker build gốc thay vì bản
public export. `deploy:cf` không tự build lại.

Sau mỗi lần publish/sửa/xóa nội dung Sanity, chạy lại build, kiểm tra và deploy.
Chưa có webhook tự động rebuild được cấu hình bởi thay đổi này. Slug mới chưa
build sẽ trả 404. Cache HTML được revalidate theo cơ chế Static Assets; JS có hash
dùng immutable cache. Không dùng cache lâu cho HTML để tránh trộn phiên bản.

Sau deploy, kiểm tra HTML và navigation public trong Worker logs: các request
khớp assets không được đi vào handler Worker. Đo CPU riêng cho API/admin/cron,
theo dõi `exceededCpu`, `exceededMemory` và backlog outbox. Bản sửa navigation
không thay thế việc nghiệm thu tài nguyên của phần runtime.

## Quay về profile standard

Đổi profile đồng nhất ở build/Worker vars, build lại và chạy các checks.
Các script sẽ chọn OpenNext như trước. Không tái sử dụng artifact Free cho standard
hoặc ngược lại; đổi profile không xóa dữ liệu D1/Sanity.
