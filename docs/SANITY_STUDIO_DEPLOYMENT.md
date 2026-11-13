# Sanity Studio độc lập

Đăng nhập CRM hiện mặc định dùng email/mật khẩu lưu hash trong D1. Xem [hướng dẫn password](ADMIN_PASSWORD_SIGN_IN.md), gồm tạo/reset tài khoản và cách tạo/reset tài khoản và nghiệm thu Worker Free. Các bước Sanity bridge bên dưới chỉ áp dụng khi chủ động chọn mode `sanity`.

Studio ở `studio/`, website Next.js ở gốc. Đích Studio của DeanFlow: `https://deanflow.sanity.studio`, project `jy7u0ikv`, dataset `production`. Đây là cấu hình đích, không phải xác nhận hostname đã được đăng ký hoặc deploy. Khi clone cho khách hàng, thay cả ba giá trị và website URL.

## Chạy local

```bash
npm ci
npm --prefix studio ci
cp studio/.env.example studio/.env.development.local
npm run d1:migrate:local
```

Không ghi đè env đã có. Trong env phát triển của website, dùng:

```dotenv
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_SANITY_STUDIO_URL="http://localhost:3333"
SANITY_STUDIO_ORIGIN="http://localhost:3333"
NEXT_PUBLIC_ADMIN_AUTH_MODE="sanity"
```

Studio `.env.development.local` dùng `SANITY_STUDIO_WEB_URL=http://localhost:3000`, project/dataset phù hợp và `SANITY_STUDIO_ADMIN_AUTH_MODE=sanity`. Chạy `npm run dev` và `npm run dev:studio` ở hai terminal. Studio sử dụng Sanity/Vite, không chạy qua Next.js.

Sanity Manage → API → CORS origins: thêm website origin và Studio origin, gồm localhost:3000/3333 khi phát triển. Bật credentials cho các origin cần xác thực; không dùng wildcard hoặc thêm path. Endpoint CRM exchange có CORS riêng, chỉ chấp nhận `SANITY_STUDIO_ORIGIN`.

## Cấu hình production

Website `.env.local`/CI build và Wrangler vars phải đồng nhất:

```dotenv
NEXT_PUBLIC_BASE_URL="https://YOUR-WEBSITE"
NEXT_PUBLIC_SANITY_STUDIO_URL="https://deanflow.sanity.studio"
SANITY_STUDIO_ORIGIN="https://deanflow.sanity.studio"
NEXT_PUBLIC_ADMIN_AUTH_MODE="sanity"
```

Studio `studio/.env.production`:

```dotenv
SANITY_STUDIO_PROJECT_ID="jy7u0ikv"
SANITY_STUDIO_DATASET="production"
SANITY_STUDIO_API_VERSION="2025-07-01"
SANITY_STUDIO_WEB_URL="https://YOUR-WEBSITE"
SANITY_STUDIO_HOST="deanflow"
SANITY_STUDIO_TITLE="DeanFlow Studio"
SANITY_STUDIO_ADMIN_AUTH_MODE="sanity"
```

Các biến `SANITY_STUDIO_*` là public. Không đưa `SANITY_API_READ_TOKEN`, write token, JWT secret hoặc Cloudflare token vào Studio. Studio dùng client của tài khoản Sanity đang đăng nhập cho việc đọc/ghi importer. Không copy `.env.local` của website sang Studio.

Nếu dùng home page ID tùy chỉnh, đặt `SANITY_STUDIO_HOME_PAGE_ID` tương ứng để giữ guards và templates. `SANITY_STUDIO_ADMIN_AUTH_MODE=password` sẽ ẩn tool đăng nhập CRM; không thay đổi quyền CMS.

## Kiểm tra và TypeGen

```bash
npm run typegen
npm run typecheck
npm test
npm run verify:studio-boundary
npm run lint:security
npm run verify:migrations
npm run verify:release
npm --prefix studio run typecheck
npm --prefix studio test
npm run build:studio
npm run build:cf
npm run dry-run:cf
npm run perf:check -- --ci
```

`npm run typegen` extract schema trong Studio rồi quét queries của website, dùng web tsconfig để resolve alias `@/`. Kết quả duy nhất dùng bởi frontend là `src/sanity/types.ts`; commit file này khi schema/queries thay đổi. `studio/schema.json` và output build không commit. Website build không chạy CLI hoặc build Studio.

`sanity` và `styled-components` còn trong package gốc để đáp ứng peers hiện tại của `next-sanity`; plugin editor đã chuyển sang package Studio. Không suy ra chúng nằm trong Worker chỉ từ node_modules: `verify:studio-boundary`, manifest/traces và dry-run mới kiểm tra ranh giới deploy. Tích hợp script `scripts/test-custom-html-module.tsx` kiểm tra cả schema lẫn frontend được loại khỏi web typecheck; script preview schema chuyển sang `studio/scripts/`.

Importer/guides chạy và được đóng gói tại Studio, không còn `/api/sanity/import-*`, `/api/sanity/guide-*` hoặc `/api/sanity/ai-audit` trên website. Các endpoint này chỉ có caller nội bộ Studio tại lúc tách; nếu có automation ngoài repo, chuyển sang hợp đồng mới trước khi phát hành. SEO audit hiện dùng thư viện cục bộ của Studio.

## CI

`verify.yml` tách job web và Studio theo đường dẫn thay đổi. Code dùng chung kích hoạt cả hai. Schema/editor đổi chạy Studio checks và TypeGen drift; queries/types web đổi cũng chạy Studio. Các thay đổi chỉ nằm trong Studio không build Cloudflare. Mọi thay đổi `src/` đều kiểm tra TypeGen drift để bắt queries nằm rải rác trong pages/modules; nếu chỉ đổi web thì không build giao diện Studio.

`deploy-studio.yml` chạy thủ công, dùng production environment. Thiết lập variables `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_ADMIN_AUTH_MODE`, `SANITY_STUDIO_HOST=deanflow`; secret `SANITY_AUTH_TOKEN` chỉ phục vụ CLI deploy. Website workflow cần thêm variable `NEXT_PUBLIC_SANITY_STUDIO_URL`. Khi clone, sửa Wrangler vars và hostname phù hợp.

CI install theo từng lockfile: web `npm ci`, Studio `npm --prefix studio ci`. Node >=22.12, dùng npm. Root `.npmrc`/Studio `.npmrc` giữ chế độ peer resolution hiện hành của repo.

## Phát hành

1. Kiểm tra diff và các thay đổi khác đang có trong working tree. Backup D1 đích; áp dụng các migrations còn thiếu theo thứ tự, gồm `0014_sanity_login_bridge.sql`. Migration 0014 chỉ thêm bảng/index và tương thích website cũ.
2. Cấu hình origins trong Sanity CORS, biến môi trường website/Studio, secrets Worker và CI. Xác nhận hostname `deanflow` khả dụng và thuộc project đúng trước khi deploy; không ghi đè Studio của project khác.
3. Build/deploy Studio trước bằng `npm run deploy:studio -- --yes` sau khi `sanity login` hoặc cấu hình `SANITY_AUTH_TOKEN`. Có thể chạy trực tiếp `npm --prefix studio run deploy -- --yes`. Website cũ tiếp tục dùng Studio embedded trong giai đoạn này.
4. Build website với public URL Studio mới, chạy `npm run verify:production -- --artifact`, rồi `npm run deploy:cf`. `/studio` lúc này chỉ redirect; `/studio/workspace-login` cũ chuyển về bước start tại website. Không đổi project/dataset hoặc document IDs.
5. Smoke test bằng tài khoản thật: sửa/publish nội dung, tải media, ba importer và guide downloads; `/admin` → Studio → callback → CRM, logout, staff inactive/role change và mã hết hạn. Không log token hoặc query mã đăng nhập trong access/application logs.

Các lệnh backup/migrate/deploy remote không được chạy bởi bộ kiểm thử local. Giữ artifact/version website cũ và Studio cũ để rollback; không rollback bằng cách xóa D1. Nếu rollback web về bản embedded, schema và dữ liệu vẫn dùng cùng project/dataset. Các migration lịch sử có thể có tác động riêng; kiểm tra trạng thái remote trước khi áp dụng toàn chuỗi.

## Preview và giới hạn

Presentation mở `SANITY_STUDIO_WEB_URL`; client website dùng `NEXT_PUBLIC_SANITY_STUDIO_URL` cho click-to-edit. Profile `free` tiếp tục trả 409 khi bật draft mode và ẩn Live/Visual Editing. Muốn nghiệm thu preview, dùng website/profile preview riêng và build Studio với URL tương ứng; kiểm tra iframe/cookie giữa hai origin trên các trình duyệt mục tiêu.

Đăng nhập CRM là bridge của ứng dụng, không phải OAuth/OIDC provider do Sanity cung cấp. State tồn tại tối đa 5 phút, mã một lần tối đa 60 giây; session app tối đa một giờ. Quyền và chính sách tự tạo sales giữ nguyên, xem [đăng nhập Sanity](SANITY_ADMIN_SIGN_IN.md).
