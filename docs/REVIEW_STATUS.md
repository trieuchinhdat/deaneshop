# Trạng thái review dự án

Cập nhật tài liệu: **2026-11-11**. Phạm vi: đối chiếu tài liệu với working tree. Kết quả kiểm tra bên dưới được kế thừa từ báo cáo remediation, không phải lần chạy lại trong lượt dọn tài liệu. Tài liệu này không phải chứng nhận production.

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
