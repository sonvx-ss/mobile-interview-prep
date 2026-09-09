import type { Question } from '../types'

export const ANDROID_KOTLIN_COMPOSE_QUESTIONS: Question[] = [
  // ============ and-kotlin ============
  {
    id: 'data-class-vs-class',
    groupId: 'and-kotlin',
    title: '`data class` khác `class` thường thế nào? Khi nào không nên dùng?',
    levels: ['junior', 'mid'],
    source: 'pdf',
    short:
      '`data class` tự sinh `equals`/`hashCode` (so sánh theo **giá trị** của các property trong constructor chính), `toString`, `copy()` và `componentN()` (destructuring). Dùng cho **object mang dữ liệu**: DTO, entity, UI state. **Không** dùng cho object có hành vi/identity (repository, service) hoặc khi cần bất biến có kiểm soát.',
    deep: `\`\`\`kotlin
data class User(val id: String, val name: String)

User("1", "A") == User("1", "A")   // true — so sánh theo giá trị

class Plain(val id: String)
Plain("1") == Plain("1")           // false — so sánh theo reference
\`\`\`

**Ba bẫy quan trọng:**

1. **Chỉ property trong constructor chính** được tính vào \`equals\`/\`hashCode\`/\`toString\`:
\`\`\`kotlin
data class User(val id: String) {
    var name: String = ""       // KHÔNG tính vào equals!
}
User("1").apply { name = "A" } == User("1").apply { name = "B" }   // true (!)
\`\`\`
Đây là nguồn bug rất khó thấy với \`DiffUtil\` và với \`StateFlow\` (nó bỏ giá trị "trùng").

2. **\`copy()\` bỏ qua logic trong \`init\`**: nếu constructor có validate, \`copy()\` vẫn tạo được object không hợp lệ. Muốn bất biến có kiểm soát → dùng class thường với factory, hoặc \`private constructor\` + \`companion object\`.

3. **Array trong data class**: \`equals\` của \`Array\` so sánh reference → hai data class chứa array giống nhau vẫn \`!=\`. Dùng \`List\` thay vì \`Array\`.

**Trong Compose, data class còn liên quan tới stability:** một \`data class\` với toàn \`val\` kiểu stable là **stable** → Compose bỏ qua recomposition khi giá trị không đổi. Có \`var\` hoặc \`List\` (interface, không rõ có mutable không) → **unstable** → recompose thừa. Dùng \`ImmutableList\` (kotlinx-collections-immutable) hoặc \`@Immutable\`.

**\`data object\`** (Kotlin 1.9+): singleton có \`toString\`/\`equals\` đẹp — rất tiện cho sealed state: \`data object Loading : UiState\`.`,
    pitfalls: [
      'Property khai báo trong thân class → không tính vào `equals`, gây bug DiffUtil/StateFlow im lặng.',
      'Dùng `data class` cho model có validate rồi bị `copy()` phá bất biến.',
      'Chứa `Array` thay vì `List`.',
      'Dùng `data class` cho ViewModel/Repository — vô nghĩa và sinh `copy()` không mong muốn.',
    ],
    followUps: ['Vì sao `List` là unstable trong Compose?', '`data object` vs `object`?', 'Kế thừa `data class` được không? (không, nó final)'],
  },
  {
    id: 'inline-reified',
    groupId: 'and-kotlin',
    title: '`inline` function là gì? `reified` giải quyết vấn đề gì?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      '`inline` yêu cầu compiler **chép thân hàm vào chỗ gọi** thay vì gọi hàm thật — nhờ đó lambda truyền vào **không tạo object `Function`**, và cho phép `return` không cục bộ. `reified` chỉ dùng được trong hàm `inline`: nó **giữ lại thông tin generic type lúc runtime**, vượt qua type erasure của JVM.',
    deep: `**Vì sao \`inline\` tồn tại:** mỗi lambda trong Kotlin bình thường được biên dịch thành một object implement \`Function0/1/2...\`. Hàm cấp cao gọi trong vòng lặp nóng sẽ tạo rất nhiều object → GC pressure. \`inline\` khử hoàn toàn chi phí đó. Đó là lý do \`map\`, \`filter\`, \`forEach\`, \`let\`, \`run\`, \`apply\` trong stdlib đều \`inline\`.

**\`reified\` — vấn đề nó giải quyết:**
\`\`\`kotlin
// Không được: T bị erase, không có T::class lúc runtime
fun <T> fromJson(json: String): T = gson.fromJson(json, T::class.java)   // compile error

// Được: inline + reified giữ được kiểu thật
inline fun <reified T> fromJson(json: String): T = gson.fromJson(json, T::class.java)

val user: User = fromJson(body)     // không cần truyền User::class.java
\`\`\`

Ứng dụng thực tế rất hay dùng:
\`\`\`kotlin
// Start Activity gọn gàng
inline fun <reified T : Activity> Context.start(noinline extras: Intent.() -> Unit = {}) {
    startActivity(Intent(this, T::class.java).apply(extras))
}
context.start<DetailActivity> { putExtra("id", "p1") }

// Lấy ViewModel, tìm Fragment theo kiểu, parse response...
inline fun <reified T> Bundle.getTyped(key: String): T? = get(key) as? T
\`\`\`

**\`noinline\` và \`crossinline\`:**
- \`noinline\` — không inline một lambda cụ thể (khi bạn cần lưu nó vào biến hoặc truyền tiếp).
- \`crossinline\` — cấm \`return\` không cục bộ trong lambda đó (cần khi lambda được gọi từ một context khác, ví dụ trong một object lồng).

**Khi nào KHÔNG nên inline:** hàm **thân lớn** — mỗi chỗ gọi được chép nguyên vào → **phình code (dex size)** và có thể làm chậm do instruction cache. Quy tắc: inline cho hàm **nhỏ có tham số lambda**; đừng inline hàm 50 dòng chỉ vì "nghe có vẻ nhanh". Compiler Kotlin thậm chí cảnh báo "expected performance impact is insignificant" khi inline hàm không có lambda.`,
    pitfalls: [
      'Inline hàm lớn → dex phình, không nhanh hơn.',
      'Inline hàm **không có** tham số lambda → gần như vô ích, compiler sẽ cảnh báo.',
      'Hàm `inline` không truy cập được thành viên `private` của class từ bên ngoài (vì code được chép ra) → cần `@PublishedApi`.',
      'Quên rằng `inline` là phần của **public ABI**: đổi thân hàm inline yêu cầu recompile mọi module gọi nó.',
    ],
    followUps: ['`crossinline` khác `noinline`?', 'Vì sao `reified` bắt buộc `inline`?', '`value class` (inline class) khác gì?'],
  },
  {
    id: 'scope-functions',
    groupId: 'and-kotlin',
    title: '`let`, `run`, `with`, `apply`, `also` — phân biệt và dùng khi nào?',
    levels: ['junior', 'mid'],
    source: 'pdf',
    short:
      'Phân biệt theo 2 trục: **tham chiếu object** (`it` hay `this`) và **giá trị trả về** (chính object hay kết quả lambda). `apply`/`also` trả về **object** (dùng để cấu hình/side-effect); `let`/`run`/`with` trả về **kết quả lambda** (dùng để biến đổi).',
    deep: `| Hàm | Object là | Trả về | Dùng cho |
|---|---|---|---|
| \`let\` | \`it\` | kết quả lambda | Null-safety, biến đổi giá trị |
| \`run\` | \`this\` | kết quả lambda | Chạy một khối và lấy kết quả |
| \`with\` | \`this\` | kết quả lambda | Gọi nhiều method trên một object |
| \`apply\` | \`this\` | **object** | Cấu hình object (builder) |
| \`also\` | \`it\` | **object** | Side-effect: log, validate, thêm vào list |

\`\`\`kotlin
// let: null-safety + biến đổi
val length = name?.let { it.trim().length } ?: 0

// apply: cấu hình rồi trả về chính object
val intent = Intent(this, DetailActivity::class.java).apply {
    putExtra("id", id)
    flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
}

// also: side-effect trong chuỗi, không phá luồng
repo.getUser(id)
    .also { Log.d(TAG, "loaded \$it") }
    .let { mapper.toUiModel(it) }

// with: gọi nhiều thứ trên cùng object
with(binding) {
    title.text = state.title
    subtitle.text = state.subtitle
    progress.isVisible = state.isLoading
}

// run: chạy khối có nhiều bước rồi lấy kết quả
val config = run {
    val base = BuildConfig.BASE_URL
    val timeout = if (BuildConfig.DEBUG) 60 else 15
    Config(base, timeout)
}
\`\`\`

**Cách chọn nhanh:** *"Tôi muốn nhận lại object đã cấu hình?"* → \`apply\`/\`also\`. *"Tôi muốn một giá trị khác?"* → \`let\`/\`run\`/\`with\`. *"Object có thể null?"* → \`let\` (vì \`?.let\` là idiom chuẩn).

**Bẫy lồng nhau:** lồng nhiều \`let\` khiến \`it\` bị che khuất, không rõ \`it\` nào là gì:
\`\`\`kotlin
// Khó đọc
user?.let { u -> u.address?.let { a -> "\${u.name} - \${a.city}" } }

// Tốt hơn: đặt tên tường minh, hoặc dùng early return
val name = user?.name ?: return null
val city = user.address?.city ?: return null
\`\`\``,
    pitfalls: [
      'Dùng `?.let { }` chỉ để "trông có vẻ Kotlin" trong khi `if (x != null)` rõ hơn.',
      'Lồng nhiều `let` với `it` → không đọc được. Đặt tên tham số.',
      'Dùng `apply` để tính giá trị (nó trả về object, không phải kết quả).',
      '`also`/`apply` với `return` bên trong — không phải return không cục bộ như bạn tưởng nếu qua `crossinline`.',
    ],
    followUps: ['`takeIf`/`takeUnless` dùng khi nào?', '`?.let` với `var` có smart-cast được không?'],
  },
  {
    id: 'sealed-class-vs-enum',
    groupId: 'and-kotlin',
    title: '`sealed class`, `sealed interface` và `enum` khác nhau thế nào?',
    levels: ['mid'],
    source: 'pdf',
    short:
      '`enum` là tập **hằng số cố định**, mỗi giá trị là một instance duy nhất, không mang dữ liệu riêng theo từng case. `sealed class/interface` là tập **kiểu con biết trước lúc compile**, mỗi kiểu con **có thể mang dữ liệu riêng** và tạo được nhiều instance. Cả hai cho `when` **exhaustive** (không cần `else`).',
    deep: `\`\`\`kotlin
// enum: các case đồng dạng, không dữ liệu riêng
enum class SortOrder { NAME, DATE, PRICE }

// sealed: mỗi case có shape riêng -> đúng cho UI state
sealed interface ProfileUiState {
    data object Loading : ProfileUiState
    data class Success(val user: User, val isRefreshing: Boolean) : ProfileUiState
    data class Error(val message: String, val retryable: Boolean) : ProfileUiState
}

// when exhaustive -> thêm case mới là LỖI COMPILE ở mọi chỗ xử lý
when (state) {
    is ProfileUiState.Loading -> showLoading()
    is ProfileUiState.Success -> render(state.user)      // smart-cast
    is ProfileUiState.Error   -> showError(state.message)
}
\`\`\`

**Đây là giá trị lớn nhất:** khi thêm \`data object Empty\`, compiler chỉ ra **mọi** chỗ cần xử lý. Với \`Boolean isLoading\` + \`String? error\` + \`User? data\` bạn có 8 tổ hợp, trong đó nhiều tổ hợp vô nghĩa (\`isLoading = true\` mà \`error != null\`) — sealed loại bỏ chúng ở tầng kiểu.

**\`sealed interface\` (Kotlin 1.5+) tốt hơn \`sealed class\` trong hầu hết trường hợp:** cho phép một kiểu thuộc **nhiều** hierarchy, và không áp đặt constructor.

\`\`\`kotlin
sealed interface Error
sealed interface Retryable
data class NetworkError(val code: Int) : Error, Retryable    // thuộc cả hai
\`\`\`

**Sealed vs enum — cách chọn:** case có **dữ liệu khác nhau** → sealed. Case chỉ là **nhãn** và cần \`values()\`/\`valueOf()\`/dùng làm key trong \`when\` đơn giản → enum. Enum còn serialize dễ hơn (một string) nên thường dùng cho giá trị lưu vào DB/API.

**Kotlin 1.9+**: \`data object\` cho case không dữ liệu — có \`toString()\` đẹp và \`equals\` đúng.`,
    pitfalls: [
      'Dùng nhiều Boolean/nullable field thay vì sealed cho UI state → tổ hợp trạng thái vô nghĩa và bug hiển thị.',
      'Sealed class có kiểu con ở module khác → không được (sealed giới hạn trong cùng module/package từ Kotlin 1.5).',
      'Thêm `else ->` vào `when` trên sealed type → mất luôn lợi ích exhaustive check.',
      'Dùng sealed cho tập giá trị cần persist → phức tạp hơn enum khi serialize.',
    ],
    followUps: ['Vì sao `when` trên sealed cần là expression mới exhaustive?', '`sealed interface` vs `sealed class`?'],
  },
  {
    id: 'lateinit-vs-lazy',
    groupId: 'and-kotlin',
    title: '`lateinit` và `by lazy` khác nhau thế nào?',
    levels: ['junior', 'mid'],
    source: 'pdf',
    short:
      '`lateinit var`: bạn **hứa sẽ gán trước khi dùng**, không gán mà truy cập thì `UninitializedPropertyAccessException`. Chỉ cho `var`, không cho kiểu primitive, không cho nullable. `by lazy`: giá trị được **tự tính lần đầu truy cập** và cache lại; chỉ cho `val`, mặc định **thread-safe** (`SYNCHRONIZED`).',
    deep: `| | \`lateinit var\` | \`by lazy\` |
|---|---|---|
| Loại | Chỉ \`var\` | Chỉ \`val\` |
| Ai gán giá trị | **Bạn**, từ bên ngoài | **Lambda** khi truy cập lần đầu |
| Primitive (\`Int\`, \`Boolean\`) | ❌ | ✅ |
| Thread-safe | Không | Có (mặc định) |
| Gán lại được | ✅ | ❌ |
| Kiểm tra đã khởi tạo | \`::prop.isInitialized\` | — |

\`\`\`kotlin
class DetailFragment : Fragment() {
    // lateinit: hệ thống inject/gán sau khi construct
    @Inject lateinit var analytics: Analytics

    // lazy: tính một lần khi cần, và cần giá trị từ arguments (chưa có lúc construct)
    private val productId: String by lazy { requireArguments().getString("id")!! }

    // lazy cho object đắt, có thể không bao giờ dùng
    private val decoder: HeavyDecoder by lazy { HeavyDecoder(context) }
}
\`\`\`

**Ba mode của lazy:**
- \`SYNCHRONIZED\` (mặc định) — an toàn đa luồng, có chi phí lock nhẹ lần đầu.
- \`PUBLICATION\` — nhiều thread có thể cùng chạy lambda, nhưng chỉ một kết quả được dùng.
- \`NONE\` — không đồng bộ, nhanh nhất. Chỉ dùng khi chắc chắn chỉ truy cập từ một thread (ví dụ chỉ trên main thread).

**Bẫy Android lớn nhất với \`by lazy\` trong Fragment/Activity:** lazy cache **vĩnh viễn** theo instance. Nếu bạn \`by lazy { binding.root }\` hoặc lazy một object phụ thuộc View, thì sau \`onDestroyView\` giá trị cache vẫn giữ View cũ → **leak** và dữ liệu sai. Với thứ phụ thuộc View, dùng property thường + null hoá ở \`onDestroyView\`.

**Với \`lateinit\`, kiểm tra trước khi dùng khi không chắc:**
\`\`\`kotlin
if (::adapter.isInitialized) adapter.notifyDataSetChanged()
\`\`\``,
    pitfalls: [
      '`by lazy` cho thứ phụ thuộc View trong Fragment → giữ View cũ sau `onDestroyView`.',
      '`lateinit` cho `Int`/`Boolean` → không compile (dùng `by lazy` hoặc giá trị mặc định).',
      'Truy cập `lateinit` trước khi gán → crash. Đây là lỗi hay gặp khi thứ tự lifecycle thay đổi.',
      'Dùng `lateinit` chỉ để né nullable trong khi nullable là mô hình đúng.',
    ],
    followUps: ['`LazyThreadSafetyMode.NONE` khi nào an toàn?', '`lazy` có tự reset khi Fragment recreate view không? (không)'],
  },
  {
    id: 'null-safety',
    groupId: 'and-kotlin',
    title: 'Null safety trong Kotlin: `?.`, `?:`, `!!`, và platform type?',
    levels: ['junior', 'mid'],
    source: 'pdf',
    short:
      'Kotlin đưa nullability vào **hệ thống kiểu**: `String` không thể null, `String?` có thể. `?.` safe call, `?:` elvis (giá trị mặc định hoặc early return), `!!` khẳng định không null (throw nếu sai). Điểm bẫy nhất là **platform type `String!`** khi gọi code Java — compiler không kiểm tra được, nên đây là nơi NPE vẫn xảy ra.',
    deep: `\`\`\`kotlin
val len = name?.length ?: 0                    // safe call + elvis
val user = repo.find(id) ?: return null        // elvis với early return
val id = requireNotNull(handle["id"]) { "thiếu id" }   // rõ nghĩa hơn !!

// let cho khối lệnh khi không null
config?.let { applyConfig(it) }

// safe cast
val fragment = supportFragmentManager.findFragmentById(R.id.host) as? NavHostFragment
\`\`\`

**Platform type — nguồn NPE thật:**
\`\`\`java
// Java
public class LegacyApi { public String getName() { return null; } }
\`\`\`
\`\`\`kotlin
val name: String = legacyApi.name      // compile OK! -> NPE lúc runtime
val name: String? = legacyApi.name     // đúng: coi như nullable
\`\`\`
Kotlin thấy \`String!\` (platform type) và **để bạn tự chịu**. Vì thế: mọi giá trị từ Java/JSON/framework phải coi là nullable, hoặc yêu cầu lib thêm \`@Nullable\`/\`@NonNull\`.

**Khi nào \`!!\` là chấp nhận được:** khi null *thật sự* là bug logic và bạn muốn crash sớm ở dev. Nhưng \`requireNotNull(x) { "message" }\` hoặc \`checkNotNull\` tốt hơn vì có **thông điệp lỗi**. \`!!\` trong crash report chỉ cho bạn số dòng, không cho biết vì sao.

**Ba nguồn null hay bị bỏ qua trong app thật:**
1. **JSON**: Gson dùng reflection nên **có thể gán null vào field non-null Kotlin**, phá vỡ đảm bảo của compiler. Dùng **Moshi** (codegen) hoặc **kotlinx.serialization** — chúng tôn trọng nullability và throw lỗi parse rõ ràng.
2. **View lookup**: \`findViewById\` trả về platform type.
3. **Bundle/Intent extras**: luôn nullable.

**Smart cast không hoạt động với \`var\` của class khác** hoặc property có custom getter — vì giá trị có thể đổi giữa hai lần đọc:
\`\`\`kotlin
if (user.address != null) {
    println(user.address.city)   // lỗi nếu address là var của class khác
}
val address = user.address ?: return   // cách đúng
\`\`\``,
    pitfalls: [
      'Dùng Gson với data class Kotlin → field non-null vẫn nhận null, NPE ở chỗ rất xa. Dùng Moshi/kotlinx.serialization.',
      'Rải `!!` khắp nơi → crash không có thông tin.',
      'Coi giá trị từ Java là non-null.',
      'Dùng `lateinit` để né nullable trong khi nullable mới là đúng mô hình.',
    ],
    followUps: ['Vì sao Moshi/kotlinx.serialization an toàn hơn Gson với Kotlin?', 'Smart cast thất bại trong những trường hợp nào?'],
  },
  {
    id: 'delegation-kotlin',
    groupId: 'and-kotlin',
    title: 'Delegation trong Kotlin: `by` cho class và cho property?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Hai loại. **Class delegation** (`class A : B by impl`) — compiler tự sinh các method của interface `B` chuyển tiếp sang `impl`, giúp làm **composition** mà không boilerplate. **Property delegation** (`val x by lazy`, `var y by Delegates.observable`) — chuyển việc get/set của property cho một object khác qua `getValue`/`setValue`.',
    deep: `**Class delegation — composition thay cho inheritance:**
\`\`\`kotlin
interface Analytics { fun track(event: String) }

class FirebaseAnalytics : Analytics { override fun track(event: String) { /*...*/ } }

// Thay vì kế thừa, delegate: A "là" Analytics nhưng dùng cài đặt của impl
class LoggingAnalytics(private val impl: Analytics) : Analytics by impl {
    override fun track(event: String) {          // chỉ override cái cần
        Log.d("Analytics", event)
        impl.track(event)
    }
}
\`\`\`
Đây là **Decorator pattern** với gần như không boilerplate — nếu interface có 20 method, bạn chỉ viết 1.

**Property delegation có sẵn:**
\`\`\`kotlin
val heavy by lazy { compute() }                          // tính một lần

var count by Delegates.observable(0) { _, old, new ->    // theo dõi thay đổi
    Log.d(TAG, "\$old -> \$new")
}

var name by Delegates.vetoable("") { _, _, new ->        // chặn giá trị không hợp lệ
    new.isNotBlank()
}

val config by map                                        // đọc từ Map
\`\`\`

**Tự viết delegate — ví dụ hữu ích thật: prefs type-safe**
\`\`\`kotlin
class BooleanPref(
    private val prefs: SharedPreferences,
    private val key: String,
    private val default: Boolean = false,
) : ReadWriteProperty<Any?, Boolean> {
    override fun getValue(thisRef: Any?, property: KProperty<*>) = prefs.getBoolean(key, default)
    override fun setValue(thisRef: Any?, property: KProperty<*>, value: Boolean) =
        prefs.edit().putBoolean(key, value).apply()
}

class Settings(prefs: SharedPreferences) {
    var isDarkMode by BooleanPref(prefs, "dark_mode")
    var isFirstRun by BooleanPref(prefs, "first_run", default = true)
}
// Dùng: settings.isDarkMode = true   -- gọn như property thường
\`\`\`

**Bạn đã dùng delegation mà có thể không biết:** \`by viewModels()\`, \`by activityViewModels()\`, \`by viewBinding()\`, \`by lazy\`, \`by inject()\` (Koin) — tất cả đều là property delegate.`,
    pitfalls: [
      'Class delegation: nếu `impl` gọi method của chính nó, nó gọi bản của `impl`, **không** gọi override của bạn (không có dynamic dispatch qua delegate) — bẫy tinh vi.',
      'Property delegate có chi phí: mỗi delegate là một object. Với property trong hot path/list item, cân nhắc.',
      'Delegate không hoạt động với local variable trong một số phiên bản Kotlin cũ.',
    ],
    followUps: ['Vì sao delegation không có dynamic dispatch?', '`ReadOnlyProperty` vs `ReadWriteProperty`?', '`provideDelegate` dùng làm gì?'],
  },

  // ============ and-compose ============
  {
    id: 'recomposition',
    groupId: 'and-compose',
    title: 'Recomposition là gì? Compose biết cần vẽ lại phần nào bằng cách nào?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Recomposition là việc Compose **gọi lại composable function** khi state nó đọc thay đổi. Compose không vẽ lại cả cây: nó dùng **snapshot system** để biết composable nào *đã đọc* state nào, và chỉ recompose đúng những "scope" đó. Composable còn **có thể bị bỏ qua (skip)** nếu tham số không đổi và **stable**.',
    deep: `**Ba tính chất của recomposition mà bạn phải biết:**
1. **Có thể xảy ra rất nhiều lần** (mỗi frame lúc animation) → composable **không được có side-effect** trực tiếp trong thân hàm.
2. **Có thể bị bỏ qua** với composable có tham số không đổi + stable.
3. **Chạy theo thứ tự bất kỳ và có thể song song** → không được dựa vào thứ tự thực thi giữa các composable.

**Cơ chế: snapshot system.** \`mutableStateOf\` trả về một \`MutableState\` được theo dõi. Khi một composable đọc \`state.value\`, Compose ghi nhận sự phụ thuộc đó vào scope hiện tại. Khi giá trị đổi, chỉ những scope có đọc nó bị đánh dấu invalid và recompose ở frame sau.

\`\`\`kotlin
@Composable
fun Screen(viewModel: MyViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    Column {
        Header()                    // KHÔNG đọc state -> không recompose
        Body(state.items)           // đọc -> recompose khi items đổi
        Footer()                    // KHÔNG đọc -> không recompose
    }
}
\`\`\`

**Ba lỗi làm recomposition nổ:**

\`\`\`kotlin
// 1. Đọc state ở scope quá rộng -> cả Column recompose
@Composable
fun Bad(state: UiState) {
    Column {
        Text(state.title)
        ExpensiveList()             // recompose oan vì Column bị invalid
    }
}
// Sửa: nâng việc đọc xuống chỗ dùng, hoặc truyền lambda
Text(text = { state.title })        // deferred read

// 2. Tạo object mới mỗi lần compose -> tham số luôn "khác"
@Composable
fun Bad() {
    val config = Config(timeout = 30)      // object mới mỗi lần!
    Child(config)                          // Child không bao giờ skip được
}
// Sửa
val config = remember { Config(timeout = 30) }

// 3. Lambda bắt biến thay đổi -> đổi identity mỗi lần
Child(onClick = { viewModel.onItemClick(item.id) })   // OK nếu Child stable & lambda được remember
\`\`\`

**\`derivedStateOf\` để tránh recompose khi kết quả không đổi:**
\`\`\`kotlin
// Xấu: recompose mỗi lần scrollState đổi (mỗi pixel!)
val showButton = scrollState.firstVisibleItemIndex > 5

// Tốt: chỉ recompose khi giá trị BOOLEAN đổi
val showButton by remember { derivedStateOf { scrollState.firstVisibleItemIndex > 5 } }
\`\`\`

**Đo lường:** bật compose compiler metrics để xem composable nào **restartable/skippable**, hoặc dùng Layout Inspector → recomposition count. **Bắt buộc đo trên release build** — debug không tối ưu skipping.`,
    code: [
      {
        lang: 'gradle',
        caption: 'Bật compiler metrics để tìm composable không skippable',
        source: `composeCompiler {
    reportsDestination = layout.buildDirectory.dir("compose_reports")
    metricsDestination = layout.buildDirectory.dir("compose_metrics")
}
// Xem build/compose_reports/*-composables.txt:
// "restartable skippable fun ItemRow(...)"  <- tốt
// "restartable fun ItemRow(...)"            <- KHÔNG skippable, tìm tham số unstable`,
      },
    ],
    pitfalls: [
      'Side-effect trong thân composable (gọi API, log, navigate) → chạy nhiều lần bất định. Dùng `LaunchedEffect`/`SideEffect`.',
      'Tạo object/lambda/list mới mỗi lần compose → phá skipping.',
      'Đọc state ở scope quá rộng → recompose cả cây con.',
      'Đo hiệu năng Compose trên debug build → số liệu sai hoàn toàn.',
      'Dùng `collectAsState` thay vì `collectAsStateWithLifecycle` → vẫn collect khi app ở background.',
    ],
    followUps: [
      '`remember` vs `rememberSaveable`?',
      'Stability là gì và `@Stable`/`@Immutable` dùng thế nào?',
      '`LaunchedEffect` vs `SideEffect` vs `DisposableEffect`?',
    ],
  },
  {
    id: 'remember-vs-remembersaveable',
    groupId: 'and-compose',
    title: '`remember` và `rememberSaveable` khác nhau thế nào?',
    levels: ['mid'],
    source: 'pdf',
    short:
      '`remember` giữ giá trị **qua các lần recomposition** nhưng **mất khi configuration change** (Activity recreate). `rememberSaveable` lưu thêm vào **`Bundle`** của saved instance state → sống qua cả rotate **và process death**, nhưng chỉ chứa được kiểu lưu được vào Bundle.',
    deep: `| | \`remember\` | \`rememberSaveable\` |
|---|---|---|
| Qua recomposition | ✅ | ✅ |
| Qua config change (rotate) | ❌ | ✅ |
| Qua process death | ❌ | ✅ |
| Kiểu dữ liệu | Bất kỳ | Parcelable/Serializable/primitive, hoặc có \`Saver\` |
| Chi phí | Rẻ | Ghi vào Bundle (giới hạn dung lượng) |

\`\`\`kotlin
// remember: state UI tạm, mất khi rotate cũng không sao
var isExpanded by remember { mutableStateOf(false) }

// rememberSaveable: user đã gõ, mất là khó chịu
var query by rememberSaveable { mutableStateOf("") }

// Object đắt, không cần lưu -> remember
val formatter = remember { DateTimeFormatter.ofPattern("dd/MM/yyyy") }

// Custom type -> cần Saver
var filter by rememberSaveable(stateSaver = FilterSaver) { mutableStateOf(Filter.default()) }

val FilterSaver = Saver<Filter, String>(
    save = { Json.encodeToString(it) },
    restore = { Json.decodeFromString(it) },
)
\`\`\`

**\`remember\` với key** — điều rất hay bị bỏ qua: nếu key đổi, giá trị được **tính lại**:
\`\`\`kotlin
// Không có key: giữ nguyên item cũ khi userId đổi -> BUG
val avatar = remember { loadAvatar(userId) }

// Có key: tính lại khi userId đổi
val avatar = remember(userId) { loadAvatar(userId) }
\`\`\`

**Ba tầng state trong Compose — chọn đúng tầng:**
| Tầng | Dùng cho |
|---|---|
| \`remember\` | State thuần UI, tạm thời (expanded, focus) |
| \`rememberSaveable\` | Input của user chưa submit (query, form nháp nhỏ) |
| **ViewModel + \`SavedStateHandle\`** | State của màn hình, dữ liệu tải về, logic nghiệp vụ |

Quy tắc: nếu state cần cho **logic nghiệp vụ** hoặc cần **survive process death với dữ liệu lớn** → ViewModel, không phải \`rememberSaveable\`.`,
    pitfalls: [
      '`remember` cho input của user → rotate là mất chữ đã gõ.',
      'Nhét object lớn vào `rememberSaveable` → `TransactionTooLargeException`.',
      '`remember` không có key khi giá trị phụ thuộc tham số → giữ dữ liệu cũ của item khác (bug hay gặp trong `LazyColumn`).',
      'Dùng `rememberSaveable` thay ViewModel cho state nghiệp vụ.',
    ],
    followUps: ['`Saver` tự viết thế nào?', '`rememberSaveable` lưu ở đâu bên dưới?', 'State hoisting nên nâng đến đâu?'],
  },
  {
    id: 'compose-stability',
    groupId: 'and-compose',
    title: 'Stability trong Compose là gì? Vì sao composable không skip được?',
    levels: ['senior'],
    source: 'pdf',
    short:
      'Một type là **stable** nếu (1) `equals` nhất quán, (2) mọi public property là `val` immutable hoặc `MutableState`, (3) khi thay đổi thì thông báo cho Compose. Compose chỉ **skip** một composable khi *mọi* tham số stable **và** bằng với lần trước. Type unstable phổ biến nhất: `List`, `Map`, `Set` (interface — Compose không biết có phải immutable), và class có `var`.',
    deep: `**Vì sao \`List\` unstable:** \`List<T>\` là *interface*. Compose không thể biết object thực là \`listOf()\` (immutable) hay \`mutableListOf()\` được cast lên. Nên nó phải giả định xấu nhất → composable nhận \`List\` không skippable → recompose mỗi lần cha recompose.

**Bốn cách sửa, theo thứ tự ưu tiên:**

\`\`\`kotlin
// 1. Dùng kotlinx-collections-immutable — cách đúng nhất
import kotlinx.collections.immutable.ImmutableList
@Composable fun ItemList(items: ImmutableList<Item>)     // stable

// 2. @Immutable / @Stable — bạn cam kết với compiler (nó TIN bạn, sai là bug hiển thị)
@Immutable
data class UiState(val items: List<Item>, val title: String)

// 3. Bọc trong class có annotation
@Immutable data class ItemsWrapper(val items: List<Item>)

// 4. Compose compiler stability config (Compose 1.5.4+) — cho type của thư viện bên thứ ba
// file stability_config.conf:
// java.time.LocalDate
// com.thirdparty.SomeModel
\`\`\`

**Khác biệt \`@Stable\` và \`@Immutable\`:**
- \`@Immutable\` — cam kết **không bao giờ đổi** sau khi tạo.
- \`@Stable\` — có thể đổi, **nhưng sẽ thông báo** cho Compose (qua \`MutableState\`), và \`equals\` nhất quán.

**Cách tìm composable không skippable:** bật compose compiler metrics (xem câu về recomposition) rồi đọc file \`*-composables.txt\`. Dòng thiếu chữ \`skippable\` là chỗ cần sửa. File \`*-classes.txt\` chỉ ra class nào unstable và **vì field nào**.

**Lưu ý quan trọng về hiệu ứng thực tế:** stability chỉ đáng đầu tư khi bạn **đã đo** thấy recomposition thừa gây jank. Với Compose 1.5+ **strong skipping mode** (mặc định từ Kotlin 2.0 compose compiler), lambda được tự động remember và composable với tham số unstable vẫn skip được nếu **so sánh bằng identity** — nên nhiều vấn đề stability cũ đã được giảm nhẹ. Nói được điều này cho thấy bạn theo dõi Compose thật.`,
    pitfalls: [
      'Rải `@Immutable` cho class thật sự mutable → Compose skip khi lẽ ra phải vẽ lại → **UI không cập nhật**, bug rất khó tìm.',
      'Tối ưu stability trước khi đo → mất thời gian vào chỗ không phải bottleneck.',
      'Dùng `List` trong UiState rồi thắc mắc sao recompose nhiều.',
      'Không biết strong skipping mode đã thay đổi bức tranh này.',
    ],
    followUps: ['Strong skipping mode làm gì?', 'Stability config file dùng khi nào?', 'Vì sao lambda gây recomposition và `remember` lambda giải quyết thế nào?'],
  },
  {
    id: 'compose-side-effects',
    groupId: 'and-compose',
    title: 'Các side-effect API trong Compose: `LaunchedEffect`, `SideEffect`, `DisposableEffect`, `produceState`?',
    levels: ['mid', 'senior'],
    short:
      'Composable phải **thuần** (không side-effect) vì nó chạy nhiều lần bất định. Việc có side-effect phải đặt trong effect API: **`LaunchedEffect`** (coroutine, chạy khi key đổi, cancel khi rời khỏi composition), **`SideEffect`** (chạy sau mỗi lần compose thành công — đồng bộ state sang object không phải Compose), **`DisposableEffect`** (cần cleanup), **`rememberCoroutineScope`** (launch từ callback như onClick).',
    deep: `| API | Chạy khi nào | Dùng cho |
|---|---|---|
| \`LaunchedEffect(key)\` | Vào composition, và mỗi lần \`key\` đổi | Gọi API một lần, animation, collect flow, show snackbar |
| \`SideEffect\` | Sau **mỗi** lần recomposition thành công | Đẩy state sang object non-Compose (analytics, native view) |
| \`DisposableEffect(key)\` | Vào composition; \`onDispose\` khi rời/key đổi | Đăng ký listener, sensor, lifecycle observer |
| \`produceState\` | Như LaunchedEffect nhưng trả về \`State\` | Chuyển nguồn non-Compose thành State |
| \`rememberCoroutineScope\` | Scope sống theo composition | Launch từ **event handler** (onClick) |
| \`rememberUpdatedState\` | — | Giữ lambda mới nhất trong effect có key dài hạn |

\`\`\`kotlin
@Composable
fun DetailScreen(id: String, viewModel: DetailViewModel = hiltViewModel()) {
    // Chạy lại khi id đổi, tự cancel khi rời màn hình
    LaunchedEffect(id) { viewModel.load(id) }

    // Event một lần: navigate / snackbar
    LaunchedEffect(Unit) {
        viewModel.events.collect { event ->
            when (event) {
                is Navigate -> navController.navigate(event.route)
                is ShowError -> snackbarHostState.showSnackbar(event.message)
            }
        }
    }

    // Cần cleanup
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, e ->
            if (e == Lifecycle.Event.ON_RESUME) viewModel.refresh()
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    // Launch từ onClick -> rememberCoroutineScope, KHÔNG dùng LaunchedEffect
    val scope = rememberCoroutineScope()
    Button(onClick = { scope.launch { viewModel.submit() } }) { Text("Gửi") }
}
\`\`\`

**\`rememberUpdatedState\` — giải quyết bẫy thực tế:**
\`\`\`kotlin
@Composable
fun Timer(onTimeout: () -> Unit) {
    val currentOnTimeout by rememberUpdatedState(onTimeout)   // luôn là lambda mới nhất
    LaunchedEffect(Unit) {                                    // key = Unit -> không restart
        delay(5_000)
        currentOnTimeout()      // nếu dùng onTimeout trực tiếp -> gọi lambda CŨ
    }
}
\`\`\`

**Chọn key cho \`LaunchedEffect\` là quyết định quan trọng nhất:** \`Unit\`/\`true\` = chạy đúng một lần cho cả đời composition. Truyền \`id\` = chạy lại khi \`id\` đổi. Truyền object không stable (\`viewModel\`, lambda) = **restart liên tục** — bug hay gặp.`,
    pitfalls: [
      'Gọi API trực tiếp trong thân composable → gọi nhiều lần bất định.',
      'Dùng `LaunchedEffect` trong `onClick` → không chạy (onClick không phải composition).',
      'Truyền lambda/object không stable làm key → effect restart mỗi recomposition.',
      'Quên `onDispose` trong `DisposableEffect` → leak listener.',
      'Dùng `LaunchedEffect(Unit)` mà bên trong lại đọc biến thay đổi → dùng giá trị cũ. Dùng `rememberUpdatedState`.',
    ],
    followUps: ['`snapshotFlow` dùng khi nào?', '`produceState` vs `collectAsState`?', 'Vì sao composable phải thuần?'],
  },
  {
    id: 'compose-vs-xml',
    groupId: 'and-compose',
    title: 'Compose khác View system (XML) thế nào? Có nên migrate?',
    levels: ['mid', 'senior'],
    short:
      'View system là **imperative + stateful**: bạn tạo cây View rồi *ra lệnh* thay đổi nó (`textView.text = ...`), nên state có thể lệch khỏi UI. Compose là **declarative**: bạn mô tả UI *theo state*, framework tự tính phần cần đổi — không còn khả năng UI lệch state. Compose cũng bỏ hẳn `findViewById`, layout XML, và `RecyclerView.Adapter`. Migrate **dần theo màn hình**, dùng interop hai chiều.',
    deep: `| | View system | Compose |
|---|---|---|
| Mô hình | Imperative, stateful | Declarative, state-driven |
| Layout | XML + inflate (đọc file lúc runtime) | Kotlin, compile-time |
| Cập nhật UI | Bạn tự set từng property | Recomposition tự động |
| List | \`RecyclerView\` + Adapter + ViewHolder + DiffUtil | \`LazyColumn\` với \`items()\` |
| Measure | Có thể multi-pass (nested weight) | **Single-pass** (nhanh hơn về lý thuyết) |
| Theming | XML style, khó đổi runtime | \`MaterialTheme\` + \`CompositionLocal\`, đổi runtime dễ |
| Animation | \`Animator\`, phức tạp | \`animate*AsState\`, rất gọn |
| Preview | Cần build & chạy | \`@Preview\`, nhiều biến thể cùng lúc |
| Trưởng thành | Rất, mọi thứ đều có | Đã production-ready, nhưng một số component còn thiếu |

**Đánh đổi thật (không chỉ ưu điểm):**
- **APK lớn hơn** (~1.5–2.5 MB cho Compose runtime + Material3) — đáng kể với app hướng thị trường máy yếu.
- **Startup của màn hình Compose đầu tiên** chậm hơn nếu không có Baseline Profile.
- **Learning curve về recomposition/stability** — team dễ viết code recompose thừa.
- Một số thứ vẫn cần View: \`MapView\`, \`WebView\`, \`CameraX PreviewView\`, một số SDK bên thứ ba → dùng \`AndroidView\`.

**Interop hai chiều — nền tảng của migrate dần:**
\`\`\`kotlin
// Compose trong XML
<androidx.compose.ui.platform.ComposeView
    android:id="@+id/compose_view" ... />

binding.composeView.setContent { MaterialTheme { MyScreen() } }

// View trong Compose
AndroidView(
    factory = { ctx -> WebView(ctx).apply { settings.javaScriptEnabled = true } },
    update = { it.loadUrl(url) },
    modifier = Modifier.fillMaxSize(),
)
\`\`\`

**Chiến lược migrate nên nói ra:** viết **màn hình mới** bằng Compose; chuyển màn hình cũ khi **có lý do sửa lớn** ở đó; không rewrite hàng loạt. Bắt đầu từ màn hình đơn giản, ít phụ thuộc custom view. Và **thêm Baseline Profile** ngay khi có Compose trong app.`,
    pitfalls: [
      'Rewrite toàn bộ app sang Compose trong một sprint — rủi ro rất lớn, không có giá trị nghiệp vụ tương ứng.',
      'Bỏ qua tác động tới APK size và startup.',
      'Viết Compose theo tư duy imperative (dùng `var` bên ngoài composable rồi mong UI cập nhật).',
      'Không dùng Baseline Profile → màn hình Compose lần đầu chậm rõ.',
    ],
    followUps: ['Compose Multiplatform có đáng cân nhắc?', 'Baseline Profile cho Compose sinh thế nào?', 'Bạn migrate màn hình nào đầu tiên và vì sao?'],
  },

  // ============ and-testing ============
  {
    id: 'android-testing-tools',
    groupId: 'and-testing',
    title: 'JUnit, Espresso, Robolectric, Compose test — mỗi cái dùng khi nào?',
    levels: ['mid'],
    source: 'pdf',
    short:
      '**JUnit** (`test/`) cho logic thuần trên JVM — nhanh nhất, dùng cho ViewModel/UseCase/Mapper. **Robolectric** (`test/`) mô phỏng framework Android trên JVM — dùng khi cần `Context`/`Resources` mà không muốn emulator. **Espresso** (`androidTest/`) cho UI test View system trên thiết bị. **`createComposeRule`** cho Compose UI test (chạy được cả JVM với Robolectric).',
    deep: `| Công cụ | Chạy ở | Tốc độ | Dùng cho |
|---|---|---|---|
| JUnit + MockK/Turbine | JVM | ~ms | ViewModel, UseCase, Mapper, Flow |
| Robolectric | JVM (giả lập Android) | ~100ms | Cần \`Context\`, \`Resources\`, \`SharedPreferences\`, Room in-memory |
| Espresso | Thiết bị/emulator | ~giây | UI test View system |
| Compose test rule | Cả hai | nhanh hơn Espresso | UI test Compose |
| MockWebServer | JVM/thiết bị | ~ms | Test tầng network với response thật |

**Test Flow bằng Turbine** — cách gọn nhất:
\`\`\`kotlin
@Test
fun \`phat loading roi success\`() = runTest {
    val vm = UserViewModel(FakeUserRepository(user))

    vm.state.test {                                  // Turbine
        assertThat(awaitItem()).isEqualTo(UiState.Loading)
        assertThat(awaitItem()).isEqualTo(UiState.Success(user))
        cancelAndIgnoreRemainingEvents()
    }
}
\`\`\`

**Test Room** — dùng in-memory DB, không cần emulator nếu có Robolectric:
\`\`\`kotlin
@RunWith(AndroidJUnit4::class)
class UserDaoTest {
    private lateinit var db: AppDatabase

    @Before fun setUp() {
        db = Room.inMemoryDatabaseBuilder(
            ApplicationProvider.getApplicationContext(), AppDatabase::class.java,
        ).allowMainThreadQueries().build()
    }

    @After fun tearDown() = db.close()
}
\`\`\`

**Compose UI test:**
\`\`\`kotlin
@get:Rule val composeRule = createComposeRule()

@Test fun hienLoiKhiThatBai() {
    composeRule.setContent { MaterialTheme { ProfileScreen(ProfileUiState.Error("lỗi mạng")) } }

    composeRule.onNodeWithText("lỗi mạng").assertIsDisplayed()
    composeRule.onNodeWithTag("retry_button").performClick()
}
\`\`\`
Compose test **tự đồng bộ** với recomposition (không cần \`IdlingResource\` như Espresso) — nhưng nếu bạn dùng \`withContext\` với dispatcher thật thì vẫn phải \`waitUntil\`.

**Chống flaky test:**
- Không \`Thread.sleep\`. Dùng \`runTest\` + \`advanceUntilIdle\`, hoặc \`composeRule.waitUntil { }\`.
- Inject dispatcher (\`TestDispatcher\`) thay vì dùng \`Dispatchers.IO\` thật.
- Tắt animation trên thiết bị test (\`animator_duration_scale 0\`).
- Mỗi test tự dựng dữ liệu, không phụ thuộc thứ tự chạy.`,
    pitfalls: [
      '`Thread.sleep` trong test → chậm và flaky.',
      'Dùng `Dispatchers.IO` thật trong unit test → test không tiền định.',
      'Mock `Context` bằng MockK thay vì Robolectric — mock 20 method rồi vẫn sai hành vi.',
      'Chạy Espresso với animation bật → flaky.',
      'Test phụ thuộc thứ tự thực thi hoặc state để lại từ test trước.',
    ],
    followUps: ['Turbine giải quyết vấn đề gì?', 'Robolectric đánh đổi gì so với emulator?', 'Screenshot/golden test trên Android làm thế nào? (Paparazzi, Roborazzi)'],
  },
]
