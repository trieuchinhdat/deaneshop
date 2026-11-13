# DeanFlow

DeanFlow hiện ưu tiên website tạo inquiry và workspace xử lý lead. Luồng chính: nội dung/landing page → biểu mẫu hỏi hàng → lead trong `/admin` → đánh giá, liên hệ và follow-up. [Định vị sản phẩm](STRATEGY_POSITIONING.md) là nguồn quyết định phạm vi; các luồng commerce cũ vẫn còn trong mã nguồn để tương thích và cần kiểm tra phụ thuộc trước khi gỡ.

## Bắt đầu review

1. [Trạng thái dự án](docs/REVIEW_STATUS.md) — phần đã có, phần chưa được xác minh và các rủi ro hiện tại.
2. [Checklist review](docs/REVIEW_CHECKLIST.md) — các bước kiểm tra và nơi ghi bằng chứng.
3. [Kiến trúc](ARCHITECTURE.md) — đường đi của dữ liệu và vị trí mã nguồn.
4. [Tài liệu CMS](CMS-SCHEMA.md) và [runbook Cloudflare D1](RUNBOOK_CLOUDFLARE_D1.md).
5. [Chỉ mục tài liệu](docs/README.md) — hướng dẫn và các review còn cần theo dõi.

## Chạy tại máy phát triển

Dùng npm và `package-lock.json` để áp dụng security overrides; `yarn.lock` cũ không phải lockfile phát hành. Yêu cầu Node theo `.nvmrc` và các biến môi trường trong `.env.example`. Không commit secret. D1 local dùng binding của Wrangler/OpenNext; `D1_ALLOW_MEMORY=false` là mặc định. Cấu hình Sanity và D1 phù hợp môi trường trước khi thử các luồng ghi dữ liệu.

```bash
npm ci
npm run d1:migrate:local
npm run dev
```

Các lệnh kiểm tra hiện có:

```bash
npm run typecheck
npm test
npm run verify:migrations
npm run lint:security
npm run verify:release
```

`verify:release` ở chế độ mặc định không chứng minh production đã sẵn sàng. Xem [trạng thái dự án](docs/REVIEW_STATUS.md) và [runbook](RUNBOOK_CLOUDFLARE_D1.md) trước khi triển khai. `wrangler.jsonc` vẫn chứa D1 UUID placeholder tại thời điểm review tài liệu 2026-11-11.

## Bản đồ mã nguồn

| Khu vực | Vị trí |
| --- | --- |
| Routes frontend, API, admin, Studio | `src/app/` |
| GROQ, Live Content, generated types | `src/sanity/` |
| Studio, schema, editor, importer | `studio/` ([runbook](docs/SANITY_STUDIO_DEPLOYMENT.md)) |
| Dynamic modules và giao diện | `src/ui/` |
| D1, lead, quyền, nghiệp vụ | `src/lib/` |
| Migrations và schema | `migrations/`, `schema.sql` |
| Kiểm thử và release gates | `tests/`, `scripts/`, `.github/workflows/` |

Ba file `AGENT-GUIDE-*.md` ở thư mục gốc được API của Sanity Studio tải trực tiếp. Chúng là tài liệu đầu vào cho công cụ import; cần đối chiếu schema trước khi dùng làm đặc tả kỹ thuật hiện hành.

## Sanity Studio độc lập

Website chạy bằng `npm run dev`; Studio chạy riêng:

```bash
npm --prefix studio ci
cp studio/.env.example studio/.env.development.local
npm run dev:studio
```

Studio ở localhost:3333. Khi phát triển, đặt website `NEXT_PUBLIC_BASE_URL=http://localhost:3000`, `NEXT_PUBLIC_SANITY_STUDIO_URL=http://localhost:3333`, `SANITY_STUDIO_ORIGIN=http://localhost:3333`; không đổi env production để chạy local. `npm run typegen` cần dependencies Studio, còn web build không cần cài Studio. Xem [cấu hình và phát hành](docs/SANITY_STUDIO_DEPLOYMENT.md).
