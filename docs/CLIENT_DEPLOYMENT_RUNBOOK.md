# Quy trình clone và triển khai DeanFlow cho khách hàng

Đăng nhập CRM mặc định dùng email/mật khẩu lưu hash scrypt trong D1. Xem [hướng dẫn password](ADMIN_PASSWORD_SIGN_IN.md), gồm tạo/reset tài khoản, xử lý rate limit và nghiệm thu Worker Free. Các bước Sanity bridge chỉ áp dụng khi chủ động chọn mode `sanity`.

Cập nhật: 2026-11-13. Dùng cho repo hiện tại: Next.js 16 (React 19) → OpenNext → Cloudflare Workers, D1 binding `DB`, Cloudflare Analytics Engine binding `ANALYTICS`, Sanity Studio tại `/studio`. Thực hiện từng bước; chỉ tiếp tục khi bước trước thành công. Các ví dụ `acme` là placeholder, cần thay bằng thông tin khách hàng.

Tài liệu này là quy trình triển khai, không xác nhận bản clone đã nghiệm thu. Deploy thành công và health 200 chưa chứng minh đăng nhập, email hay luồng nghiệp vụ hoạt động.

## 1. Chuẩn bị hồ sơ triển khai

Mỗi khách hàng có repo riêng, Worker riêng, D1 riêng, Sanity project riêng và secrets riêng. Không nhân bản dữ liệu khách hàng, tài khoản admin hoặc secrets từ hệ thống đang chạy. Staging dùng tài nguyên riêng với production; không chỉ đổi domain nhưng vẫn trỏ cùng database.

| Thông tin | Ví dụ cần thay |
| --- | --- |
| Repo khách hàng | `git@github.com:YOUR_ORG/acme-site.git` |
| Cloudflare account | Account ID 32 ký tự hex của khách hàng |
| Worker | `acme-site` |
| D1 | `acme-db`, UUID lấy sau khi tạo |
| Analytics Engine | Dataset riêng (vd: `acme_analytics`) |
| Sanity | Project mới, dataset `production` |
| URL ban đầu | `https://acme-site.YOUR_SUBDOMAIN.workers.dev` |
| URL bàn giao | Domain riêng hoặc URL Workers đã thống nhất |
| Email | Domain gửi đã xác minh, người nhận thử nghiệm |
| Chủ sở hữu | Người quản lý billing, repo, CMS, DNS và admin |
| Phiên bản | Commit/tag mã nguồn được chọn và ngày triển khai |

Lập kế hoạch Workers Paid cho bản production có SSR và xác thực mật khẩu, sau khi xác nhận chi phí với khách hàng. Workers Free có giới hạn CPU 10 ms/request; không lấy việc trang chủ chạy được làm bằng chứng đăng nhập hoặc cron chạy được. Kiểm tra giới hạn và billing hiện hành trong [tài liệu Workers](https://developers.cloudflare.com/workers/platform/limits/).

Nếu khách hàng bắt buộc dùng Cloudflare Free giai đoạn đầu, xem [review Free-plan](reviews/FREE_PLAN_READINESS_REVIEW_2026_11_12.md) trước: cần chọn lại phạm vi SSR, xác thực và delivery, không chỉ đổi subscription rồi triển khai nguyên cấu hình đầy đủ.

### Profile Free trong mã nguồn

`NEXT_PUBLIC_DEPLOYMENT_PROFILE=free` phải đồng nhất trong local/build/Worker vars. Mặc định `/admin` dùng email/mật khẩu trong D1, hash bằng scrypt native, không cần password service hoặc tài khoản Sanity cho CRM. Xem [hướng dẫn password](ADMIN_PASSWORD_SIGN_IN.md). Nếu chủ động dùng mode `sanity`, áp dụng toàn bộ migration và làm theo [hướng dẫn Sanity](SANITY_ADMIN_SIGN_IN.md). Mọi chế độ vẫn cần nghiệm thu CPU/runtime thật trước bàn giao.

Trong build production Free: website public xuất HTML và payload navigation tĩnh, phục vụ trực tiếp từ Static Assets; Sanity đọc published snapshot, không đọc draft cookies; Live Content/Visual Editing tắt, reviews/comments và submission tương ứng tạm tắt, admin refresh 5 phút. Telemetry Web Vitals và Funnel được stream trực tiếp về Cloudflare Analytics Engine (zero-D1-write). Studio vẫn biên tập được, nhưng nội dung public chỉ cập nhật khi build/deploy lại. Đây là profile tối ưu tài nguyên có chủ đích; dữ liệu D1 hiện có không bị xóa.

`NEXT_PUBLIC_VITALS_SAMPLE_RATE` cho phép đặt tỉ lệ beacon 0..1 theo document; local snapshot vẫn được giữ. `D1_LOG_METRICS=true` chỉ dùng tạm để ghi operation, rows read/written và duration, không ghi SQL hay parameters.

Capture lead/popup/order hiện chỉ ghi dữ liệu/outbox và trả receipt; cron xử lý delivery sau đó, không còn inline drain trong request capture. `OUTBOX_MAX_JOBS_PER_INVOCATION=1` trong cấu hình hiện tại giới hạn throughput; không tắt cron khi còn job. Monitor backlog và thời gian chờ trước khi bật email/dossier.

Xem [cách triển khai website public tĩnh](STATIC_STOREFRONT_DEPLOYMENT.md). Build Free tạo Worker và bản export public riêng; dùng `npm run preview:cf`, `npm run dry-run:cf`, `npm run deploy:cf` để chọn đúng cấu hình. Không deploy trực tiếp `wrangler.jsonc` cho profile Free.

Sau `npm run build:cf`, lifecycle postbuild ghi `.open-next/deployment-profile.json`. `npm run deploy:cf` kiểm tra artifact cùng profile trước upload; không deploy lại artifact từ profile khác. Mọi lần đổi profile phải build lại và chạy checks trên đúng artifact.

## 2. Tạo repo khách hàng và cài công cụ

Chuẩn bị repo riêng từ bản mã nguồn đã kiểm tra; không copy `.env.local`, `studio/.env*` (trừ `.env.example`), `studio/node_modules/`, `studio/dist/`, `.wrangler/`, `.open-next/`, `backups/`, `node_modules/` hoặc thư mục `.git` của dự án cũ vào bản phát hành mới. Nếu chuyển cả lịch sử Git, phải kiểm tra secret trong lịch sử trước.

Sau khi repo khách hàng đã được tạo và điền mã nguồn sạch:

```bash
git clone git@github.com:YOUR_ORG/acme-site.git
cd acme-site
nvm install
nvm use
npm ci
python3 --version
```

Dùng Node theo `.nvmrc`, npm và `package-lock.json`. Python 3 dùng cho migration verifier và script chuẩn bị admin. Nếu không dùng nvm, cài Node tương ứng bằng công cụ quản lý của máy.

Trước khi clone cho khách, bảo đảm repo nguồn đã commit script `scripts/prepare-first-admin.py` và các bản sửa cần phát hành; clone không mang theo file chưa commit.

## 3. Tách Sanity và chuẩn bị nội dung

1. Tạo project Sanity thuộc tổ chức phù hợp, tạo dataset `production`; không để bản clone dùng project ID của DeanFlow.
2. Mời người biên tập bằng tài khoản Sanity và cấp quyền phù hợp. Tài khoản Sanity Studio độc lập với tài khoản D1 `/admin`.
3. Tạo read token dành riêng project. Repo dùng token này cho Live Content và published fetch; chỉ cấp quyền đọc tối thiểu phù hợp, không dùng write/admin token ở vị trí này.
4. Chỉ tạo write token server nếu bật chức năng cần ghi/upload Sanity, ví dụ upload media review. Không đặt token trong biến `NEXT_PUBLIC_*`.
5. Trong Sanity Manage → API → CORS origins, thêm `http://localhost:3000` và origin HTTPS của website. Bật Allow credentials cho origin Studio riêng, thêm cả localhost:3333 và hostname Sanity Hosting của khách hàng; nhập origin, không thêm `/studio` và không dùng wildcard rộng. Xem [Sanity CORS](https://www.sanity.io/docs/content-lake/cors).
6. Chỉ nhập nội dung template đã làm sạch. Kiểm tra logo, email, điện thoại, tracking ID, webhook, link, chứng nhận và media không thuộc khách hàng cũ.

Studio đã tách thành ứng dụng `studio/`, cài dependency và deploy lên Sanity Hosting riêng. `/studio` của website chỉ redirect. Làm theo [runbook Studio](SANITY_STUDIO_DEPLOYMENT.md) để cấu hình hostname, đăng nhập giữa hai origin, CORS và TypeGen. Không dùng hostname `deanflow` cho khách hàng khác.

### Tạo `.env.local`

Nếu chưa có file, copy `.env.example` thành `.env.local`; nếu đã có thì chỉnh file hiện tại, tránh ghi đè secrets đã tạo. Thay project ID mẫu trong file. Tối thiểu cần:

```dotenv
NEXT_PUBLIC_BASE_URL="https://acme-site.YOUR_SUBDOMAIN.workers.dev"
NEXT_PUBLIC_SANITY_PROJECT_ID="YOUR_CLIENT_PROJECT_ID"
NEXT_PUBLIC_SANITY_DATASET="production"
NEXT_PUBLIC_ADMIN_AUTH_MODE="password"
NEXT_PUBLIC_DEPLOYMENT_PROFILE="free"
NEXT_PUBLIC_SANITY_HOME_PAGE_ID="homePage"
NEXT_PUBLIC_SITE_NAME="Acme"
NEXT_PUBLIC_SANITY_STUDIO_TITLE="Acme Studio"
NEXT_PUBLIC_SANITY_STUDIO_URL="https://acme.sanity.studio"
SANITY_STUDIO_ORIGIN="https://acme.sanity.studio"
SANITY_API_READ_TOKEN="YOUR_NEW_READ_TOKEN"
ADMIN_JWT_SECRET="YOUR_NEW_RANDOM_SECRET"
D1_ALLOW_MEMORY="false"
ALLOW_TRUSTED_CUSTOM_HTML="false"
CLOUDFLARE_ACCOUNT_ID="YOUR_CLOUDFLARE_ACCOUNT_ID"
CLOUDFLARE_ANALYTICS_API_TOKEN="YOUR_ANALYTICS_READ_TOKEN"
```

Tạo khóa admin riêng bằng `openssl rand -hex 32`; lưu trong trình quản lý mật khẩu và `.env.local`. Đây là khóa ký session, không phải mật khẩu đăng nhập admin. Không gửi secrets qua chat hoặc commit vào Git.

`NEXT_PUBLIC_*` được đóng vào bundle khi build: thay chúng cần build lại. Chỉ chỉnh runtime vars trên Dashboard không cập nhật bundle đã build.

### Nội dung tối thiểu trước build/nghiệm thu

Chạy local với D1 local đã migrate ở bước 5; mở `/studio`, tạo và publish Site settings, theme, header/footer và Home Page. Đặt Home Page `metadata.slug.current = index`, thêm modules, SEO và navigation. Với dataset mới, đặt `NEXT_PUBLIC_SANITY_HOME_PAGE_ID=homePage` để tránh fallback UUID home của dự án gốc. Nếu nhập template có home ID khác thì dùng đúng ID đã nhập. Không để draft là nội dung duy nhất của website public.

## 4. Đăng nhập Cloudflare, tạo D1 và cấu hình Wrangler

```bash
# Xóa biến deploy token nếu có sẵn trong shell hiện tại để tránh xung đột quyền
unset CLOUDFLARE_API_TOKEN

npx wrangler login
npx wrangler whoami
npx wrangler d1 list
npx wrangler d1 create acme-db
```

Xác nhận đúng Cloudflare account trước khi tạo. Lưu Account ID và D1 UUID trả về; không chọn database đang phục vụ khách hàng khác.

### Sửa `wrangler.jsonc` trong repo khách hàng

Giữ cấu hình Worker/assets/cron/analytics của repo, thay `name`, `account_id`, database và toàn bộ public vars theo khách hàng. Cấu hình chuẩn:

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "acme-site",
  "account_id": "YOUR_CLOUDFLARE_ACCOUNT_ID",
  "workers_dev": true,
  "preview_urls": false,
  "main": "./worker.ts",
  "compatibility_date": "2026-11-10",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "acme-db",
      "database_id": "YOUR_NEW_D1_UUID",
      "migrations_dir": "migrations"
    }
  ],
  "analytics_engine_datasets": [
    {
      "binding": "ANALYTICS",
      "dataset": "acme_analytics"
    }
  ],
  "triggers": { "crons": ["* * * * *"] },
  "vars": {
    "NEXT_PUBLIC_BASE_URL": "https://acme-site.YOUR_SUBDOMAIN.workers.dev",
    "NEXT_PUBLIC_SANITY_PROJECT_ID": "YOUR_CLIENT_PROJECT_ID",
    "NEXT_PUBLIC_SANITY_DATASET": "production",
    "NEXT_PUBLIC_ADMIN_AUTH_MODE": "password",
    "NEXT_PUBLIC_DEPLOYMENT_PROFILE": "free",
    "NEXT_PUBLIC_SANITY_HOME_PAGE_ID": "homePage",
    "NEXT_PUBLIC_SITE_NAME": "Acme",
    "NEXT_PUBLIC_SANITY_STUDIO_TITLE": "Acme Studio",
    "NEXT_PUBLIC_SANITY_STUDIO_URL": "https://acme.sanity.studio",
    "SANITY_STUDIO_ORIGIN": "https://acme.sanity.studio",
    "D1_ALLOW_MEMORY": "false",
    "ALLOW_TRUSTED_CUSTOM_HTML": "false",
    "OUTBOX_MAX_JOBS_PER_INVOCATION": "1",
    "D1_LOG_METRICS": "false",
    "ANALYTICS_DATASET": "acme_analytics"
  }
}
```

Giữ binding **`DB`** và **`ANALYTICS`**: code dùng `env.DB` và `env.ANALYTICS`. Khai báo rõ `account_id` trong `wrangler.jsonc` để Wrangler không bao giờ gặp lỗi tự động dò account ID khi deploy.

Lấy subdomain Workers thực từ tài khoản Cloudflare, không suy ra từ tên đăng nhập. URL phải trùng `.env.local` và `vars.NEXT_PUBLIC_BASE_URL`.

## 5. Áp dụng migrations D1

```bash
npm run d1:migrate:local
npm run verify:migrations
```

Dùng database mới cho lần triển khai đầu. Nếu nâng cấp database đã có dữ liệu, backup trước:

```bash
npm run d1:backup -- acme-db --remote
```

Áp dụng trên đúng D1 khách hàng; kiểm tra tên và UUID Wrangler in ra trước khi xác nhận:

```bash
npm run d1:migrate:remote
npx wrangler d1 migrations list DB --remote
```

Hiện hệ thống có 17 migrations (`0000`–`0016`). Toàn bộ migration phải được áp dụng đầy đủ. Migration `0016` mở rộng bảng `orders` chứa attribution/journey/geo và cập nhật trigger `wholesale_rfq_to_lead` đảm bảo RFQ tự động sinh Lead mà không làm mất dữ liệu attribution.

## 6. Cấu hình secrets trên Worker

Chạy trong repo khách hàng sau khi đã đổi Worker name. Các lệnh hỏi giá trị riêng, nhập trực tiếp ở prompt:

```bash
npx wrangler secret put ADMIN_JWT_SECRET
npx wrangler secret put SANITY_API_READ_TOKEN
npx wrangler secret put CLOUDFLARE_ACCOUNT_ID
npx wrangler secret put CLOUDFLARE_ANALYTICS_API_TOKEN
```

Nếu Worker mới chưa tồn tại và Wrangler hỏi tạo Worker, xác nhận đúng tên khách hàng rồi chọn Yes. Dùng cùng giá trị đã cấu hình local để dễ kiểm tra; giá trị local không tự được upload lên Cloudflare.

| Secret / biến | Khi nào cần |
| --- | --- |
| `ADMIN_JWT_SECRET` | Bắt buộc để ký session admin; ít nhất 32 byte (`openssl rand -hex 32`) |
| `SANITY_API_READ_TOKEN` | Bắt buộc cho cấu hình fetch CMS của repo |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID Cloudflare để Admin truy vấn Analytics Engine SQL API |
| `CLOUDFLARE_ANALYTICS_API_TOKEN` | Token Cloudflare quyền `Account Analytics: Read` để hiển thị Edge Funnel & Web Vitals rollups (dùng tên này để không xung đột với quyền deploy của Wrangler) |
| `SANITY_API_WRITE_TOKEN` | Khi bật chức năng server ghi/upload vào Sanity |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Khi nghiệm thu gửi email; dùng sender/domain đã xác minh |
| `OUTBOX_CRON_SECRET` | Khi gọi HTTP drain endpoint bằng scheduler ngoài; cron Worker hiện có không cần secret này |
| `ORDER_WEBHOOK_URL`, `LEAD_WEBHOOK_URL`, `NOTIFICATION_WEBHOOK_URL` | Khi bật integration webhook tương ứng |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Khi bật cảnh báo đơn/lead qua Telegram |

Kiểm tra danh sách secrets đã nạp bằng:
```bash
npx wrangler secret list
```

## 7. Kiểm tra, commit và push

Chạy bộ kiểm thử tự động toàn diện:

```bash
npm run typecheck &&
npm test &&
npm run lint:security &&
npm run verify:migrations &&
npm run verify:studio-boundary &&
npm run verify:release &&
npm audit --audit-level=high
```

Khi sửa schema/GROQ, chạy thêm `npm run typegen`, kiểm tra diff và giữ types/extract đồng bộ.

Xác nhận `.env.local`, build artifacts và backups được ignore:

```bash
git check-ignore .env.local .dev.vars backups/ .wrangler/ .open-next/ .static-storefront-build/
git status --short
git add -A -- . ':(exclude)yarn.lock'
git diff --cached --stat
```

Xem nội dung thay đổi đã stage, đảm bảo không commit token/secret.

```bash
git commit -m "chore: configure client deployment"
git push origin main
git rev-parse HEAD
```

Ghi commit SHA vào hồ sơ triển khai.

## 8. Build và deploy Static Storefront + Worker

Build cả hai artifact (Worker OpenNext và bản xuất tĩnh Static Storefront):

```bash
npm run build:cf &&
node scripts/verify-static-storefront.cjs &&
npm run verify:production -- --artifact &&
npm run dry-run:cf &&
npm run perf:check -- --ci
```

Chỉ tiếp tục khi tất cả pass. Build xong rồi mới deploy: script `deploy:cf` **không tự build lại**; nó chạy production gate ở predeploy rồi upload artifact có sẵn từ `wrangler.free.generated.json`:

```bash
npm run deploy:cf
```

> [!WARNING]
> **Không chạy `npx wrangler deploy` trực tiếp với `wrangler.jsonc`** cho profile `free`, vì lệnh đó sẽ phục vụ Worker build gốc thay vì bản static export. Luôn dùng `npm run deploy:cf`.

Lưu URL, Version ID, commit SHA, ngày và kết quả deploy. Log upload phải có binding `env.DB`, `env.ANALYTICS`, `ASSETS`, public vars và cron theo cấu hình.

## 9. Tạo hoặc đặt lại tài khẩu Admin đầu tiên

### Mặc định: Chế độ Password (`NEXT_PUBLIC_ADMIN_AUTH_MODE="password"`)

Khi tạo tài khoản Super Admin đầu tiên cho cơ sở dữ liệu mới (bảng `admin_users` chưa có bản ghi):

```bash
python3 scripts/prepare-first-admin.py
npx wrangler d1 execute DB --remote --file=backups/first-admin.sql
rm -f backups/first-admin.sql
```

Script sẽ hỏi email, tên và mật khẩu (nhập kín, tối thiểu 12 ký tự, hash bằng scrypt native). Xác nhận output `created: 1`.

#### Đặt lại mật khẩu cho tài khoản đã có (hoặc đổi từ hash bcrypt cũ sang scrypt)

Nếu database đã có tài khoản (ví dụ tài khoản admin cũ dùng hash bcrypt hoặc quên mật khẩu), chạy:

```bash
python3 scripts/prepare-first-admin.py --reset-password
npx wrangler d1 execute DB --remote --file=backups/reset-admin-password.sql
rm -f backups/reset-admin-password.sql
```

Xác nhận output `updated: 1`.

### Tùy chọn: Chế độ Sanity (`NEXT_PUBLIC_ADMIN_AUTH_MODE="sanity"`)

Nếu khách hàng chọn xác thực qua Sanity Studio:

```bash
python3 scripts/prepare-first-admin.py --sanity
npx wrangler d1 execute DB --remote --file=backups/first-admin.sql
rm -f backups/first-admin.sql
```

Chi tiết tại [hướng dẫn Sanity sign-in](SANITY_ADMIN_SIGN_IN.md).

## 10. Kiểm tra sau deploy và xử lý sự cố

Thay URL bên dưới bằng URL khách hàng:

```bash
curl -i https://acme-site.YOUR_SUBDOMAIN.workers.dev/api/health
```

Kỳ vọng HTTP 200 và `{"ok":true,"database":"connected"}`. Sau đó đăng nhập vào `/admin` và kiểm tra `/api/admin/health`.

### Bảng xử lý sự cố thường gặp

| Triệu chứng | Nguyên nhân & Cách xử lý |
| --- | --- |
| `Failed to automatically retrieve account IDs` khi chạy Wrangler | Shell đang có biến `CLOUDFLARE_API_TOKEN` hạn chế quyền, hoặc `wrangler.jsonc` thiếu `account_id`. Chạy `unset CLOUDFLARE_API_TOKEN`, thêm `account_id` vào `wrangler.jsonc`, rồi chạy `npx wrangler login`. |
| Đăng nhập admin báo `401 Invalid credentials` dù gõ đúng mật khẩu | Database đang lưu hash bcrypt cũ (`$2...`) hoặc marker Sanity. Chạy `python3 scripts/prepare-first-admin.py --reset-password` và execute `--remote` để cập nhật hash sang `scrypt`. |
| Đăng nhập admin báo `429 Too many attempts` | Đã nhập sai quá 5 lần trong 15 phút. Xóa bảng giới hạn bằng: `npx wrangler d1 execute DB --remote --command="DELETE FROM request_limits;"`. |
| Đăng nhập admin báo `503 Authentication service unavailable` | Worker chưa được nạp secret `ADMIN_JWT_SECRET` (>= 32 bytes). Nạp bằng: `npx wrangler secret put ADMIN_JWT_SECRET`. |
| `Missing/invalid build profile artifact` | Bạn chưa chạy `npm run build:cf` trước khi deploy. Chạy `npm run build:cf` để sinh `.open-next/deployment-profile.json` và bản export tĩnh. |
| Thẻ Edge Funnel báo `SQL Query Unconfigured` | Chưa nạp `CLOUDFLARE_ACCOUNT_ID` hoặc `CLOUDFLARE_ANALYTICS_API_TOKEN` trên Worker. Nạp 2 secret này với token có quyền `Account Analytics: Read`. |
| Thẻ Edge Funnel báo `0` cho mọi chỉ số | Bảng `acme_analytics` chỉ tự tạo sau khi có datapoint đầu tiên được gửi từ website. Mở website và click thử vài trang/nút CTA để phát sinh beacon. |
| HTTP 503, Cloudflare 1102 (`exceededCpu`) | Worker vượt hạn mức CPU (thường do SSR hoặc hash scrypt trên Worker Free). Xem invocation log qua `npx wrangler tail acme-site`. Kiểm tra gói Worker và cân nhắc nâng lên Workers Paid nếu traffic cao. |
| Studio lỗi CORS/login | Kiểm tra origin website và studio trong Sanity Manage → API → CORS origins đã bật `Allow credentials`. |
| Trang chủ 404 hoặc trắng trang | Kiểm tra slug trang chủ trong Sanity đã đặt là `index`, document đã Publish, và ID trùng với `NEXT_PUBLIC_SANITY_HOME_PAGE_ID`. |
| Email lead/đơn không tới | Kiểm tra sender domain trong Resend, secrets `RESEND_API_KEY`, và bảng `outbox_jobs` trong D1 xem job có bị lỗi không. |

Để theo dõi log thời gian thực:
```bash
npx wrangler tail acme-site
```

## 11. Gắn domain riêng khi cần

Với domain trong Cloudflare zone mà tài khoản có quyền quản lý, thêm Custom Domain cho Worker trên Dashboard và quản lý lại trong Wrangler để cấu hình nhất quán. Ví dụ:

```jsonc
"routes": [{ "pattern": "www.customer.example", "custom_domain": true }]
```

Đổi `NEXT_PUBLIC_BASE_URL` ở local, Wrangler và GitHub build vars sang origin HTTPS chính; thêm origin vào Sanity CORS. Cập nhật URL canonical/site settings/link/email, build và deploy lại. Xem [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

## 12. Nghiệm thu và bàn giao

- [ ] Xác nhận repo/Worker/D1/Sanity/domain/secrets đúng khách hàng và không còn tài nguyên khách cũ.
- [ ] Homepage, product/blog, SEO và Studio hoạt động với nội dung đã publish.
- [ ] Đăng nhập Super Admin bằng email/mật khẩu scrypt thành công. Thử phân quyền admin/sales/marketing.
- [ ] Gửi thử lead, RFQ, popup, newsletter: kiểm tra dữ liệu vào đúng D1, có `ai_score`, `ai_pitch_draft`, `ip_country`, `journey_json`, và hiển thị trong danh sách Leads.
- [ ] Thẻ **Insights** hiển thị 4 sub-tab (Sources, Campaigns, Placements, Countries) và thẻ **Edge Funnel & Web Vitals** kết nối thành công với Cloudflare Analytics Engine.
- [ ] Tab **Customers** hiển thị đúng lịch sử tương tác, số đơn hàng (`order_count`) và tổng chi tiêu (`total_spent`).
- [ ] Thử email tới người nhận kiểm thử; kiểm tra outbox retry, cron và không còn lỗi tài nguyên.
- [ ] Thử mobile, keyboard, menu/modal, reload/deep link và đo Web Vitals trên URL thật.
- [ ] Export backup sau cấu hình bằng `npm run d1:backup -- acme-db --remote`, lưu mã hóa ở nơi bàn giao.
- [ ] Ghi commit, Worker Version ID, URL, migration state, người nghiệm thu, ngày và giới hạn còn lại.
- [ ] Bàn giao quyền repo/Cloudflare/Sanity/DNS/email và thông tin billing; chuyển thông tin đăng nhập qua kênh bảo mật.

Khi nâng cấp: kiểm tra trên staging → backup D1 → áp dụng migrations tương thích → build/deploy cùng candidate → nghiệm thu. Rollback Worker về phiên bản tương thích không tự rollback schema hay dữ liệu. Không restore backup production tùy tiện vì có thể mất lead/đơn mới; xem quy trình restore trong [runbook D1](../RUNBOOK_CLOUDFLARE_D1.md).

Các bước nghiệm thu chi tiết nằm trong [checklist review](REVIEW_CHECKLIST.md). Ghi kết quả riêng theo từng khách hàng trong hệ thống bàn giao riêng, không chép secrets hoặc dữ liệu cá nhân vào tài liệu template này.
