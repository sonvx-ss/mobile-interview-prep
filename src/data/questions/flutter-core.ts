import type { Question } from '../types'

export const FLUTTER_CORE_QUESTIONS: Question[] = [
  // ============ flu-foundation ============
  {
    id: 'stateless-vs-stateful',
    groupId: 'flu-foundation',
    title: 'StatelessWidget và StatefulWidget khác nhau thế nào?',
    levels: ['junior'],
    source: 'pdf',
    short:
      '**StatelessWidget** không có state nội tại — mọi thứ nó vẽ đến từ tham số constructor; muốn đổi UI thì widget cha rebuild với tham số mới. **StatefulWidget** có một object `State` **sống lâu hơn widget**, giữ được dữ liệu qua các lần rebuild và tự gọi `setState` để vẽ lại.',
    deep: `**Điểm cốt lõi hay bị hiểu sai:** cả hai loại widget đều **immutable**. \`StatefulWidget\` không "chứa" state — nó *tạo ra* một object \`State\` riêng, và chính object đó mới mutable và sống dai.

\`\`\`text
Widget (immutable, bị tạo lại liên tục)
   |  createState()
State (sống dai, gắn với Element trong cây)
\`\`\`

Vì thế \`State\` truy cập tham số mới nhất qua \`widget.xxx\` — property \`widget\` được cập nhật mỗi lần widget mới cùng loại thay thế cái cũ.

\`\`\`dart
class Counter extends StatefulWidget {
  const Counter({super.key, required this.step});
  final int step;                        // immutable
  @override
  State<Counter> createState() => _CounterState();
}

class _CounterState extends State<Counter> {
  int _count = 0;                        // mutable, sống qua rebuild

  @override
  void didUpdateWidget(Counter old) {    // được gọi khi cha rebuild với step mới
    super.didUpdateWidget(old);
    if (old.step != widget.step) _recalculate();
  }

  @override
  Widget build(BuildContext context) => TextButton(
        onPressed: () => setState(() => _count += widget.step),  // đọc tham số mới nhất
        child: Text('\$_count'),
      );
}
\`\`\`

**Quy tắc chọn:** mặc định dùng \`StatelessWidget\`. Chỉ lên \`StatefulWidget\` khi cần (1) giữ state cục bộ thuần UI (\`TextEditingController\`, \`AnimationController\`, \`ScrollController\`), hoặc (2) cần lifecycle (\`initState\`/\`dispose\`). State nghiệp vụ thì đưa lên state management (Bloc/Riverpod), không để trong \`State\`.

**Với hooks/Riverpod**, \`ConsumerWidget\`/\`HookWidget\` cho phép giữ state cục bộ mà vẫn viết như stateless — giảm hẳn nhu cầu \`StatefulWidget\`.`,
    pitfalls: [
      'Đọc tham số qua biến copy trong `initState` rồi không cập nhật khi cha rebuild → dùng `widget.xxx` hoặc xử lý trong `didUpdateWidget`.',
      'Quên `dispose()` cho `AnimationController`/`TextEditingController`/`StreamSubscription` → leak.',
      'Gọi `setState` sau khi widget đã unmount → dùng `if (mounted)`.',
      'Để state nghiệp vụ trong `State` → mất khi widget bị rebuild ở vị trí khác trong cây, và không test được.',
    ],
    followUps: ['`didUpdateWidget` được gọi khi nào?', 'Vì sao widget immutable lại tốt cho hiệu năng?', '`mounted` dùng để làm gì?'],
  },
  {
    id: 'widget-lifecycle',
    groupId: 'flu-foundation',
    title: 'Vòng đời của StatefulWidget gồm những gì?',
    levels: ['junior', 'mid'],
    source: 'pdf',
    short:
      '`createState` → `initState` → `didChangeDependencies` → `build` → (`didUpdateWidget` → `build` mỗi lần cha rebuild) → `deactivate` → `dispose`. Hai mốc quan trọng nhất: `initState` (khởi tạo, **chưa dùng được `InheritedWidget`**) và `dispose` (giải phóng controller/subscription).',
    deep: `| Callback | Khi nào | Làm gì ở đây |
|---|---|---|
| \`createState\` | Một lần khi Element được tạo | Trả về State |
| \`initState\` | Một lần, trước build đầu | Tạo controller, subscribe. **Không** gọi \`context.watch\`/\`InheritedWidget\` |
| \`didChangeDependencies\` | Sau initState, và mỗi khi InheritedWidget phụ thuộc đổi | Đọc \`Theme.of\`, \`MediaQuery.of\`, provider |
| \`build\` | Rất nhiều lần | **Chỉ** dựng UI, không side-effect |
| \`didUpdateWidget(old)\` | Khi cha rebuild với widget mới cùng type + key | So sánh tham số cũ/mới, cập nhật controller |
| \`setState\` | Bạn gọi | Đánh dấu dirty → build lại |
| \`deactivate\` | Khi bị bỏ khỏi cây (có thể được đưa lại) | Ít dùng |
| \`dispose\` | Khi bị xoá vĩnh viễn | \`controller.dispose()\`, \`subscription.cancel()\` |

**Vì sao \`initState\` không dùng được \`InheritedWidget\`:** lúc đó State đã \`mounted\` nhưng cây phụ thuộc chưa được thiết lập xong, nên \`Theme.of(context)\` sẽ throw (hoặc không đăng ký dependency). Nếu buộc phải làm gì đó với context ngay:
\`\`\`dart
@override
void initState() {
  super.initState();
  // Hoãn tới sau frame đầu tiên
  WidgetsBinding.instance.addPostFrameCallback((_) {
    if (!mounted) return;
    context.read<CartBloc>().add(CartLoaded());
  });
}
\`\`\`

**\`dispose\` — checklist bắt buộc:**
\`\`\`dart
@override
void dispose() {
  _animationController.dispose();
  _textController.dispose();
  _scrollController.dispose();
  _subscription?.cancel();
  _timer?.cancel();
  super.dispose();               // gọi CUỐI CÙNG
}
\`\`\`

**Lifecycle của cả app** (khác lifecycle widget): \`AppLifecycleListener\` hoặc \`WidgetsBindingObserver.didChangeAppLifecycleState\` cho \`resumed\`/\`inactive\`/\`paused\`/\`detached\`/\`hidden\`.`,
    pitfalls: [
      'Gọi `Theme.of(context)`/`Provider.of` trong `initState` → exception. Dùng `didChangeDependencies` hoặc `addPostFrameCallback`.',
      'Gọi `super.dispose()` **trước** khi dispose các controller → lỗi.',
      'Gọi `setState` trong `build` → vòng lặp rebuild vô hạn.',
      '`await` rồi `setState` mà không kiểm tra `mounted` → "setState called after dispose".',
    ],
    followUps: ['`deactivate` vs `dispose`?', '`didChangeAppLifecycleState` có những state nào?', '`GlobalKey` ảnh hưởng lifecycle thế nào?'],
  },
  {
    id: 'three-trees',
    groupId: 'flu-foundation',
    title: 'Widget Tree, Element Tree, RenderObject Tree — ba cây này làm gì?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      '**Widget tree**: bản mô tả UI, **immutable và rẻ**, bị tạo lại liên tục. **Element tree**: cây *thực thể* sống dai, giữ state và mapping giữa widget và render object — đây là nơi Flutter so sánh cũ/mới để quyết định tái dùng hay tạo mới. **RenderObject tree**: nơi thực sự làm layout (measure/position) và painting — **đắt nhất**, nên Flutter cố hết sức tái dùng nó.',
    deep: `\`\`\`text
Widget           Element              RenderObject
(config, rẻ)     (lifecycle, state)   (layout + paint, đắt)
Text('a')  -->   StatelessElement --> RenderParagraph
Padding    -->   SingleChildElement-> RenderPadding
\`\`\`

**Cơ chế tái dùng (reconciliation)** — trả lời được là ăn điểm senior. Khi widget mới đến, Element so sánh với widget cũ:

\`\`\`text
canUpdate(old, new) = old.runtimeType == new.runtimeType && old.key == new.key
\`\`\`

- **true** → tái dùng Element và RenderObject, chỉ cập nhật config → **rất rẻ**.
- **false** → hủy Element cũ (mất State!) và tạo mới → đắt.

Đây là **lý do gốc** của toàn bộ chuyện về \`Key\`: khi bạn đảo thứ tự item trong list, widget ở cùng vị trí có cùng \`runtimeType\` và \`key == null\` → Flutter tưởng là cùng widget → **State bị gắn sai item**.

**Vì sao rebuild widget rẻ:** tạo một \`Text('a')\` chỉ là cấp phát một object nhỏ với vài field. Cái đắt là layout + paint, và phần đó chỉ chạy lại khi RenderObject bị đánh dấu \`markNeedsLayout\`/\`markNeedsPaint\`. Nên "build được gọi 60 lần/giây" không tự động là vấn đề — vấn đề là khi build tạo ra cây **khác** buộc layout chạy lại.

**Ba cờ đánh dấu:**
| Cờ | Nghĩa | Chi phí |
|---|---|---|
| \`markNeedsBuild\` (\`setState\`) | Element dirty → build lại | Rẻ |
| \`markNeedsLayout\` | Kích thước có thể đổi → measure lại | Trung bình, lan lên cha |
| \`markNeedsPaint\` | Chỉ hình thức đổi (màu, opacity) | Rẻ nhất |

Đó là lý do animate \`Opacity\`/\`Transform\` (chỉ repaint) rẻ hơn animate \`Padding\` (relayout).

**\`const\` widget cắt ngắn quá trình này:** cùng một instance const → \`old == new\` (identical) → Flutter bỏ qua cả subtree, không cần \`canUpdate\`.`,
    pitfalls: [
      'Nghĩ "build gọi nhiều lần = chậm". Build rẻ; layout và paint mới đắt.',
      'Không hiểu vì sao State "nhảy" sang item khác khi reorder list → thiếu `Key`.',
      'Tưởng RenderObject tree có cùng số node với widget tree — nhiều widget (như `Padding` composite hay `StatelessWidget`) không tạo RenderObject riêng.',
    ],
    followUps: [
      '`canUpdate` so sánh gì chính xác?',
      'Vì sao `const` widget giúp hiệu năng?',
      '`RepaintBoundary` can thiệp ở tầng cây nào?',
    ],
  },
  {
    id: 'buildcontext',
    groupId: 'flu-foundation',
    title: '`BuildContext` là gì? Vì sao dùng sai lại lỗi?',
    levels: ['mid'],
    source: 'pdf',
    short:
      '`BuildContext` **chính là Element** của widget đó trong cây — nó là "vị trí của tôi trong cây widget". Nhờ vậy `Theme.of(context)` có thể **đi ngược lên** tìm ancestor gần nhất. Lỗi phổ biến: dùng context của widget cha khi cần context của con (`showDialog` không tìm được `Navigator`/`Scaffold`), hoặc dùng context sau khi widget đã unmount.',
    deep: `\`\`\`dart
// context là "cửa sổ" nhìn lên cây phía trên -> tra ngược lên tìm ancestor
final theme = Theme.of(context);          // InheritedWidget gần nhất phía trên
final nav = Navigator.of(context);
final size = MediaQuery.sizeOf(context);  // sizeOf: chỉ rebuild khi size đổi (tốt hơn .of)
\`\`\`

**Lỗi 1: context không có ancestor cần tìm**
\`\`\`dart
// SAI: context của MyApp không có Scaffold phía trên
class MyApp extends StatelessWidget {
  Widget build(BuildContext context) => MaterialApp(
    home: Builder(builder: (innerContext) {          // Builder tạo context MỚI, sâu hơn
      return ElevatedButton(
        onPressed: () => ScaffoldMessenger.of(innerContext).showSnackBar(...),
        child: const Text('OK'),
      );
    }),
  );
}
\`\`\`
\`Builder\` chính là cách chuẩn để "lấy context sâu hơn một bậc".

**Lỗi 2: dùng context sau await** — lint \`use_build_context_synchronously\`:
\`\`\`dart
Future<void> submit() async {
  final result = await repo.save(data);
  if (!mounted) return;                   // BẮT BUỘC kiểm tra
  Navigator.of(context).pop(result);
}
\`\`\`
Nếu user bấm back trong lúc \`await\`, widget đã unmount → dùng context là crash. Trong Flutter 3.7+, \`StatelessWidget\` không có \`mounted\` → capture những gì cần **trước** khi await:
\`\`\`dart
final navigator = Navigator.of(context);   // lấy trước
final result = await repo.save(data);
navigator.pop(result);                     // dùng object đã lấy, không dùng context
\`\`\`

**Lỗi 3: \`context.watch\` ngoài \`build\`** — \`watch\` phải ở trong \`build\` để đăng ký dependency; trong callback thì dùng \`context.read\`.

**\`.of(context)\` tạo dependency:** khi InheritedWidget đó đổi, widget của bạn rebuild. Nên \`MediaQuery.of(context)\` khiến rebuild mỗi lần bàn phím lên/xuống. Flutter 3.10+ có \`MediaQuery.sizeOf\`/\`paddingOf\` để chỉ phụ thuộc phần bạn cần.`,
    pitfalls: [
      'Dùng context sau `await` mà không kiểm tra `mounted`.',
      '`MediaQuery.of(context)` khi chỉ cần size → rebuild thừa khi bàn phím xuất hiện.',
      '`context.watch` trong `onPressed` → exception; dùng `context.read`.',
      'Truyền context của widget này sang widget khác lưu giữ lâu dài.',
    ],
    followUps: ['`Builder` giải quyết vấn đề gì?', '`context.read` vs `watch` vs `select`?', '`sizeOf` khác `of` thế nào?'],
  },

  // ============ flu-rendering ============
  {
    id: 'flutter-rendering-pipeline',
    groupId: 'flu-rendering',
    title: 'Rendering pipeline của Flutter gồm những bước nào?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Mỗi frame: **Animate** (tick ticker) → **Build** (chạy `build()` của element dirty) → **Layout** (measure + position, single-pass) → **Paint** (sinh danh sách lệnh vẽ) → **Composite** (ghép layer) → **Rasterize** (raster thread biến layer thành pixel qua Impeller/Skia). Build/Layout/Paint chạy trên **UI thread**, rasterize chạy trên **raster thread** riêng.',
    deep: `\`\`\`text
Vsync -> [UI thread]  Animate -> Build -> Layout -> Paint -> tạo Layer tree
      -> [Raster thread] Composite -> Rasterize (Impeller/Skia) -> GPU -> màn hình
\`\`\`

**Hai thread, hai loại jank** — chi tiết quan trọng nhất:
| Thread | Chậm vì | Cách sửa |
|---|---|---|
| **UI thread** | \`build()\` nặng, layout phức tạp, JSON parse, tính toán trong build | Đưa việc nặng sang \`compute\`/isolate; giảm phạm vi rebuild |
| **Raster thread** | Shader compile lần đầu, hiệu ứng đắt (\`BackdropFilter\`, \`Opacity\` trên subtree lớn, saveLayer) | \`RepaintBoundary\`, tránh \`saveLayer\`, Impeller |

Flutter DevTools → Performance overlay vẽ **hai** đồ thị chính vì lý do này: thanh trên là raster, thanh dưới là UI. Biết thanh nào đỏ mới biết sửa ở đâu.

**Layout là single-pass** (một lần đi xuống truyền constraint, một lần đi lên trả size) — đó là điểm khác biệt lớn so với hệ thống layout có thể multi-pass. Quy tắc Flutter: *"constraints go down, sizes go up, parent sets position"*. Nhờ single-pass, layout là O(n) thay vì O(n²) như nested weight trong Android LinearLayout.

**Impeller thay Skia** (mặc định trên iOS từ Flutter 3.10, Android từ 3.27): biên dịch shader **trước** lúc build thay vì lúc runtime → giải quyết vấn đề jank "lần đầu chạy animation" (shader compilation jank) mà cộng đồng Flutter khổ nhiều năm.

**Điều nên nói khi được hỏi "làm sao tối ưu":** đo trước bằng DevTools timeline trên **profile mode** (không phải debug — debug chậm gấp nhiều lần và không đại diện).`,
    pitfalls: [
      'Đo hiệu năng trên **debug mode** → số liệu vô nghĩa. Luôn dùng `flutter run --profile`.',
      'Không phân biệt UI thread jank và raster thread jank → sửa sai chỗ.',
      'Đặt logic nặng (parse, sort, tính toán) trong `build()` → chạy mỗi frame.',
      'Dùng `Opacity` widget cho animation (gây `saveLayer`) thay vì `AnimatedOpacity`/`FadeTransition`.',
    ],
    followUps: ['Impeller giải quyết vấn đề gì so với Skia?', '`saveLayer` đắt vì sao?', 'Performance overlay đọc thế nào?'],
  },
  {
    id: 'tai-sao-flutter-render-nhanh',
    groupId: 'flu-rendering',
    title: 'Tại sao Flutter render nhanh hơn (so với React Native/WebView)?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Ba lý do: (1) Flutter **tự vẽ toàn bộ UI** lên canvas qua Impeller/Skia, **không dùng widget native** → không có bridge để đồng bộ cây view; (2) release build là **AOT compile sang mã máy ARM**, không phải JS thông dịch; (3) **layout single-pass** và cơ chế rebuild có kiểm soát. So sánh: React Native cũ phải chuyển đổi qua bridge JS↔native mỗi frame.',
    deep: `| | Flutter | React Native (old bridge) | WebView/Hybrid |
|---|---|---|---|
| UI | Tự vẽ (Impeller/Skia) | Widget native thật | HTML/CSS trong browser engine |
| Code release | **AOT** → mã máy ARM | JS thông dịch/JIT (Hermes) | JS |
| Giao tiếp UI | Không cần | Bridge JSON async (nút cổ chai) | DOM |
| Nhất quán giữa nền tảng | Rất cao (pixel giống nhau) | Phụ thuộc native | Phụ thuộc engine |
| Truy cập widget native mới | Phải tự vẽ lại | Có sẵn | Không |

**Nói cho công bằng — đánh đổi của cách tự vẽ:**
- Widget không phải native thật → cảm giác "hơi lạ" trên iOS nếu dùng Material, và **accessibility** phải Flutter tự cung cấp (nó có làm, qua semantics tree).
- App size lớn hơn (mang cả engine, ~4–7 MB).
- Widget hệ thống mới (một control iOS mới) phải chờ Flutter implement.
- **React Native mới (Fabric + JSI, bỏ bridge)** đã thu hẹp khoảng cách đáng kể — nói được điều này cho thấy bạn không thiên vị.

**Vì sao AOT quan trọng:** Dart release compile ra mã máy, không có warm-up JIT, không có GC pause của VM ngôn ngữ script ở mức tương tự. Đó cũng là lý do **release không Hot Reload được** (xem câu về hot reload).

**Nhưng "nhanh" không tự động:** Flutter vẫn jank nếu bạn viết sai — \`build()\` nặng, không dùng \`const\`, rebuild cả cây, list không lazy. Câu trả lời tốt nên kết thúc bằng: *"kiến trúc cho phép nhanh, nhưng hiệu năng thực tế phụ thuộc cách viết; tôi thường đo bằng DevTools ở profile mode."*`,
    pitfalls: [
      'Trả lời như quảng cáo ("Flutter nhanh vì 60fps") mà không nói cơ chế.',
      'Không biết React Native đã bỏ bridge (Fabric/JSI) → thông tin lỗi thời.',
      'Bỏ qua đánh đổi (app size, accessibility, widget native).',
    ],
    followUps: ['Bridge của RN cũ là nút cổ chai thế nào?', 'Flutter làm accessibility ra sao?', 'Impeller khác Skia?'],
  },
  {
    id: 'const-widget-repaintboundary',
    groupId: 'flu-rendering',
    title: '`const` widget và `RepaintBoundary` tối ưu bằng cách nào?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      '`const` widget là **cùng một instance** được tái dùng → Flutter so sánh thấy `identical(old, new)` và **bỏ qua toàn bộ subtree**, không cần build/layout lại. `RepaintBoundary` tách subtree thành **layer riêng** → khi phần khác repaint, layer này được tái dùng nguyên (không vẽ lại) — dùng cho phần tĩnh nằm cạnh phần đang animate.',
    deep: `**\`const\`:**
\`\`\`dart
// Mỗi lần build tạo instance mới -> Flutter phải so sánh field
Padding(padding: EdgeInsets.all(8), child: Text('Xin chào'))

// Cùng instance mỗi lần -> identical() -> bỏ qua hoàn toàn
const Padding(padding: EdgeInsets.all(8), child: Text('Xin chào'))
\`\`\`
Bật lint \`prefer_const_constructors\` và \`prefer_const_literals_to_create_immutables\` trong \`analysis_options.yaml\` để không phải nhớ thủ công.

**Tách widget thành class thay vì method** — quan trọng hơn \`const\` nhiều:
\`\`\`dart
// Xấu: _buildHeader() là phần của build() của cha -> rebuild cùng cha, không thể skip
Widget _buildHeader() => Container(...);

// Tốt: class riêng -> có Element riêng -> có thể skip độc lập
class _Header extends StatelessWidget {
  const _Header();
  @override
  Widget build(BuildContext context) => Container(...);
}
\`\`\`
Đây là một trong những tối ưu Flutter hiệu quả nhất và hay bị bỏ qua nhất: **method trả về widget không tạo ranh giới rebuild, class thì có.**

**\`RepaintBoundary\`:**
\`\`\`dart
Stack(
  children: [
    const RepaintBoundary(child: ComplexStaticBackground()),  // vẽ 1 lần, cache layer
    AnimatedBuilder(                                           // chỉ layer này repaint
      animation: controller,
      builder: (_, __) => Transform.rotate(angle: controller.value, child: const Icon(Icons.star)),
    ),
  ],
)
\`\`\`

**Khi nào \`RepaintBoundary\` KHÔNG nên dùng:** mỗi boundary tốn bộ nhớ GPU cho layer riêng và thêm chi phí composite. Đặt bừa khắp nơi làm **chậm hơn**. Chỉ đặt khi (1) subtree vẽ đắt, (2) nó **không** đổi trong khi cạnh nó đổi liên tục. Kiểm tra hiệu quả bằng DevTools → *Highlight repaints* (viền đổi màu mỗi lần repaint) — nếu phần tĩnh vẫn nhấp nháy màu thì cần boundary, nếu không thì đừng thêm.

\`ListView\` đã **tự** thêm \`RepaintBoundary\` cho mỗi item — nên đừng thêm lại.`,
    pitfalls: [
      'Rải `RepaintBoundary` khắp nơi "cho chắc" → tốn GPU memory, chậm hơn.',
      'Dùng method `_buildXxx()` thay vì class con → mất khả năng skip rebuild.',
      '`const` widget nhưng có tham số động → không thể `const` (compiler sẽ báo).',
      'Thêm `RepaintBoundary` trong item của `ListView` (đã có sẵn).',
    ],
    followUps: ['DevTools "Highlight repaints" đọc thế nào?', 'Vì sao `Opacity` gây `saveLayer`?', '`AnimatedBuilder` giới hạn rebuild thế nào?'],
  },
  {
    id: 'hot-reload-vs-hot-restart',
    groupId: 'flu-rendering',
    title: 'Hot Reload và Hot Restart khác nhau thế nào? Vì sao release không có?',
    levels: ['junior', 'mid'],
    source: 'pdf',
    short:
      '**Hot Reload** nạp code mới vào **Dart VM đang chạy** và rebuild lại cây widget — **giữ nguyên state**, mất < 1 giây. **Hot Restart** khởi động lại toàn bộ app từ `main()` — **mất hết state**, vài giây. Cả hai chỉ có ở **debug build** vì debug dùng **JIT** (Dart VM còn trong app); release là **AOT** nên không thể nạp code mới lúc chạy.',
    deep: `| | Hot Reload | Hot Restart | Full Restart |
|---|---|---|---|
| Tốc độ | < 1s | 1–5s | 10s+ |
| Giữ state | ✅ | ❌ | ❌ |
| Nạp code mới | Có (inject vào VM) | Có | Có |
| Chạy lại \`main()\` | Không | Có | Có |

**Hot Reload KHÔNG áp dụng được với:**
| Thay đổi | Vì sao |
|---|---|
| \`main()\` hoặc \`initState\` đã chạy | Code đã thực thi, không chạy lại |
| Biến \`static\`/global đã khởi tạo | Giữ giá trị cũ |
| Khai báo enum, thay đổi kiểu generic | Cần rebuild cấu trúc |
| Đổi \`StatelessWidget\` ↔ \`StatefulWidget\` | Đổi shape của Element |
| Native code (Kotlin/Swift), plugin mới | Phải build lại phần native |
| \`pubspec.yaml\` (thêm asset/dependency) | Cần rebuild bundle |

Khi Hot Reload không đủ, Flutter thường tự báo và bạn cần Hot Restart (\`R\`) hoặc rebuild hẳn.

**Cơ chế:** Dart VM trong debug mode giữ khả năng nạp thêm **library mới** vào isolate đang chạy. Flutter gửi diff của các file đã đổi tới VM, VM thay thế các hàm, rồi Flutter gọi \`reassemble()\` để rebuild toàn cây từ root. State trong \`State\` object vẫn còn vì Element tree không bị hủy.

**Vì sao release không có:** \`flutter build apk --release\` compile Dart sang **mã máy ARM (AOT)**, không mang Dart VM có khả năng nạp code. Đó là đánh đổi có chủ ý: mất hot reload, đổi lấy khởi động nhanh và hiệu năng cao.

**Ba build mode phải phân biệt:**
| Mode | Compile | Assert | Hot reload | Dùng cho |
|---|---|---|---|---|
| debug | JIT | Bật | ✅ | Phát triển |
| **profile** | AOT | Tắt | ❌ | **Đo hiệu năng** (có tracing) |
| release | AOT | Tắt | ❌ | Phát hành |

Rất hay bị hỏi: *"Đo hiệu năng ở mode nào?"* → **profile**, không phải debug (debug chậm gấp nhiều lần) và không phải release (không có tracing).`,
    pitfalls: [
      'Đo hiệu năng ở debug mode.',
      'Sửa `main()` rồi Hot Reload và thắc mắc sao không thấy đổi.',
      'Thêm asset vào `pubspec.yaml` rồi Hot Reload → cần restart.',
      'Nghĩ Hot Reload sẽ reset state để test luồng khởi động — dùng Hot Restart.',
    ],
    followUps: ['`reassemble()` là gì?', 'Vì sao profile mode dùng để đo mà không phải release?', 'Hot Reload có làm được với code native không?'],
  },

  // ============ flu-concurrency ============
  {
    id: 'dart-event-loop',
    groupId: 'flu-concurrency',
    title: 'Event loop của Dart hoạt động thế nào? Microtask queue là gì?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Dart chạy **một thread mỗi isolate** với một event loop. Có **hai hàng đợi**: **microtask queue** (ưu tiên cao, từ `scheduleMicrotask` và phần tiếp sau `await` của Future đã hoàn thành) và **event queue** (I/O, timer, gesture, `Future` từ nguồn ngoài). Event loop **làm cạn microtask queue trước**, rồi mới lấy **một** event từ event queue, rồi lại làm cạn microtask.',
    deep: `\`\`\`text
while (true) {
  while (microtaskQueue.isNotEmpty) run(microtaskQueue.removeFirst());   // cạn hết
  if (eventQueue.isNotEmpty) run(eventQueue.removeFirst());              // đúng MỘT cái
}
\`\`\`

**Ví dụ kinh điển — đoán thứ tự in:**
\`\`\`dart
void main() {
  print('1');
  Future(() => print('2'));                       // event queue
  Future.microtask(() => print('3'));             // microtask queue
  Future.value(4).then((v) => print(v));          // then -> microtask
  scheduleMicrotask(() => print('5'));            // microtask queue
  print('6');
}
// Kết quả: 1, 6, 3, 4, 5, 2
\`\`\`
Giải thích: code đồng bộ trước (\`1\`, \`6\`) → cạn microtask (\`3\`, \`4\`, \`5\` theo thứ tự đăng ký) → event queue (\`2\`).

**Hệ quả thực tế quan trọng nhất:** vì chỉ có **một** thread, **mọi tính toán đồng bộ dài đều làm đứng UI** — kể cả khi bạn đặt nó trong \`async\` function. \`async\`/\`await\` **không** tạo thread mới; nó chỉ cho phép nhường event loop tại điểm \`await\`.

\`\`\`dart
// Vẫn làm đứng UI 3 giây! async không tạo thread
Future<int> heavy() async {
  var sum = 0;
  for (var i = 0; i < 5000000000; i++) sum += i;   // không có await -> không nhường
  return sum;
}

// Đúng: đẩy sang isolate khác
Future<int> heavy() => compute(_heavySum, 5000000000);
\`\`\`

**Đừng lạm dụng microtask:** microtask queue phải cạn *hoàn toàn* trước khi event queue được xử lý → một chuỗi microtask vô tận sẽ **chặn cả I/O và render** vĩnh viễn. Dùng \`Future(...)\` (event queue) khi việc không cần ưu tiên tối đa.`,
    pitfalls: [
      'Nghĩ `async` tạo thread mới hoặc chạy song song — nó không.',
      'Đặt vòng lặp CPU nặng trong `async function` rồi ngạc nhiên vì UI đứng.',
      'Dùng `scheduleMicrotask` cho việc dài → chặn render.',
      'Không phân biệt được `Future(...)` (event queue) và `Future.microtask(...)`.',
    ],
    followUps: ['`Future.delayed(Duration.zero)` vào queue nào?', 'Vì sao `await` giúp nhường event loop?', '`Timer.run` khác `scheduleMicrotask`?'],
  },
  {
    id: 'future-async-await',
    groupId: 'flu-concurrency',
    title: '`Future`, `async`/`await`, `Stream` — dùng thế nào cho đúng?',
    levels: ['junior', 'mid'],
    source: 'pdf',
    short:
      '**`Future<T>`** = *một* giá trị sẽ có trong tương lai (như `Single` của RxJava, `suspend fun` của Kotlin). **`Stream<T>`** = *nhiều* giá trị theo thời gian (như `Flow`). `async`/`await` là cú pháp để viết code Future như code tuần tự — nó **không tạo thread**, chỉ nhường event loop.',
    deep: `\`\`\`dart
// Tuần tự: 2 giây
final user = await api.getUser();
final orders = await api.getOrders();

// Song song: 1 giây — dùng Future.wait
final results = await Future.wait([api.getUser(), api.getOrders()]);

// Song song và cho phép từng cái lỗi riêng
final results = await Future.wait([
  api.getUser().catchError((_) => null),
  api.getOrders().catchError((_) => <Order>[]),
]);
\`\`\`

**Xử lý lỗi:**
\`\`\`dart
try {
  final user = await api.getUser();
} on SocketException {
  // lỗi mạng
} on FormatException catch (e) {
  // parse lỗi
} catch (e, stack) {
  logger.error(e, stack);
} finally {
  setState(() => _loading = false);
}
\`\`\`

**Hai loại Stream — bắt buộc phân biệt:**
| | Single-subscription | Broadcast |
|---|---|---|
| Số listener | **Một** (listen lần hai → throw) | Nhiều |
| Ví dụ | Đọc file, HTTP response | \`Stream.broadcast()\`, event bus |
| Buffer khi chưa listen | Có | **Không** (event bị mất) |

\`\`\`dart
// StreamController mặc định là single-subscription
final controller = StreamController<int>();               // 1 listener
final broadcast = StreamController<int>.broadcast();      // nhiều listener, không buffer
\`\`\`

**\`async*\` + \`yield\`** để tạo Stream:
\`\`\`dart
Stream<int> countdown(int from) async* {
  for (var i = from; i >= 0; i--) {
    await Future.delayed(const Duration(seconds: 1));
    yield i;
  }
}
\`\`\`

**Bắt buộc: cancel subscription** — đây là leak số một trong Flutter:
\`\`\`dart
StreamSubscription? _sub;

@override void initState() {
  super.initState();
  _sub = stream.listen(_onData);
}

@override void dispose() {
  _sub?.cancel();      // nếu quên -> callback chạy sau khi widget chết -> crash + leak
  super.dispose();
}
\`\`\`
Hoặc dùng \`StreamBuilder\` — nó tự cancel.

**\`unawaited\`:** nếu cố ý không await một Future, dùng \`unawaited(f)\` (package \`meta\`) để lint không cảnh báo và người đọc biết đó là chủ ý.`,
    pitfalls: [
      '`await` tuần tự cho các request độc lập → chậm gấp N lần. Dùng `Future.wait`.',
      'Quên `cancel()` StreamSubscription trong `dispose`.',
      '`listen` hai lần trên single-subscription stream → exception.',
      'Không await Future mà cũng không `unawaited` → lỗi bị nuốt âm thầm.',
      'Dùng `Future` cho nguồn phát nhiều giá trị (nên là Stream).',
    ],
    followUps: ['`Stream.broadcast` mất event khi nào?', '`await for` khác `.listen`?', '`Future.wait` với `eagerError` làm gì?'],
  },
  {
    id: 'isolate-vs-async',
    groupId: 'flu-concurrency',
    title: 'Isolate là gì? Tại sao không dùng isolate để gọi API thay cho async/await?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      '**Isolate** là đơn vị thực thi có **memory heap riêng biệt**, không chia sẻ bộ nhớ, giao tiếp qua **message passing** (`SendPort`/`ReceivePort`) — dùng cho việc **CPU-bound**. Không dùng isolate để gọi API vì network là **I/O-bound**: nó *đã* không chặn thread (event loop nhường trong lúc chờ), nên isolate chỉ **thêm chi phí** tạo isolate + serialize message mà không nhanh hơn một chút nào.',
    deep: `**Bảng quyết định — đây là cốt lõi của câu hỏi:**

| Loại việc | Ví dụ | Công cụ đúng |
|---|---|---|
| **I/O-bound** (chờ bên ngoài) | HTTP, đọc file, query DB | \`async\`/\`await\` |
| **CPU-bound** (tính toán) | Parse JSON 10 MB, mã hoá, resize ảnh, sort 100k item | \`compute\`/\`Isolate.run\` |

**Vì sao async/await đủ cho network:** khi bạn \`await http.get(...)\`, Dart đăng ký callback rồi **trả điều khiển về event loop** → UI vẫn render 60fps trong suốt thời gian chờ. Không có thread nào bị chặn. Isolate không giải quyết vấn đề gì ở đây.

**Chi phí của isolate — vì sao "thêm isolate" không miễn phí:**
1. Tạo isolate mất vài ms và cấp phát heap riêng (vài trăm KB đến MB).
2. Message phải **copy** giữa hai heap (serialize/deserialize) — với object lớn, chi phí copy có thể **lớn hơn** việc tính toán bạn muốn tối ưu.
3. Isolate không truy cập được nhiều thứ trong Flutter: **không dùng được plugin cần platform channel** (trước Flutter 3.7 là hoàn toàn không; nay có \`BackgroundIsolateBinaryMessenger\` nhưng vẫn hạn chế), không truy cập \`BuildContext\`, không cập nhật UI trực tiếp.

**Trường hợp isolate là đúng:**
\`\`\`dart
// Parse JSON lớn: chạy trên isolate riêng, UI không jank
Future<List<Product>> parseProducts(String json) =>
    compute(_parse, json);

List<Product> _parse(String json) =>        // phải là top-level hoặc static
    (jsonDecode(json) as List).map((e) => Product.fromJson(e)).toList();

// Flutter 3.7+: Isolate.run gọn hơn compute
final products = await Isolate.run(() => _parse(json));
\`\`\`

**Kết hợp đúng cả hai — pattern thực tế:**
\`\`\`dart
Future<List<Product>> fetchProducts() async {
  final response = await http.get(uri);          // I/O -> async/await (không chặn)
  if (response.body.length > 100 * 1024) {
    return Isolate.run(() => _parse(response.body));   // CPU -> isolate
  }
  return _parse(response.body);                  // nhỏ thì parse ngay, tránh overhead
}
\`\`\`
Ngưỡng "khi nào đáng dùng isolate" nên do **đo** quyết định, không phải cảm giác — thường JSON dưới ~100 KB parse trực tiếp còn nhanh hơn.

**Hai loại isolate:** \`Isolate.run\`/\`compute\` (một việc, tự chết) và \`Isolate.spawn\` với \`ReceivePort\` (isolate sống dai, nhận nhiều việc — dùng khi cần xử lý liên tục, tránh trả phí tạo isolate mỗi lần).`,
    pitfalls: [
      'Dùng isolate cho HTTP call — thêm overhead, không nhanh hơn.',
      'Truyền object lớn/không serialize được qua isolate (chỉ primitive, List, Map, và một số type được hỗ trợ).',
      'Gọi hàm không phải top-level/static trong `compute` → lỗi.',
      'Cố dùng plugin (SharedPreferences, path_provider) trong isolate mà không setup `BackgroundIsolateBinaryMessenger`.',
      'Dùng isolate cho việc nhỏ → chi phí tạo isolate lớn hơn lợi ích.',
    ],
    followUps: [
      '`compute` vs `Isolate.run` vs `Isolate.spawn`?',
      'Message giữa isolate được copy hay share? (copy, trừ `TransferableTypedData`)',
      'Flutter 3.7 thay đổi gì về plugin trong isolate?',
    ],
  },
]
