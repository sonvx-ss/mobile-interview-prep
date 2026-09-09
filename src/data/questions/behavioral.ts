import type { Question } from '../types'

export const BEHAVIORAL_QUESTIONS: Question[] = [
  {
    id: 'star-framework',
    groupId: 'beh-star',
    title: 'Khung STAR là gì và kể thế nào cho hiệu quả?',
    levels: ['junior', 'mid', 'senior'],
    source: 'pdf',
    short:
      '**S**ituation (bối cảnh, 1–2 câu) → **T**ask (vai trò và trách nhiệm *của bạn*) → **A**ction (bạn đã làm gì, chi tiết nhất, chiếm ~60% thời lượng) → **R**esult (kết quả **có số liệu** + bạn học được gì). Toàn bộ nên gói trong **2–3 phút**. Lỗi lớn nhất là dành 2 phút cho Situation rồi hết thời gian cho Action.',
    deep: `**Phân bổ thời lượng chuẩn:**
\`\`\`text
S  ██                    ~15%   Bối cảnh vừa đủ để hiểu vấn đề
T  █                     ~10%   Vai trò của BẠN (không phải của team)
A  ████████████          ~55%   Bạn đã làm gì, quyết định gì, vì sao
R  ████                  ~20%   Số liệu + bài học
\`\`\`

**Ba nguyên tắc quan trọng nhất:**

1. **Dùng "tôi", không dùng "chúng tôi".** Interviewer đang tuyển *bạn*. "Chúng tôi đã tối ưu app" không cho biết bạn làm gì. Đúng: "Tôi profile bằng Perfetto, tìm ra \`onBindViewHolder\` gọi \`getUser()\` O(n), và thay bằng map index."

2. **Result phải có số.** "App nhanh hơn" là vô nghĩa. "Cold start P90 từ 4.2s xuống 1.8s; jank frame khi scroll từ 12% xuống 2%; crash-free users từ 98.1% lên 99.6%" là bằng chứng. Nếu không có số chính xác, ước lượng có căn cứ vẫn tốt hơn không có gì ("giảm khoảng một nửa số ticket về màn hình đó").

3. **Luôn đóng bằng bài học.** Một câu là đủ: "Từ đó tôi luôn đặt Macrobenchmark vào CI để không bị hồi quy." Nó biến một câu chuyện thành bằng chứng về khả năng học.

**Bốn dấu hiệu của một câu chuyện yếu:**
| Dấu hiệu | Vì sao mất điểm |
|---|---|
| Toàn "chúng tôi" | Không rõ đóng góp cá nhân |
| Không có số | Không kiểm chứng được |
| Đổ lỗi cho người khác/công ty cũ | Đỏ cờ về thái độ |
| Không có phần khó | Nghe như không thật |

**Chuẩn bị thực tế:** viết sẵn **6–8 câu chuyện**, mỗi cái dùng được cho nhiều câu hỏi. Một câu chuyện "fix memory leak dưới deadline gấp trong lúc bất đồng với tech lead" trả lời được cả *thử thách kỹ thuật*, *áp lực thời gian*, và *xung đột*. Đừng chuẩn bị 20 câu chuyện rời rạc.

**Với câu hỏi tiêu cực** ("kể về một lần bạn thất bại/mắc lỗi"): chọn lỗi **thật** nhưng đã được sửa, nhận trách nhiệm rõ ràng, tập trung vào **cái bạn thay đổi sau đó**. Đừng chọn lỗi giả ("em quá cầu toàn") — người phỏng vấn nhận ra ngay.`,
    pitfalls: [
      'Kể quá dài phần Situation rồi hết thời gian cho Action.',
      'Dùng "chúng tôi" xuyên suốt.',
      'Result không có số liệu.',
      'Nói xấu công ty/đồng nghiệp cũ.',
      'Chuẩn bị quá nhiều câu chuyện rời rạc thay vì vài câu dùng được nhiều mục đích.',
    ],
    followUps: [
      'Nếu interviewer đào sâu chi tiết kỹ thuật, bạn có nắm được không?',
      'Bạn học được gì và đã áp dụng lại chưa?',
      'Nếu làm lại, bạn làm gì khác?',
    ],
  },
  {
    id: 'behavioral-common-questions',
    groupId: 'beh-star',
    title: '10 tình huống cần chuẩn bị sẵn — mỗi cái interviewer đang đo gì?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Mỗi câu hỏi behavioral đo một năng lực cụ thể. Biết họ đang đo gì thì bạn chọn được câu chuyện đúng: *bug production* đo khả năng xử lý áp lực và quy trình; *conflict trong team* đo giao tiếp; *refactor lớn* đo tư duy đánh đổi; *deadline gấp* đo khả năng ưu tiên và dám nói không.',
    deep: `| Tình huống | Interviewer đang đo | Điều nhất định phải có trong câu trả lời |
|---|---|---|
| **Bug production nghiêm trọng** | Bình tĩnh, quy trình, ưu tiên | Trình tự: chặn thiệt hại (rollback/kill switch) → tìm nguyên nhân → fix → **hậu kiểm để không lặp lại** |
| **App lag / crash** | Kỹ năng debug có phương pháp | Bạn **đo** trước khi sửa (profiler, log), không đoán |
| **Refactor lớn** | Tư duy đánh đổi, quản lý rủi ro | Làm **từng phần**, có test bảo vệ, thuyết phục được stakeholder về giá trị |
| **Conflict trong team** | Giao tiếp, sự trưởng thành | Bạn tìm hiểu lý do phía bên kia; kết thúc bằng **quyết định và cùng thực thi**, không phải "ai thắng" |
| **Deadline gấp** | Ưu tiên, dám nói không | Bạn **thương lượng phạm vi** thay vì âm thầm cắt chất lượng; nêu rõ nợ kỹ thuật đã tạo và kế hoạch trả |
| **Tối ưu performance** | Chiều sâu kỹ thuật | Số liệu trước/sau, và **công cụ** cụ thể (Perfetto, Macrobenchmark, DevTools) |
| **Fix memory leak** | Chiều sâu kỹ thuật | Cách tìm (LeakCanary, heap dump), **nguyên nhân gốc**, và cách chống hồi quy |
| **Migration architecture** | Tầm nhìn dài hạn | Migrate **dần**, hai hệ cùng tồn tại, có mốc đo được — không "rewrite hết" |
| **Incident production** | Trách nhiệm, học từ lỗi | Có **postmortem không quy trách cá nhân**, và hành động cụ thể sau đó |
| **Mentor teammate** | Khả năng nhân bản năng lực | Bạn dạy **cách suy nghĩ**, không chỉ đưa đáp án; có kết quả quan sát được |

**Ba câu hỏi "bẫy" hay đi kèm:**
1. *"Nếu làm lại bạn làm gì khác?"* — luôn có câu trả lời thật. "Không có gì" nghe như thiếu tự phản tỉnh.
2. *"Tại sao không chọn phương án X?"* — họ kiểm tra bạn có **thực sự** cân nhắc hay chỉ làm theo cái mình biết.
3. *"Ai không đồng ý với bạn? Rồi sao?"* — họ muốn thấy bạn xử lý bất đồng, không phải áp đặt.

**Câu hỏi bạn nên hỏi lại** (đo mức độ bạn quan tâm tới công việc thật): quy trình release ra sao? crash-free rate hiện tại bao nhiêu? nợ kỹ thuật lớn nhất là gì? code review thế nào? ai quyết định kiến trúc?

Dùng tab **STAR Stories** của trang này để viết sẵn từng câu chuyện — viết ra rồi đọc lại thành tiếng là cách chuẩn bị hiệu quả nhất.`,
    pitfalls: [
      'Dùng cùng một câu chuyện cho mọi câu hỏi mà không điều chỉnh góc kể.',
      'Với câu về conflict, kể theo hướng "tôi đúng, họ sai".',
      'Với deadline gấp, kể việc làm OT 3 tuần như thành tích — nó cho thấy vấn đề ở lập kế hoạch.',
      'Không chuẩn bị câu hỏi để hỏi lại.',
    ],
    followUps: ['Bạn có postmortem cho incident không? Nó gồm gì?', 'Làm sao bạn thuyết phục stakeholder cho thời gian trả nợ kỹ thuật?'],
  },
]
