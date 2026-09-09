import type { Question } from '../types'

export const GENERAL_QUESTIONS: Question[] = [
  // ============ gen-oop ============
  {
    id: 'oop-la-gi',
    groupId: 'gen-oop',
    title: 'Lập trình hướng đối tượng (OOP) là gì?',
    levels: ['junior'],
    source: 'pdf',
    short:
      'OOP là cách tổ chức chương trình quanh **object** — mỗi object gói cả **dữ liệu (state)** và **hành vi (behavior)** liên quan đến nhau, thay vì tách rời data và function. Mục tiêu thực tế: giảm phụ thuộc giữa các phần code, để sửa một chỗ không làm vỡ chỗ khác.',
    deep: `**Class vs Object**: class là bản thiết kế, object là thực thể được tạo ra từ bản thiết kế đó tại runtime.

Bốn tính chất trụ cột:

| Tính chất | Ý nghĩa | Biểu hiện trong code mobile |
|---|---|---|
| Encapsulation | Che state, chỉ mở API cần thiết | \`private val _state = MutableStateFlow(...)\` + \`val state: StateFlow\` |
| Inheritance | Lớp con dùng lại định nghĩa lớp cha | \`class HomeFragment : BaseFragment()\` |
| Polymorphism | Cùng lời gọi, nhiều cách thực thi | \`Repository\` interface có impl remote/local/fake |
| Abstraction | Chỉ phơi ra "làm gì", ẩn "làm thế nào" | \`interface UserRepository\` trong domain layer |

**Đừng chỉ đọc định nghĩa.** Interviewer muốn nghe bạn nối OOP với thiết kế thật: "vì \`ViewModel\` chỉ phụ thuộc vào \`interface UserRepository\` (abstraction), nên khi test tôi thay bằng \`FakeUserRepository\` mà không đổi một dòng nào trong ViewModel."`,
    pitfalls: [
      'Trả lời "OOP là mô phỏng thế giới thực" rồi dừng — quá sách vở. Hãy nói OOP giải quyết vấn đề **quản lý phụ thuộc** trong codebase lớn.',
      'Nhầm encapsulation với "để private hết". Encapsulation là kiểm soát *cách* bên ngoài được phép thay đổi state, không phải cấm truy cập.',
      'Lạm dụng inheritance: `BaseActivity` 800 dòng là mùi code kinh điển. Ưu tiên composition hơn inheritance.',
    ],
    followUps: [
      'Composition vs Inheritance — khi nào chọn cái nào?',
      'Kotlin `data class` có phá encapsulation không? (`copy()` cho phép tạo bản mới bỏ qua validate trong constructor)',
    ],
  },
  {
    id: 'jdk-jre-jvm',
    groupId: 'gen-oop',
    title: 'JDK, JRE và JVM khác nhau thế nào?',
    levels: ['junior'],
    source: 'pdf',
    short:
      '**JVM** là máy ảo thực thi bytecode. **JRE** = JVM + thư viện runtime, đủ để *chạy* app. **JDK** = JRE + bộ công cụ phát triển (javac, javadoc, jdb), đủ để *build* app. Quan hệ lồng nhau: JDK ⊃ JRE ⊃ JVM.',
    deep: `Luồng biên dịch — thông dịch của Java:

\`\`\`text
Source (.java) --javac--> Bytecode (.class) --JVM--> machine code
\`\`\`

Java **vừa biên dịch vừa thông dịch**: biên dịch ra bytecode (không phụ thuộc nền tảng), rồi JVM thông dịch/JIT-compile bytecode thành mã máy lúc chạy. Đó chính là cơ chế "write once, run anywhere".

**Đặt vào ngữ cảnh Android** — chỗ này mới ăn điểm, vì Android *không* dùng JVM:

\`\`\`text
Kotlin/Java --kotlinc/javac--> .class --D8/R8--> DEX --ART--> mã máy
\`\`\`

- **Dalvik** (Android ≤ 4.4): register-based VM, JIT thuần.
- **ART** (Android 5+): AOT compile lúc install; từ Android 7 chuyển sang **hybrid** — thông dịch trước, JIT các đoạn nóng, rồi AOT dần theo profile (profile-guided compilation) để cân bằng thời gian install và hiệu năng.
- **D8** desugar + biên dịch sang DEX, **R8** làm luôn shrink/obfuscate/optimize (thay thế ProGuard).`,
    pitfalls: [
      'Nói "Android chạy trên JVM" — sai. Android chạy ART/Dalvik với định dạng DEX, chỉ *dùng lại* bytecode Java làm bước trung gian.',
      'Nói ART chỉ AOT — từ Android 7 là hybrid AOT + JIT + profile-guided.',
    ],
    followUps: ['Vì sao Android chọn register-based VM thay vì stack-based như JVM?', 'R8 khác ProGuard ở đâu?'],
  },
  {
    id: 'abstract-vs-interface',
    groupId: 'gen-oop',
    title: 'Abstract class vs Interface — chọn cái nào?',
    levels: ['junior', 'mid'],
    source: 'pdf',
    short:
      'Dùng **interface** để mô tả *khả năng* (capability) — một class có thể implement nhiều interface, và interface là chỗ để đảo ngược phụ thuộc. Dùng **abstract class** khi cần *chia sẻ state và code khởi tạo* giữa các lớp con cùng một họ. Quy tắc thực chiến: mặc định chọn interface, chỉ lên abstract class khi thật sự cần state.',
    deep: `| | Interface | Abstract class |
|---|---|---|
| Kế thừa | Nhiều | Chỉ một |
| State (field có backing) | Không (Kotlin: property không backing field) | Có |
| Constructor | Không | Có |
| Body của method | Được (default method / Kotlin) | Được |
| Ý nghĩa quan hệ | "có khả năng…" (can-do) | "là một…" (is-a) |

Trong Kotlin, interface **được** có property và method body, nhưng **không có backing field** — nghĩa là không lưu được state:

\`\`\`kotlin
interface Loggable {
    val tag: String                 // không backing field -> lớp con phải override
    fun log(msg: String) = println("[\$tag] \$msg")   // có body được
}
\`\`\`

Kiến trúc thật: trong Clean Architecture, **domain layer khai báo interface** (\`UserRepository\`), **data layer implement**. Nếu domain khai báo abstract class thì data layer bị buộc vào cây kế thừa — kém linh hoạt và khó fake khi test.`,
    code: [
      {
        lang: 'kotlin',
        caption: 'Interface cho ranh giới kiến trúc, abstract class cho code dùng chung',
        source: `// domain layer — chỉ mô tả hợp đồng
interface UserRepository {
    suspend fun getUser(id: String): User
}

// data layer — nhiều implementation cùng tồn tại
class UserRepositoryImpl(private val api: Api, private val dao: UserDao) : UserRepository { /*...*/ }
class FakeUserRepository : UserRepository { /*...*/ }   // dùng trong test

// abstract class khi có state + logic khởi tạo dùng chung
abstract class BaseViewModel : ViewModel() {
    private val _error = MutableSharedFlow<Throwable>()   // state dùng chung
    val error = _error.asSharedFlow()

    protected fun launchSafely(block: suspend () -> Unit) = viewModelScope.launch {
        runCatching { block() }.onFailure { _error.emit(it) }
    }
}`,
      },
    ],
    pitfalls: [
      'Trả lời chỉ bằng bảng so sánh cú pháp mà không nói *khi nào dùng cái nào*. Interviewer đang đo tư duy thiết kế, không đo trí nhớ.',
      'Nói "interface không có code" — đúng với Java 7, sai với Java 8+ (default method) và Kotlin.',
      'Nhớ rằng interface không giải quyết được vấn đề diamond problem về *state*, chỉ về *behavior* (Kotlin buộc override khi trùng).',
    ],
    followUps: ['Nếu hai interface có method trùng tên, Kotlin xử lý sao?', 'Sealed interface khác interface thường ở đâu?'],
  },
  {
    id: 'overload-vs-override',
    groupId: 'gen-oop',
    title: 'Overloading vs Overriding, và đa hình tại runtime là gì?',
    levels: ['junior'],
    source: 'pdf',
    short:
      '**Overloading** là cùng tên method nhưng khác tham số, trong *cùng* một class — compiler chọn ở **compile time** (static dispatch). **Overriding** là lớp con viết lại method của lớp cha với cùng signature — JVM chọn ở **runtime** dựa vào kiểu thực của object (dynamic dispatch). Đa hình tại runtime chính là overriding.',
    deep: `\`\`\`kotlin
open class Analytics {
    open fun track(event: String) = println("base: \$event")
}
class FirebaseAnalytics : Analytics() {
    override fun track(event: String) = println("firebase: \$event")
}

val a: Analytics = FirebaseAnalytics()   // kiểu khai báo là Analytics
a.track("open")                          // -> "firebase: open"  (runtime chọn)
\`\`\`

Điểm khác biệt cốt lõi: **overload resolution nhìn kiểu khai báo, override resolution nhìn kiểu thực tế.**

Ví dụ bẫy:

\`\`\`kotlin
fun render(v: View) = "view"
fun render(v: Button) = "button"

val v: View = Button(ctx)
render(v)   // -> "view"  vì compiler chỉ thấy kiểu View
\`\`\`

Trong Kotlin, class và method **mặc định final** — muốn cho phép override phải khai báo \`open\`. Đây là lựa chọn có chủ ý theo nguyên tắc "design for inheritance or prohibit it" của Effective Java.`,
    pitfalls: [
      'Gọi overloading là "đa hình tại runtime" — sai, overloading được giải quyết ở compile time.',
      'Quên rằng Kotlin mặc định `final`, nên `override` không compile nếu lớp cha không `open` (trừ interface member và abstract member).',
      'Override method nhưng thu hẹp visibility hoặc đổi kiểu trả về không tương thích → không compile.',
    ],
    followUps: ['Tại sao Kotlin chọn `final` làm mặc định?', 'Kotlin có cho phép override property không? Điều kiện gì?'],
  },
  {
    id: 'access-modifier',
    groupId: 'gen-oop',
    title: 'Access modifier trong Java và Kotlin khác nhau ra sao?',
    levels: ['junior'],
    source: 'pdf',
    short:
      'Java có 4 mức: `private` → `default`/package-private → `protected` → `public`. Kotlin có 4 mức khác: `private` → `internal` (cả module) → `protected` → `public` (**mặc định public**). Kotlin bỏ package-private và thêm `internal` — cực hữu ích khi modularize app.',
    deep: `| Modifier | Java | Kotlin |
|---|---|---|
| \`private\` | trong class | trong class, hoặc trong file (top-level) |
| (không ghi) | package-private | **public** |
| \`internal\` | — | trong cùng **module** (Gradle module) |
| \`protected\` | class + package + lớp con | **chỉ** class + lớp con (không có package) |
| \`public\` | mọi nơi | mọi nơi |

\`internal\` là công cụ chính để làm **modularization** đúng: một feature module phơi ra vài class \`public\` làm API, còn toàn bộ chi tiết cài đặt để \`internal\` — module khác không thể import được, compiler bảo vệ ranh giới thay cho code review.

\`\`\`kotlin
// :feature:checkout
class CheckoutEntryPoint          // public — API của module
internal class CheckoutMapper      // module khác không thấy
internal val DEFAULT_TIMEOUT = 30
\`\`\``,
    pitfalls: [
      '`protected` trong Kotlin **không** bao gồm package-level như Java.',
      'Quên rằng Kotlin mặc định `public` — dễ vô tình phơi ra chi tiết cài đặt của module.',
      '`internal` bị "rò" ra bytecode với tên bị mangle (`foo$module_name`), nên Java code cùng project vẫn gọi được — nó là rào chắn của compiler Kotlin, không phải bảo mật.',
    ],
    followUps: ['Modularize app thì đặt ranh giới `internal` ở đâu?', '`@PublishedApi` dùng để làm gì?'],
  },
  {
    id: 'static-va-companion',
    groupId: 'gen-oop',
    title: 'Static là gì? Tại sao `main` phải static? Kotlin không có static thì dùng gì?',
    levels: ['junior'],
    source: 'pdf',
    short:
      'Thành viên `static` thuộc về **class**, không thuộc về instance — nạp một lần khi class được load, và gọi được mà không cần `new`. `main` phải static vì JVM cần gọi nó *trước khi* có bất kỳ object nào tồn tại. Kotlin không có `static`; thay bằng **top-level declaration**, `companion object`, hoặc `object` (singleton).',
    deep: `\`\`\`kotlin
// 1. Top-level — tương đương static thuần, nên là lựa chọn mặc định
const val MAX_RETRY = 3
fun formatCurrency(v: Long): String = "..."

// 2. companion object — khi cần gắn với class (factory, constant nội bộ)
class UserViewModel private constructor(private val repo: UserRepository) {
    companion object {
        private const val TAG = "UserVM"
        fun create(repo: UserRepository) = UserViewModel(repo)
    }
}

// 3. object — singleton thật, khởi tạo lazy và thread-safe
object AppLogger {
    fun log(msg: String) { /*...*/ }
}
\`\`\`

**Bẫy Android quan trọng**: static/companion/object sống suốt đời process → giữ reference tới \`Activity\`, \`View\`, hoặc \`Context\` của Activity trong đó là **memory leak chắc chắn**. Nếu bắt buộc phải giữ Context, chỉ giữ \`applicationContext\`.

\`@JvmStatic\` sinh ra static method thật trong bytecode để Java gọi cho gọn; không có nó, Java phải gọi \`UserViewModel.Companion.create(...)\`.`,
    pitfalls: [
      'Method static **không** truy cập được biến non-static trực tiếp (không có `this`).',
      'Dùng `object` làm nơi chứa state toàn cục (giỏ hàng, user đang đăng nhập) → khó test, khó reset, và sống sót qua cả logout. Hãy để DI quản lý scope.',
      '`companion object` là một object thật → nó *có* instance, khác hoàn toàn `static` của Java về mặt bytecode.',
    ],
    followUps: ['`object` khởi tạo lúc nào? Có thread-safe không?', 'Vì sao giữ Activity context trong companion object gây leak?'],
  },
  {
    id: 'string-immutable',
    groupId: 'gen-oop',
    title: 'Tại sao String là immutable? String vs StringBuilder vs StringBuffer',
    levels: ['junior'],
    source: 'pdf',
    short:
      'String immutable để có thể **cache/intern** an toàn, **thread-safe** miễn phí, và dùng làm key của HashMap mà hashCode không đổi. Nối string trong vòng lặp bằng `+` tạo ra n object rác → dùng **StringBuilder** (không đồng bộ, nhanh) hoặc **StringBuffer** (đồng bộ, chậm hơn, hầu như không cần trong app mobile).',
    deep: `\`\`\`kotlin
// Xấu: mỗi vòng lặp tạo một String mới -> O(n²) và tạo rác cho GC
var s = ""
for (item in items) s += item.name + ", "

// Tốt
val s = buildString { items.forEach { append(it.name).append(", ") } }
// hoặc gọn hơn
val s = items.joinToString(", ") { it.name }
\`\`\`

**String pool**: string literal được intern vào pool nên \`"a" === "a"\` là true, nhưng \`StringBuilder().append("a").toString() === "a"\` là false. Vì thế **luôn so sánh string bằng \`==\` (Kotlin, gọi \`equals\`) chứ không \`===\`**.

Với dữ liệu nhạy cảm (password, token), String immutable là **nhược điểm**: nó nằm trong heap đến khi GC dọn, có thể bị dump. Java khuyên dùng \`CharArray\` để \`fill('\\u0000')\` xoá sau khi dùng.`,
    pitfalls: [
      'Nói "immutable nên tốn bộ nhớ hơn" mà không nói string pool bù lại bằng cách chia sẻ literal.',
      'Dùng `StringBuffer` trong app mobile vì "an toàn hơn" — đồng bộ vô ích, chỉ làm chậm.',
      'Lưu token vào String rồi tưởng an toàn.',
    ],
    followUps: ['`==` vs `===` vs `equals` trong Kotlin?', 'Tại sao String làm key HashMap lại lý tưởng?'],
  },
  {
    id: 'bien-dich-vs-thong-dich',
    groupId: 'gen-oop',
    title: 'Biên dịch (compile) và thông dịch (interpret) khác nhau ở đâu?',
    levels: ['junior'],
    source: 'pdf',
    short:
      '**Biên dịch** dịch toàn bộ source sang mã máy một lần, tạo artifact chạy lại được mà không cần dịch nữa — nhanh khi chạy, chậm khi build. **Thông dịch** dịch và chạy từng lệnh mỗi lần — khởi động nhanh, linh hoạt, nhưng chạy chậm hơn.',
    deep: `Thực tế các runtime hiện đại đều là **hybrid**:

| Nền tảng | Cơ chế |
|---|---|
| Java/JVM | javac → bytecode; JVM thông dịch + **JIT** biên dịch đoạn nóng |
| Android ART | DEX → thông dịch + JIT + **AOT theo profile** (profile-guided) |
| Dart (debug) | **JIT** — nhờ đó có Hot Reload |
| Dart (release) | **AOT** → mã máy ARM, không mang VM theo, khởi động nhanh |

Điểm này rất hay được hỏi ở Flutter: **Hot Reload chỉ có trong debug vì debug build dùng JIT**; release build là AOT nên không thể nạp code mới lúc chạy.`,
    pitfalls: [
      'Nói Java "chỉ là ngôn ngữ thông dịch" hoặc "chỉ biên dịch" — nó là cả hai.',
      'Không nối được sang Dart JIT/AOT khi đang phỏng vấn Flutter — đây là chỗ ghi điểm miễn phí.',
    ],
    followUps: ['Vì sao release Flutter không Hot Reload được?', 'Profile-guided AOT của ART hoạt động thế nào?'],
  },

  // ============ gen-memory ============
  {
    id: 'heap-vs-stack',
    groupId: 'gen-memory',
    title: 'Heap và Stack khác nhau thế nào?',
    levels: ['junior', 'mid'],
    source: 'pdf',
    short:
      '**Stack** lưu biến local và khung gọi hàm, hoạt động LIFO, **riêng cho từng thread**, nhỏ và rất nhanh, tự giải phóng khi hàm return. **Heap** lưu object (`new`), **chia sẻ giữa mọi thread**, lớn hơn, được GC dọn. Tràn stack → `StackOverflowError`; tràn heap → `OutOfMemoryError`.',
    deep: `| | Heap | Stack |
|---|---|---|
| Lưu gì | Object, array, instance field | Biến local (primitive + reference), tham số, khung gọi hàm |
| Phạm vi | Toàn app, mọi thread truy cập | Riêng từng thread, thread khác không thấy |
| Giải phóng | Garbage Collector | Tự động khi hàm kết thúc (LIFO) |
| Kích thước | Lớn (\`-Xms\`/\`-Xmx\`) | Nhỏ (\`-Xss\`), mặc định vài trăm KB – 1 MB |
| Tốc độ truy cập | Chậm hơn | Nhanh hơn |
| Lỗi khi hết | \`OutOfMemoryError: Java heap space\` | \`StackOverflowError\` |
| Cấu trúc | Young gen (Eden, Survivor) + Old gen | Một khối liên tục, con trỏ stack |

Điểm hay nhầm: **biến reference nằm trên stack, object nó trỏ tới nằm trên heap.**

\`\`\`kotlin
fun load() {
    val id = 42                  // primitive -> stack
    val user = User(id)          // reference trên stack, object User trên heap
}                                // hết hàm: stack frame bị xoá; object User thành rác nếu không ai giữ
\`\`\`

Trên Android, mỗi app có **heap limit riêng theo thiết bị** (\`ActivityManager.memoryClass\`, thường 128–512 MB) chứ không phải toàn bộ RAM máy. Vượt limit là OOM crash dù máy còn RAM. Đó là lý do bitmap lớn là nguyên nhân OOM số một trên Android.`,
    pitfalls: [
      'Nói "primitive luôn ở stack" — sai: `int` là **field của object** thì nằm trong object đó, trên heap.',
      'Nghĩ heap của Android app = RAM thiết bị. Không: mỗi process có heap cap riêng.',
      'Không nhắc được lỗi tương ứng (`StackOverflowError` vs `OutOfMemoryError`) — câu hỏi này gần như luôn đi kèm.',
    ],
    followUps: [
      'Đệ quy sâu gây lỗi gì? Chuyển sang vòng lặp / tail-recursion thế nào?',
      'Vì sao Bitmap hay gây OOM và Android 8+ đã thay đổi gì? (native heap cho bitmap)',
    ],
  },
  {
    id: 'garbage-collection',
    groupId: 'gen-memory',
    title: 'Garbage Collector hoạt động thế nào?',
    levels: ['mid'],
    source: 'pdf',
    short:
      'GC xác định object nào còn **reachable** từ tập GC root (biến static, biến local trên stack các thread, JNI reference), rồi thu hồi phần còn lại. Cơ chế là **mark–sweep–compact**, chia heap theo generation vì đa số object chết rất non ("weak generational hypothesis").',
    deep: `**Ba pha**:
1. **Mark** — đi từ GC root, đánh dấu object reachable.
2. **Sweep** — thu hồi vùng nhớ của object không được đánh dấu.
3. **Compact** — dồn object lại để tránh phân mảnh (không phải GC nào cũng làm).

**Generational**: object mới sinh ra ở *young generation* (Eden). Minor GC quét young gen rất thường xuyên và rất nhanh; object sống qua nhiều lần GC được promote sang *old generation*, nơi major GC chạy thưa nhưng đắt hơn.

**Trên Android (ART)** — chỗ này mới đúng ngữ cảnh:
- Từ Android 8 dùng **CC (Concurrent Copying)** collector: chạy song song với app, gần như không stop-the-world, và **moving** (di chuyển object để chống phân mảnh).
- Vấn đề thực tế không phải "GC chậm" mà là **GC quá thường xuyên**: allocate nhiều object trong \`onDraw\`/\`onBindViewHolder\` khiến minor GC nổ liên tục, làm **jank frame** dù mỗi lần GC chỉ vài ms.
- Xem bằng \`adb logcat\` (dòng \`Background concurrent copying GC freed ...\`) hoặc Android Studio Memory Profiler.

**Điều bạn không kiểm soát được**: \`System.gc()\` chỉ là *gợi ý*, và \`finalize()\` đã deprecated — không bao giờ dựa vào nó để giải phóng tài nguyên. Dùng \`Closeable\`/\`use {}\` hoặc lifecycle callback.`,
    code: [
      {
        lang: 'kotlin',
        caption: 'Tránh allocation trong hot path',
        source: `// Xấu: mỗi frame tạo Paint + Rect mới -> GC pressure -> jank
override fun onDraw(canvas: Canvas) {
    val paint = Paint().apply { color = Color.RED }
    canvas.drawRect(Rect(0, 0, width, height), paint)
}

// Tốt: cấp phát một lần, tái sử dụng
private val paint = Paint().apply { color = Color.RED }
private val rect = Rect()

override fun onDraw(canvas: Canvas) {
    rect.set(0, 0, width, height)
    canvas.drawRect(rect, paint)
}`,
      },
    ],
    pitfalls: [
      'Nói "gọi `System.gc()` để dọn bộ nhớ" — nó chỉ là hint, và gọi thủ công thường làm hiệu năng tệ hơn.',
      'Tin rằng có GC thì không thể leak. GC chỉ dọn object **unreachable**; leak nghĩa là object vẫn reachable dù không còn cần.',
      'Dựa vào `finalize()` để đóng file/socket.',
    ],
    followUps: [
      'Strong / Weak / Soft / Phantom reference khác nhau ra sao?',
      'Vì sao allocation nhiều lại gây jank frame chứ không chỉ tốn RAM?',
    ],
  },
  {
    id: 'reference-types',
    groupId: 'gen-memory',
    title: 'Strong, Weak, Soft, Phantom reference dùng khi nào?',
    levels: ['mid', 'senior'],
    short:
      '**Strong** (mặc định): còn reference là GC không dọn. **Soft**: GC chỉ dọn khi sắp hết bộ nhớ → dùng cho cache. **Weak**: GC dọn ngay lần GC kế tiếp nếu không còn strong ref → dùng để giữ Context/listener mà không giữ nó sống. **Phantom**: chỉ để biết object đã bị thu hồi, dùng cho cleanup tài nguyên native.',
    deep: `\`\`\`kotlin
// WeakReference: pattern kinh điển để Handler không giữ Activity sống
class MyHandler(activity: MainActivity) : Handler(Looper.getMainLooper()) {
    private val ref = WeakReference(activity)
    override fun handleMessage(msg: Message) {
        val activity = ref.get() ?: return   // Activity đã bị hủy -> bỏ qua
        activity.update()
    }
}
\`\`\`

Thứ tự "sức bám" giảm dần: **strong > soft > weak > phantom**.

**Cảnh báo thực tế**: đừng coi \`WeakReference\` là cách sửa memory leak. Nó là *dấu hiệu* thiết kế sai vòng đời. Cách đúng trên Android hiện đại:
- Dùng \`viewModelScope\`/\`lifecycleScope\` để coroutine tự cancel.
- Dùng \`repeatOnLifecycle(STARTED)\` khi collect Flow trên UI.
- Gỡ listener trong \`onDestroyView\`, và set \`_binding = null\`.

\`SoftReference\` cho cache cũng lỗi thời trên Android: Google khuyên dùng **\`LruCache\`** với budget cố định, vì hành vi của Soft/Weak trong ART khó đoán và GC hay dọn sớm hơn bạn tưởng.`,
    pitfalls: [
      'Dùng `WeakReference` để "vá" leak thay vì sửa vòng đời — leak vẫn còn, chỉ khó thấy hơn.',
      'Dùng `SoftReference` làm bitmap cache trên Android (Google khuyến nghị `LruCache`).',
      'Quên `ref.get()` có thể trả về `null` bất kỳ lúc nào.',
    ],
    followUps: ['`LruCache` tính size thế nào cho bitmap?', 'Tại sao inner class không static lại gây leak?'],
  },
  {
    id: 'memory-leak-cases',
    groupId: 'gen-memory',
    title: 'Memory leak: các case hay gặp nhất và cách phát hiện?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Leak xảy ra khi một object **sống lâu** giữ reference tới object **đáng lẽ phải chết** — trên Android thường là Activity/Fragment/View bị giữ lại sau khi đã destroy. Phát hiện bằng **LeakCanary** (dev build) và **Memory Profiler** + heap dump; sửa bằng cách gắn đúng scope vòng đời, không phải bằng WeakReference.',
    deep: `**Top các case gặp thật trong dự án:**

| Case | Vì sao leak | Cách sửa |
|---|---|---|
| \`object\`/\`companion\` giữ Activity hoặc View | static sống bằng process | Chỉ giữ \`applicationContext\`, hoặc bỏ hẳn state toàn cục |
| Inner class / lambda non-static (Handler, Runnable, callback) | ngầm giữ \`this\` của outer class | Dùng \`lifecycleScope\`, gỡ callback trong \`onDestroy\` |
| \`ViewBinding\` trong Fragment | Fragment sống lâu hơn View của nó | \`onDestroyView { _binding = null }\` |
| Listener/Observer đăng ký mà không gỡ | bus/singleton giữ observer | \`viewLifecycleOwner\` cho LiveData, gỡ trong \`onDestroyView\` |
| Coroutine chạy trong \`GlobalScope\` | không ai cancel | \`viewModelScope\` / \`lifecycleScope\` |
| RxJava không dispose | subscription giữ view | \`CompositeDisposable.clear()\` trong \`onDestroy\` |
| Bitmap/Drawable cache giữ View qua callback | Drawable giữ \`Callback\` là View | \`drawable.callback = null\` khi detach |
| Thread/Timer/AsyncTask còn chạy | thread không dừng theo Activity | Chuyển sang WorkManager/coroutine có scope |

**Câu hỏi trong tài liệu: inject \`@ApplicationContext\` có gây leak không?**
→ Bản thân nó **không** leak, vì Application context sống bằng process nên không giữ gì "đáng lẽ phải chết". Nguy hiểm nằm ở hai hướng ngược lại:
1. Nếu bạn inject \`@ActivityContext\` (hoặc Activity context) vào một object \`@Singleton\` → singleton sống mãi và **giữ Activity** → leak thật.
2. Dùng Application context ở chỗ cần Activity context (inflate theme, show Dialog) → sai theme hoặc crash \`BadTokenException\`, không phải leak nhưng cũng là bug.

**Quy tắc**: scope của object được inject phải **rộng hơn hoặc bằng** scope của context nó giữ. Singleton chỉ được giữ Application context.`,
    code: [
      {
        lang: 'kotlin',
        caption: 'Leak điển hình vs bản đã sửa',
        source: `// LEAK: singleton giữ Activity context
@Singleton
class ThemeManager @Inject constructor(
    @ActivityContext private val context: Context   // Activity không bao giờ được GC
)

// OK: singleton chỉ giữ Application context
@Singleton
class ThemeManager @Inject constructor(
    @ApplicationContext private val context: Context
)

// LEAK: binding của Fragment
class HomeFragment : Fragment() {
    private lateinit var binding: FragmentHomeBinding   // giữ View sau onDestroyView
}

// OK
class HomeFragment : Fragment() {
    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}`,
      },
    ],
    pitfalls: [
      'Kết luận "app không leak vì không thấy OOM". Leak nhỏ tích lũy dần: mở/đóng một screen 20 lần rồi mới dump heap.',
      'Quên rằng `viewLifecycleOwner` khác `this` khi observe LiveData trong Fragment — dùng `this` sẽ tạo observer trùng lặp sau mỗi lần recreate view.',
      'Đổ lỗi cho GC. GC không dọn được vì object *vẫn reachable* — đó là bug của bạn.',
    ],
    followUps: [
      'LeakCanary phát hiện leak bằng cách nào? (weak ref + retained heap analysis)',
      'Tại sao `viewLifecycleOwner` được đưa vào Fragment?',
      'Rotate màn hình 30 lần rồi heap tăng đều — bạn debug thế nào?',
    ],
  },
  {
    id: 'oom-vs-stackoverflow',
    groupId: 'gen-memory',
    title: 'OutOfMemoryError và StackOverflowError — nguyên nhân và cách xử lý?',
    levels: ['junior', 'mid'],
    short:
      '`OutOfMemoryError`: heap hết chỗ — thường do bitmap lớn, load cả list vào RAM, hoặc leak tích lũy. `StackOverflowError`: stack hết chỗ — hầu như luôn do đệ quy không có điều kiện dừng (hoặc quá sâu). Cả hai là `Error` chứ không phải `Exception`, nên đừng catch để "chữa cháy".',
    deep: `**OOM trên Android — nguyên nhân theo tần suất:**
1. Bitmap: decode ảnh 4000×3000 vào ImageView 300 dp. Sửa bằng \`inSampleSize\`/\`BitmapFactory.Options\`, hoặc để Coil/Glide tự downsample theo kích thước view.
2. Giữ toàn bộ dataset trong RAM. Sửa bằng \`Paging 3\` + \`PagingSource\`.
3. Leak tích lũy (xem câu về memory leak).
4. Cache không giới hạn — \`HashMap\` làm cache mà không bao giờ evict. Dùng \`LruCache\`.

**StackOverflow:**
\`\`\`kotlin
// Nổ stack với n lớn
fun sum(n: Int): Int = if (n == 0) 0 else n + sum(n - 1)

// Tail-recursive: Kotlin biên dịch thành vòng lặp, không tốn stack frame
tailrec fun sum(n: Int, acc: Int = 0): Int = if (n == 0) acc else sum(n - 1, acc + n)
\`\`\`

Ngoài đệ quy, còn hai nguồn hay bị bỏ qua:
- **Vòng lặp vô hạn giữa hai method** (\`equals\` gọi lẫn nhau, \`toString\` của hai object trỏ vòng).
- **Data class có tham chiếu vòng**: \`a.b = b; b.a = a\` rồi gọi \`toString()\` → đệ quy vô tận.`,
    pitfalls: [
      'Catch `OutOfMemoryError` rồi tiếp tục chạy — JVM/ART đã ở trạng thái không đáng tin, hãy để nó crash và fix nguyên nhân.',
      'Tăng heap bằng `android:largeHeap="true"` để "sửa" OOM — chỉ đẩy lùi vấn đề và làm GC pause dài hơn.',
      'Quên `tailrec` phải là lời gọi cuối cùng thật sự; `n + sum(...)` không phải tail call.',
    ],
    followUps: ['`largeHeap` có tác dụng phụ gì?', 'Paging 3 giải quyết vấn đề bộ nhớ thế nào?'],
  },

  // ============ gen-concurrency ============
  {
    id: 'thread-vs-process',
    groupId: 'gen-concurrency',
    title: 'Thread và Process khác nhau thế nào? Android tổ chức chúng ra sao?',
    levels: ['junior', 'mid'],
    source: 'pdf',
    short:
      '**Process** là một đơn vị chạy có **không gian địa chỉ riêng**, bị OS cô lập. **Thread** là luồng thực thi *bên trong* process, **chia sẻ heap** với các thread khác cùng process (nhưng có stack riêng). Mỗi app Android mặc định chạy trong **một process** với **một main thread (UI thread)**.',
    deep: `| | Process | Thread |
|---|---|---|
| Bộ nhớ | Riêng biệt, cô lập | Chia sẻ heap, stack riêng |
| Chi phí tạo | Nặng | Nhẹ |
| Giao tiếp | IPC (Binder, AIDL, socket) | Đọc/ghi biến chung (cần đồng bộ) |
| Crash | Chỉ chết process đó | Uncaught exception giết cả process |

**Trên Android:**
- Mọi component (Activity, Service, Receiver, Provider) mặc định chạy trên **main thread của process app** — kể cả Service. Đây là điểm bị nhầm nhiều nhất.
- Có thể tách process bằng \`android:process=":remote"\` trong manifest. Dùng khi cần cô lập phần dễ crash (WebView, native lib) hoặc cần heap riêng. Giá phải trả: mỗi process có \`Application\` riêng, singleton **không** chia sẻ, phải IPC qua Binder.
- OS giết process theo mức ưu tiên khi thiếu RAM: foreground → visible → service → cached. Đây là gốc của vấn đề **process death** mà bạn phải xử lý bằng \`SavedStateHandle\`.
- Main thread có **Looper** chạy vòng lặp lấy message từ **MessageQueue**; block nó > ~5s gây **ANR**.`,
    pitfalls: [
      'Nói "Service chạy background thread" — sai, Service chạy main thread. Muốn chạy nền phải tự tạo thread/coroutine (hoặc dùng `WorkManager`).',
      'Nghĩ mỗi Activity là một process/thread riêng.',
      'Tách `android:process` mà quên singleton và DI graph bị nhân đôi.',
    ],
    followUps: [
      'Vì sao chỉ main thread được cập nhật UI?',
      'Process death khác configuration change ở đâu?',
      'Binder truyền được tối đa bao nhiêu dữ liệu? (~1 MB TransactionTooLargeException)',
    ],
  },
  {
    id: 'handler-looper-messagequeue',
    groupId: 'gen-concurrency',
    title: 'Handler, Looper, MessageQueue hoạt động thế nào?',
    levels: ['mid'],
    source: 'pdf',
    short:
      'Bộ ba này là cơ chế **message loop** của Android. **Looper** chạy vòng lặp vô hạn lấy message từ **MessageQueue** của thread mình và điều phối tới **Handler** tương ứng. **Handler** là API để bạn *gửi* `Message`/`Runnable` vào queue đó — vì thế nó là cách để một thread nhờ thread khác làm việc, kinh điển là background thread nhờ main thread cập nhật UI.',
    deep: `\`\`\`text
Thread B                    MessageQueue (của main)          Main thread
handler.post(runnable) -->  [msg][msg][msg]  <-- Looper.loop() lấy ra và dispatch
\`\`\`

**Ba điều then chốt:**
1. Một thread có **tối đa một Looper**, và một Looper có **một MessageQueue**. Main thread đã được \`ActivityThread\` gọi \`Looper.prepareMainLooper()\` sẵn; thread thường muốn có Looper phải tự gọi \`Looper.prepare()\` → \`Looper.loop()\`.
2. Handler **gắn cứng vào Looper của thread tạo ra nó** (hoặc Looper bạn truyền vào). Vì thế \`Handler(Looper.getMainLooper())\` luôn chạy trên main thread bất kể tạo từ đâu.
3. Hai nhiệm vụ của Handler: **lên lịch** (\`postDelayed\`) và **chuyển việc sang thread khác**.

Toàn bộ hệ thống Android xây trên nó: dispatch lifecycle, \`View.invalidate()\`, \`Choreographer\` (đồng bộ frame 16.6 ms), và cả \`Dispatchers.Main\` của coroutine — bên trong chỉ là \`Handler\` post lên main Looper.

**Vì sao vẫn phải biết trong thời đại coroutine?** Vì \`postDelayed\` là nguyên nhân leak kinh điển (message giữ Handler → giữ Activity trong suốt thời gian delay), và vì hiểu Looper là hiểu tại sao block main thread gây ANR.`,
    code: [
      {
        lang: 'kotlin',
        caption: 'Handler thời nay: chủ yếu để lên lịch, và phải nhớ gỡ',
        source: `class HomeFragment : Fragment() {
    private val handler = Handler(Looper.getMainLooper())
    private val tick = Runnable { refresh() }

    override fun onStart() {
        super.onStart()
        handler.postDelayed(tick, 5_000)
    }

    override fun onStop() {
        super.onStop()
        handler.removeCallbacks(tick)   // BẮT BUỘC, không thì leak + crash sau destroy
    }
}

// Cách hiện đại hơn: coroutine tự cancel theo lifecycle
viewLifecycleOwner.lifecycleScope.launch {
    repeatOnLifecycle(Lifecycle.State.STARTED) {
        while (true) { delay(5_000); refresh() }
    }
}`,
      },
    ],
    pitfalls: [
      '`postDelayed` mà không `removeCallbacks` → giữ Activity/Fragment sống suốt thời gian delay.',
      'Tạo `Handler()` không tham số — đã deprecated vì phụ thuộc ngầm vào Looper của thread hiện tại. Luôn truyền Looper tường minh.',
      'Nghĩ `HandlerThread` là thread thường — nó là thread **có Looper**, dùng để nhận việc tuần tự.',
    ],
    followUps: [
      '`Dispatchers.Main` được cài đặt trên nền gì?',
      '`Choreographer` liên quan tới jank frame thế nào?',
      '`HandlerThread` dùng khi nào so với coroutine?',
    ],
  },
  {
    id: 'race-condition',
    groupId: 'gen-concurrency',
    title: 'Race condition là gì? Có mấy cách phòng?',
    levels: ['mid', 'senior'],
    short:
      'Race condition là khi **kết quả phụ thuộc vào thứ tự thực thi** của nhiều thread truy cập cùng state có thể thay đổi. Phòng bằng: (1) **loại bỏ shared mutable state** — hướng đi tốt nhất, dùng immutable data; (2) **giới hạn về một thread** (confinement); (3) **đồng bộ** (`Mutex`, `synchronized`, atomic).',
    deep: `\`\`\`kotlin
// Race: đọc-sửa-ghi không nguyên tử
var counter = 0
repeat(1000) { launch(Dispatchers.Default) { counter++ } }  // kết quả < 1000

// 1. Loại bỏ mutable state — cách Kotlin/Compose khuyến khích
val results = (1..1000).map { async { compute(it) } }.awaitAll()

// 2. Confinement: dồn việc ghi về một dispatcher đơn luồng
private val single = Dispatchers.Default.limitedParallelism(1)
suspend fun inc() = withContext(single) { counter++ }

// 3. Mutex (suspend, không block thread như synchronized)
private val mutex = Mutex()
suspend fun inc() = mutex.withLock { counter++ }

// 4. Atomic cho trường hợp đơn giản
private val counter = AtomicInteger(0)
counter.incrementAndGet()
\`\`\`

**Trong app mobile, race hay xuất hiện ở đâu:**
- Nhiều nguồn cùng ghi vào một \`MutableStateFlow\` → dùng \`update { }\` (compare-and-set) chứ không \`value = value.copy(...)\`.
- Người dùng bấm nút 2 lần rất nhanh → gửi 2 request. Sửa bằng cách disable nút theo state, hoặc \`Flow.debounce\`, hoặc cancel job cũ trước khi launch job mới.
- Cache + network cùng ghi DB → dùng transaction của Room.

**\`MutableStateFlow.update\` vs \`value =\`:**
\`\`\`kotlin
// Có race nếu 2 coroutine chạy song song
_state.value = _state.value.copy(count = _state.value.count + 1)

// An toàn: update dùng CAS, retry nếu bị chen
_state.update { it.copy(count = it.count + 1) }
\`\`\``,
    pitfalls: [
      'Dùng `synchronized` trong code suspend — nó **block thread** thay vì suspend coroutine, làm đói thread pool. Dùng `Mutex`.',
      'Tưởng `@Volatile` giải quyết race — nó chỉ đảm bảo *visibility*, không đảm bảo *atomicity* cho `i++`.',
      'Gán `_state.value = _state.value.copy(...)` trong môi trường concurrent.',
    ],
    followUps: ['Deadlock khác race condition thế nào?', '`Mutex` khác `Semaphore` ở đâu?', '`@Volatile` đảm bảo gì và không đảm bảo gì?'],
  },
  {
    id: 'thread-pool',
    groupId: 'gen-concurrency',
    title: 'Thread pool là gì và vì sao không nên tự tạo thread?',
    levels: ['mid'],
    short:
      'Tạo thread rất đắt (~1 MB stack + chi phí OS) và số thread hữu ích bị giới hạn bởi số CPU core. **Thread pool** tái sử dụng một số cố định thread để chạy nhiều task qua một queue. Trên Android hiện nay bạn hầu như không cần tự quản lý pool — dùng `Dispatchers` của coroutine hoặc `WorkManager`.',
    deep: `**Ba loại dispatcher và lý do tồn tại:**

| Dispatcher | Số thread | Dùng cho |
|---|---|---|
| \`Dispatchers.Main\` | 1 (UI thread) | Cập nhật UI |
| \`Dispatchers.Default\` | = số CPU core (min 2) | Việc **CPU-bound**: parse JSON lớn, sort, xử lý ảnh |
| \`Dispatchers.IO\` | tới 64 (chia sẻ pool với Default) | Việc **blocking I/O**: đọc file, DB, socket |

Vì sao IO cho tới 64 thread mà Default chỉ bằng số core? Vì thread làm I/O **đang bị block, không dùng CPU** — có nhiều thread cùng chờ vẫn hợp lý. Còn CPU-bound thì nhiều thread hơn core chỉ làm tăng context switch.

**\`Dispatchers.IO\` và \`Default\` chia sẻ chung pool** → \`withContext(Dispatchers.IO)\` từ Default thường không cần tạo thread mới, chỉ đổi "giấy phép" — nên chuyển dispatcher rẻ hơn tưởng.

Nếu vẫn phải dùng \`ExecutorService\` (interop với lib Java cũ), nhớ \`shutdown()\`.`,
    pitfalls: [
      'Dùng `Dispatchers.IO` cho việc CPU-bound → 64 thread giành CPU, làm chậm cả app.',
      'Tạo `newFixedThreadPool` trong Activity mà không shutdown → leak thread.',
      '`GlobalScope.launch` — không ai cancel, sống ngoài mọi lifecycle. Gần như luôn là bug.',
    ],
    followUps: ['`limitedParallelism` giải quyết vấn đề gì?', 'Khi nào dùng WorkManager thay vì coroutine?'],
  },
  {
    id: 'deadlock',
    groupId: 'gen-concurrency',
    title: 'Deadlock là gì? Làm sao tránh?',
    levels: ['mid', 'senior'],
    short:
      'Deadlock là khi hai (hoặc nhiều) luồng mỗi bên giữ một lock và chờ lock bên kia → cả hai đứng mãi. Cần đủ 4 điều kiện Coffman: **mutual exclusion, hold-and-wait, no preemption, circular wait**. Cách tránh dễ nhất và hiệu quả nhất: **luôn lấy lock theo một thứ tự toàn cục cố định**, hoặc bỏ lock đi hẳn.',
    deep: `\`\`\`kotlin
// Deadlock: thứ tự lấy lock ngược nhau
suspend fun transferA() = lockA.withLock { lockB.withLock { /*...*/ } }
suspend fun transferB() = lockB.withLock { lockA.withLock { /*...*/ } }

// Sửa: áp thứ tự cố định (ví dụ theo id)
suspend fun transfer(from: Account, to: Account) {
    val (first, second) = if (from.id < to.id) from to to else to to from
    first.mutex.withLock { second.mutex.withLock { /*...*/ } }
}
\`\`\`

**Bốn cách xử lý:**
1. **Ordering** — thứ tự lock toàn cục. Đơn giản, hiệu quả nhất.
2. **Timeout** — \`tryLock(timeout)\`, thất bại thì retry/abort. Biến deadlock thành lỗi có thể xử lý.
3. **Giảm phạm vi lock** — giữ lock càng ngắn càng tốt, **không bao giờ gọi code lạ (callback) khi đang giữ lock**.
4. **Bỏ lock** — immutable state + message passing (actor). Đây là hướng của coroutine/Flow.

**Deadlock trên mobile trong thực tế** ít do lock thủ công, hay do:
- Gọi \`runBlocking\` trên main thread trong khi coroutine bên trong cần \`Dispatchers.Main\` → tự khoá chính mình.
- \`Future.get()\` / \`Thread.join()\` trên main thread.
- Query DB đồng bộ trên main thread trong khi transaction đang giữ ở thread khác.`,
    pitfalls: [
      '`runBlocking` trên main thread — nguyên nhân số một gây ANR dạng deadlock.',
      'Gọi listener/callback do bên ngoài cung cấp khi đang giữ lock (lock ordering inversion không kiểm soát được).',
      'Nhầm deadlock (đứng mãi) với livelock (chạy mãi mà không tiến triển) và starvation.',
    ],
    followUps: ['ANR do deadlock thì đọc trace ở đâu? (`/data/anr/traces.txt`)', 'Actor model tránh lock bằng cách nào?'],
  },
]
