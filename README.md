# Mobile Interview Prep — Android & Flutter

Trang web ôn luyện phỏng vấn Mobile Development (Android + Flutter, mọi level), nội dung tiếng Việt
với thuật ngữ kỹ thuật giữ tiếng Anh.

Nội dung được xây dựng từ tài liệu `Mobile Development.pdf` và mở rộng thêm.

## Tính năng

- **Ôn tập theo chủ đề** — cây chủ đề 6 nhánh (Nền tảng chung, Android, Flutter, Architecture,
  System Design, Behavioral), lọc theo level và theo tiến độ, đánh dấu *Đã chắc / Chưa chắc / Cần học*.
- **Mock interview** — chọn chủ đề + level, sinh bộ đề ngẫu nhiên trải đều các nhóm, **timer từng câu**
  (Junior 2 phút, Mid 3 phút, Senior 4 phút), ẩn đáp án đến khi bạn bấm hiện, cuối buổi có bảng kết quả
  và gợi ý nhóm chủ đề nên ôn lại.
- **STAR stories** — 10 tình huống behavioral kèm gợi ý từng phần S/T/A/R và checklist "nhất định phải có";
  viết vào ô nhập, lưu localStorage, xuất ra Markdown.
- **Tìm kiếm không dấu** — `⌘K` hoặc `/`; gõ "bo nho" tìm ra "bộ nhớ".
- Giao diện sáng/tối, responsive, in được (đã có `@media print`).

## Cấu trúc đáp án mỗi câu

1. **Chốt nhanh** — 2–4 câu để nói ngay khi interviewer hỏi.
2. **Giải thích sâu** — markdown có bảng so sánh.
3. **Code** — snippet Kotlin / Dart / Gradle / XML, có nút copy.
4. **Bẫy thường gặp** — những lỗi khiến bạn mất điểm.
5. **Interviewer sẽ đào tiếp** — câu hỏi tiếp theo để bạn chuẩn bị.

## Chạy local

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run build      # ra dist/
npm run preview
```

## CI & Deploy

`.github/workflows/deploy.yml` chạy `typecheck` + `build` trên mọi push và pull request.

Phần deploy GitHub Pages **chỉ kích hoạt khi repo là public** — Pages cho repo private yêu cầu
gói Pro/Team. Repo đang private thì workflow vẫn xanh, chỉ bỏ qua bước deploy.

Muốn có link công khai: đổi repo sang public (Settings → General → Danger Zone → Change visibility),
rồi bật **Settings → Pages → Source: GitHub Actions**. Push kế tiếp sẽ tự deploy tới
`https://<user>.github.io/<tên-repo>/`.

Workflow tự đặt `VITE_BASE=/<tên-repo>/`. Nếu dùng user page (`<user>.github.io`) thì sửa
`VITE_BASE: /` trong workflow.

## Thêm câu hỏi mới

Mỗi nhóm chủ đề là một file trong `src/data/questions/`. Thêm một object vào mảng:

```ts
{
  id: 'slug-on-dinh',          // ĐỪNG đổi sau khi phát hành — đây là key lưu tiến độ
  groupId: 'and-concurrency',  // xem src/data/tracks.ts
  levels: ['mid', 'senior'],
  title: 'Câu hỏi? (dùng `backtick` cho tên API)',
  short: 'Câu trả lời chốt nhanh, markdown inline.',
  deep: `Giải thích sâu, hỗ trợ bảng GFM.`,
  code: [{ lang: 'kotlin', caption: 'Mô tả', source: `...` }],
  pitfalls: ['...'],
  followUps: ['...'],
}
```

Lưu ý khi viết trong template literal: backtick phải escape thành ``\` ``, và `${` phải escape thành
`\${`. `npm run typecheck` sẽ báo lỗi nếu quên.

Thêm nhóm chủ đề mới thì khai báo trong `src/data/tracks.ts` (`GROUPS`), và nếu là file mới thì
import vào `src/data/questions/index.ts`.

## Lưu trữ

Tiến độ, đánh dấu, STAR draft và cấu hình mock đều nằm trong **localStorage của trình duyệt**
(tiền tố `mip:v1:`). Không có backend, không gửi dữ liệu đi đâu — nhưng cũng không đồng bộ sang máy khác.
