# Backend password service cũ — không còn dùng

Website hiện dùng scrypt native và D1 trực tiếp, không gọi service này. Không cần cài đặt hoặc deploy package này. Xem [hướng dẫn password hiện hành](../../docs/ADMIN_PASSWORD_SIGN_IN.md).

Các phần bên dưới là hướng dẫn lịch sử cho backend bcrypt cũ; không áp dụng cho code website hiện tại.

# Backend bcrypt cho Workers Free

Dự án hiện ưu tiên [đăng nhập Sanity](../../docs/SANITY_ADMIN_SIGN_IN.md): chế độ đó không cần chạy dịch vụ này. Backend bên dưới chỉ dành cho `NEXT_PUBLIC_ADMIN_AUTH_MODE=password` khi chọn offload bcrypt.

Dịch vụ Node.js này thực hiện hash/compare mật khẩu ở ngoài Workers Free. Website giữ form email/mật khẩu, tài khoản/role/status vẫn ở D1, session vẫn do Worker phát hành. Backend chỉ nhận password/hash qua HTTPS, không có quyền D1, Sanity hoặc ký session.

Chưa có hosting được cấu hình cho dự án hiện tại. Cần VPS hoặc nền tảng chạy Node.js/Docker có CPU đủ và URL HTTPS ổn định; đây không phải một Worker Free khác. Chi phí/free-tier của hosting ngoài phải kiểm tra riêng. Nếu nền tảng ngủ và cold start vượt timeout 8 giây, đăng nhập sẽ trả lỗi dịch vụ; không có fallback bcrypt trong Worker.

Mỗi khách hàng dùng instance/token riêng; không tái sử dụng token xác thực giữa các bản clone. Nếu muốn gom nhiều khách vào một dịch vụ, cần thiết kế tenant isolation và quota riêng trước; phiên bản này chưa có cơ chế multi-tenant.

## Chạy Node.js

```bash
cd services/password-service
npm ci --omit=dev
```

Đặt `PASSWORD_SERVICE_TOKEN` ít nhất 32 byte bằng secret manager/environment của hosting. Dùng `openssl rand -hex 32` để tạo khóa riêng. Không đặt giá trị thật vào source, Dockerfile hay command history. Sau khi environment đã có secret:

```bash
npm start
```

Mặc định listen `127.0.0.1:8080`. Đặt reverse proxy HTTPS phía trước; chặn truy cập trực tiếp port HTTP từ Internet. Không bật access/request-body logging chứa Authorization, password hoặc bcrypt hash. Chỉ cho Worker/nguồn được quản lý truy cập nếu hạ tầng hỗ trợ.

## Chạy Docker

Từ thư mục gốc repo:

```bash
docker build -t deanflow-password-service services/password-service
docker run --rm --name deanflow-password-service \
  --env PASSWORD_SERVICE_TOKEN \
  -p 127.0.0.1:8080:8080 deanflow-password-service
```

`--env PASSWORD_SERVICE_TOKEN` lấy giá trị đã đặt trong environment của terminal, không điền secret trực tiếp vào câu lệnh. Container listen `0.0.0.0:8080` bên trong nhưng port host được bind loopback; vẫn cần reverse proxy HTTPS, process supervision/restart và monitoring khi chạy thật.

## Cấu hình Worker

Sau khi backend HTTPS hoạt động, đặt trong `.env.local`:

```dotenv
PASSWORD_HASHING_MODE="external"
PASSWORD_SERVICE_URL="https://auth.customer.example"
PASSWORD_SERVICE_TOKEN="SAME_SECRET_AS_BACKEND"
```

Thêm vào Wrangler `vars`:

```jsonc
"PASSWORD_HASHING_MODE": "external",
"PASSWORD_SERVICE_URL": "https://auth.customer.example"
```

Upload riêng token lên Worker:

```bash
npx wrangler secret put PASSWORD_SERVICE_TOKEN
```

URL phải là HTTPS origin, không có path/query/credentials. Worker từ chối redirect. Không upload token cho frontend; token mới này khác `ADMIN_JWT_SECRET`. Có thể chuyển `PASSWORD_HASHING_MODE=external` trước trên profile standard để nghiệm thu đăng nhập rồi mới chuyển profile Free.

Khi bật Free, đồng nhất `NEXT_PUBLIC_DEPLOYMENT_PROFILE=free` trong local/build env, GitHub Actions variable và Wrangler vars. GitHub production-strict gate cần thêm variable `PASSWORD_HASHING_MODE`, `PASSWORD_SERVICE_URL` và secret `PASSWORD_SERVICE_TOKEN`; chúng độc lập với Worker runtime secrets. Build/deploy lại theo [runbook](../../docs/CLIENT_DEPLOYMENT_RUNBOOK.md).

## Hợp đồng và bảo vệ

- `POST /v1/hash`: JSON `{ "password": "..." }` → `{ "hash": "..." }`, cost luôn 12; yêu cầu ít nhất 12 ký tự, tối đa 72 byte UTF-8.
- `POST /v1/verify`: JSON `{ "password": "...", "hash": "..." }` → `{ "verified": true/false }`. Hỗ trợ bcrypt cost 4–14; hash mới của repo là cost 12. Nếu dữ liệu cũ có cost cao hơn, cần quy trình chuyển đổi/reset phù hợp trước khi chuyển chế độ.
- Hai endpoint yêu cầu Bearer token, response `no-store`, request tối đa 4096 byte và tối đa hai công việc đồng thời mỗi process. Không có endpoint tạo user/session hay chọn role.
- Worker vẫn kiểm tra account active, rate limit login, password version và quyền mỗi phiên. Backend lỗi/timeout/response sai → fail closed, không chuyển sang hash local.
- Admin đã có hash bcrypt cost 12 không cần tạo lại. Bootstrap script vẫn chạy bcrypt trên máy triển khai, không chạy trong Worker.

## Nghiệm thu

Chạy `node --test tests/password-service.test.cjs` từ gốc repo để kiểm tra protocol/hash/giới hạn/fail-closed local. Các test này chưa chứng minh hạ tầng HTTPS ngoài đang chạy.

Trên môi trường đích: thử login đúng/sai, account inactive, đổi password, logout và thu hồi phiên; thử service unavailable/timeout và xác nhận Worker không chạy bcrypt fallback. Kiểm tra CPU/memory ở Worker và tải backend riêng. Mật khẩu và hash đi qua backend xác thực: cấp quyền vận hành tối thiểu và bảo vệ log/secrets của host này.
