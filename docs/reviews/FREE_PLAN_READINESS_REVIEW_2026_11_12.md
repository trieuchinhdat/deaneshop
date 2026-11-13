# Review khả năng chạy Cloudflare Free — 2026-11-12

## Kết luận

### Tình trạng triển khai code sau review

- FREE-001: phương án hiện hành là đăng nhập Sanity bằng token đã xác minh + membership đúng project + liên kết User ID cố định trong D1. Mọi human member đúng project được tạo sales; staff đã có tự liên kết email từ Sanity và giữ role D1, không lấy role từ CMS/client và không chạy bcrypt và không cần host password service ở chế độ này. Cần toàn bộ migrations đến `0013`, tự liên kết/cấp sales sau khi xác minh phiên/project và nghiệm thu phiên Sanity thật; không dùng link mời. Không cần nhập Account ID thủ công. Backend bcrypt riêng được giữ cho mode password tùy chọn.
- FREE-002: thêm profile build `free` dùng published queries không đọc draft cookies, cache Static Assets cho prerender và bỏ request-bound reviews/comments khỏi public build. Preview/reviews/comments tạm tắt trong profile này; standard giữ luồng live và D1 theo request.
- FREE-003: bỏ inline outbox drain khỏi lead/popup/order capture; cron là processor, lazy-load delivery ở scheduled handler và giới hạn jobs qua cấu hình. Config hiện tại một job/invocation, không chứng minh đủ CPU; phải đo và theo dõi backlog.
- FREE-004: admin Free refresh 5 phút thay vì 60 giây, vẫn dừng khi tab ẩn và refresh sau mutation. Chưa gộp analytics/list endpoint hoặc thêm cache dữ liệu riêng tư.
- FREE-005: có `D1_LOG_METRICS` opt-in không log SQL/params; chưa thêm index/projection hoặc retention xóa dữ liệu khi chưa có profile query và chính sách lưu trữ.
- FREE-006: sample beacon theo document, mặc định Free không gửi; local snapshot vẫn có. Chưa thay search provider hoặc thêm cache search.
- FREE-007: giữ Studio hiện tại; thông báo perf gate đã đổi thành budget nội bộ, không còn tuyên bố ngưỡng Cloudflare Paid cũ.

Môi trường remote chưa được migrate/deploy các bản sửa này. Mã hiện tại chọn `NEXT_PUBLIC_ADMIN_AUTH_MODE=sanity` cho lần build tiếp theo; profile Free vẫn là lựa chọn riêng. Xem [hướng dẫn chuyển đăng nhập](../SANITY_ADMIN_SIGN_IN.md). Không còn cần host bcrypt cho mode Sanity; kiểm chứng CPU và browser trên remote vẫn còn thiếu.

Chưa có bằng chứng repo hiện tại vận hành ổn định trên Workers Free với đầy đủ tính năng. Để dùng Free ở giai đoạn đầu, nên thu gọn thành website nội dung prerender + API nhận lead nhỏ; chọn lại cách xác thực và delivery trước khi giữ toàn bộ Lead Workspace/email/commerce.

Ít khách truy cập giúp giảm tổng quota, nhưng không làm tăng ngân sách CPU cho một lần đăng nhập hoặc gửi form. Không cam kết chữa 1102 chỉ bằng giảm bundle, đổi lịch cron hoặc đưa công việc vào `waitUntil`.

Phạm vi: review source/config và artifact build đang có; không sửa application code, không thay plan, không deploy. Không chạy lại full tests/build trong lượt review này. Chưa có CPU/memory profile trên Cloudflare, thông tin plan/CPU limit thật hoặc load test. Đường login đã trả 503/1102 trong kiểm tra ở lượt trước; health 200 không xác minh toàn hệ thống.

## Giới hạn cần thiết kế theo

Theo tài liệu được đối chiếu ngày review: Workers Free có 10 ms CPU/request và mỗi cron invocation, 128 MB RAM/isolate, 100.000 requests/ngày, 5 cron triggers/account. D1 Free có 5 triệu rows read/ngày, 100.000 rows written/ngày, 5 GB tổng storage và 10 databases/account. Đây là quota dùng chung tương ứng trong account; mỗi khách hàng mới làm tăng phần sử dụng. Rows read là số hàng được đọc/quét, không phải chỉ số hàng trả về. Nguồn: [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/).

Thời gian đợi I/O không phải CPU xử lý. Tuy nhiên framework, parse/serialize JSON, dựng HTML, xác minh mật khẩu và dựng email đều có phần CPU. Cần invocation profiling, không lấy thời gian phản hồi HTTP làm CPU time.

## FREE-001 — P0: Cơ chế mật khẩu hiện tại không phù hợp mục tiêu CPU Free

**Bằng chứng:** `src/lib/passwords.ts` tạo bcrypt cost 12 và dùng `bcryptjs.compare`; login import thư viện và auth/D1 qua Next.js route. Benchmark synthetic ở lượt trước đo khoảng 282 ms CPU local cho một compare; không phải số đo CPU Cloudflare. Request login rỗng từng lỗi 1102 nên overhead trước bcrypt cũng cần profile.

**Cần làm:** chọn một phương án xác thực trước khi mở admin trên Free:

- Dùng identity provider hoặc xác thực tại backend ngoài Workers Free; giữ D1 làm nguồn quyền và trạng thái nhân viên. Cần xác minh chữ ký, issuer/audience/expiry và ánh xạ identity sang staff, có quy trình chuyển tài khoản cũ.
- Nếu vẫn giữ password auth hiện tại, đưa phần này sang môi trường có CPU đủ; một Worker Free khác vẫn chịu cùng giới hạn CPU, tách route đơn thuần không giải quyết bcrypt.

Lazy-load bcrypt sau validation và giảm lookup user lặp có thể giảm overhead, nhưng không làm chi phí compare biến mất. Không giảm bcrypt cost, cache kết quả password check hoặc bỏ rate limit để cố đạt Free. Không dùng đăng nhập Sanity làm cầu cấp admin session khi chưa có thiết kế xác thực và phân quyền rõ ràng.

**Nghiệm thu:** request rỗng, sai credentials, đúng credentials, tài khoản bị khóa và phiên bị thu hồi đều đúng; log không còn `exceededCpu`/`exceededMemory` trên môi trường mục tiêu. Không chỉ test một lần khi isolate đã warm.

## FREE-002 — P0: Public rendering cần chuyển sang ưu tiên prerender

**Bằng chứng:** product/blog detail có `dynamic = 'force-dynamic'`; product list module gọi `connection()` và enrich D1 reviews. `src/sanity/lib/live.ts` đọc `draftMode()`; layout public luôn render Visual Editing controls, nơi cũng đọc draft mode. `open-next.config.ts` chưa khai báo cache backend/interception. Không có đủ bằng chứng kết luận mọi route đều dynamic: artifact `.next/prerender-manifest.json` đang có chứa một số landing/blog listing prerender, nhưng không chứng minh behavior của mọi request hay artifact remote.

**Cần làm:** phân loại từng route thành nội dung public có thể prerender, dữ liệu public cần cập nhật, preview và dữ liệu riêng tư. Home/landing/blog/product ổn định nên render lúc build; Sanity publish kích hoạt build có debounce, hoặc chấp nhận lịch cập nhật đã thống nhất. Tách review/comment có thể thay đổi khỏi critical HTML path bằng snapshot đã publish hoặc endpoint nhỏ; không bịa rating và không làm JSON-LD lệch nội dung hiển thị.

Tách luồng published khỏi draft/preview để không đọc request cookies ở mọi nhánh cần static. Phải giữ quyền preview và chống rò draft. Không chỉ bỏ `connection()`/`force-dynamic` khi component vẫn truy cập D1 lúc build; đó từng là nguyên nhân build lỗi do không có D1.

OpenNext có read-only incremental cache từ Static Assets cho route đã prerender; không hỗ trợ revalidation. Đây là ứng viên cho bản Free chấp nhận rebuild khi publish. ISR với R2/queue/tag cache là thiết kế khác, có tài nguyên/quota riêng; không thêm mặc định chỉ để bật cache. Xem [OpenNext caching](https://opennext.js.org/cloudflare/caching).

**Không public-cache:** `/admin`, auth, staff/customer/lead API, quote cá nhân, response có cookie hoặc draft preview. Không bật Cache Everything toàn website. Cache hit có thể giảm SSR nhưng cache miss vẫn phải đáp ứng giới hạn CPU.

**Nghiệm thu:** route matrix + artifact build + kiểm tra header/behavior thực tế; nội dung mới xuất hiện theo chính sách publish; preview đúng; hai tài khoản không nhìn thấy dữ liệu lẫn nhau qua cache.

## FREE-003 — P0 nếu bật email: Background outbox vẫn là tải runtime

**Bằng chứng:** `worker.ts` chạy `drainOutbox(15)` mỗi phút. `/api/leads` và `/api/popup/lead` còn schedule `drainOutbox(5)` sau capture. `src/lib/outbox.ts` xử lý tuần tự, mỗi job có claim/lookup/envelope/provider/update. Cron mỗi phút tương đương 1.440 lần/ngày ngay cả khi ít lead; giảm tần suất giảm số invocation, không tăng CPU cho một invocation. `waitUntil` giữ công việc sau response, không phải cơ chế cấp thêm ngân sách CPU.

**Cần làm:** capture chỉ validate + ghi lead/outbox nguyên tử + trả receipt. Delivery/retry tách khỏi capture; giữ lease, envelope ổn định, idempotency, dead-letter và khả năng khôi phục. Bắt đầu benchmark một job/invocation, dựng email nhẹ và giới hạn batch; tăng batch chỉ khi có bằng chứng ngân sách đủ.

Nếu vẫn vượt CPU khi xử lý một job, chuyển delivery sang processor ngoài Free hoặc tạm không mở tính năng gửi email tự động. Không chỉ xóa cron để bỏ mặc job tồn đọng. Dossier hứa gửi qua email phải có cơ chế delivery hoạt động trước khi bật form.

**Nghiệm thu:** request capture và toàn bộ background work không lỗi tài nguyên; worker bị ngắt giữa chừng không mất job/gửi sai body; retry sau mất response provider vẫn đúng; theo dõi tuổi job pending và dead-letter. Không chỉ kiểm tra HTTP capture 200.

## FREE-004 — P1: Overview polling lặp lại nhiều lần quét D1

**Bằng chứng:** `lead-workspace-client.tsx` refresh 60 giây khi tab hiện. Overview gọi ba endpoint: analytics, leads, followups. Analytics chạy sáu aggregate queries; hai list mỗi cái lấy rows/count/staff, ngoài lookup session. Một tab Overview mở 8 giờ có khoảng 1.440 API calls định kỳ (3 × 60 × 8), chưa tính navigation và mutation. Client đã dừng refresh khi tab bị ẩn: cần giữ điểm này.

**Cần làm:** giai đoạn đầu ưu tiên refresh thủ công, hoặc chu kỳ 3–5 phút khi tab active. Refresh ngay sau mutation, không polling mọi panel không mở. Gộp endpoint để xác thực một lần và tránh tải staff lặp; không coi việc gộp request là tự giảm tất cả SQL scans. Aggregate có thể cache TTL ngắn theo đúng user/role/filter; phải có chính sách invalidation khi đổi assignment/quyền, không dùng cache public dùng chung.

**Nghiệm thu:** đếm requests/rows read trên một ca làm việc, xác minh dữ liệu quyền và follow-up vẫn đầy đủ. Không thay aggregate toàn dữ liệu bằng chỉ đếm 25 hàng đầu để tiết kiệm.

## FREE-005 — P1: Customer directory và analytics cần budget D1 theo rows read

**Bằng chứng:** directory tạo CTE UNION leads/comments/reviews, chuẩn hóa email rồi group; năm latest-field subqueries tương quan và query count riêng. List chỉ trả 25 profile nhưng phần gom dữ liệu có thể đọc nhiều hơn. Analytics group nhiều lần trên lead/assessment. Có indexes hiện hữu, chưa có `EXPLAIN QUERY PLAN`/D1 row metrics chứng minh chúng đủ cho workload thật.

**Cần làm:** đo `meta.rows_read/rows_written`, `EXPLAIN QUERY PLAN` và dataset đại diện trước khi thêm index. Dùng composite/expression index khi phù hợp predicates; `LIKE '%term%'` và hàm trên cột cần kiểm tra riêng. Tải Customers khi mở; giai đoạn đầu không tự refresh directory toàn dữ liệu. Projection table có thể giảm đọc khi dữ liệu lớn nhưng phải đánh đổi thêm writes, migration và đồng bộ theo quyền; không cần tạo sớm khi volume nhỏ.

Đặt retention cho request limit keys, events, telemetry và delivery đã hoàn tất theo nhu cầu vận hành; giữ dữ liệu audit/receipt/idempotency trong thời hạn nghiệp vụ. Mỗi capture còn có rate-limit writes và SQL triggers: không tính một lead là chỉ một row write. Vượt daily quota và vượt CPU là hai vấn đề khác nhau.

## FREE-006 — P1: Telemetry tự host đang thêm requests nhưng chưa có kho phân tích

**Bằng chứng:** layout public luôn mount `WebVitalsReporter`; reporter flush lúc rời trang/ẩn trang/cleanup. `sendVitalsBeacon()` gửi `/api/vitals`; endpoint chủ yếu validate và log khi vượt budget, chưa có pipeline lưu/truy vấn tổng hợp. Trong cùng lifecycle có guard chống flush lặp, nhưng navigation và checkout vẫn có thể tạo các request riêng.

**Cần làm:** giữ quan sát local, sample nhỏ (ví dụ 5–10%) hoặc tạm tắt beacon server trong bản Free; vẫn dùng Lighthouse/manual diagnostics. Nếu cần RUM, chọn giải pháp có quota phù hợp và dữ liệu dùng được. Chỉ log lỗi cần điều tra, tránh payload hoặc secrets/PII. Đây là tối ưu số request/tải tổng, không chữa CPU của login.

Search đã debounce 1 giây, giới hạn trang và loại stale response; không cần làm lại các phần đã có. Có thể thêm min-length hợp lý và cache truy vấn published phổ biến; search scope all vẫn có thể gọi ba nhóm Sanity và enrich D1 reviews. Giữ kiểm soát draft và cân nhắc rate limiting không tạo quá nhiều D1 writes.

## FREE-007 — P2: Studio, media và bundle là hạng mục phụ

Studio đã được tách client-side lazy load. Có thể host Studio riêng để giảm build/dependency coupling và tách vòng phát hành; chưa có bằng chứng đó chữa login 1102. Ảnh đang dùng Sanity CDN/custom loader: giữ resizing đúng kích thước và lazy-load, tránh đưa ảnh/video binary qua Worker nếu không cần.

`scripts/perf-check.cjs` kiểm tra kích thước JS/Worker, chưa kiểm tra CPU/RAM hay D1 quota và còn ghi ngưỡng paid bundle cũ trong thông báo. PASS không chứng minh Free-ready. Cần đối chiếu ngưỡng hiện hành và thêm báo cáo runtime riêng; không dùng gzip size làm proxy cho CPU. Không ưu tiên bỏ animation/frontend effects để sửa lỗi server 1102 khi chưa có profile: phần lớn các hiệu ứng chạy trên trình duyệt.

## Cấu hình sản phẩm đề xuất cho giai đoạn Free

| Thành phần | Phạm vi ban đầu |
| --- | --- |
| Home, landing, blog, catalog | Published content prerender; rebuild khi publish theo chính sách rõ ràng |
| Lead/RFQ | API nhỏ, lưu D1 bền vững, receipt/idempotency và giới hạn abuse được giữ |
| Admin | Identity/session phù hợp ngân sách; list, contact notes, assessment, follow-up trước |
| Analytics/Customers | Tải theo yêu cầu, refresh thủ công, chưa bật dashboard polling dày |
| Reviews/comments | Tạm tắt nếu chưa cần, hoặc tách khỏi public SSR và giữ moderation |
| Email/dossier | Chỉ bật sau khi processor được đo và nghiệm thu; không hứa delivery khi chưa có |
| Commerce/quote | Không mở nếu launch chỉ nhận inquiry; cần khóa entry points/API tương ứng chứ không chỉ ẩn nút |
| Studio | Giữ embedded nếu chưa cần tách; không xem là blocker đã được xác nhận |

## Thứ tự thực hiện và điều kiện nghiệm thu

1. Xác nhận account Free và invocation outcome thật; lấy CPU/memory profile cho login rỗng/đúng/sai, public route, capture và cron. Không đưa secrets hoặc credentials vào log.
2. Giải quyết FREE-001, thu gọn public rendering theo FREE-002, tách capture/delivery theo FREE-003. Nếu yêu cầu giữ đủ password auth + SSR + email hiện tại, phải chấp nhận thay kiến trúc hoặc dùng runtime khác cho các phần nặng.
3. Làm FREE-004–006 trước khi có nhiều nhân viên/traffic: giảm polling, kiểm tra scan D1, sample telemetry.
4. Chạy typecheck/tests/security/migrations/build/dry-run; đo cold/warm invocations trên Cloudflare Free với dữ liệu đại diện và dự kiến concurrency. Chọn mục tiêu nội bộ có headroom dưới 10 ms, ví dụ CPU p95 dưới 5 ms, nhưng percentile pass không cho phép bỏ qua request vẫn lỗi 1102; phải kiểm tra tail/errors và worst paths.
5. Ghi tổng Worker requests và D1 rows/ngày, cộng cron, staff, bot, rate-limit writes và retry. Dự trù quota cho mọi khách hàng chung account, bao gồm 5 cron triggers/10 D1 databases. Không suy ra mỗi website được một bộ quota mới.
6. Nghiệm thu đầy đủ quyền, consent, stale writes, retry/idempotency, delivery và rollback theo [checklist](../REVIEW_CHECKLIST.md). Ghi commit, version, plan, dữ liệu thử, số đo và giới hạn; health 200 hoặc bundle gate PASS chưa đủ.

Không có cách bảo đảm full-stack hiện tại chạy Free ổn định chỉ bằng một flag Wrangler. Với mục tiêu không trả phí Cloudflare ban đầu, thay đổi mang lại lợi ích lớn nhất là giảm phần xử lý động và xác thực/delivery nặng, không phải chỉ giảm dung lượng Studio.

## Kiểm chứng implementation — 2026-11-12

| Kiểm tra local | Kết quả |
| --- | --- |
| TypeScript | PASS |
| Full test suite | 71/71 PASS, gồm protocol bcrypt ngoài, fail-closed, giới hạn service và static Free boundaries |
| Security lint | PASS, 8 targeted checks và 428 source files |
| Migration verifier | PASS hai đường fresh và incremental, không sửa schema |
| Build Cloudflare profile Free | PASS; postbuild ghi profile artifact |
| Prerender manifest | 34 routes, có `/`, product/blog/collection; không có admin/quote private trong cache tĩnh |
| Wrangler dry-run và perf gate | PASS; chỉ kiểm tra bundle, không kiểm tra CPU runtime |
| Backend Node HTTP localhost | PASS hash/verify thực bằng dữ liệu giả và từ chối token sai |
| Deployment profile guard | PASS; chặn deploy artifact Free bằng cấu hình standard hiện tại |

Lỗi khi thử import `@next/env` trong OpenNext config đã được xử lý bằng wrapper build riêng: config runtime không kéo thư viện Node env loader vào Worker. Script `build:cf` nạp production env trước khi gọi adapter, nên profile trong `.env.local` được áp dụng nhất quán cho cache và Next build.

Chưa build/run container Docker, chưa host backend HTTPS, chưa thay runtime secrets, chưa chạy profile CPU/memory/cold-start trên Cloudflare Free, chưa deploy hoặc ghi database remote. Kết quả ở bảng trên là của đợt sửa trước khi thêm Sanity sign-in. Lần cập nhật auth mới có kết quả riêng ở cuối tài liệu; cần migrate/link/test phiên Sanity trước khi bật Free. FREE-005 index/projection/retention và endpoint aggregation còn cần số đo/chính sách riêng, không coi đã hoàn tất chỉ vì có logging.

## Cập nhật Sanity sign-in — 2026-11-12

Đã thêm xác minh token bằng Sanity API, membership human/current-user, explicit `sanity_user_id` unique link trong D1, chặn Origin khác và password endpoint khi dùng mode Sanity. JWT gắn auth mode/project/identity, tối đa một giờ; D1 role/status/credential/unlink vẫn kiểm tra mỗi request. Membership Sanity kiểm tra lúc exchange, nên cần đồng thời inactive/unlink D1 để thu hồi ngay thay vì chỉ xóa khỏi Sanity.

82/82 tests và TypeScript PASS; migration fresh/incremental và security lint PASS. Build Cloudflare Free với auth Sanity PASS; vẫn phải nghiệm thu browser/account thật, CPU/memory và migrations remote. Không deploy hoặc ghi D1 remote trong lượt sửa code.
