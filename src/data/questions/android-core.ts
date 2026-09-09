import type { Question } from '../types'

export const ANDROID_CORE_QUESTIONS: Question[] = [
  // ============ and-foundation ============
  {
    id: 'activity-lifecycle',
    groupId: 'and-foundation',
    title: 'Vòng đời Activity gồm những callback nào?',
    levels: ['junior'],
    source: 'pdf',
    short:
      '`onCreate` → `onStart` → `onResume` → (chạy) → `onPause` → `onStop` → `onDestroy`. Ba cặp có ý nghĩa riêng: **create/destroy** = đời của instance, **start/stop** = có thể thấy hay không, **resume/pause** = có foreground và nhận tương tác hay không.',
    deep: `\`\`\`text
onCreate  -> khởi tạo UI, bind ViewModel, restore state
onStart   -> Activity thành visible; bắt đầu quan sát dữ liệu
onResume  -> Activity ở foreground, nhận input; mở camera/sensor tại đây
   ...
onPause   -> mất focus (dialog, split-screen, app khác lên); phải rất nhanh
onStop    -> không còn visible; huỷ đăng ký, lưu dữ liệu bền
onDestroy -> giải phóng cuối cùng
\`\`\`

**Nơi đặt việc gì:**
| Việc | Đặt ở |
|---|---|
| Inflate layout, bind ViewModel | \`onCreate\` |
| Collect Flow / observe LiveData | \`onStart\` + \`onStop\`, hoặc \`repeatOnLifecycle(STARTED)\` |
| Mở camera, sensor, animation | \`onResume\` / dừng ở \`onPause\` |
| Lưu bản nháp của user | \`onStop\` (không phải \`onDestroy\` — có thể không được gọi) |

**Điều then chốt:** \`onDestroy\` **không được đảm bảo gọi**. Nếu OS giết process vì thiếu RAM, bạn chỉ có \`onStop\` là mốc cuối cùng đáng tin. Vì thế dữ liệu quan trọng phải lưu ở \`onStop\` hoặc ngay khi user thay đổi.

**Lifecycle-aware là cách hiện đại:** thay vì rải logic vào từng callback, dùng \`DefaultLifecycleObserver\` hoặc \`repeatOnLifecycle\` để component tự gắn/tự gỡ theo lifecycle.`,
    code: [
      {
        lang: 'kotlin',
        caption: 'Cách collect Flow đúng — tự dừng khi không visible',
        source: `class HomeActivity : AppCompatActivity() {
    private val viewModel: HomeViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(binding.root)

        lifecycleScope.launch {
            // Tự cancel khi xuống dưới STARTED, tự restart khi trở lại
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.state.collect { render(it) }
            }
        }
    }
}`,
      },
    ],
    pitfalls: [
      'Lưu dữ liệu quan trọng trong `onDestroy` — có thể không bao giờ được gọi.',
      'Làm việc nặng trong `onPause` — nó chặn việc mở Activity tiếp theo, gây cảm giác lag khi chuyển màn.',
      'Dùng `launchWhenStarted` (deprecated, chỉ *pause* coroutine chứ không cancel → vẫn giữ tài nguyên). Dùng `repeatOnLifecycle`.',
    ],
    followUps: ['Rotate màn hình thì thứ tự callback ra sao?', 'Vì sao `repeatOnLifecycle` tốt hơn `launchWhenStarted`?'],
  },
  {
    id: 'fragment-lifecycle',
    groupId: 'and-foundation',
    title: 'Vòng đời Fragment và vì sao nó có 2 lifecycle?',
    levels: ['junior', 'mid'],
    source: 'pdf',
    short:
      '`onAttach` → `onCreate` → `onCreateView` → `onViewCreated` → `onStart` → `onResume` → `onPause` → `onStop` → `onDestroyView` → `onDestroy` → `onDetach`. Điểm quan trọng nhất: Fragment có **hai lifecycle** — của *Fragment instance* và của *View* nó tạo ra. View có thể bị hủy và tạo lại (back stack, `ViewPager2`) trong khi Fragment vẫn sống.',
    deep: `Đó là lý do có \`viewLifecycleOwner\`:

\`\`\`kotlin
// SAI: observer gắn vào lifecycle của Fragment (sống lâu hơn View)
// -> vào back stack rồi quay lại: có 2 observer, UI update 2 lần, và giữ View cũ
viewModel.data.observe(this) { render(it) }

// ĐÚNG: observer chết cùng View
viewModel.data.observe(viewLifecycleOwner) { render(it) }
\`\`\`

**ViewBinding phải null hoá ở \`onDestroyView\`** cũng vì lý do này:

\`\`\`kotlin
private var _binding: FragmentHomeBinding? = null
private val binding get() = _binding!!

override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?) =
    FragmentHomeBinding.inflate(i, c, false).also { _binding = it }.root

override fun onDestroyView() {
    super.onDestroyView()
    _binding = null      // nếu quên -> Fragment giữ toàn bộ cây View -> leak
}
\`\`\`

**Ba scope ViewModel trong Fragment:**
| Cách khai báo | Sống theo |
|---|---|
| \`by viewModels()\` | Fragment này |
| \`by activityViewModels()\` | Activity — chia sẻ giữa các Fragment |
| \`by navGraphViewModels(R.id.flow)\` | Một nav graph con — chia sẻ trong một luồng (ví dụ checkout) |

**Giao tiếp giữa Fragment:** không gọi trực tiếp lẫn nhau. Dùng shared ViewModel (\`activityViewModels\`) hoặc \`FragmentResultListener\` (\`setFragmentResult\`) — cách sau tốt hơn cho dialog trả kết quả một lần.`,
    pitfalls: [
      'Dùng `this` thay vì `viewLifecycleOwner` khi observe LiveData → observer nhân bản sau mỗi lần view recreate.',
      'Truy cập `binding` trong callback async chạy sau `onDestroyView` → NPE. Kiểm tra `_binding != null` hoặc dùng `viewLifecycleOwner.lifecycleScope`.',
      'Truyền dữ liệu qua constructor Fragment — Fragment phải có constructor rỗng để hệ thống recreate. Dùng `arguments`/Safe Args.',
      'Giữ reference tới Fragment khác.',
    ],
    followUps: [
      'Vì sao Fragment bắt buộc constructor không tham số?',
      '`ViewPager2` + `FragmentStateAdapter` hủy view khi nào?',
      '`childFragmentManager` khác `parentFragmentManager` ở đâu?',
    ],
  },
  {
    id: 'onpause-vs-onstop',
    groupId: 'and-foundation',
    title: 'Khi nào chỉ `onPause` được gọi mà không có `onStop`?',
    levels: ['mid'],
    source: 'pdf',
    short:
      '`onPause` = mất focus nhưng **vẫn còn thấy**. `onStop` = **không còn thấy** nữa. Chỉ `onPause` khi có dialog/Activity trong suốt (dialog theme) đè lên, khi vào split-screen mà app kia được focus, hoặc khi hiện Picture-in-Picture. Khi user bấm Home hoặc mở app khác thì cả `onPause` rồi `onStop`.',
    deep: `| Tình huống | Callback |
|---|---|
| Dialog / Activity theme trong suốt đè lên | \`onPause\` |
| Split-screen, app khác đang được focus | \`onPause\` (vẫn visible) |
| Bấm Home, mở app khác | \`onPause\` → \`onStop\` |
| Mở Activity khác cùng app (full screen) | \`onPause\` → \`onStop\` |
| Rotate | \`onPause\` → \`onStop\` → \`onDestroy\` → tạo lại |
| Bấm Back | \`onPause\` → \`onStop\` → \`onDestroy\` (finish) |

**Ứng dụng thực tế:** đừng dừng video ở \`onPause\` nếu app hỗ trợ split-screen/PiP — user vẫn đang xem. Dùng \`onStop\`. Ngược lại, camera và sensor nên dừng ở \`onPause\` vì chỉ một app được dùng camera tại một thời điểm (trên máy cũ).

**Từ Android 7 (multi-window)** ranh giới này quan trọng hơn nhiều: nhiều Activity có thể ở trạng thái RESUMED-visible cùng lúc, nên "pause = user không xem nữa" là giả định sai.

**Multi-resume trên Android 10+**: trong multi-window, tất cả Activity đang thấy đều có thể ở RESUMED; dùng \`onTopResumedActivityChanged()\` để biết mình có đang là cái được ưu tiên (dành camera/mic).`,
    pitfalls: [
      'Dừng phát nhạc/video ở `onPause` → user split-screen thấy video tự dừng vô lý.',
      'Làm việc nặng (ghi DB đồng bộ, network) trong `onPause` → chặn transition, gây lag khi chuyển màn.',
      'Coi `onPause` là "app vào background" — nó không phải.',
    ],
    followUps: ['Multi-resume trên Android 10 ảnh hưởng gì?', 'Làm sao biết app thực sự vào background? (`ProcessLifecycleOwner`)'],
  },
  {
    id: 'rotate-screen',
    groupId: 'and-foundation',
    title: 'Rotate màn hình xảy ra gì? Giữ state thế nào?',
    levels: ['junior', 'mid'],
    source: 'pdf',
    short:
      'Rotate là một **configuration change**: Activity bị **destroy và tạo lại** để nạp resource đúng cấu hình mới (layout-land, dimens...). Thứ tự: `onPause → onSaveInstanceState → onStop → onDestroy → onCreate → onStart → onRestoreInstanceState → onResume`. **ViewModel sống sót** qua rotate; instance Activity thì không.',
    deep: `**Bốn cơ chế giữ state, dùng đúng chỗ:**

| Cơ chế | Sống qua rotate | Sống qua process death | Dùng cho |
|---|---|---|---|
| Biến thường trong Activity | ❌ | ❌ | không dùng cho state |
| **ViewModel** | ✅ | ❌ | state của UI, dữ liệu đã tải, job đang chạy |
| **\`onSaveInstanceState\` / \`SavedStateHandle\`** | ✅ | ✅ | ID, query text, vị trí scroll — dữ liệu **nhỏ** |
| **DB / DataStore** | ✅ | ✅ | dữ liệu bền, bản nháp của user |

Vì sao ViewModel sống sót: \`ViewModelStore\` được giữ trong \`NonConfigurationInstance\` của Activity và bàn giao cho instance mới, chỉ \`onCleared()\` khi Activity **finish thật** (back/finish), không phải khi recreate.

**\`android:configChanges="orientation|screenSize"\`** chặn recreate và gọi \`onConfigurationChanged\` thay thế. **Đừng dùng để "sửa" mất state** — nó là workaround che bug, và bạn sẽ tự chịu trách nhiệm nạp lại resource. Nó chỉ hợp lý cho case đặc thù như màn hình camera/video player. Với Compose, recreate rẻ hơn nhiều nên càng ít lý do dùng.

**Kiểm tra bằng cách nào:** bật *Developer options → Don't keep activities* để mô phỏng cả recreate lẫn process death — rotate 20 lần và bật cờ này là cách nhanh nhất tìm bug state.`,
    code: [
      {
        lang: 'kotlin',
        caption: 'SavedStateHandle: sống qua cả rotate và process death',
        source: `class SearchViewModel(
    private val handle: SavedStateHandle,
    private val repo: SearchRepository,
) : ViewModel() {

    // Tự động lưu/khôi phục, kể cả sau khi process bị kill
    val query: StateFlow<String> = handle.getStateFlow("query", "")

    val results = query
        .debounce(300)
        .filter { it.length >= 2 }
        .flatMapLatest { repo.search(it) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun onQueryChange(q: String) { handle["query"] = q }
}`,
      },
    ],
    pitfalls: [
      'Dùng `configChanges` để né vấn đề state.',
      'Nhét object lớn (bitmap, list dài) vào `onSaveInstanceState` → `TransactionTooLargeException` (giới hạn Bundle ~500 KB thực tế, Binder ~1 MB).',
      'Nghĩ ViewModel sống sót được cả process death — không.',
    ],
    followUps: [
      '`SavedStateHandle` vs `onSaveInstanceState`?',
      'Compose thì `rememberSaveable` đóng vai gì?',
      'Test rotate tự động trong CI thế nào?',
    ],
  },
  {
    id: 'process-death',
    groupId: 'and-foundation',
    title: 'Process death là gì và khác configuration change thế nào?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Process death là khi **OS giết cả process app** để lấy RAM cho app foreground, trong khi user vẫn nghĩ app còn đó — bấm vào recents là quay lại. Khác rotate ở chỗ **ViewModel và mọi biến trong RAM đều mất**; chỉ `savedInstanceState`/`SavedStateHandle` và dữ liệu bền còn lại. Đây là nguồn bug "app trắng màn hình sau khi mở lại".',
    deep: `| | Configuration change (rotate) | Process death |
|---|---|---|
| Activity recreate | ✅ | ✅ |
| ViewModel còn không | **Còn** | **Mất** |
| \`SavedStateHandle\` / \`Bundle\` | Còn | **Còn** (Android ghi ra disk) |
| Singleton, biến static, cache RAM | Còn | **Mất** |
| Back stack | Còn | **Được khôi phục** (Activity/Fragment recreate lại) |

**Mức ưu tiên bị giết** (thấp → dễ bị giết): foreground → visible → service → **cached** (app ở background). App ở background lâu gần như *chắc chắn* sẽ bị giết trên máy RAM thấp.

**Test bằng cách nào** (bắt buộc phải biết, vì bug này không tự thấy được):
\`\`\`bash
# 1. Mở app đến màn hình cần test, bấm Home
# 2. Giả lập OS giết process (khác hoàn toàn với force-stop!)
adb shell am kill com.example.app
# 3. Mở lại từ recents -> app phải khôi phục đúng chỗ
\`\`\`
Lưu ý: \`am force-stop\` mô phỏng user tự tắt app (không restore state) — **không** dùng để test process death.

**Thiết kế để sống sót:**
1. Mọi tham số điều hướng đi qua \`arguments\`/Safe Args, không qua singleton.
2ph. State tối thiểu để dựng lại màn hình (id, query, tab đang chọn) vào \`SavedStateHandle\`.
3. Dữ liệu lấy lại được thì **không lưu**, chỉ tải lại từ repository (single source of truth là DB/network).
4. Bản nháp form dài → DataStore/Room ngay khi user gõ, không chờ submit.`,
    pitfalls: [
      'Truyền dữ liệu giữa màn hình qua singleton/`object` → sau process death là `null` → crash hoặc màn trắng.',
      'Dùng `am force-stop` để test rồi kết luận "app ổn".',
      'Lưu cả object domain lớn vào `SavedStateHandle` thay vì chỉ id.',
      'Quên rằng người dùng thật gặp case này rất thường xuyên trên máy 2–3 GB RAM.',
    ],
    followUps: [
      '`SavedStateHandle` lưu ở đâu về mặt vật lý?',
      'Giới hạn dung lượng của Bundle khi save state?',
      'Làm sao khôi phục vị trí scroll của một list dài?',
    ],
  },
  {
    id: 'savedstatehandle-vs-onsaveinstancestate',
    groupId: 'and-foundation',
    title: '`SavedStateHandle` và `onSaveInstanceState` khác nhau ra sao?',
    levels: ['mid'],
    source: 'pdf',
    short:
      'Cả hai ghi vào **cùng một Bundle** do hệ thống quản lý, nên đều sống qua process death. Khác nhau ở **nơi đặt code**: `onSaveInstanceState` nằm ở Activity/Fragment (tầng View), còn `SavedStateHandle` được inject vào **ViewModel** — nhờ đó logic state nằm cùng chỗ với logic nghiệp vụ, và test được trên JVM.',
    deep: `\`\`\`kotlin
// Cách cũ: state bị chia đôi giữa View và ViewModel
class SearchFragment : Fragment() {
    private var query: String = ""
    override fun onSaveInstanceState(out: Bundle) { out.putString("q", query) }
    override fun onViewStateRestored(s: Bundle?) { query = s?.getString("q") ?: "" }
}

// Cách hiện đại: state thuộc về ViewModel
class SearchViewModel(private val handle: SavedStateHandle) : ViewModel() {
    val query = handle.getStateFlow("q", "")
    fun setQuery(v: String) { handle["q"] = v }
}
\`\`\`

**Vì sao \`SavedStateHandle\` tốt hơn:**
- View không cần biết state là gì → dễ đổi View (XML → Compose) mà không đụng logic.
- Test được bằng \`SavedStateHandle(mapOf("q" to "abc"))\` trong unit test JVM thuần.
- \`getStateFlow\` cho luồng reactive, kết hợp tự nhiên với Flow operator.
- Hilt tự inject: chỉ cần \`@HiltViewModel\` + \`SavedStateHandle\` trong constructor.

**Giới hạn giống nhau:** chỉ chứa được kiểu **parcelable/serializable nhỏ**. Bundle không phải nơi để lưu danh sách 500 item — sẽ \`TransactionTooLargeException\`. Quy tắc: lưu **khoá để lấy lại dữ liệu**, không lưu dữ liệu.

Trong Compose, \`rememberSaveable\` là tầng thứ ba cùng cơ chế — dùng cho state thuần UI (trạng thái mở/đóng của một expandable item) mà không đáng đưa vào ViewModel.`,
    pitfalls: [
      'Dùng cả hai cùng lúc cho cùng một state → hai nguồn sự thật, không đồng bộ.',
      'Lưu list lớn hoặc bitmap → crash Binder.',
      'Quên rằng Safe Args tự đưa argument vào `SavedStateHandle` — nên id truyền qua navigation đã sống sót sẵn, không cần lưu lại.',
    ],
    followUps: ['`rememberSaveable` và `SavedStateHandle` chọn cái nào?', '`SavedStateHandle` có sống qua `finish()` không?'],
  },
  {
    id: 'launch-mode',
    groupId: 'and-foundation',
    title: 'Các launch mode của Activity? Dùng khi nào?',
    levels: ['mid'],
    source: 'pdf',
    short:
      '**standard**: luôn tạo instance mới. **singleTop**: nếu đã ở đỉnh stack thì tái dùng và gọi `onNewIntent`. **singleTask**: chỉ một instance trong task, quay lại nó và **xoá mọi Activity phía trên**. **singleInstance**: một instance trong task riêng, không có Activity nào khác cùng task. Thực tế chỉ dùng `standard` và `singleTop`; hai cái còn lại dành cho launcher/entry point đặc biệt.',
    deep: `\`\`\`text
standard      A -> B -> B -> B        (3 instance của B)
singleTop     A -> B, mở B lại        (tái dùng B, gọi onNewIntent)
              A -> B -> C, mở B       (tạo B mới, vì B không ở đỉnh)
singleTask    A -> B -> C, mở B       (C bị pop, còn A -> B, onNewIntent)
singleInstance  B nằm một mình trong task riêng
\`\`\`

**Dùng thật ở đâu:**
| Mode | Trường hợp |
|---|---|
| standard | Mặc định, 95% màn hình |
| singleTop | Màn hình mở từ notification/search — tránh xếp chồng 5 bản cùng màn hình |
| singleTask | \`MainActivity\` làm entry point duy nhất, deep link đổ về đây |
| singleInstance | Gần như không dùng trong app thường (dành cho launcher, màn hình khẩn cấp) |

**Bắt buộc: \`singleTop\`/\`singleTask\` phải xử lý \`onNewIntent\`** — nếu không, mở app từ notification lần thứ hai sẽ không đổi nội dung vì \`onCreate\` không được gọi lại:

\`\`\`kotlin
override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)                       // quan trọng: cập nhật intent hiện tại
    handleDeepLink(intent)
}
\`\`\`

**Intent flag làm được điều tương tự mà không sửa manifest** — linh hoạt hơn: \`FLAG_ACTIVITY_NEW_TASK\`, \`FLAG_ACTIVITY_CLEAR_TOP\`, \`FLAG_ACTIVITY_SINGLE_TOP\`. Combo \`CLEAR_TOP or SINGLE_TOP\` là cách phổ biến để "về màn hình chính và xoá stack" khi logout.

**Với single-Activity + Navigation Component**, launch mode gần như không còn dùng: điều hướng do \`NavController\` quản lý, còn logout thì \`popUpTo(startDestination) { inclusive = true }\`.`,
    pitfalls: [
      'Đặt `singleTop` mà không override `onNewIntent` → deep link thứ hai không có tác dụng.',
      'Quên `setIntent(intent)` trong `onNewIntent` → `getIntent()` vẫn trả về intent cũ.',
      'Dùng `singleInstance` cho MainActivity → hành vi back/recents rất lạ, khó debug.',
      'Nghĩ launch mode ảnh hưởng Fragment — không, nó chỉ áp cho Activity.',
    ],
    followUps: ['`taskAffinity` là gì?', '`FLAG_ACTIVITY_CLEAR_TASK` khác `CLEAR_TOP`?', 'Logout thì xoá back stack thế nào?'],
  },
  {
    id: 'app-launch-flow',
    groupId: 'and-foundation',
    title: 'App launch flow: cold, warm, hot start khác nhau thế nào và tối ưu ra sao?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      '**Cold start**: process chưa tồn tại — Zygote fork process → tạo `Application` → `onCreate` → inflate → frame đầu tiên. **Warm start**: process còn nhưng Activity đã destroy. **Hot start**: cả process và Activity còn, chỉ đưa lên foreground. Google đặt ngưỡng: cold < 5s là "chấp nhận", nhưng mục tiêu thực tế nên < 2s.',
    deep: `**Chuỗi cold start chi tiết:**
\`\`\`text
Launcher gửi intent
  -> Zygote fork process (đã preload framework class)
  -> tạo Application object -> Application.onCreate()
  -> ContentProvider.onCreate() của các lib (Firebase, WorkManager...)
  -> Activity.onCreate -> inflate layout -> measure/layout/draw
  -> FIRST FRAME (Time To Initial Display - TTID)
  -> tải dữ liệu -> Time To Full Display (TTFD)
\`\`\`

**Ba nguồn chậm phổ biến nhất, theo thứ tự:**

1. **\`Application.onCreate\` làm quá nhiều.** Init Firebase, analytics, crash reporter, DI graph, image loader… đồng bộ. Sửa: dùng **App Startup (\`androidx.startup\`)** để gom \`Initializer\`, và **lazy init** những gì không cần cho frame đầu.
2. **ContentProvider ẩn của thư viện.** Mỗi lib dùng \`ContentProvider\` để tự init đều chạy *trước* \`Application.onCreate\`. Đó chính là vấn đề mà \`androidx.startup\` ra đời để giải quyết — nó thay N provider bằng 1.
3. **Layout sâu / inflate nặng** ở màn hình đầu. Sửa bằng \`ConstraintLayout\` phẳng, \`ViewStub\`, hoặc Compose.

**Đo lường đúng cách:**
\`\`\`bash
# Cold start time thực tế (TTID)
adb shell am start-activity -W -n com.example/.MainActivity | grep TotalTime

# Trace chi tiết
adb shell am start --start-profiler /data/local/tmp/trace com.example/.MainActivity
\`\`\`
Và trong production: **Play Console → Android vitals** (cold start), hoặc Firebase Performance.

**Hai kỹ thuật hiện đại đáng nêu ra:**
- **Baseline Profiles**: cung cấp profile AOT cho code đường khởi động → giảm 20–30% cold start thật. Đây là câu trả lời làm interviewer chú ý.
- **SplashScreen API (Android 12)**: dùng theme splash chuẩn thay vì một Activity splash riêng (Activity splash làm *tăng* thời gian khởi động).`,
    pitfalls: [
      'Dùng một `SplashActivity` riêng "để cảm giác nhanh hơn" — nó thêm một vòng inflate + transition, làm chậm thật.',
      'Đọc `SharedPreferences` đồng bộ trong `Application.onCreate` → I/O trên main thread ngay lúc khởi động.',
      'Đo cold start bằng cách bấm icon rồi bấm đồng hồ — dùng `am start -W` hoặc Macrobenchmark.',
      'Không nhắc Baseline Profile — hiện là công cụ hiệu quả nhất cho startup.',
    ],
    followUps: [
      'Baseline Profile sinh ra và dùng thế nào?',
      'TTID vs TTFD khác gì?',
      'Vì sao ContentProvider của lib chạy trước `Application.onCreate`?',
    ],
  },
  {
    id: 'four-components',
    groupId: 'and-foundation',
    title: 'Service, BroadcastReceiver, ContentProvider dùng để làm gì?',
    levels: ['junior', 'mid'],
    source: 'pdf',
    short:
      '**Service**: chạy việc không có UI (3 loại: background, **foreground** có notification, **bound** để client gọi qua Binder). **BroadcastReceiver**: nghe sự kiện hệ thống/app. **ContentProvider**: chia sẻ dữ liệu **giữa các app** qua URI. Điểm bị nhầm nhiều nhất: **cả ba đều chạy trên main thread**.',
    deep: `**Service — và vì sao ngày nay ít dùng:**
| Loại | Đặc điểm | Trạng thái hiện nay |
|---|---|---|
| Background Service | Không có UI, không notification | Bị chặn từ **Android 8 (API 26)** khi app ở background → dùng **WorkManager** |
| Foreground Service | Bắt buộc có notification, ưu tiên cao | Vẫn dùng: nhạc, ghi GPS, gọi điện. Android 14 bắt buộc khai báo \`foregroundServiceType\` |
| Bound Service | Client bind, gọi method qua \`Binder\`/AIDL | Dùng cho IPC giữa các app hoặc process |

**Cây quyết định thực dụng:**
\`\`\`text
Việc phải hoàn thành dù app bị đóng?         -> WorkManager
Việc user đang chủ động theo dõi (nhạc, GPS)? -> Foreground Service
Việc chỉ trong lúc màn hình đang mở?          -> coroutine trong viewModelScope
Cần app khác gọi vào?                         -> Bound Service / ContentProvider
\`\`\`

**BroadcastReceiver:** từ Android 8, **implicit broadcast bị chặn** với receiver khai báo trong manifest (trừ một danh sách ngoại lệ như \`BOOT_COMPLETED\`). Nên đăng ký động bằng \`registerReceiver\` khi cần, và **nhớ \`unregisterReceiver\`**. Android 13+ bắt buộc cờ \`RECEIVER_EXPORTED\`/\`RECEIVER_NOT_EXPORTED\`. \`onReceive\` có ~10 giây trước khi bị coi là ANR → việc dài phải đẩy sang WorkManager.

**ContentProvider:** thực tế chỉ dùng khi (1) chia sẻ dữ liệu cho app khác, (2) làm \`FileProvider\` để chia sẻ file an toàn qua \`content://\` (bắt buộc từ Android 7 thay cho \`file://\`), (3) đọc dữ liệu hệ thống (Contacts, MediaStore). Không dùng nó để truy cập DB nội bộ của chính app — dùng Room.`,
    code: [
      {
        lang: 'kotlin',
        caption: 'Foreground Service đúng chuẩn Android 14',
        source: `class PlaybackService : Service() {
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Phải gọi startForeground trong ~5 giây, nếu không -> crash
        ServiceCompat.startForeground(
            this, NOTIFICATION_ID, buildNotification(),
            ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK,
        )
        return START_STICKY
    }
    override fun onBind(intent: Intent?): IBinder? = null
}`,
      },
      {
        lang: 'xml',
        caption: 'Manifest cho Android 14+',
        source: `<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />

<service
    android:name=".PlaybackService"
    android:foregroundServiceType="mediaPlayback"
    android:exported="false" />`,
      },
    ],
    pitfalls: [
      'Nghĩ Service chạy sẵn trên background thread — không, phải tự tạo thread/coroutine.',
      'Dùng background Service trên Android 8+ khi app ở background → `IllegalStateException`.',
      'Quên `unregisterReceiver` → leak.',
      'Làm việc nặng trong `onReceive` (giới hạn ~10s).',
      'Từ Android 14, thiếu `foregroundServiceType` hoặc quyền tương ứng → crash khi start.',
    ],
    followUps: [
      '`START_STICKY` vs `START_NOT_STICKY` vs `START_REDELIVER_INTENT`?',
      'WorkManager chọn backend nào bên dưới? (JobScheduler / AlarmManager)',
      '`FileProvider` giải quyết vấn đề gì so với `file://`?',
    ],
  },
  {
    id: 'deep-link-vs-app-link',
    groupId: 'and-foundation',
    title: 'Deep link và App Link khác nhau thế nào?',
    levels: ['mid'],
    source: 'pdf',
    short:
      '**Deep link** là URI (custom scheme như `myapp://product/1` hoặc http) khai báo trong `intent-filter` — vấn đề là **app khác có thể khai báo trùng**, khiến Android hiện hộp chọn app, hoặc bị hijack. **App Link** là deep link http/https có **xác thực chủ quyền domain** qua file `assetlinks.json` trên server → mở trực tiếp app, không hiện dialog, không thể bị chiếm.',
    deep: `| | Deep link (custom scheme) | App Link (verified) |
|---|---|---|
| Scheme | Tuỳ ý (\`myapp://\`) | Chỉ \`http\`/\`https\` |
| Cần verify domain | Không | **Có** (\`/.well-known/assetlinks.json\`) |
| Hộp chọn app | Có thể hiện | Không |
| App chưa cài | Không làm gì | Mở web bình thường → fallback tự nhiên |
| Bị app khác chiếm | **Được** | Không |

\`\`\`xml
<activity android:name=".MainActivity" android:exported="true">
    <intent-filter android:autoVerify="true">      <!-- chìa khoá của App Links -->
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https" android:host="example.com" android:pathPrefix="/product" />
    </intent-filter>
</activity>
\`\`\`

Trên server \`https://example.com/.well-known/assetlinks.json\`:
\`\`\`json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.example.app",
    "sha256_cert_fingerprints": ["AA:BB:..."]
  }
}]
\`\`\`

**Bẫy vận hành hay gặp nhất:** nếu bạn dùng **Play App Signing**, fingerprint phải là của **cert do Google ký**, không phải cert upload của bạn — lấy trong Play Console → Setup → App integrity. Sai fingerprint thì verify âm thầm thất bại và link mở bằng browser.

**Debug:**
\`\`\`bash
adb shell am start -W -a android.intent.action.VIEW -d "https://example.com/product/1" com.example.app
adb shell pm get-app-links com.example.app       # xem trạng thái verify
\`\`\`

**Bảo mật:** activity nhận deep link là \`exported="true"\` → **mọi app đều gọi được**. Vì thế **phải validate toàn bộ param** và không tin dữ liệu trong URI (đây chính là OWASP M4). Đừng để một link mở được màn hình thanh toán với \`amount\` từ URI.`,
    pitfalls: [
      'Dùng fingerprint của upload key thay vì Play App Signing key → App Link không verify.',
      'Không validate param từ deep link → app khác kích hoạt được luồng nội bộ.',
      'Quên `autoVerify="true"`, hoặc `assetlinks.json` trả về Content-Type sai / redirect (phải là 200 + `application/json`, không redirect).',
      'Chỉ dùng custom scheme → không có fallback web khi user chưa cài app.',
    ],
    followUps: [
      'Navigation Component xử lý deep link thế nào? (`<deepLink>` trong nav graph)',
      'Deferred deep link (chưa cài app → cài rồi mở đúng trang) làm sao?',
      'iOS Universal Links tương đương gì?',
    ],
  },

  // ============ and-perf ============
  {
    id: 'anr',
    groupId: 'and-perf',
    title: 'ANR là gì? Nguyên nhân và cách điều tra?',
    levels: ['mid', 'senior'],
    short:
      'ANR (Application Not Responding) xảy ra khi main thread bị chặn quá lâu: **~5 giây** không xử lý input, **~10 giây** cho `BroadcastReceiver.onReceive`, **~20 giây** cho Service start (foreground là ~5s để gọi `startForeground`). Nguyên nhân gần như luôn là I/O, khoá, hoặc IPC đồng bộ trên main thread. Điều tra bằng **Play Console → Android vitals** và `traces.txt`.',
    deep: `**Các nguyên nhân theo tần suất thực tế:**
1. **I/O trên main thread** — đọc/ghi \`SharedPreferences\` lớn, query Room không \`suspend\`, đọc file, decode bitmap.
2. **\`runBlocking\` / \`Future.get()\` / \`Thread.join()\` trên main thread** — dịch nghĩa là "tự tạo deadlock".
3. **Lock contention** — main thread chờ \`synchronized\` mà background thread đang giữ (và background đang làm việc dài).
4. **Binder call đồng bộ** — gọi ContentProvider của app khác, \`PackageManager\` với nhiều app, hoặc IPC tới process đã treo.
5. **Khởi tạo nặng** trong \`Application.onCreate\` khi user vừa mở app.

**Điều tra:**
\`\`\`bash
# Lấy trace khi ANR xảy ra
adb pull /data/anr/traces.txt
# hoặc
adb bugreport bug.zip
\`\`\`
Trong trace, tìm thread \`"main"\` và đọc stack trên cùng: nó cho biết main thread đang chờ gì. Nếu thấy \`- waiting to lock <0x...> held by thread N\` → đi tìm thread N để biết ai giữ lock.

**Trong production:** Play Console → Android vitals cho ANR rate (ngưỡng "bad behaviour" là **0.47%** ANR per user per day — vượt sẽ bị giảm khả năng hiển thị trên Play Store). Firebase Crashlytics cũng thu ANR từ Android 11+ qua \`ApplicationExitInfo\`.

**Phòng ngừa chủ động:**
- \`StrictMode\` trong debug build: crash ngay khi có disk/network trên main thread.
- Room/Retrofit dùng \`suspend\` — compiler bắt lỗi thay bạn.
- \`Dispatchers.IO\` cho mọi I/O, và **không bao giờ** \`runBlocking\` trong code UI.`,
    code: [
      {
        lang: 'kotlin',
        caption: 'StrictMode: bắt vi phạm main thread ngay lúc dev',
        source: `override fun onCreate() {
    super.onCreate()
    if (BuildConfig.DEBUG) {
        StrictMode.setThreadPolicy(
            StrictMode.ThreadPolicy.Builder()
                .detectDiskReads()
                .detectDiskWrites()
                .detectNetwork()
                .detectCustomSlowCalls()
                .penaltyLog()
                .penaltyDeath()     // crash ngay -> không thể bỏ qua
                .build()
        )
        StrictMode.setVmPolicy(
            StrictMode.VmPolicy.Builder()
                .detectLeakedClosableObjects()
                .detectActivityLeaks()
                .penaltyLog()
                .build()
        )
    }
}`,
      },
    ],
    pitfalls: [
      'Nghĩ "app không crash nên không sao" — ANR làm tệ chỉ số Play Store và bị user uninstall nhiều hơn crash.',
      '`runBlocking` để "lấy nhanh một giá trị" trong Activity.',
      'Đọc `SharedPreferences` lần đầu trên main thread — lần `getSharedPreferences` đầu tiên đọc cả file XML đồng bộ.',
      'Không bật StrictMode nên vi phạm chỉ lộ ra trên máy yếu của user.',
    ],
    followUps: [
      '`ApplicationExitInfo` cho biết gì?',
      'Vì sao `commit()` của SharedPreferences nguy hiểm hơn `apply()`?',
      'ANR rate bao nhiêu thì Google cảnh báo?',
    ],
  },
  {
    id: 'jank-frame',
    groupId: 'and-perf',
    title: 'Jank frame là gì? Làm sao tìm và sửa?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Jank là frame bị **vẽ trễ hơn deadline** — ở 60 Hz bạn có 16.6 ms mỗi frame, 120 Hz chỉ còn 8.3 ms. Vượt quá là frame bị drop, user thấy giật. Nguyên nhân chính: làm việc nặng trong `onDraw`/`onBindViewHolder`/`build()`, layout quá sâu, overdraw, allocation gây GC, và I/O trên main thread. Đo bằng **Macrobenchmark**, **Perfetto**, và `FrameMetrics` trong production.',
    deep: `**Ngân sách một frame** (60 Hz = 16.6 ms) phải gồm cả: xử lý input → animation → measure → layout → draw → RenderThread → GPU. Nên phần logic của bạn thực tế chỉ nên chiếm **< 8 ms**.

**Nguồn jank theo tần suất:**

| Nguyên nhân | Dấu hiệu | Cách sửa |
|---|---|---|
| Allocation trong hot path | GC log liên tục | Cấp phát lại dùng object; xem câu về GC |
| \`onBindViewHolder\` nặng | Giật khi scroll | Bỏ logic tính toán ra khỏi bind; tính sẵn trong ViewModel |
| Layout lồng sâu | \`measure\` chiếm nhiều ms | \`ConstraintLayout\` phẳng, bỏ \`RelativeLayout\` lồng nhau |
| Overdraw | Vẽ nhiều lớp cùng vùng | Bỏ background trùng, dùng Developer options → Debug GPU overdraw |
| Bitmap decode trên main | Giật khi ảnh xuất hiện | Coil/Glide (decode off-thread + downsample) |
| I/O main thread | Giật ngẫu nhiên | StrictMode + \`Dispatchers.IO\` |
| Compose recomposition thừa | Recomposition count cao | \`key\`, \`remember\`, tham số stable, \`derivedStateOf\` |

**Đo lường — theo thứ tự nên dùng:**
1. **Macrobenchmark** (\`FrameTimingMetric\`) trong CI: có số liệu khách quan cho scroll, có thể đặt ngưỡng chặn PR làm chậm app.
2. **Perfetto / Android Studio Profiler**: xem timeline từng frame, biết chính xác ms nằm ở đâu.
3. **\`JankStats\`** (androidx): thu jank **trên máy user thật** kèm state của UI lúc đó — cực hữu ích vì máy dev luôn nhanh hơn máy user.
4. **Play Console → Android vitals**: "Excessive frozen frames" (> 700 ms) và "slow frames".

**Baseline Profile** cũng giảm jank ở lần scroll đầu tiên (JIT chưa warm), không chỉ giảm startup.`,
    code: [
      {
        lang: 'kotlin',
        caption: 'JankStats: thu jank từ user thật',
        source: `class MainActivity : AppCompatActivity() {
    private lateinit var jankStats: JankStats

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        jankStats = JankStats.createAndTrack(window) { frameData ->
            if (frameData.isJank) {
                analytics.log("jank", mapOf(
                    "durationMs" to frameData.frameDurationUiNanos / 1_000_000,
                    "states" to frameData.states.joinToString { "\${it.key}=\${it.value}" },
                ))
            }
        }
    }

    override fun onResume() { super.onResume(); jankStats.isTrackingEnabled = true }
    override fun onPause() { super.onPause(); jankStats.isTrackingEnabled = false }
}`,
      },
    ],
    pitfalls: [
      'Test hiệu năng trên máy flagship — user của bạn dùng máy 2 GB RAM. Luôn đo trên máy thấp cấp.',
      'Đo trên **debug build**: Compose debug không tối ưu recomposition, Kotlin debug không inline → số liệu vô nghĩa. Luôn benchmark trên release.',
      'Chỉ nhìn FPS trung bình. Phải nhìn **P90/P99** — một frame 500 ms mới là thứ user nhớ.',
      'Tối ưu mò mà không profile trước.',
    ],
    followUps: [
      '`FrameTimingMetric` đo P50/P90/P99 thế nào?',
      'Overdraw phát hiện bằng gì?',
      'Trong Compose, tìm recomposition thừa bằng cách nào? (Layout Inspector, compose compiler metrics)',
    ],
  },
  {
    id: '16kb-page-size',
    groupId: 'and-perf',
    title: '16 KB page size là gì và ảnh hưởng app của bạn thế nào?',
    levels: ['senior'],
    source: 'pdf',
    short:
      'Android trước đây giả định page size của kernel là **4 KB**. Thiết bị Android 15+ (bắt buộc với thiết bị mới ra từ Android 16) chuyển sang **16 KB** để tăng hiệu năng (ít TLB miss, khởi động nhanh hơn ~3–8%). Ảnh hưởng: **native library (.so) phải được align 16 KB**, nếu không app **không load được** trên các thiết bị đó. Code Kotlin/Java thuần không bị ảnh hưởng.',
    deep: `**Ai bị ảnh hưởng:** app có **native code** — trực tiếp (NDK, C++) hoặc gián tiếp qua thư viện: Flutter, React Native, SQLCipher, Realm, ffmpeg, ML Kit, OpenCV, một số SDK quảng cáo/thanh toán. Nếu app của bạn chỉ Kotlin/Java thuần thì không cần làm gì.

**Google Play yêu cầu:** app target Android 15+ nộp lên Play từ **1/11/2025** phải tương thích 16 KB.

**Kiểm tra:**
\`\`\`bash
# Cách nhanh: script chính thức của Google
python3 check_elf_alignment.py app-release.apk

# Cách thủ công cho từng .so
unzip -o app-release.apk -d out/
for so in out/lib/arm64-v8a/*.so; do
  objdump -p "\$so" | grep -A1 LOAD | head -4    # align phải >= 2**14
done
\`\`\`

**Sửa:**
1. **AGP 8.5.1+ / NDK r28+** — cách dễ nhất, chỉ cần nâng version rồi build lại.
2. Nếu NDK cũ, thêm linker flag:
\`\`\`text
-Wl,-z,max-page-size=16384
\`\`\`
3. Bật \`useLegacyPackaging = false\` để .so được nén/align theo cách mới.
4. Nâng **mọi dependency có native code** — thường đây mới là phần mất thời gian, vì bạn phải chờ upstream.
5. Nếu code C++ của bạn **hardcode 4096** hoặc dùng \`getpagesize()\` với giả định 4 KB → phải sửa (dùng \`sysconf(_SC_PAGESIZE)\`).

**Test:** dùng emulator system image "16 KB page size" trong Android Studio, hoặc thiết bị Pixel với developer option bật chế độ 16 KB.`,
    code: [
      {
        lang: 'gradle',
        caption: 'build.gradle.kts — cấu hình cần thiết',
        source: `android {
    ndkVersion = "28.0.12433566"       // r28+ mặc định align 16 KB

    packaging {
        jniLibs {
            useLegacyPackaging = false  // cần thiết cho 16 KB alignment
        }
    }

    defaultConfig {
        externalNativeBuild {
            cmake {
                // Chỉ cần nếu dùng NDK cũ hơn r28
                arguments += "-DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON"
            }
        }
    }
}`,
      },
    ],
    pitfalls: [
      'Chỉ align .so của mình mà quên .so trong dependency (Flutter engine, Realm, SDK bên thứ ba).',
      'Nghĩ app Kotlin thuần cũng phải sửa — không cần, trừ khi có dependency mang native.',
      'Test trên emulator 4 KB rồi kết luận đã ổn.',
      'Không biết deadline của Play (11/2025) → app mới không nộp được.',
    ],
    followUps: ['Vì sao 16 KB page nhanh hơn 4 KB?', 'App bundle có tự xử lý được không?', 'Flutter version nào đã hỗ trợ?'],
  },
  {
    id: 'giam-size-app',
    groupId: 'and-perf',
    title: 'Làm sao giảm size app? Ưu tiên từ đâu?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Theo thứ tự hiệu quả: (1) **Android App Bundle** — Play tự tách theo ABI/density/language, thường giảm 20–35% ngay; (2) **R8 + `shrinkResources`**; (3) **ảnh**: WebP/AVIF, vector drawable thay PNG nhiều density; (4) **cắt dependency** không dùng; (5) **Play Feature Delivery** cho phần ít dùng. Luôn đo bằng **APK Analyzer** trước khi tối ưu.',
    deep: `**Đo trước đã:** Android Studio → Build → Analyze APK. Nó cho biết phần nào chiếm chỗ: \`lib/\` (native), \`res/\`, \`assets/\`, \`classes.dex\`.

| Việc | Mức giảm điển hình | Ghi chú |
|---|---|---|
| AAB thay APK | 20–35% | Không phải làm gì thêm, Play tách sẵn |
| \`isMinifyEnabled\` + \`isShrinkResources\` | 10–25% dex + res | Bắt buộc test kỹ reflection |
| PNG → WebP (lossless) | 20–30% phần ảnh | Studio convert trực tiếp |
| Vector drawable | Rất nhiều nếu đang có 5 density | Chỉ cho icon đơn giản |
| Bỏ dependency thừa | Tuỳ | \`gradle :app:dependencies\` để soi |
| \`resConfigs\` giới hạn ngôn ngữ | 1–3 MB | Chỉ khi không dùng AAB |
| Play Feature Delivery (on-demand module) | Lớn | Cho phần dùng ít (scan QR, AR) |
| Play Asset Delivery | Lớn | Cho game/asset nặng |

**Nhìn vào những chỗ ít ai kiểm tra:**
- **Native lib**: một ABI của ffmpeg có thể 8 MB. AAB đã tách theo ABI, nhưng đừng đóng gói \`armeabi-v7a\` nếu đã bỏ hỗ trợ máy 32-bit.
- **Font**: một file font variable thay cho 6 file static; hoặc dùng downloadable fonts.
- **Thư viện quá to cho một tính năng nhỏ**: kéo cả Firebase BOM chỉ để dùng Analytics; dùng Guava thay vì vài hàm tự viết.
- **Debug symbol trong .so**: \`strip\` hoặc dùng \`android.buildTypes.release.ndk.debugSymbolLevel = "SYMBOL_TABLE"\` (upload symbol riêng cho Play).
- **BuildConfig/generated code** từ annotation processor: dùng KSP thay KAPT (nhanh hơn, ít code sinh dư).

**Cách nói ăn điểm:** kể một con số thật. "APK 42 MB → 26 MB: chuyển sang AAB (-9 MB), R8 full mode + shrinkResources (-4 MB), chuyển 180 file PNG sang WebP (-3 MB)."`,
    code: [
      {
        lang: 'gradle',
        caption: 'Cấu hình release tối thiểu nên có',
        source: `android {
    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true          // cần isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
            ndk { debugSymbolLevel = "SYMBOL_TABLE" }
        }
    }
    // R8 full mode (mặc định từ AGP 8) — tối ưu mạnh hơn, phải test reflection
    bundle {
        language { enableSplit = true }
        density  { enableSplit = true }
        abi      { enableSplit = true }
    }
}`,
      },
    ],
    pitfalls: [
      'Bật `shrinkResources` mà không có `keep` rule cho resource truy cập bằng tên (`getIdentifier`) → crash lúc runtime.',
      'R8 xoá class dùng qua reflection (Gson/Moshi model, Room entity) → thêm `@Keep` hoặc rule tương ứng.',
      'Tối ưu mò không đo trước → mất một tuần cắt 200 KB trong khi `lib/` chiếm 15 MB.',
      'Quên giữ `mapping.txt` khi bật minify → crash report không đọc được.',
    ],
    followUps: [
      'R8 full mode phá gì so với legacy?',
      'Play Feature Delivery hoạt động thế nào?',
      'Đo size ảnh hưởng tới tỉ lệ cài đặt thế nào?',
    ],
  },
]
