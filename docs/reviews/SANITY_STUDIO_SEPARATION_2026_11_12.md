# Tách Studio — kết quả local 2026-11-12

Phạm vi: working tree có sẵn nhiều thay đổi chưa commit; chỉ di chuyển/tích hợp Studio và bổ sung kiểm tra liên quan. Không tạo commit, không migrate D1 remote hoặc deploy production. Node 22.23.2, deployment profile `free`, cùng project/dataset cho hai build.

## Thay đổi

- Studio Sanity/Vite độc lập ở `studio/`, package/lockfile/env riêng; hostname đích `deanflow.sanity.studio`.
- Schema/actions/UI/preview/templates chuyển sang Studio, giữ hợp đồng dữ liệu. Next.js không mount NextStudio; route cũ chỉ redirect.
- Parser ba importer chạy trong Studio bằng client của user; guides là asset Studio. Helper thuần dùng chung ở `shared/`.
- Bridge CRM với state/cookie của browser, mã ngắn hạn dùng một lần và D1 migration 0014. Origin allowlist chính xác, không cookie cross-site và không lưu personal token. Chính sách staff D1 giữ nguyên.
- TypeGen chạy từ Studio, resolve queries bằng web tsconfig và sinh types vào website. CI build/deploy tách biệt, có kiểm tra import editor vào website.

## Số đo build trước/sau

| Chỉ số | Embedded Studio | Studio độc lập |
| --- | ---: | ---: |
| Files `.open-next/assets` | 745 | 295 |
| Tổng bytes `.open-next/assets` | 18,704,865 | 7,032,905 |
| Shared root client JS, gzip | 137.6 KiB | 130.6 KiB |
| Worker handler, raw | 10.70 MiB | 10.30 MiB |
| Wrangler Total Upload, raw | 18,243.60 KiB | 17,776.51 KiB |
| Wrangler Total Upload, gzip | 4,088.27 KiB | 3,961.73 KiB |

Static assets giảm khoảng 62.4%; Worker upload gzip giảm khoảng 3.1%. Studio trước đó đã dùng `ssr:false`, nên phần giảm lớn nằm ở editor assets. Không kết luận CPU Worker giảm tương ứng hoặc storefront nhanh hơn chỉ từ kích thước.

Build wall time một lần: trước 49.98s, sau 69.29s (lần cuối; lần trước 74.12s). Lượt sau có retry Google Fonts và chạy cùng các kiểm tra khác; đây không phải benchmark thời gian có kiểm soát. Không tuyên bố build nhanh hơn từ hai lần chạy này. Log cục bộ ở `/tmp/deanflow-studio-split/`, không chứa env secrets và không phải artifact phát hành.

## Bằng chứng kiểm tra

- Web/Studio TypeScript PASS, Studio build PASS.
- Website tests: 88/88 PASS, gồm sáu tests bridge/config mới; Studio tests: 5/5 PASS (ba importer và hai state tests).
- Đối chiếu parser cũ/mới: JSON, Markdown, nội dung rỗng cho post/product/page, cả status và payload đều khớp (9 trường hợp).
- TypeGen thành công với 31 queries, 151 schema types; generated types phản ánh schema hiện có, không chỉnh sửa bằng tay.
- Thử trong bản sao tại `/tmp/deanflow-studio-isolation` không có web node_modules: Studio TypeGen, typecheck và build PASS với dependencies riêng của Studio. Types sinh ra trùng byte với website. Formatter TypeGen dùng options riêng, không phụ thuộc plugin Prettier của website.
- Security lint, migration verifier (fresh và incremental), repository/production artifact release gates, Studio boundary, Cloudflare build, Wrangler dry-run và perf budgets PASS.
- 66 Next output traces và manifests không tham chiếu `studio/src`, `sanity-plugin-media`, assist/vision hoặc `next-sanity/dist/studio`.
- npm audit sau khi dùng các phiên bản đã khóa của dự án: Studio 0 vulnerabilities; web lock update cũng báo 0. Không nâng cấp Sanity ngoài phạm vi để tách Studio.

## Còn phải nghiệm thu ở môi trường đích

Chưa xác nhận hostname khả dụng, CORS project, migrations/secrets Worker, đăng nhập browser bằng Sanity thật, publish/upload thực, preview giữa hai origin hoặc CPU/memory Workers Free. CLI hiện có quyền xem project đúng; việc xem project không đăng ký hostname hay deploy. Chỉ chạy phát hành theo [runbook Studio](../SANITY_STUDIO_DEPLOYMENT.md) sau khi review artifact và cấu hình.
