# Production readiness review — 2026-11-11

**NO-GO cho production:** phần code đã được remediation, nhưng cấu hình và nghiệm thu trên môi trường đích còn thiếu. Báo cáo này giữ kết quả sau sửa; các lỗi ban đầu được tóm tắt bằng ID trong bảng.

Kết quả kiểm tra được ghi nhận từ đợt remediation ngày 2026-11-11, không phải lần chạy lại khi dọn tài liệu. Chưa gắn với một release commit cụ thể; cần chạy lại checks trên candidate trước phát hành.

## Cập nhật sau sửa code — 2026-11-11

**Đã sửa phần code của PROD-001–003 và PROD-005–011. PROD-004 còn phụ thuộc cấu hình môi trường thật.** Chưa deploy hoặc chạy migration remote.

| Issue | Kết quả sửa |
| --- | --- |
| PROD-001 | Server Action có directive hợp lệ. Product/article/collection và các builder module đọc reviews/comments dùng request boundary cho D1; Cloudflare build đã hoàn tất |
| PROD-002 | Next.js 16.4.6, Swiper 12.2.0, plugin Sanity được nâng cấp; override có phạm vi cho dependency gián tiếp. Audit toàn bộ dependency: 0 vulnerabilities |
| PROD-003 | Analytics dùng priority từ assessment; test thực thi query trên SQLite đã migrate |
| PROD-004 | Có `verify:production`, tự nạp production env, kiểm tra URL đúng cấu trúc, predeploy guard và CI manual release gate. D1 UUID placeholder/HTTPS origin thật vẫn phải cấu hình |
| PROD-005 | Lưu envelope thất bại hoặc mất lease sẽ dừng trước khi gọi provider; retry giữ nguyên body đã lưu |
| PROD-006 | Chuẩn hóa bộ lọc theo UTC calendar days, so sánh `julianday`; biểu đồ và nhãn ngày dùng UTC |
| PROD-007 | Ba form inquiry/RFQ/dossier giữ submission key qua retry/reload; unique D1 key cùng stored receipt chống tạo trùng, nội dung khác dùng cùng key trả 409 |
| PROD-008 | KPI high-priority/new lấy từ aggregate; tổng/overdue follow-up được aggregate trên toàn bộ dữ liệu được phép truy cập, không giới hạn 25 hoặc theo ngày tạo |
| PROD-009 | Biểu đồ trình bày qualification/current status, bỏ retention giữa các nhóm độc lập; các hàng mở đúng filter |
| PROD-010 | Newsletter/popup lưu consent flag, notice, timestamp và policy version; không suy diễn consent của bản ghi cũ |
| PROD-011 | Migration `0010` tạo dossier payload đầy đủ trong cùng transaction với lead/outbox. Legacy jobs thiếu metadata resolve published asset trước khi gửi |

Health công khai và admin giờ kiểm tra schema submission/RFQ bắt buộc, gồm trigger RFQ của `0009`. Migration verifier kiểm tra cả các cột mới và unique submission index. Node tooling chuyển sang >=22.12, `.nvmrc` 22.23.2; tài liệu stack được cập nhật. Chỉ npm và `package-lock.json` là đường phát hành đã kiểm chứng; không dùng `yarn.lock` cũ để phát hành.

Bằng chứng sau sửa: TypeScript PASS; 60/60 tests PASS; security lint PASS; hai đường migration PASS; Cloudflare build PASS; Wrangler dry-run PASS (gzip upload khoảng 4 MiB); performance gate PASS (shared root JS 137.6 KB gzip, Worker payload trong budget); npm audit toàn bộ dependency PASS (0). Bộ test mới kiểm tra SQLite analytics, hơn 25 follow-up, ranh giới ngày, retry đồng thời, receipt replay, envelope write failure/lease loss/provider response loss, dossier legacy và missing-schema health.

**Chưa đủ điều kiện GO production:** cần gắn D1 UUID thật, cấu hình HTTPS origin và runtime secrets trên môi trường đích, backup/apply migrations tới `0010`, rồi chạy staging browser/email/role acceptance và restore rehearsal. `verify:production` hiện chủ động fail vì UUID placeholder và local base URL không đạt yêu cầu production. Các check local không chứng minh remote đã sẵn sàng.

Giới hạn còn lại: integration cũ không gửi `Idempotency-Key` vẫn tương thích nhưng không được deduplicate; browser visual/mobile/keyboard, email provider thật và Workers/D1 đang chạy chưa được nghiệm thu. Toàn workspace còn whitespace có sẵn ở một số file ngoài phạm vi sửa; không thay đổi các file đó.

## Điều kiện nghiệm thu trước production

1. Gắn D1 UUID thật, HTTPS origin, runtime secrets/vars và cron trên môi trường đích theo [runbook](../../RUNBOOK_CLOUDFLARE_D1.md).
2. Backup, áp dụng toàn bộ migrations còn thiếu tới `0010`, kiểm tra public/admin health và diễn tập restore trên staging.
3. Chạy typecheck, tests, security lint, migration verifier, `npm run verify:production`, Cloudflare build, Wrangler dry-run, performance gate và dependency audit trên cùng candidate. CI push/PR có checks và dry-run; production-strict gate trong workflow chạy khi `workflow_dispatch`.
4. Nghiệm thu staging với từng role admin/sales/marketing/support: inquiry/RFQ/dossier, consent, Customers, stale write, follow-up và số liệu với hơn 25 bản ghi. Kiểm tra retry, reload, mất response và ranh giới ngày UTC.
5. Kiểm tra email provider thật, retry outbox, cron, monitoring, rollback và browser mobile/keyboard; đo LCP/INP/CLS trên URL triển khai.

Các giới hạn chức năng hiện hành được tập trung tại [trạng thái dự án](../REVIEW_STATUS.md). Xem thêm [tracker remediation DF-001–034](ISSUES_ORDER_ADMIN_GLOBAL_2026_11_10.md) để nghiệm thu các mục runtime còn thiếu; không suy ra rằng các check local đã xác minh Cloudflare/D1/email thật.
