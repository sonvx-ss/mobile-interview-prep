export interface StoryPrompt {
  id: string
  title: string
  /** interviewer đang đo năng lực gì */
  measures: string
  /** gợi ý cho từng phần STAR */
  hints: { situation: string; task: string; action: string; result: string }
  /** những gì nhất định phải có */
  mustHave: string[]
}

export const STORY_PROMPTS: StoryPrompt[] = [
  {
    id: 'bug-production',
    title: 'Bug production nghiêm trọng',
    measures: 'Bình tĩnh dưới áp lực, quy trình xử lý sự cố, khả năng ưu tiên',
    hints: {
      situation: 'Bug gì, ảnh hưởng bao nhiêu user, phát hiện lúc nào và bằng cách nào?',
      task: 'Bạn là ai trong tình huống đó — người phát hiện, người fix, hay người điều phối?',
      action:
        'Trình tự: chặn thiệt hại trước (rollback / kill switch / remote config) → tìm nguyên nhân → fix → verify → phát hành. Bạn quyết định gì và vì sao?',
      result: 'Bao lâu thì khống chế được? Bao nhiêu user bị ảnh hưởng? Sau đó bạn thay đổi gì để không lặp lại?',
    },
    mustHave: [
      'Chặn thiệt hại trước khi đi tìm nguyên nhân gốc',
      'Số liệu: số user ảnh hưởng, thời gian khống chế (MTTR)',
      'Hành động phòng ngừa sau sự cố (test, alert, quy trình release)',
    ],
  },
  {
    id: 'app-lag-crash',
    title: 'App lag hoặc crash hàng loạt',
    measures: 'Debug có phương pháp, hiểu sâu nền tảng',
    hints: {
      situation: 'Biểu hiện gì? Trên thiết bị/phiên bản nào? Ai báo — user, QA, hay dashboard?',
      task: 'Bạn được giao điều tra hay tự nhận?',
      action:
        'Bạn ĐO bằng gì (Crashlytics, Perfetto, Memory Profiler, DevTools) trước khi sửa? Giả thuyết nào bị loại bỏ và vì sao?',
      result: 'Crash-free rate / P90 frame time trước và sau. Cách chống hồi quy.',
    },
    mustHave: [
      'Đo trước, sửa sau — không đoán',
      'Nêu tên công cụ cụ thể',
      'Số liệu trước/sau',
    ],
  },
  {
    id: 'refactor-lon',
    title: 'Một lần refactor lớn',
    measures: 'Tư duy đánh đổi, quản lý rủi ro, khả năng thuyết phục',
    hints: {
      situation: 'Vì sao phải refactor? Vấn đề cụ thể nó gây ra là gì (build chậm, bug lặp lại, không thêm được tính năng)?',
      task: 'Bạn đề xuất hay được giao? Bạn thuyết phục ai?',
      action:
        'Chia nhỏ thế nào? Có test bảo vệ trước khi sửa không? Hai hệ cùng tồn tại ra sao? Bạn giữ tính năng chạy liên tục bằng cách nào?',
      result: 'Chỉ số cải thiện (build time, số bug, thời gian thêm feature mới). Có gì đã không diễn ra như dự kiến?',
    },
    mustHave: [
      'Refactor từng phần, không big-bang rewrite',
      'Có test hoặc cơ chế bảo vệ trước khi sửa',
      'Lý lẽ nghiệp vụ để thuyết phục stakeholder, không chỉ lý lẽ kỹ thuật',
    ],
  },
  {
    id: 'conflict-team',
    title: 'Bất đồng / xung đột trong team',
    measures: 'Giao tiếp, sự trưởng thành, khả năng làm việc nhóm',
    hints: {
      situation: 'Bất đồng về điều gì? Với ai (đồng cấp, lead, PO)?',
      task: 'Vì sao bạn cần giải quyết nó thay vì bỏ qua?',
      action:
        'Bạn tìm hiểu lý do phía bên kia thế nào? Bạn đưa dữ liệu gì? Cuối cùng quyết định ra sao — và bạn phản ứng thế nào nếu quyết định không theo ý bạn?',
      result: 'Kết quả với sản phẩm VÀ với quan hệ làm việc. Bạn học được gì về cách trình bày ý kiến?',
    },
    mustHave: [
      'Thể hiện bạn thực sự hiểu góc nhìn phía bên kia',
      'Kết thúc bằng quyết định và cùng thực thi, không phải "ai thắng"',
      'Không nói xấu ai',
    ],
  },
  {
    id: 'deadline-gap',
    title: 'Deadline gấp',
    measures: 'Khả năng ưu tiên, dám nói không, minh bạch về đánh đổi',
    hints: {
      situation: 'Deadline gì, còn bao lâu, khối lượng ra sao? Vì sao gấp?',
      task: 'Phần nào là trách nhiệm của bạn?',
      action:
        'Bạn thương lượng PHẠM VI thế nào? Cắt gì, giữ gì? Bạn nói rõ với ai về nợ kỹ thuật sẽ phát sinh?',
      result: 'Kịp không? Chất lượng ra sao? Nợ kỹ thuật đã được trả chưa và bằng cách nào?',
    },
    mustHave: [
      'Thương lượng phạm vi thay vì âm thầm cắt chất lượng',
      'Minh bạch với stakeholder về đánh đổi',
      'Kế hoạch trả nợ kỹ thuật (và nói thật nếu chưa trả được)',
    ],
  },
  {
    id: 'toi-uu-performance',
    title: 'Tối ưu hiệu năng',
    measures: 'Chiều sâu kỹ thuật, tư duy dựa trên số liệu',
    hints: {
      situation: 'Chỉ số nào tệ? Ai phát hiện? Ảnh hưởng nghiệp vụ gì (tỉ lệ thoát, đánh giá store)?',
      task: 'Mục tiêu cụ thể bạn nhắm tới là gì?',
      action:
        'Profile bằng gì? Bottleneck thật là gì (khác với điều bạn đoán ban đầu không)? Bạn tối ưu gì và bỏ qua gì?',
      result: 'Số liệu trước/sau ở P50 và P90. Bạn đưa gì vào CI để không hồi quy?',
    },
    mustHave: [
      'Số liệu cụ thể, có percentile',
      'Bottleneck thật thường khác với dự đoán — kể chi tiết đó',
      'Cơ chế chống hồi quy (Macrobenchmark, alert)',
    ],
  },
  {
    id: 'fix-memory-leak',
    title: 'Fix memory leak',
    measures: 'Hiểu sâu nền tảng, kỹ năng điều tra',
    hints: {
      situation: 'Biểu hiện gì — OOM, app chậm dần, hay LeakCanary báo?',
      task: 'Bạn điều tra một mình hay cùng ai?',
      action:
        'Cách tái hiện (mở/đóng màn hình N lần, rotate)? Đọc heap dump thế nào? Nguyên nhân gốc là gì — và vì sao code đó được viết như vậy ban đầu?',
      result: 'Bộ nhớ sau khi sửa, số crash OOM giảm bao nhiêu. Bạn thêm gì để phát hiện sớm lần sau?',
    },
    mustHave: [
      'Nguyên nhân gốc cụ thể (không chỉ "có leak nên em sửa")',
      'Cách tái hiện có hệ thống',
      'Biện pháp phát hiện sớm (LeakCanary trong debug, StrictMode)',
    ],
  },
  {
    id: 'migration-architecture',
    title: 'Migration kiến trúc / công nghệ',
    measures: 'Tầm nhìn dài hạn, quản lý rủi ro ở quy mô lớn',
    hints: {
      situation: 'Migrate từ gì sang gì (RxJava→Coroutine, XML→Compose, MVP→MVVM)? Vì sao cần?',
      task: 'Bạn dẫn dắt hay tham gia?',
      action:
        'Chiến lược: module nào trước? Hai hệ cùng tồn tại thế nào? Bạn tránh "rewrite hết" ra sao? Bạn onboard team thế nào?',
      result: 'Tiến độ hiện tại (bao nhiêu % đã chuyển), lợi ích đo được, và điều bạn sẽ làm khác.',
    },
    mustHave: [
      'Migrate dần, có interop giữa hai hệ',
      'Bắt đầu từ chỗ ít rủi ro nhất',
      'Không đề xuất rewrite toàn bộ',
    ],
  },
  {
    id: 'incident-production',
    title: 'Incident production và postmortem',
    measures: 'Tinh thần trách nhiệm, khả năng học từ lỗi',
    hints: {
      situation: 'Sự cố gì? Bạn có phải nguyên nhân không (nếu có, càng nên kể thật)?',
      task: 'Vai trò của bạn trong xử lý và trong hậu kiểm?',
      action:
        'Timeline xử lý. Postmortem gồm gì? Bạn đề xuất hành động phòng ngừa nào và có được thực thi không?',
      result: 'Sự cố tương tự có tái diễn không? Quy trình team thay đổi thế nào?',
    },
    mustHave: [
      'Nhận trách nhiệm rõ ràng nếu là lỗi của mình',
      'Postmortem không quy trách cá nhân (blameless)',
      'Hành động phòng ngừa cụ thể và đã được thực thi',
    ],
  },
  {
    id: 'mentor-teammate',
    title: 'Mentor / hướng dẫn đồng nghiệp',
    measures: 'Khả năng nhân bản năng lực, kỹ năng lãnh đạo không cần chức danh',
    hints: {
      situation: 'Ai, ở mức nào, gặp khó khăn gì cụ thể?',
      task: 'Bạn được giao mentor hay tự nhận?',
      action:
        'Bạn dạy CÁCH SUY NGHĨ thế nào thay vì đưa đáp án? Bạn dùng code review, pair programming, hay tài liệu? Bạn điều chỉnh khi cách đầu không hiệu quả ra sao?',
      result: 'Người đó tiến bộ thế nào (quan sát được)? Bạn học được gì về việc dạy người khác?',
    },
    mustHave: [
      'Ví dụ cụ thể về cách bạn hướng dẫn, không chung chung',
      'Dạy cách tiếp cận vấn đề, không chỉ đưa lời giải',
      'Kết quả quan sát được ở phía người được mentor',
    ],
  },
]
