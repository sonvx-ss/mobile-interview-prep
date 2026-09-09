# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dự án

Trang web tĩnh ôn luyện phỏng vấn Mobile Development (Android + Flutter), nội dung tiếng Việt với
thuật ngữ kỹ thuật giữ tiếng Anh. Không có backend — mọi thứ là dữ liệu tĩnh trong repo + localStorage.

Nội dung trả lời cho người dùng nên viết bằng tiếng Việt, khớp với ngôn ngữ của codebase và dữ liệu.

## Lệnh

```bash
npm run dev         # vite dev server
npm run typecheck   # tsc -b --noEmit
npm run build       # tsc -b && vite build -> dist/
npm run preview     # serve bản dist
```

**Không có test framework trong dự án này.** Đừng đi tìm `npm test` hay vitest/jest — chúng không tồn tại.
`npm run typecheck` là cổng kiểm tra tự động duy nhất, và nó bắt được phần lớn lỗi dữ liệu (xem mục Escaping).

### Cách kiểm chứng thay đổi UI khi không có test runner

Dùng headless Chrome để render thật rồi grep DOM — cách này đã bắt được lỗi trong quá trình phát triển:

```bash
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
npm run dev &   # cổng mặc định 5173

# Dump DOM một route bất kỳ (hash router nên URL có #)
"$CH" --headless --disable-gpu --no-sandbox --virtual-time-budget=6000 \
  --dump-dom "http://localhost:5173/#/study/and-concurrency" > /tmp/dom.html

# Chụp ảnh để xem giao diện
"$CH" --headless --disable-gpu --no-sandbox --hide-scrollbars --virtual-time-budget=8000 \
  --window-size=1440,1200 --screenshot=/tmp/shot.png "http://localhost:5173/#/mock"
```

Kiểm tra nhanh sau khi sửa dữ liệu:

```bash
grep -c 'hljs-keyword' /tmp/dom.html    # syntax highlight có chạy
grep -o '<table>' /tmp/dom.html | wc -l # bảng GFM có render
grep -c '\\`' /tmp/dom.html             # PHẢI ra 0 — khác 0 là escaping lọt ra UI
```

Phần `deep`/`code` mặc định đóng nên không xuất hiện trong DOM. Muốn kiểm tra chúng, tạm đổi
`useState(false)` → `useState(true)` cho `expandAll` trong `src/pages/Study.tsx`, dump xong nhớ trả lại.

## Kiến trúc

### Luồng dữ liệu

```
data/tracks.ts          TRACKS (6 nhánh) -> GROUPS (37 nhóm), mỗi GROUP có trackId
        ^ groupId
data/questions/*.ts     mảng Question, mỗi câu trỏ về một groupId
        |
data/questions/index.ts gom tất cả thành ALL_QUESTIONS + cảnh báo id trùng (chỉ ở DEV)
        |
data/selectors.ts       tìm kiếm không dấu, đếm theo track, buildMockSet
        |
pages/                  Dashboard | Study/StudyIndex | Mock | Stories
```

`src/data/types.ts` là nguồn sự thật cho shape của `Question`, `Level`, `TrackId`.

**Ba ràng buộc dễ vỡ khi thêm nội dung:**

1. `groupId` của câu hỏi phải tồn tại trong `GROUPS` — không có kiểm tra runtime nào bắt lỗi này, câu hỏi
   sẽ đơn giản là biến mất khỏi UI.
2. File dữ liệu mới **phải** được import vào `src/data/questions/index.ts`, nếu không nó không tồn tại.
3. `Question.id` là **key lưu tiến độ trong localStorage**. Đổi id sau khi phát hành = người dùng mất tiến độ
   của câu đó. Coi nó như bất biến.

### Escaping trong file dữ liệu — nguồn lỗi số một

Trường `deep` và `code[].source` là **template literal** chứa markdown/code có rất nhiều backtick.
Bên trong chúng:

- Backtick phải viết là `` \` ``
- `${` phải viết là `\${` (hay gặp trong string template của Kotlin và trong `${{ secrets.X }}` của YAML)

Quên escape thì `tsc` báo hàng chục lỗi `TS1005: ',' expected` ở những dòng trông chẳng liên quan — nguyên nhân
thật là template literal bị kết thúc sớm ở dòng phía trên. Khi thấy dạng lỗi này, tìm backtick chưa escape
gần nhất **trước** dòng lỗi đầu tiên.

Ngược lại, `short`, `pitfalls[]`, `followUps[]` là **string thường** (nháy đơn) — backtick trong đó viết bình thường,
không escape, và được render thành inline code bởi markdown.

### Tiêu đề câu hỏi không phải markdown

`Question.title` là chuỗi thuần. Chỉ backtick là ký tự đặc biệt: `src/components/CodeTitle.tsx` tách chuỗi
theo backtick và bọc phần lẻ thành `<code>`. Đừng dùng `**bold**` hay cú pháp markdown khác trong `title`.

### Routing

Hash router tự viết (`src/lib/router.ts`), không dùng react-router. Bảng route nằm trong `src/App.tsx`:

| Hash | Trang |
|---|---|
| `#/` | Dashboard |
| `#/study` | StudyIndex |
| `#/study/<groupId>` | Study — thêm `?q=<questionId>` để cuộn tới và highlight một câu |
| `#/mock` | Mock (tự chuyển giữa Setup / Running / Summary theo state) |
| `#/stories` | Stories |

Sidebar chỉ hiện ở section `study` (điều kiện nằm trong `src/components/Layout.tsx`).

### State và lưu trữ

Mọi state bền đi qua `useLocalState` (`src/lib/useLocalState.ts`) → `src/lib/storage.ts`, tiền tố khoá `mip:v1:`.
Mọi truy cập localStorage đều bọc try/catch vì trình duyệt có thể chặn.

Khoá đang dùng: `progress`, `bookmarks`, `theme`, `star-drafts`, `mock-session`, `mock-tracks`, `mock-level`, `mock-count`.

Tiến độ (`progress` + `bookmarks`) đi qua React context: `ProgressProvider` bọc `App` trong `src/main.tsx`;
component đọc bằng `useProgress()` từ `src/lib/progress.ts`.

`mock-session` lưu cả buổi mock đang làm dở nên người dùng reload trang vẫn tiếp tục được — sửa shape của
`MockSession` sẽ làm hỏng session đang lưu của người dùng cũ.

### Sinh bộ đề mock

`buildMockSet` trong `src/data/selectors.ts` gom câu hỏi theo `groupId` rồi **rút vòng tròn qua các nhóm**
thay vì random phẳng, để một bộ 12 câu trải đều chủ đề chứ không dồn hết vào Coroutine. Dùng PRNG có seed
(`mulberry32`) nên truyền `seed` cố định sẽ tái tạo được cùng một bộ đề — trang Setup dùng `seed: 1` để
phần xem trước không nhảy mỗi lần render.

### Build

`vite.config.ts` chia `manualChunks` thành `content` (dữ liệu câu hỏi), `vendor-highlight`, `vendor-markdown`,
`vendor-react`. Mục đích: sửa nội dung câu hỏi không làm invalidate cache của vendor. Thêm dependency lớn thì
cân nhắc thêm vào bảng phân chia này.

`base` lấy từ biến môi trường `VITE_BASE` (CI đặt `/<tên-repo>/` cho GitHub Pages project page).

## CI

`.github/workflows/deploy.yml`: `typecheck` + `build` chạy trên mọi push và PR.

Các bước GitHub Pages có điều kiện `github.event.repository.visibility == 'public'` vì Pages cho repo private
yêu cầu gói Pro/Team (tài khoản hiện tại là free → API trả HTTP 422). Repo đang **private**, nên job `deploy`
bị skip và đó là hành vi đúng, không phải lỗi. Đổi repo sang public là deploy tự chạy, không cần sửa workflow.

## Ghi chú môi trường

Thư mục home `/Users/sonvx` cũng là một git repo. Repo này nằm lồng bên trong nó — luôn chạy lệnh git từ
thư mục dự án, đừng `git add` từ home.

`known_hosts` của máy còn key RSA cũ của github.com nên SSH tới GitHub sẽ báo host key changed. Git và `gh`
ở đây đều đi HTTPS nên không ảnh hưởng.
