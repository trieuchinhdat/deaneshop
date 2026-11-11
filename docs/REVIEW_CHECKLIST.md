# Checklist review DeanFlow

Ghi ngày, môi trường, commit và bằng chứng cho từng mục. Checklist này là công cụ review, không tự đánh dấu hoàn thành.

## 1. Phạm vi và nội dung

- [ ] Đối chiếu CTA, form và điều hướng với [định vị hiện hành](../STRATEGY_POSITIONING.md).
- [ ] Kiểm tra một landing page, một product page và blog trên desktop/mobile; nội dung và chứng nhận phải có nguồn thật.
- [ ] Đối chiếu module schema → GROQ → `ModulesResolver` → UI và chạy `npm run typegen` khi schema thay đổi.
- [ ] Kiểm tra ví dụ JSON trong ba `AGENT-GUIDE-*.md` với importer và schema trước khi phát cho editor.

## 2. Lead và admin

- [ ] Gửi inquiry thường và RFQ; kiểm tra product/variant/quantity, nguồn, UTM và consent trong D1.
- [ ] Kiểm tra Leads, Customers, Follow-ups, Insights với dữ liệu đủ vượt một trang.
- [ ] Kiểm tra admin, sales, support, marketing: quyền xem, sửa, gán chủ sở hữu và cách ly dữ liệu.
- [ ] Thử hai phiên sửa cùng một lead; xác nhận xung đột thay vì ghi đè im lặng.
- [ ] Thử email gửi thất bại và retry; kiểm tra outbox và không ghi nhận đã đọc/đã trả lời nếu chưa có bằng chứng.

## 3. Dữ liệu và phát hành

- [ ] Chạy `npm run typecheck`, `npm test`, `npm run verify:migrations`, `npm run lint:security` trên commit cần phát hành.
- [ ] Kiểm tra D1 binding, migrations remote, `/api/health` và admin health trên staging.
- [ ] Chạy `npm run verify:production`; xử lý mọi điều kiện chặn trước deploy.
- [ ] Chạy `npm run build:cf`, Wrangler dry-run và `npm run perf:check -- --ci` trên cùng candidate; kiểm tra cấu hình vars/secrets của CI và môi trường đích.
- [ ] Kiểm tra backup/restore và cron/outbox theo [runbook](../RUNBOOK_CLOUDFLARE_D1.md).
- [ ] Chạy browser acceptance, keyboard/mobile và đo LCP/INP/CLS trên URL thật.
- [ ] Nghiệm thu các mục `FIXED_PENDING_VERIFICATION` trong [tracker 34 issue](reviews/ISSUES_ORDER_ADMIN_GLOBAL_2026_11_10.md) theo phạm vi còn sử dụng; ghi kết quả riêng từng issue.
- [ ] Hoàn thành các điều kiện còn chặn trong [production readiness](reviews/PRODUCTION_READINESS_REVIEW_2026_11_11.md), gồm migrations tới `0010` và staging acceptance.

Sau review, cập nhật [trạng thái dự án](REVIEW_STATUS.md) với bằng chứng và giới hạn còn lại.
