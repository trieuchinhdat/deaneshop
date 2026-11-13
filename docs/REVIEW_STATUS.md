# Trạng thái review dự án

Cập nhật tài liệu: **2026-11-12**. Tài liệu này không phải chứng nhận production. Các kết quả cũ được giữ theo đợt; kết quả local mới nhất về static storefront được ghi riêng bên dưới.

## Static storefront Free — 2026-11-12

Đã build OpenNext Worker và public static export: 30 HTML, navigation payload, sitemap/RSS/robots. Có 94/94 tests pass, typecheck, security lint, Studio boundary, migration verification, production artifact gate và Wrangler dry-run pass. Chrome local xác nhận Link từ home sang blog/landing dùng static payload, không tải lại document, không có local request lỗi hoặc JavaScript exception. Link sang admin dùng document `/admin`, không gọi `/admin.txt`.

HTTP smoke local xác nhận HTML/payload/sitemap/RSS trả 200 không có `x-opennext` hoặc Set-Cookie; URL public thiếu trả 404. API admin không có phiên trả 401; payload lead/search không hợp lệ trả 400; Studio redirect 307. Preview dùng D1 tạm, không ghi production. Chưa nghiệm thu submit thành công với D1/email thật, chưa deploy bản sửa và chưa đo lại CPU production. Các API/admin/cron vẫn chịu quota Free. Xem [hướng dẫn triển khai](STATIC_STOREFRONT_DEPLOYMENT.md) và [bằng chứng 1102](reviews/WORKER_1102_2026_11_12.md).

## Hướng sản phẩm hiện hành

[Định vị](../STRATEGY_POSITIONING.md) đặt website tạo inquiry và Lead Workspace làm trọng tâm. `/admin` hiện render `LeadWorkspaceClient` từ `src/app/(admin)/admin/page.tsx`. Bộ commerce/order cũ còn trong source; chưa xác nhận có thể xóa an toàn. Nội dung Sanity và dữ liệu nghiệp vụ D1 giữ vai trò khác nhau như [kiến trúc](../ARCHITECTURE.md).

## Bằng chứng đã có

Cập nhật sửa code mới nhất: [Production readiness và kết quả remediation](reviews/PRODUCTION_READINESS_REVIEW_2026_11_11.md). Cloudflare build/dry-run, 60 tests, typecheck và audit đã pass ở local; cần migration `0010` và cấu hình/nghiệm thu staging trước production.

| Chủ đề | Bằng chứng trong repo | Giới hạn |
| --- | --- | --- |
| Lead Workspace | `src/app/(admin)/admin/page.tsx`, `lead-workspace-client.tsx`, `/api/admin/intelligence`, `/api/admin/customer-directory` | Entry point dùng workspace lead; Customers tổng hợp inquiry, subscriber, comment và review theo phạm vi quyền. Chưa có nghiệm thu browser với D1/email thật |
| Database | Toàn bộ `migrations/0000_baseline.sql`–`0010_lead_delivery_and_submissions.sql`, `src/lib/d1.ts`, các route health | Cần áp dụng toàn bộ migration còn thiếu theo thứ tự; có file không chứng minh remote đã áp dụng |
| Release | `scripts/release-gate.cjs`, `.github/workflows/verify.yml` | `wrangler.jsonc` còn D1 UUID placeholder tại lúc review tài liệu |
| Issues đợt trước | [Tracker 10/11](reviews/ISSUES_ORDER_ADMIN_GLOBAL_2026_11_10.md) | Ghi nhận 22 VERIFIED local và 12 FIXED_PENDING_VERIFICATION; không thay thế báo cáo production mới nhất hay nghiệm thu môi trường đích |

## Chưa được xác nhận

1. Binding D1 và migration trên staging/production; secret và cron thật.
2. Luồng inquiry/RFQ, phân quyền, Customers directory, gửi email và follow-up qua trình duyệt với dữ liệu thử.
3. Nghiệm thu runtime còn thiếu của tracker order/admin; các luồng commerce vẫn có API/module dù workspace cũ không còn được mount tại `/admin`.
4. Kiểm tra responsive, keyboard và số liệu Core Web Vitals trên URL triển khai thực.
5. Hợp đồng JSON của ba importer so với schema Sanity và ví dụ trong `AGENT-GUIDE-*.md`.

## Giới hạn chức năng cần giữ rõ

- Journey là snapshot trước khi gửi form, giới hạn 40 sự kiện trong session và phụ thuộc consent. Click contact/download không chứng minh đã liên hệ hoặc tải hoàn tất; không có nhận diện đa thiết bị hay đồng bộ email trả lời.
- Qualification/priority do nhân viên đánh giá. Nhóm Customers theo email không xác minh danh tính hoặc suy ra marketing consent.
- Analytics có bộ lọc ngày theo UTC và aggregate trên dữ liệu được phép truy cập; chưa chứng minh visitor conversion, first-response metrics, chi phí acquisition hay ROI.
- Inquiry/RFQ/dossier từ ba form hiện tại có submission key; integration cũ không gửi `Idempotency-Key` không được bảo đảm deduplicate.
- Chưa xác nhận có thể gỡ các API/module commerce và workspace cũ an toàn. Cần kiểm kê consumer trước khi xóa.

## Cách cập nhật

Ghi mỗi lần xác minh theo mẫu: **ngày — môi trường — phiên bản/commit — bước hoặc lệnh — kết quả — bằng chứng — giới hạn**. Chỉ chuyển mục sang “đã xác nhận” khi đã chạy trên môi trường cần kết luận. Bắt đầu từ [checklist review](REVIEW_CHECKLIST.md).

## Đăng nhập Sanity — code cập nhật 2026-11-12

Đã thêm [Sanity sign-in](SANITY_ADMIN_SIGN_IN.md) xác minh token/membership đúng project rồi liên kết `sanity_user_id` với staff D1. Cần migration `0011` và liên kết tài khoản trước khi deploy chuyển auth mode. Không còn cần host backend bcrypt khi dùng mode này. Test local 78/78, typecheck, migrations, security lint và build Free PASS; chưa deploy, migrate D1 remote hoặc nghiệm thu browser/CPU bằng phiên Sanity thật. D1 runtime mặc định local trong dev, các lệnh remote dùng `--remote` rõ ràng.


## Studio độc lập — 2026-11-12

Đã tách Studio sang `studio/`, thêm bridge đăng nhập CRM giữa hai origin và migration 0014. Xem [báo cáo kiểm tra local](reviews/SANITY_STUDIO_SEPARATION_2026_11_12.md) và [runbook phát hành](SANITY_STUDIO_DEPLOYMENT.md). Static assets Cloudflare giảm khoảng 62.4%, Worker upload gzip giảm khoảng 3.1%. Website 88 tests, Studio 5 tests, TypeGen/typecheck/build/dry-run và các repository gates PASS ở local. Chưa migrate/deploy remote hoặc nghiệm thu browser bằng tài khoản thật; hostname đích là `deanflow.sanity.studio`.
