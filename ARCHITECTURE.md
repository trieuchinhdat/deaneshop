# Kiến trúc hiện tại

Cập nhật từ mã nguồn ngày 2026-11-11. Đây là bản đồ để review, không phải xác nhận production readiness.

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

Migrations đang ở `migrations/0000_baseline.sql` đến `0009_wholesale_rfq_leads.sql`. Không suy ra môi trường remote đã chạy các migration này từ việc file có trong repo.

## Quy ước thay đổi

- Trang `page.tsx` là Server Component; tương tác nằm trong client component riêng.
- Module mới phải đi qua tên hiển thị, schema với `defineModulePreview()`, registry, GROQ, typegen và `ModulesResolver`. Xem [CMS-SCHEMA.md](CMS-SCHEMA.md).
- Dùng type Sanity sinh từ `npm run typegen` cho dữ liệu CMS; D1 có domain type riêng trong `src/lib/d1.ts`.
- Legacy order/quote APIs và `admin-workspace.tsx` vẫn còn trong source, nhưng `/admin` hiện mount Lead Workspace. Việc loại bỏ cần audit các consumer trước.

Xem [định vị](STRATEGY_POSITIONING.md), [trạng thái](docs/REVIEW_STATUS.md) và [checklist review](docs/REVIEW_CHECKLIST.md).
