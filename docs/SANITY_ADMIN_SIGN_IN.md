# Đăng nhập Lead Workspace bằng Sanity

Đăng nhập CRM hiện mặc định dùng email/mật khẩu lưu hash trong D1. Xem [hướng dẫn password](ADMIN_PASSWORD_SIGN_IN.md), gồm tạo/reset tài khoản và cách tạo/reset tài khoản và nghiệm thu Worker Free. Các bước Sanity bridge bên dưới chỉ áp dụng khi chủ động chọn mode `sanity`.

Cập nhật 2026-11-12. Chính sách hiện hành: mọi human member của đúng Sanity project được vào `/admin`. Người chưa có trong D1 được tạo với role `sales`; không cần link mời hoặc nhập Account ID. Chế độ này không chạy bcrypt và không cần host password service.

## Luồng đăng nhập và phân quyền

`/admin` → `/api/admin/auth/sanity/start` → `https://deanflow.sanity.studio/workspace-login?state=…` → đăng nhập Sanity → Continue to Lead Workspace → callback tại website → `/admin`.

Studio gửi personal token qua Authorization header tới `/api/admin/auth/sanity/exchange` của website, với `credentials: omit`. Endpoint chỉ chấp nhận đúng Studio origin và trả mã dùng một lần, không đặt cookie cross-site. Website đã tạo state gắn với cookie HttpOnly của trình duyệt khởi tạo; callback đối chiếu cookie/state và tiêu thụ mã nguyên tử trước khi cấp phiên trên domain website. Giao dịch hết hạn sau 5 phút, mã hết hạn sau 60 giây. D1 chỉ giữ hash state/verifier/code và identity đã xác minh; bản ghi hết hạn được dọn khi bắt đầu đăng nhập mới. Server tự gọi `/users/me` và kiểm tra membership/current-user của project cấu hình; không nhận email, ID hoặc role từ body trình duyệt. Robot token, token sai và project khác bị từ chối. Token Sanity không lưu vào D1, URL hoặc session ứng dụng.

- Đã liên kết Account ID: dùng staff D1 hiện có, giữ role và kiểm tra active.
- Chưa liên kết nhưng email từ Sanity khớp staff D1 active: tự gắn ID, giữ role đã được admin phân.
- Chưa có staff: tự tạo với email do Sanity trả về và role `sales`, kể cả khi đó là thành viên đầu tiên đăng nhập. Sanity Administrator không tự nhận app Administrator/Super Admin.
- Email đã gắn ID khác, staff inactive hoặc Sanity không trả email cho tài khoản mới: từ chối; không tạo bản ghi thay thế hoặc tự kích hoạt lại.

Chính sách này chủ động tin cậy danh tính/email do Sanity trả về sau khi xác minh project membership. Đây không phải luồng xác nhận email riêng của ứng dụng. Quyền D1 được thiết lập theo email trước lần liên kết đầu; sau khi đã liên kết, ID ổn định là khóa nhận diện. Khi thêm staff có quyền cao, dùng đúng email Sanity của người được cấp quyền.

Membership Sanity là điều kiện vào ứng dụng; role D1 quyết định chức năng, dữ liệu và thao tác được phép. Không cần thêm staff trước nếu chỉ cần quyền sales. Admin có thể thêm email và chọn role trước lần đăng nhập hoặc sửa role sau khi tài khoản sales tự được tạo. Tên là tùy chọn trong form thêm mới; không cần Account ID/password/link.

Cookie session ứng dụng là HttpOnly/Secure/SameSite=Lax, tối đa một giờ. Mỗi lần kiểm tra phiên vẫn đọc D1 để kiểm tra active, role, credential version, identity và project. Đổi mode/project hoặc role làm phiên cũ không phù hợp bị từ chối. Membership Sanity chỉ kiểm tra lúc exchange: khi xóa member khỏi Sanity, session ứng dụng có thể còn sống tối đa một giờ. Muốn chặn ngay, đồng thời đặt staff D1 inactive. Xóa hẳn staff D1 không phải chặn truy cập lâu dài: nếu vẫn là Sanity member, lần đăng nhập sau sẽ được tạo lại với sales.

## Cấu hình

- Mời người dùng vào đúng Sanity project và chờ họ chấp nhận. Kiểm tra hạn mức thành viên/quyền CMS của gói Sanity; role CMS độc lập role ứng dụng.
- Sanity API CORS: thêm đúng website origin và Studio origin, gồm localhost:3000/3333 khi phát triển; Allow credentials cho origins cần xác thực. Đây là cấu hình riêng với CORS của endpoint exchange, endpoint chỉ allowlist `SANITY_STUDIO_ORIGIN` và không dùng cookie cross-site.
- Website cần `NEXT_PUBLIC_SANITY_STUDIO_URL=https://deanflow.sanity.studio`, `SANITY_STUDIO_ORIGIN=https://deanflow.sanity.studio` và `NEXT_PUBLIC_BASE_URL` đúng origin website; Studio cần `SANITY_STUDIO_WEB_URL` trỏ lại đúng website. Xem [runbook Studio](SANITY_STUDIO_DEPLOYMENT.md).
- Đồng nhất `NEXT_PUBLIC_ADMIN_AUTH_MODE=sanity` và project/dataset giữa `.env.local`, CI build và Wrangler vars. Vẫn cần `ADMIN_JWT_SECRET` đủ mạnh. Robot read token CMS không dùng làm token đăng nhập cá nhân.
- Studio dùng `auth.loginMethod=token`. Sanity quản lý token trong storage của Studio; ứng dụng không tạo bản sao. Nếu đã login cookie trước khi đổi mode, đăng xuất Studio rồi đăng nhập lại khi tool không lấy được token.
- Chế độ Free dùng thêm `NEXT_PUBLIC_DEPLOYMENT_PROFILE=free` ở local/build/Worker. Đổi public env phải build/deploy lại.

Nguồn tham khảo: [Sanity authentication](https://www.sanity.io/docs/content-lake/http-auth), [Project membership API](https://www.sanity.io/docs/http-reference/projects-api).

## Migrations

Local và remote là hai database độc lập:

```bash
npm run d1:migrate:local
```

Production cần backup trước khi áp dụng toàn bộ migration:

```bash
npm run d1:backup -- deanflow-db --remote
npm run d1:migrate:remote
npx wrangler d1 migrations list DB --remote
```

Đổi database name theo khách hàng khi clone. `0011` thêm identity link/unique index. `0012` là migration lịch sử của cơ chế mời đã bỏ; `0013` xóa bảng và trigger mời, không xóa staff hoặc sửa role. `0014` thêm bảng giao dịch đăng nhập giữa hai origin; cần áp dụng trước khi phát hành website đã tách Studio. Giữ nguyên chuỗi migration đã phát hành/áp dụng; database mới cũng chạy toàn bộ theo thứ tự. Endpoint/trang và scripts tạo link mời đã bị loại bỏ, link cũ không còn được sử dụng.

## Thiết lập Super Admin đầu tiên

Không tự nâng người đăng nhập đầu tiên thành Super Admin. Operator có quyền database chạy:

```bash
python3 scripts/prepare-first-admin.py --sanity
npx wrangler d1 execute DB --local --file=backups/first-admin.sql
```

Script chỉ hỏi email Sanity và tên. SQL chỉ chạy khi chưa có bản ghi Super Admin; tạo root hoặc nâng đúng email staff active đã có lên Super Admin, giữ identity/password hiện có. Điều này hỗ trợ trường hợp người vận hành đã đăng nhập và được tự tạo sales trước khi bootstrap. `created: 1` nghĩa là đã tạo/nâng quyền; `created: 0` nghĩa là chưa thay đổi, cần kiểm tra staff/Super Admin đang có. Không dùng bootstrap để vượt qua một Super Admin bị khóa.

Sau thành công, đăng nhập `/admin` qua Sanity bằng đúng email. Không cần link, Project ID riêng trong script hoặc Account ID. Trên production, thay `--local` bằng `--remote` sau khi backup/migrate đúng database. Xóa SQL tạm:

```bash
rm -f backups/first-admin.sql
```

`link-sanity-admin.py` chỉ giữ làm recovery nâng cao cho operator cần ID trực tiếp. Luồng thông thường không dùng script này. Các file cũ `backups/staff-invitation.txt` và SQL mời nếu còn trên máy có thể xóa; không sử dụng lại.

## Nghiệm thu và giới hạn

Chạy tests/typecheck/security/migrations/build/dry-run theo [runbook](CLIENT_DEPLOYMENT_RUNBOOK.md), rồi nghiệm thu với phiên Sanity thật:

- Thành viên mới vào được với sales; không nhận role do trình duyệt tự khai.
- Staff được admin thêm trước tự liên kết và giữ role; lần đăng nhập sau không sinh bản ghi trùng.
- Inactive, email xung đột, token robot/sai, project khác và Origin khác đều bị từ chối. Kiểm tra thêm sai state/cookie, mã hết hạn, replay và staff bị khóa sau exchange trước callback.
- Logout, đổi role/inactive và kiểm tra session cũ bị chặn. Logout `/admin` không tự logout Studio; tool không tự exchange lúc mount.
- Kiểm tra CPU/memory cold/warm trên Workers Free. Không chạy bcrypt không chứng minh mọi route đã tránh lỗi 1102.

`AUTH_SCHEMA_OUTDATED` yêu cầu migrate đúng môi trường. `AUTH_CONFIGURATION_ERROR` yêu cầu kiểm tra mode/project/signing secret. Server chỉ log stage và mã lỗi, không log token/SQL. Chưa nghiệm thu browser với phiên Sanity thật, chưa migrate/deploy remote trong lượt sửa này.
