# Đăng nhập admin bằng email và mật khẩu D1

Luồng mặc định: mở `/admin` → nhập email và mật khẩu → server kiểm tra tài khoản active trong D1 → so sánh scrypt → cấp cookie phiên → vào CRM. Không cần Google OAuth, Cloudflare Access, OTP hoặc tài khoản Sanity để vào CRM.

D1 lưu `email`, `password_hash`, tên, role và trạng thái trong `admin_users`. Mật khẩu không lưu nguyên văn và không được trả về trình duyệt. Session tối đa 8 giờ, cookie HttpOnly/Secure/SameSite=Lax. Mỗi lần xác thực vẫn đọc D1: đổi mật khẩu/role, khóa hoặc xóa staff sẽ vô hiệu phiên cũ. Đăng xuất xóa cookie trên trình duyệt hiện tại; không tự đăng xuất các thiết bị khác.

## Cấu hình

Website `.env.local`/build và `wrangler.jsonc` vars dùng cùng mode:

```dotenv
NEXT_PUBLIC_ADMIN_AUTH_MODE="password"
```

Giữ `ADMIN_JWT_SECRET` riêng cho từng khách, ít nhất 32 byte, chỉ ở server/Worker secret. Không dùng secret mẫu và không nhập mật khẩu/secret vào chat, git hoặc command arguments. D1 binding `DB` phải đúng database khách hàng. Mỗi khách có database và tài khoản admin riêng.

Studio đặt `SANITY_STUDIO_ADMIN_AUTH_MODE=password` để ẩn bridge CRM. Editor vẫn dùng tài khoản Sanity riêng; mật khẩu admin D1 không đăng nhập Studio.

### Runtime

Website dùng `scrypt` có sẵn trong `node:crypto`; không cần thư viện hash, Google, Cloudflare Access hoặc backend password riêng. Không còn cấu hình `PASSWORD_HASHING_MODE`/`PASSWORD_SERVICE_*`.

Cloudflare cần `nodejs_compat` (repo đã cấu hình). Hash có salt ngẫu nhiên riêng; tham số cố định N=16384, r=8, p=5, dùng khoảng 16 MiB cho mỗi tác vụ hash. Không còn chặn cấu hình Free chỉ vì thuật toán bcrypt cũ. Tuy nhiên, hashing vẫn tốn CPU: cần đo login/tạo staff/reset trên Worker thật; chuyển sang native không bảo đảm đáp ứng giới hạn CPU Free hoặc hết lỗi 1102. Không tự nâng gói/deploy remote.

Nguồn: [Node crypto trên Workers](https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/), [tham số scrypt OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#scrypt).

## Tạo tài khoản đầu tiên

Áp dụng các migration còn thiếu cho đúng database. Local:

```bash
npm run d1:migrate:local
python3 scripts/prepare-first-admin.py
npx wrangler d1 execute DB --local --file=backups/first-admin.sql
```

Script hỏi email, tên và mật khẩu bằng input kín, rồi tạo SQL riêng tư chỉ chứa scrypt hash. Mật khẩu mới cần tối thiểu 12 ký tự, tối đa 72 byte UTF-8; không bắt buộc OTP hoặc quy tắc ký tự phức tạp.

`created: 1` là đã tạo Super Admin; `created: 0` nghĩa là bảng staff không trống và không có gì được thay đổi. Không dùng bootstrap để ghi đè tài khoản đã có. Production cần backup đúng database trước và thay `--local` bằng `--remote`. Kiểm tra email/database trước khi áp dụng SQL.

Sau đó vào `/admin`, nhập đúng email/mật khẩu và xác nhận role. Xóa SQL tạm:

```bash
rm -f backups/first-admin.sql
```

## Đặt mật khẩu cho tài khoản đã có

Staff có hash bcrypt cũ hoặc marker `sanity-only:…` cần đặt lại mật khẩu sang scrypt. Không thể chuyển hash cũ sang hash mới khi không có mật khẩu gốc; không chạy fallback bcrypt và không nhận plaintext trong D1. Operator đặt mật khẩu riêng cho đúng email bằng:

```bash
python3 scripts/prepare-first-admin.py --reset-password
npx wrangler d1 execute DB --local --file=backups/reset-admin-password.sql
```

Script chỉ tạo SQL, không kết nối database. SQL cập nhật mật khẩu của đúng email active đã có, giữ tên/role/identity, không tạo tài khoản mới hoặc tự mở khóa inactive. Kiểm tra `updated: 1`. Với production, backup trước rồi dùng `--remote`. Xóa SQL sau sử dụng:

```bash
rm -f backups/reset-admin-password.sql
```

Mật khẩu bị quên cũng xử lý bằng cách này. Không có đăng ký public hoặc chức năng tự cấp quyền admin.

## Tạo nhân viên tiếp theo

Super Admin/Admin đăng nhập → Staff Management → Add Staff → nhập tên, email, mật khẩu và role. Nhân viên dùng email/mật khẩu đó để đăng nhập. Chỉ Super Admin cấp được role Super Admin. Admin có thể đặt lại mật khẩu staff qua giao diện theo quyền hiện có; khóa tài khoản bằng status inactive.

API giới hạn đăng nhập theo email và IP; sai email, sai mật khẩu hoặc inactive đều trả thông báo chung. Không log mật khẩu hoặc hash. Trang admin dùng `NEXT_PUBLIC_SITE_NAME`, không chờ Sanity để hiển thị login.

## Kiểm tra trước triển khai

- Đăng nhập đúng/sai, email không tồn tại, staff inactive, logout và hết phiên.
- Đổi mật khẩu/role, xác nhận phiên cũ bị chặn.
- API quản trị từ chối khi không có phiên; hash không xuất hiện trong response.
- Backup/migration đúng D1, build đúng auth mode và đủ Worker secrets.
- Đo CPU login/tạo staff/đổi mật khẩu trên môi trường thật trước khi bàn giao.

Bộ kiểm thử local không tạo tài khoản production, không deploy và không chứng minh ngân sách CPU production.
