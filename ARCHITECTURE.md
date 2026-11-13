# Kiến trúc hiện tại

Cập nhật từ mã nguồn ngày 2026-11-11. Đây là bản đồ để review, không phải xác nhận production readiness.

## Sanity Studio độc lập — 2026-11-12

`studio/` chứa schema, editor, plugin, importer và config Sanity/Vite; có package/lockfile riêng và deploy lên Sanity Hosting. Next.js chỉ dùng client, queries, images, Live Content và types trong `src/sanity/`. `shared/` giữ helper thuần được cả hai ứng dụng dùng; không chứa Next.js, D1 hoặc secret. `/studio` ở website chỉ redirect; không render NextStudio. Xem [runbook](docs/SANITY_STUDIO_DEPLOYMENT.md).

Đăng nhập CRM dùng `/api/admin/auth/sanity/{start,exchange,callback}` với transaction browser-bound trong D1 (`0014_sanity_login_bridge.sql`); phiên CRM vẫn nằm trên website. CMS role độc lập D1 role. Schema/queries đổi: chạy `npm run typegen` qua CLI trong Studio rồi commit `src/sanity/types.ts`.

## Luồng chính

1. Next.js App Router trong `src/app/(frontend)/` render trang từ nội dung Sanity.
2. `src/sanity/lib/queries.ts` lấy các field cần thiết; `src/ui/modules/index.tsx` ánh xạ `_type` sang UI module.
3. Form gửi inquiry tới `src/app/(frontend)/api/leads/route.ts`. Dữ liệu nghiệp vụ được lưu qua `src/lib/d1.ts` vào Cloudflare D1.
4. `src/app/(admin)/admin/page.tsx` dựng `lead-workspace-client.tsx` cho người dùng đã đăng nhập. Workspace hiển thị Leads, Follow-ups, Insights, Customers và Team theo quyền.
5. `src/lib/admin-auth.ts` và `src/lib/admin-roles.ts` cùng các API admin kiểm soát phiên, vai trò và phạm vi dữ liệu. `src/lib/outbox.ts` xử lý công việc gửi thông báo.

## Ranh giới dữ liệu

| Hệ thống | Trách nhiệm |
| --- | --- |
| Sanity | Trang, bài viết, sản phẩm, module, cấu hình trình bày |
| D1 | Inquiry, đánh giá lead, follow-up, nhân sự, ghi chú, orders cũ, outbox |
| Zustand | Trạng thái tương tác phía trình duyệt; không là nguồn dữ liệu nghiệp vụ |

Migrations đang ở `migrations/0000_baseline.sql` đến `0014_sanity_login_bridge.sql`. Không suy ra môi trường remote đã chạy các migration này từ việc file có trong repo.

Profile Free build hai artifact: public website dùng Next.js static export và được Cloudflare Static Assets phục vụ trực tiếp; OpenNext Worker giữ API, admin, quote cá nhân, order-success và Studio redirect. Public URL chưa build trả static 404 thay vì render theo request. `worker-free.ts` chỉ lazy-load runtime cho các prefix trong `shared/runtime-routes.json`; cấu hình deploy được sinh ở `wrangler.free.generated.json`. Xem [runbook static storefront](docs/STATIC_STOREFRONT_DEPLOYMENT.md).

## Quy ước thay đổi

- Trang `page.tsx` là Server Component; tương tác nằm trong client component riêng.
- Module mới phải đi qua tên hiển thị, schema với `defineModulePreview()`, registry, GROQ, typegen và `ModulesResolver`. Xem [CMS-SCHEMA.md](CMS-SCHEMA.md).
- Dùng type Sanity sinh từ `npm run typegen` cho dữ liệu CMS; D1 có domain type riêng trong `src/lib/d1.ts`.
- `/admin` mount Lead Workspace. Dashboard commerce cũ và các modal/chart chỉ dashboard đó sử dụng đã được gỡ; order/quote APIs vẫn phục vụ các luồng checkout, quote và kiểm thử nghiệp vụ hiện có.

Xem [định vị](STRATEGY_POSITIONING.md), [trạng thái](docs/REVIEW_STATUS.md) và [checklist review](docs/REVIEW_CHECKLIST.md).
