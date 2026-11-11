# Chỉ mục tài liệu DeanFlow

Đọc theo thứ tự sau khi review dự án:

| Tài liệu | Dùng để |
| --- | --- |
| [README](../README.md) | Bắt đầu và chạy kiểm tra |
| [Định vị](../STRATEGY_POSITIONING.md) | Xác định mục tiêu và phạm vi sản phẩm |
| [Trạng thái](REVIEW_STATUS.md) | Xem điều đã xác minh, điều còn mở |
| [Checklist](REVIEW_CHECKLIST.md) | Review UI, API, dữ liệu và release theo bằng chứng |
| [Kiến trúc](../ARCHITECTURE.md) | Tìm đường dữ liệu và các file chủ chốt |
| [CMS schema](../CMS-SCHEMA.md) | Thêm/sửa module Sanity |
| [Runbook D1](../RUNBOOK_CLOUDFLARE_D1.md) | Cấu hình, migration, backup, health check |

## Tài liệu chuyên sâu

`AGENT-GUIDE-ARTICLES.md`, `AGENT-GUIDE-PAGE.md`, `AGENT-GUIDE-PRODUCT.md` nằm ở gốc vì các route `/api/sanity/guide-*` import chúng trực tiếp. Đây là tài liệu tải xuống cho các importer trong Studio. Trước khi dùng prompt hoặc JSON mẫu, đối chiếu schema và action hiện tại.

Không duy trì bản sao guide trong `docs/`. Khi sửa hợp đồng importer, cập nhật file `AGENT-GUIDE-*.md` tương ứng ở gốc và đối chiếu action/schema.

## Review cần giữ

- [Production readiness 2026-11-11](reviews/PRODUCTION_READINESS_REVIEW_2026_11_11.md): kết quả remediation được ghi nhận và điều kiện còn chặn production.
- [Issue tracker order/admin/global](reviews/ISSUES_ORDER_ADMIN_GLOBAL_2026_11_10.md): lưu 34 issue cùng chi tiết fix và phần nghiệm thu còn thiếu. `VERIFIED` chỉ bằng chứng local được ghi tại đợt đó; `FIXED_PENDING_VERIFICATION` vẫn cần nghiệm thu runtime.

Các báo cáo phase/audit cũ, guide trùng lặp và review tổng hợp đã được thay thế được loại khỏi bộ tài liệu hiện hành. Trạng thái và giới hạn còn liên quan được tập trung tại `REVIEW_STATUS.md`; không suy ra production readiness từ báo cáo hoàn thành cũ.

## Cách cập nhật tài liệu

Khi thay đổi sản phẩm, cập nhật `STRATEGY_POSITIONING.md`. Khi thay đổi đường dữ liệu hoặc cách triển khai, cập nhật `ARCHITECTURE.md` hoặc runbook. Khi có kết quả kiểm chứng mới, ghi ngày, môi trường, lệnh/bước, kết quả và giới hạn trong `REVIEW_STATUS.md`. Báo cáo theo đợt đặt trong `docs/reviews/`; không dùng tên `Report.md` hoặc tạo thêm bản sao hướng dẫn.
