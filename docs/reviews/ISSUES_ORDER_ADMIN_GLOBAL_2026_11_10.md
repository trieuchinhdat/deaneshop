# DeanFlow — Issue tracker Order / Admin / Global

Đợt review: 2026-11-10; ghi nhận sửa code tới 2026-11-11. Phạm vi: Order / Admin / Global trên Cloudflare Workers + D1 + Next.js App Router tại đợt đó.

Đây là hồ sơ remediation, không phải trạng thái runtime hiện tại. Xem [production readiness mới nhất](PRODUCTION_READINESS_REVIEW_2026_11_11.md) và [trạng thái dự án](../REVIEW_STATUS.md) trước khi phát hành. Workspace commerce cũ không còn được mount tại `/admin`, nhưng các API/module liên quan vẫn tồn tại.

**34/34 issues đã hoàn tất fix trong working tree (0 OPEN): 22 VERIFIED (đã fix + chứng minh bằng SQLite D1 migrations, unit/integration tests, TypeScript & security/perf gates), 12 FIXED_PENDING_VERIFICATION (đã fix + pass 100% local tests; chỉ còn bước đối soát runtime ngoài môi trường offline như live Resend API, Cloudflare WAF/Cron thật, Mobile Lighthouse thật, Sanity CDN online).**

DF-001–012 tương ứng F01–F12 của review order/admin ban đầu; DF-013–021 từ review bổ sung; DF-022–034 từ review toàn dự án. Các báo cáo tổng hợp trùng lặp đã được loại bỏ; chi tiết issue được giữ tại đây. `VERIFIED` nghĩa là đã sửa và có bằng chứng local ghi trong issue, không phải chứng nhận production. `FIXED_PENDING_VERIFICATION` còn bước nghiệm thu runtime. Không coi HTTP 200 với database mock là bằng chứng đã ghi trên D1 production.

### Kết quả kiểm tra lịch sử của đợt remediation này

Các con số dưới đây được giữ để truy vết đợt sửa DF-001–034; chúng đã được thay thế bởi kết quả trong báo cáo production ngày 2026-11-11 và không được chạy lại khi dọn tài liệu.

- `npm run typecheck` (`tsc --noEmit`): **PASS** (0 errors).
- `npm run verify:migrations`: **PASS** (`fresh-d1-migrations`: 16 tables, 18 triggers; `schema-plus-incremental`: 16 tables, 18 triggers).
- `npm run lint:security`: **PASS** (8 targeted checks + 409 scanned files).
- `npm run verify:release`: **PASS** (repository & CI check; cảnh báo `wrangler.jsonc` `database_id` placeholder trước khi deploy remote).
- `npm test`: **29/29 PASS** (`0 failed` trên `tests/commerce.test.cjs`, `tests/database.test.cjs`, `tests/domain-fixes.test.cjs`, `tests/e2e-flows.test.cjs`, `tests/operations.test.cjs`, `tests/resilience.test.cjs`, `tests/security.test.cjs`, `tests/storefront-security.test.cjs`).
- `npm run build`: **Next webpack + TypeScript compile PASS** (`✓ Compiled successfully`, `✓ Finished TypeScript`); bước `generateStaticParams` cho routes `/collections/[slug]` & `/blog/[slug]` dừng do môi trường local offline (`ENOTFOUND jy7u0ikv.apicdn.sanity.io`).
- `npm run perf:check -- --ci`: **PASS** (`Shared root client JS`: `120.6 KB gzip <= 250 KB`, 10 storefront routes `< 650 KB gzip`, max non-Studio chunk `174 KB gzip <= 250 KB`, Worker gzip `2.76 MB`).

## Quy ước cập nhật

Mỗi issue giữ ID ổn định; khi xử lý ghi file sửa, test đã chạy, kết quả và phần còn thiếu (nếu có). Luồng trạng thái: OPEN → IN_PROGRESS → FIXED_PENDING_VERIFICATION → VERIFIED. Các tham chiếu migration `0006` trong từng issue mô tả migration đưa fix vào; khi phát hành phải backup và áp dụng toàn bộ migrations còn thiếu tới `0010` theo thứ tự, theo [runbook](../../RUNBOOK_CLOUDFLARE_D1.md). Chạy `npm run typegen` khi schema/GROQ thay đổi.

## Các issue từ lượt review trước

### DF-001 — VERIFIED — P0: Chuyển RFQ sang đơn kho tự ghi nhận đã thanh toán

- **Trạng thái:** ✅ Đã hoàn tất & VERIFIED (local SQLite D1 tests).
- **Files đã sửa:** `src/app/(admin)/admin/order-detail-modal.tsx`, `src/app/(frontend)/api/orders/update-status/route.ts`, `src/app/(frontend)/api/orders/accept-quote/route.ts`, `src/app/(frontend)/api/orders/record-payment/route.ts`, `src/app/(frontend)/api/orders/release-fulfillment/route.ts`, `src/lib/d1.ts`, `src/lib/admin-format.ts`, `migrations/0006_domain_integrity.sql`.
- **Chi tiết fix:** Gỡ bỏ việc gộp `PAID` vào thao tác chuyển đơn kho; tách 3 endpoint chuyên biệt `/api/orders/accept-quote`, `/api/orders/record-payment` (bảng `order_payments` + `paid_cents`), `/api/orders/release-fulfillment`. Chuyển đơn kho giữ `UNPAID`/`PARTIAL` theo ledger thực tế; payment bắt buộc `amount > 0`, `method`, `reference`, `actor`.
- **Tests & kết quả:** `tests/domain-fixes.test.cjs` (`DF-001..DF-005`) **PASS**: accept quote giữ unpaid, release trước thanh toán bị chặn (`422`), partial `$500/$1500` -> `PARTIAL`, full settlement -> `PAID`, release sau settlement -> `PROCESSING`.
- **Còn thiếu (Deploy):** Chạy `migrations/0006_domain_integrity.sql` trên D1 production.

### DF-002 — VERIFIED — P0: Lưu đơn D2C có thể biến nó thành báo giá

- **Trạng thái:** ✅ Đã hoàn tất & VERIFIED.
- **Files đã sửa:** `migrations/0006_domain_integrity.sql`, `src/lib/order-domain.ts`, `src/lib/d1.ts`, `src/lib/admin-format.ts`, `src/lib/crm-metrics.ts`, `src/app/(frontend)/api/orders/update-status/route.ts`, `src/app/(admin)/admin/order-detail-modal.tsx`.
- **Chi tiết fix:** Thêm cột discriminator `order_intent` (`'direct' | 'sample' | 'wholesale_rfq'`) và SQL trigger `validate_order_financials_*`; D2C `ordersDb.create` giữ `quote_status = NULL`; UI `order-detail-modal.tsx` không còn gửi `quoteStatus`/`paymentTerms` khi lưu D2C; API `/api/orders/update-status` trả HTTP `422` nếu client gửi field RFQ vào đơn D2C; `crm-metrics.ts` đếm `quote_status IS NULL OR quote_status = 'approved'`.
- **Tests & kết quả:** `tests/domain-fixes.test.cjs` (`DF-001..DF-005`) **PASS**: gửi `quoteStatus: 'sent'` vào `ord-d2c` bị từ chối HTTP `422`.

### DF-003 — VERIFIED — P0: Admin mutation không bảo vệ các bất biến tài chính

- **Trạng thái:** ✅ Đã hoàn tất & VERIFIED.
- **Files đã sửa:** `src/lib/order-domain.ts`, `src/app/(frontend)/api/orders/update-status/route.ts`, `src/app/(frontend)/api/orders/record-payment/route.ts`, `migrations/0006_domain_integrity.sql`.
- **Chi tiết fix:** Thêm validator minor-unit integer cents (`toCents`/`fromCents`), enum runtime (`FULFILLMENT_STATUSES`, `PAYMENT_STATUSES`, `PAYMENT_METHODS`, `INCOTERMS_2020`), state machine `canTransitionFulfillment` & `canTransitionAdminQuote`, allowlist theo role (`superadmin|admin` vs `cskh`) và `order_intent`, tổng server-derived, cấm sửa thẳng `paymentStatus` (`422`), bulk cap 50 IDs, DB trigger `validate_order_financials_insert`/`_update` chặn giá trị âm/sai enum ngay tại SQLite.
- **Tests & kết quả:** `tests/domain-fixes.test.cjs` (`DF-001..DF-005`) **PASS**: chặn `cskh` sửa pricing (`403`), chặn `paymentStatus` trực tiếp (`422`), trigger SQLite từ chối `total = -5`, reject overpayment (`422`).

### DF-004 — VERIFIED — P1: Hai nhân viên có thể ghi đè thay đổi của nhau

- **Trạng thái:** ✅ Đã hoàn tất & VERIFIED.
- **Files đã sửa:** `migrations/0006_domain_integrity.sql`, `src/lib/d1.ts`, `src/app/(frontend)/api/orders/update-status/route.ts`, `src/app/(frontend)/api/orders/accept-quote/route.ts`, `src/app/(frontend)/api/orders/record-payment/route.ts`, `src/app/(frontend)/api/orders/release-fulfillment/route.ts`, `src/app/(admin)/admin/order-detail-modal.tsx`.
- **Chi tiết fix:** Thêm cột `orders.version` & `leads.version` với CAS check (`expectedVersion` -> `409 Conflict` kèm dữ liệu mới nhất); tách ghi chú sang bảng append-only `order_notes` & `lead_notes`; bulk endpoint trả `results[]` (`updated | conflict | not_found | invalid`) theo từng ID; modal đồng bộ lại theo `order` prop mới khi version tăng.
- **Tests & kết quả:** `tests/domain-fixes.test.cjs` **PASS**: stale `expectedVersion: 1` sau v2 trả HTTP `409`, bulk trả `partial: true` với từng ID `['updated', 'not_found']`.

### DF-005 — VERIFIED — P1: RFQ cần báo giá thủ công chưa có đường nhập giá dòng hàng hoàn chỉnh

- **Trạng thái:** ✅ Đã hoàn tất & VERIFIED.
- **Files đã sửa:** `src/lib/order-domain.ts`, `src/app/(frontend)/api/orders/update-status/route.ts`, `src/app/(admin)/admin/order-detail-modal.tsx`.
- **Chi tiết fix:** Bổ sung Quote Draft Line-Item Editor (sửa qty/đơn giá/terms/Incoterm/port/target delivery) & nút "Move to Draft to Revise"; server validate mọi dòng đều có `price > 0` và `paymentTerms` trước khi chuyển `quote_status -> 'sent'`, tự tính lại subtotal/total.
- **Tests & kết quả:** `tests/domain-fixes.test.cjs` **PASS**: RFQ dòng giá `0` không được gửi (`422`), sửa giá -> gửi -> khóa điều khoản -> về draft sửa lại -> re-issue -> buyer/admin accept -> record payment -> release warehouse đều PASS.

### DF-006 — VERIFIED — P1: Idempotency đang chặn cả lần mua lại hợp lệ

- **Trạng thái:** ✅ Đã hoàn tất & VERIFIED.
- **Files đã sửa:** `src/lib/checkout-submission.ts`, `src/ui/modules/cart-checkout/cart-checkout-client.tsx`, `src/app/(frontend)/api/orders/create/route.ts`.
- **Chi tiết fix:** Thêm `retireCheckoutKey(payload)` xóa key khỏi `sessionStorage` ngay khi nhận được xác nhận đơn thành công từ server; giữ nguyên key nếu request timeout/lỗi mạng hoặc `409 priceChanged` để retry an toàn, và tự sinh key mới cho lần mua tiếp theo cùng sản phẩm/địa chỉ.
- **Tests & kết quả:** `tests/database.test.cjs` & `tests/domain-fixes.test.cjs` **PASS**: concurrent same key trả về cùng `orderId`; `retireCheckoutKey` có hiệu lực sau checkout thành công.

### DF-007 — VERIFIED — P1: Admin tìm kiếm, export và tổng số liệu chỉ nhìn một phần dữ liệu

- **Trạng thái:** ✅ Đã hoàn tất & VERIFIED.
- **Files đã sửa:** `src/lib/admin-queries.ts`, `src/app/(frontend)/api/admin/data/route.ts`, `src/app/(admin)/admin/page.tsx`, `src/app/(frontend)/api/admin/poll/route.ts`, `src/app/(admin)/admin/admin-workspace.tsx`, `src/app/(admin)/admin/leads/lead-operations.tsx`, `src/lib/crm-metrics.ts`.
- **Chi tiết fix:** Thêm `getRoleScopedAggregates` SQL aggregate theo quyền cho `summary` KPI cards; tạo endpoint `/api/admin/data` phân trang server-side (`orders`, `leads`, `customers`, `reviews`, `comments`, `summary`) + CSV chunk export toàn bộ D1; hợp nhất `buildUnifiedCustomersProjection`; Marketing overview ẩn khối doanh thu (không hiện `$0` sai); wired "Load More from D1" & server search cho Orders, Customers và Leads; mở rộng CRM metrics bao gồm B2B quote `approved`.
- **Tests & kết quả:** `tests/domain-fixes.test.cjs` **PASS**: `/api/admin/data` & `admin-queries.ts` biên dịch strict TS và trả CSV/D1 records chính xác.

### DF-008 — FIXED_PENDING_VERIFICATION — P1: SSE replay cursor có thể mắc ở backlog không thuộc quyền người xem

- **Trạng thái:** ⏳ FIXED_PENDING_VERIFICATION (đã fix + pass SSE unit test; còn xác minh reconnect multi-tab browser trên Cloudflare Worker runtime).
- **Files đã sửa:** `src/app/(frontend)/api/admin/events/route.ts`, `src/app/(admin)/admin/admin-workspace.tsx`, `src/app/(frontend)/api/admin/reviews/update/route.ts`, `src/app/(frontend)/api/admin/comments/update/route.ts`, `src/app/(frontend)/api/blog/comments/route.ts`.
- **Chi tiết fix:** Fast-forward tối đa 500 event bị lọc quyền mỗi tick; phát `event: checkpoint` có JSON `data` (gồm trường hợp `cursor > maxId` reset cursor về `maxId`); lưu cursor theo key user `admin-event-cursor:${adminUser.id}`; thêm `pendingPollDirtyRef` để poll bù khi `fetchPollData` bị trùng nhịp; emit `REVIEW_UPDATED` / `COMMENT_UPDATED`.
- **Tests & kết quả:** `tests/domain-fixes.test.cjs` & `tests/operations.test.cjs` **PASS**: verified `event: checkpoint` khi stale `cursor = 500 > maxId = 12` và filter `sales-a` không lộ `sales-b`.
- **Còn thiếu:** Multi-tab live browser `EventSource` test trên deployment Worker thật.

### DF-009 — FIXED_PENDING_VERIFICATION — P1: Optimistic UI chưa xử lý đầy đủ thất bại

- **Trạng thái:** ⏳ FIXED_PENDING_VERIFICATION (đã fix + pass controller unit test; còn test UX trực tiếp trên browser UI).
- **Files đã sửa:** `src/lib/admin-mutations.ts`, `src/app/(admin)/admin/admin-workspace.tsx`, `src/app/(admin)/admin/leads/lead-operations.tsx`.
- **Chi tiết fix:** Triển khai `OptimisticMutationController` (sequence guard chống out-of-order, kiểm tra `!res.ok`, rollback snapshot + toast lỗi rõ ràng cả khi network error hoặc `403`/`409`/`503`); thêm `reconcileBulkOrderUpdate` hòa giải từng ID theo `results[]` và giữ lại chỉ các ID thất bại; Kanban `handleDropLead` gửi `expectedVersion` và rollback + banner khi lỗi.
- **Tests & kết quả:** `tests/domain-fixes.test.cjs` (`DF-008 & DF-009`) **PASS**: simulated `409` trả state về snapshot ban đầu & thông báo lỗi; bulk `[updated, conflict]` chỉ cập nhật `updated`.
- **Còn thiếu:** Multi-tab browser UI E2E kiểm tra offline toggle / 409 trực quan.

### DF-010 — FIXED_PENDING_VERIFICATION — P1: Retry email báo giá không giữ nguyên delivery payload

- **Trạng thái:** ⏳ FIXED_PENDING_VERIFICATION (đã fix + pass SQLite outbox envelope retry test; còn test contract trên Resend API thật).
- **Files đã sửa:** `migrations/0006_domain_integrity.sql`, `src/lib/outbox.ts`, `src/app/(frontend)/api/admin/outbox/route.ts`.
- **Chi tiết fix:** Persist `delivery_envelope` (recipient, from, subject, HTML, `quoteUrl`, `version`, `bodyHash`) ngay trước lần gửi đầu; mọi retry dùng lại đúng envelope đã lưu và cùng `Idempotency-Key`; phân loại HTTP status thành `'transient'`, `'permanent'` (`dead_letter` + `dead_lettered_at`), hoặc `'superseded'`; thêm `GET`/`POST replayJobId` ở `/api/admin/outbox`.
- **Tests & kết quả:** `tests/domain-fixes.test.cjs` & `tests/operations.test.cjs` **PASS**: kiểm chứng retry sau 503 giữ nguyên `Idempotency-Key` và exact HTML `body`.
- **Còn thiếu:** Smoke test gửi thực tế qua Resend sandbox/production API.

### DF-011 — VERIFIED — P1: Hạn hiệu lực của báo giá chưa được khóa cùng commercial snapshot

- **Trạng thái:** ✅ Đã hoàn tất & VERIFIED.
- **Files đã sửa:** `migrations/0006_domain_integrity.sql`, `src/lib/quote-transition.ts`.
- **Chi tiết fix:** Tái tạo trigger `lock_issued_commercial_terms` đưa `quote_valid_until` vào danh sách cột bị khóa khi `quote_status IN ('sent','viewed','negotiating','approved')`; `quote-transition.ts` đối chiếu `validUntil` giữa snapshot version tương ứng và yêu cầu của buyer.
- **Tests & kết quả:** `tests/domain-fixes.test.cjs` **PASS**: SQL `UPDATE orders SET quote_valid_until = ...` khi đã `sent` bị trigger chặn với lỗi `Move an unapproved quote to draft`.

### DF-012 — VERIFIED — P1: Buyer confirmation chưa phản ánh đúng loại giao dịch và giá cuối

- **Trạng thái:** ✅ Đã hoàn tất & VERIFIED.
- **Files đã sửa:** `migrations/0006_domain_integrity.sql`, `src/lib/order-receipt.ts`, `src/app/(frontend)/api/orders/create/route.ts`, `src/ui/modules/cart-checkout/cart-checkout-client.tsx`, `src/app/(frontend)/order-success/page.tsx`.
- **Chi tiết fix:** Checkout client gửi `requirePriceMatch: true` & `expectedTotal`; khi giá server thay đổi trả `409 priceChanged` kèm `serverPricing` buộc buyer xác nhận lại; sinh `receiptToken` ngẫu nhiên lưu `receipt_token_hash` ở D1; `/order-success` xác minh token bằng `timingSafeEqual` (thiếu/sai token chỉ hiện thông báo chung không lộ dữ liệu đơn); hiển thị thông điệp phân tách rõ `wholesale_rfq` vs `sample` vs `direct` và chính sách thanh toán USD.
- **Tests & kết quả:** `tests/domain-fixes.test.cjs` (`DF-006, DF-012, DF-019`) **PASS**: sai giá -> `409 priceChanged` với `serverPricing`, hợp lệ -> trả `receiptToken`, `verifyReceiptToken` pass/fail đúng token & wrong/missing token.

### DF-013 — VERIFIED — P1: Buyer link hiển thị commercial draft chưa được phát hành

- **Trạng thái:** ✅ Đã hoàn tất & VERIFIED.
- **Files đã sửa:** `src/lib/quote-access.ts`, `src/app/(frontend)/quote/[id]/page.tsx`, `src/app/(frontend)/quote/[id]/quote-view-client.tsx`.
- **Chi tiết fix:** Buyer chỉ render dữ liệu từ `quote_versions` snapshot khớp `access.tokenVersion` (tuyệt đối không đọc draft live trên bảng `orders`); khi token cũ bị vượt bởi version mới (`access.isSuperseded`), trang hiển thị màn hình `"Quotation Superseded"`; khi quote đang bị nhân viên đưa về draft chỉnh sửa, trang khóa nút Approve của buyer; chỉ nhân viên đã đăng nhập (`access.isStaff`) mới thấy preview draft với banner cảnh báo nội bộ.
- **Tests & kết quả:** `tests/domain-fixes.test.cjs` **PASS**: sau khi lên draft & cấp version 2, `resolveQuoteAccess` báo `isSuperseded: true` cho `tok1` và `canAccessQuote(..., tok1)` trả `false`.

### DF-014 — VERIFIED — P1: Link hết hạn trước báo giá

- **Trạng thái:** ✅ Đã hoàn tất & VERIFIED.
- **Files đã sửa:** `src/lib/quote-token.ts`, `src/lib/quote-access.ts`.
- **Chi tiết fix:** `issueQuoteAccess` đồng bộ `expires_at` với `validUntil` trong snapshot/order (`quote_valid_until`, fallback 14 ngày nếu chưa đặt), từ chối phát hành link nếu quote đã hết hạn (`expiresAtMs <= now`).
- **Tests & kết quả:** `tests/domain-fixes.test.cjs` **PASS**: quote hạn `2026-12-10` sinh `quote_access.expires_at = '2026-12-10T00:00:00.000Z'` (không còn cứng 7 ngày).

### DF-015 — FIXED_PENDING_VERIFICATION — P1: Email lead có thể gửi trùng khi lưu activity thất bại

- **Trạng thái:** ⏳ FIXED_PENDING_VERIFICATION (đã fix + pass outbox/idempotency test; còn test gửi mail thật trên Resend).
- **Files đã sửa:** `src/app/(frontend)/api/admin/leads/email/route.ts`, `src/lib/outbox.ts`.
- **Chi tiết fix:** Chuyển gửi email lead vào bảng `outbox` (`event_type = 'lead.email'`) với `commandId` -> `jobId` & `delivery_envelope` ghi DB **trước** khi gọi Resend; ghi append-only `lead_notes`; retry cùng `commandId` dùng lại envelope & `Idempotency-Key` cũ và trả `idempotent: true` nếu đã `'sent'` (không gọi provider lần hai); thêm endpoint `GET /api/admin/leads/email?leadId=...` để UI tra trạng thái.
- **Tests & kết quả:** `tests/domain-fixes.test.cjs` **PASS**: attempt 1 `503` -> HTTP `502` & lưu `failed`; retry cùng `commandId` (dù đổi payload test) vẫn gửi nguyên HTML & `Idempotency-Key` cũ -> HTTP `200`; lần 3 trả `{ idempotent: true }` với `fetchCalls` giữ nguyên.
- **Còn thiếu:** Test delivery thực tế trên Resend sandbox/production.

### DF-016 — VERIFIED — P1: Có thể vô hiệu hóa superadmin cuối cùng qua PUT

- **Trạng thái:** ✅ Đã hoàn tất & VERIFIED.
- **Files đã sửa:** `migrations/0006_domain_integrity.sql`, `src/app/(frontend)/api/admin/users/route.ts`.
- **Chi tiết fix:** Validate `role`/`status` bằng strict enum runtime; chặn self-demote/self-disable (`409`); bảo vệ bằng cả conditional SQL và DB triggers `prevent_last_superadmin_demotion` & `prevent_last_superadmin_delete` nên dù 2 request đồng thời cũng không thể mất superadmin hoạt động cuối cùng.
- **Tests & kết quả:** `tests/domain-fixes.test.cjs` (`DF-016`) **PASS**: trigger SQLite & API `PUT` chặn demote/delete root superadmin cuối cùng.

### DF-017 — FIXED_PENDING_VERIFICATION — P1: CSV export sai cấu trúc và chưa vô hiệu hóa formula input

- **Trạng thái:** ⏳ FIXED_PENDING_VERIFICATION (đã fix + pass RFC-4180 round-trip & formula unit tests; còn kiểm chứng mở file trực tiếp trên Excel/Google Sheets nếu cần).
- **Files đã sửa:** `src/lib/csv.ts`, `src/app/(frontend)/api/admin/data/route.ts`, `src/app/(admin)/admin/admin-workspace.tsx`, `src/app/(admin)/admin/leads/lead-operations.tsx`.
- **Chi tiết fix:** Tạo `src/lib/csv.ts` dùng chung với RFC-4180 escaping (comma, quotes, newline), định dạng ISO date, trung hòa ký tự formula (`=`, `+`, `-`, `@`, `\t`, `\r`) bằng tiền tố `'`, giữ số 0 đầu cho SĐT/tracking/ID qua `preserveLeadingZero`; bỏ hết CSV string-join thủ công cũ ở workspace và `LeadOperations`.
- **Tests & kết quả:** `tests/domain-fixes.test.cjs` (`DF-017`) **PASS**: round-trip `parseCsv(serializeCsv(...))` giữ nguyên nội dung nhiều dòng/quote/comma, vô hiệu hóa `=CMD(...)` và bảo toàn `'00987`.
- **Còn thiếu:** Mở kiểm tra thực tế trên Excel desktop / Google Sheets.

### DF-018 — VERIFIED — P1: Pagination leads nhận LIMIT âm/không giới hạn

- **Trạng thái:** ✅ Đã hoàn tất & VERIFIED.
- **Files đã sửa:** `src/app/(frontend)/api/admin/leads/route.ts`, `src/lib/d1.ts`.
- **Chi tiết fix:** API parse bằng regex số nguyên dương nghiêm ngặt, ép range `limit: 1..100` & `offset >= 0` (trả `400` cho `-1`, `NaN`, `Infinity`, số thập phân); `leadsDb.list` & `ordersDb.list` đều clamp boundary phòng thủ tại tầng repo.
- **Tests & kết quả:** `tests/domain-fixes.test.cjs` (`DF-018`) **PASS**: `limit=-1`, `NaN`, `1.5`, `offset=-2` đều trả HTTP `400`.

### DF-019 — FIXED_PENDING_VERIFICATION — P1: Public order creation chưa có lớp chống abuse trong application

- **Trạng thái:** ⏳ FIXED_PENDING_VERIFICATION (đã fix + pass local rate-limit/idempotency order test; chưa kiểm tra cấu hình Cloudflare WAF ngoài repo).
- **Files đã sửa:** `src/app/(frontend)/api/orders/create/route.ts`, `src/lib/rate-limit.ts`.
- **Chi tiết fix:** Áp dụng `takeRateLimit` theo IP (`20/giờ`) và theo email/SĐT (`8/giờ`) dùng atomic SQLite `request_limits`, nhưng luôn chạy kiểm tra idempotency hit **trước** rate-limit để retry hợp lệ cùng `Idempotency-Key` không bao giờ bị chặn oan.
- **Tests & kết quả:** `tests/domain-fixes.test.cjs` (`DF-019`) **PASS**: vượt 8 đơn từ 1 contact -> đơn mới thứ 9 bị chặn `429`, trong khi replay key cũ vẫn trả `200`.
- **Còn thiếu:** Kiểm tra Cloudflare WAF rule trên dashboard production.

### DF-020 — VERIFIED — P2: Sales không thể claim unassigned lead như comment nghiệp vụ mô tả

- **Trạng thái:** ✅ Đã hoàn tất & VERIFIED.
- **Files đã sửa:** `src/lib/d1.ts`, `src/app/(frontend)/api/admin/leads/claim/route.ts`, `src/app/(frontend)/api/admin/leads/route.ts`, `src/app/(frontend)/api/admin/leads/update/route.ts`.
- **Chi tiết fix:** Tách endpoint atomic `POST /api/admin/leads/claim` gọi `leadsDb.claimUnassigned` (`UPDATE leads SET assigned_to = ? ... WHERE id = ? AND (assigned_to IS NULL OR assigned_to = '')`); hỗ trợ `?queue=unassigned` ở `GET /api/admin/leads`; gỡ nhánh claim chết ở `leads/update`.
- **Tests & kết quả:** `tests/domain-fixes.test.cjs` (`DF-020`) **PASS**: 2 sales (`sales-1` vs `sales-2`) cùng `POST /api/admin/leads/claim` đồng thời trên 1 lead -> đúng 1 `200`, 1 `409`.

### DF-021 — VERIFIED — P1: Sales import không bảo đảm lead thuộc người import

- **Trạng thái:** ✅ Đã hoàn tất & VERIFIED.
- **Files đã sửa:** `migrations/0006_domain_integrity.sql`, `src/app/(frontend)/api/admin/import/route.ts`, `src/app/(admin)/admin/csv-import-modal.tsx`.
- **Chi tiết fix:** Sales bị chặn (`403`) nếu chọn `assignmentMode: 'pool'` và luôn bị ép gán `assigned_to: session.id`; deduplicate email trùng trong batch; dùng bảng `import_batches` + `importKey` chống tạo bản ghi lặp khi retry (`409` nếu hash payload khác); chuẩn hóa trạng thái `SHIPPED -> 'shipping'`; UI cập nhật option theo role & gửi `importKey`.
- **Tests & kết quả:** `tests/domain-fixes.test.cjs` (`DF-021`) **PASS**: `sales` -> `'pool'` trả `403`, email trùng chỉ import 1, replay `importKey` trả `idempotent: true`, đổi payload cùng key trả `409`.

### DF-022 — VERIFIED — P0: Generic Sanity fetch được expose thành Server Action không có authorization

- **Trạng thái:** ✅ Đã hoàn tất & VERIFIED.
- **Files đã sửa:** `src/sanity/lib/live.ts`, `src/ui/modules/search/actions.ts`, `src/ui/modules/search/store.ts`, `src/ui/modules/search/search-results.tsx`, `src/ui/modules/search/search-form.tsx`, `scripts/lint-security.cjs`.
- **Chi tiết fix:** Gỡ `'use server'` khỏi `src/sanity/lib/live.ts` và thêm `import 'server-only'`; ép `perspective = 'published'` khi `!preview` (không cho caller override); tạo dedicated Server Action `searchStorefront` trong `src/ui/modules/search/actions.ts` với scope allowlist, GROQ cố định, clamp bounds `pageSize <= 24`; `lint:security` chặn client import `@/sanity/lib/live` và chặn `'use server'` quay lại `live.ts`.
- **Tests & kết quả:** `tests/storefront-security.test.cjs`, `npm run lint:security` & `npm run build` compile **PASS**.

### DF-023 — VERIFIED — P1: JSON-LD Product/Organization có script breakout từ dữ liệu CMS

- **Trạng thái:** ✅ Đã hoàn tất & VERIFIED.
- **Files đã sửa:** `src/lib/json-ld.ts`, `src/app/(frontend)/products/[slug]/page.tsx`, `src/ui/organization-json-ld.tsx`, `src/ui/modules/accordion-list.tsx`, `src/ui/modules/step-list.tsx`, `src/ui/modules/blog/schema.tsx`, `scripts/lint-security.cjs`.
- **Chi tiết fix:** Tạo helper `serializeJsonLd` escape `<`, `\u2028`, `\u2029` và áp dụng đồng loạt cho mọi `<script type="application/ld+json">`; thêm rule vào `lint:security` phát hiện mọi sink `JSON.stringify` trần trong JSON-LD.
- **Tests & kết quả:** `tests/storefront-security.test.cjs` (`DF-023`) **PASS**: payload `</script><script>alert("xss")</script><!--` được thoát hoàn toàn ký tự `<` mà `JSON.parse` vẫn khôi phục nguyên vẹn.

### DF-024 — VERIFIED — P1: Public lead API cho caller đặt link trong email chính thức

- **Trạng thái:** ✅ Đã hoàn tất & VERIFIED.
- **Files đã sửa:** `src/lib/compliance-assets.ts`, `src/lib/outbox.ts`, `src/app/(frontend)/api/leads/route.ts`, `src/app/(frontend)/api/popup/lead/route.ts`.
- **Chi tiết fix:** Server bỏ qua `asset_url`/`asset_title` do client gửi; nhận `assetId` và tự truy vấn document đã publish trong Sanity thông qua `lookupPublishedComplianceAsset`, đồng thời lọc host theo allowlist `cdn.sanity.io` / `NEXT_PUBLIC_BASE_URL` trong `resolveComplianceAssetUrl`.
- **Tests & kết quả:** `tests/domain-fixes.test.cjs` **PASS**: `asset_url: 'https://evil.example/phish.exe'` bị bỏ qua hoàn toàn; outbox payload chỉ chứa URL Sanity hợp lệ.

### DF-025 — VERIFIED — P1: Module compliance tự hiển thị chứng nhận và tuyên bố chưa được xác thực

- **Trạng thái:** ✅ Đã hoàn tất & VERIFIED.
- **Files đã sửa:** `src/ui/modules/compliance-vault/index.tsx`, `src/lib/dossier-email.ts`, `scripts/lint-security.cjs`.
- **Chi tiết fix:** Loại bỏ `DEFAULT_CERTS`, `DEFAULT_DOCS`, `DEFAULT_METRICS` (production trả về rỗng nếu CMS không cấu hình chứng nhận/tài liệu thật); sửa copy email dossier thành `"Technical Dossier Request Received"` trung thực; `lint:security` khóa chặn tái xuất hiện demo fallback.
- **Tests & kết quả:** `npm run lint:security` **PASS**.

### DF-026 — VERIFIED — P1: Review ghi ở D1 nhưng storefront vẫn đọc Sanity review

- **Trạng thái:** ✅ Đã hoàn tất & VERIFIED.
- **Files đã sửa:** `src/lib/reviews.ts`, `src/lib/d1.ts`, `src/app/(frontend)/products/[slug]/page.tsx`, `src/ui/modules/product/product-content.tsx`, `src/ui/modules/product/product-content-client.tsx`, `src/ui/modules/product/product-list.tsx`, `src/ui/modules/product/product-list-client.tsx`, `src/ui/modules/product/product-card.tsx`, `src/ui/modules/product/quick-view-modal.tsx`, `src/app/(frontend)/collections/[slug]/page.tsx`, `src/app/(frontend)/blog/[slug]/page.tsx`, `src/app/(frontend)/api/products/showcase/route.ts`, `src/ui/modules/search/actions.ts`, `src/sanity/lib/queries.ts`, `src/app/(frontend)/api/reviews/route.ts`, `src/app/(frontend)/api/admin/reviews/update/route.ts`, `scripts/lint-security.cjs`.
- **Chi tiết fix:** Hợp nhất toàn bộ review công khai trên D1 via `getApprovedReviewsForProduct` & batch aggregate `enrichProductsWithD1Reviews` (`GROUP BY product_id`, zero N+1, ẩn hoàn toàn `author_email`); gỡ mọi GROQ `*[_type == "review" ...]` khỏi Sanity queries/storefront; `admin/reviews/update` gọi `revalidateTag`/`revalidatePath` và phát `REVIEW_UPDATED` SSE event.
- **Tests & kết quả:** `tests/storefront-security.test.cjs`, `tests/security.test.cjs` & `npm run lint:security` **PASS**: chỉ hiển thị review `is_approved = 1`, `author_email === undefined`, `limit=-1` trả `400`.

### DF-027 — FIXED_PENDING_VERIFICATION — P1: UI upload review và API không cùng contract; mất ảnh vẫn báo thành công

- **Trạng thái:** ⏳ FIXED_PENDING_VERIFICATION (đã fix + pass full upload policy & orphan cleanup tests; còn kiểm tra thực tế với token Sanity upload CDN thật).
- **Files đã sửa:** `src/lib/upload-policy.ts`, `src/ui/modules/product/review-form-modal.tsx`, `src/app/(frontend)/api/reviews/route.ts`.
- **Chi tiết fix:** Đồng nhất policy tại `upload-policy.ts` (`MAX_REVIEW_IMAGES = 3`, JPEG/PNG/WebP `<= 5MB/file`, `<= 15MB` tổng); gỡ control video khỏi `ReviewFormModal`; API dùng `SANITY_API_WRITE_TOKEN` (không fallback READ token), thất bại rõ ràng (`503`/`502`) khi thiếu token hoặc Sanity lỗi upload ảnh, và dọn dẹp Sanity asset mồ côi nếu insert D1 thất bại.
- **Tests & kết quả:** `tests/storefront-security.test.cjs` & `tests/operations.test.cjs` **PASS**: thiếu `SANITY_API_WRITE_TOKEN` trả `503` thay vì drop ảnh, D1 fail sau upload gọi `delete('image-orphan-1')`.
- **Còn thiếu:** Test upload thật tới Sanity Assets API bằng `SANITY_API_WRITE_TOKEN` thật.

### DF-028 — FIXED_PENDING_VERIFICATION — P1: Compliance vault mở khóa và báo success cả khi lead API lỗi

- **Trạng thái:** ⏳ FIXED_PENDING_VERIFICATION (đã fix ở query + API + client; còn verify UI trên trình duyệt thực tế).
- **Files đã sửa:** `src/sanity/lib/queries.ts`, `src/ui/modules/compliance-vault/index.tsx`, `src/app/(frontend)/api/leads/route.ts`.
- **Chi tiết fix:** Gỡ URL asset thô khỏi public projection GROQ của `compliance-vault` (chỉ trả `assetId` & `hasFile`); `compliance-vault/index.tsx` chỉ báo đã ghi nhận sau khi `res.ok && data.success`, bỏ bypass mở khóa bằng `sessionStorage` hay trong `catch` mạng; gửi rành mạch `dossierConsent` vs `consent: false`.
- **Tests & kết quả:** `npm run typecheck`, `npm run lint:security` & `tests/domain-fixes.test.cjs` **PASS**.
- **Còn thiếu:** Browser UX check form Compliance Vault khi mạng offline / 429.

### DF-029 — FIXED_PENDING_VERIFICATION — P1: Lead notification/dossier chưa có durable delivery tương đương order

- **Trạng thái:** ⏳ FIXED_PENDING_VERIFICATION (đã fix + pass SQLite triggers & outbox drain tests; còn verify Cloudflare Cron Worker thực tế).
- **Files đã sửa:** `migrations/0006_domain_integrity.sql`, `src/lib/outbox.ts`, `src/app/(frontend)/api/leads/route.ts`, `src/app/(frontend)/api/popup/lead/route.ts`.
- **Chi tiết fix:** Thêm SQL triggers `lead_notify_job` & `lead_dossier_job` atomically ghi job `'lead.notify'` & `'lead.dossier'` vào `outbox` ngay trong cùng transaction tạo lead khi `enqueue_notify = 1` / `dossier_asset_id IS NOT NULL`; xử lý thống nhất trong `outbox.ts` (`processOutbox`/`drainOutbox`).
- **Tests & kết quả:** `tests/domain-fixes.test.cjs` **PASS**: verified 2 outbox jobs được SQL trigger tạo atomically cùng `POST /api/leads`.
- **Còn thiếu:** Verify scheduled Cron trigger trên Worker production.

### DF-030 — VERIFIED — P2: Search có race condition và lỗi để loading treo

- **Trạng thái:** ✅ Đã hoàn tất & VERIFIED.
- **Files đã sửa:** `src/ui/modules/search/store.ts`, `src/ui/modules/search/actions.ts`, `src/ui/modules/search/search-results.tsx`, `src/ui/modules/search/search-form.tsx`.
- **Chi tiết fix:** `handleSearch` thêm monotonic `activeRequestSequence` chặn response cũ ghi đè query mới; bọc `try/catch/finally` giải phóng `loading` và set `error` rõ ràng khi lỗi; clear results khi query rỗng; phân trang server-side bằng GROQ slice `[$start...$end]` & `pageSize` bounded.
- **Tests & kết quả:** `tests/storefront-security.test.cjs` (`DF-022 & DF-030`) **PASS**: query 1 chậm / query 2 nhanh giữ nguyên kết quả query 2, fetch reject thoát loading và đặt error message.

### DF-031 — FIXED_PENDING_VERIFICATION — P2: SEO routing chưa nhất quán giữa sitemap và redirect

- **Trạng thái:** ⏳ FIXED_PENDING_VERIFICATION (đã fix + pass unit tests cho entity routes, redirects & sitemap structure; còn verify live fetch `next.config.ts` redirects với Sanity online).
- **Files đã sửa:** `src/lib/routing.ts`, `src/sanity/lib/resolve-slug.ts`, `src/sanity/schemaTypes/documents/redirect.ts`, `next.config.ts`, `src/app/sitemap.ts`.
- **Chi tiết fix:** Tạo `resolveEntityRoute` & `normalizeRedirectEntry` dùng chung; hỗ trợ đủ `product`, `collection`, `blog.post`, `page` không bao giờ tạo `//`; thêm `collections` tôn trọng `noIndex != true` vào `sitemap.ts` và chuẩn hóa `baseUrl`; hỗ trợ field `permanent` trên document `redirect` thay vì hardcode `false`.
- **Tests & kết quả:** `tests/storefront-security.test.cjs` (`DF-031`) **PASS**.
- **Còn thiếu:** Chạy `next build` online xác nhận Sanity CDN redirects load 100%.

### DF-032 — FIXED_PENDING_VERIFICATION — P2: Media pipeline chưa bảo đảm tải nhẹ cho mobile

- **Trạng thái:** ⏳ FIXED_PENDING_VERIFICATION (đã fix + pass image loader & guard tests; còn đo Lighthouse mobile thực tế sau deploy).
- **Files đã sửa:** `src/sanity/lib/image-loader.ts`, `next.config.ts`, `src/ui/img.tsx`, `src/ui/responsiveImage.tsx`, `src/ui/modules/hero-slider/hero-slider-client.tsx`.
- **Chi tiết fix:** Cấu hình Next custom loader `src/sanity/lib/image-loader.ts` thay `unoptimized: true`, cấp responsive `srcSet`/`sizes` chuẩn Sanity CDN (`auto=format&fit=max`, bảo toàn `.svg`); `Source` tạo responsive breakpoints `[384, 640, 750, 960]`; `HeroSliderClient` chỉ eager-load slide đầu (`isFirst`); `VideoMediaItem` gating qua `IntersectionObserver` + `prefers-reduced-motion` + `preload="none"` khi offscreen; iframe thêm `loading="lazy"`.
- **Tests & kết quả:** `tests/storefront-security.test.cjs` (`DF-032`), `npm run typecheck` & `npm run perf:check -- --ci` **PASS**.
- **Còn thiếu:** Đo PageSpeed / Lighthouse mobile thực địa cho hero LCP và trang catalog/video.

### DF-033 — FIXED_PENDING_VERIFICATION — P2: Consent lần đầu có thể làm mất UTM của landing hiện tại

- **Trạng thái:** ⏳ FIXED_PENDING_VERIFICATION (đã fix + pass URL capture helper tests; còn E2E browser flow click "Allow marketing").
- **Files đã sửa:** `src/lib/attribution.ts`, `src/proxy.ts`, `src/store/use-consent-store.ts`.
- **Chi tiết fix:** Hợp nhất logic chuẩn hóa vào `resolveAttributionForVisit` & `captureCurrentUrlAttribution`; khi `useConsentStore.setMarketing(true)` được kích hoạt lần đầu trên trang landing, cookie `deanflow_attr` được capture ngay từ `window.location.href` + `document.referrer` với cùng TTL/SameSite/Secure; `setMarketing(false)` dọn cookie & `deanflow_session_journey` đồng bộ.
- **Tests & kết quả:** `tests/storefront-security.test.cjs` (`DF-033`) **PASS**.
- **Còn thiếu:** Fresh browser test luồng `campaign URL -> Allow marketing -> submit cùng trang`.

### DF-034 — VERIFIED — P2: Performance/security gates chưa bao phủ các tuyên bố chất lượng

- **Trạng thái:** ✅ Đã hoàn tất & VERIFIED.
- **Files đã sửa:** `scripts/perf-check.cjs`, `scripts/lint-security.cjs`, `.github/workflows/verify.yml`.
- **Chi tiết fix:** `perf-check.cjs --ci` fail non-zero nếu thiếu `.next/static/chunks`, kiểm tra budget theo route storefront (`<= 650 KB gzip`), shared root JS (`<= 250 KB gzip`), max non-Studio chunk (`<= 250 KB gzip`), và Worker bundle (`<= 8.5 MB / 10000 KiB`); `lint-security.cjs` quét đệ quy toàn bộ `src/` phát hiện client import `@/sanity/lib/live`, client module barrel, `'use server'` ở `live.ts`, JSON-LD không escape, Sanity review queries cũ và compliance demo fallback; `.github/workflows/verify.yml` bật `--ci`.
- **Tests & kết quả:** `npm run lint:security` (**PASS** 409 files), `npm run perf:check -- --ci` (**PASS** 10 routes), `tests/storefront-security.test.cjs` (verified `--ci` fails when `.next/static/chunks` missing).
