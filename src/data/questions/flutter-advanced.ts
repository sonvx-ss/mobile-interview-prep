import type { Question } from '../types'

export const FLUTTER_ADVANCED_QUESTIONS: Question[] = [
  // ============ flu-state ============
  {
    id: 'flutter-state-management-tong-quan',
    groupId: 'flu-state',
    title: 'Các giải pháp state management trong Flutter: chọn thế nào?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Thang đo từ đơn giản đến đầy đủ: **`setState`** (state cục bộ một widget) → **`InheritedWidget`/`Provider`** (chia sẻ xuống cây) → **Riverpod** (Provider không cần `BuildContext`, compile-safe) → **Bloc/Cubit** (event → state tường minh, dễ audit). Tiêu chí chọn thật: **quy mô team, khả năng test, và mức độ cần truy vết thay đổi state**, không phải "cái nào hot nhất".',
    deep: `| Giải pháp | Boilerplate | Test | Điểm mạnh | Điểm yếu |
|---|---|---|---|---|
| \`setState\` | Rất ít | Khó | Đơn giản, đủ cho state UI cục bộ | Không chia sẻ được, logic lẫn vào UI |
| \`InheritedWidget\` | Nhiều | Trung bình | Nền tảng của mọi thứ khác | Thủ công, ít ai viết tay |
| Provider | Ít | Tốt | Đơn giản, phổ biến, official-ish | Phụ thuộc \`BuildContext\`, lỗi runtime khi thiếu provider |
| **Riverpod** | Ít | **Rất tốt** | Không cần context, **compile-safe**, auto-dispose, dễ combine | Khái niệm mới cần học |
| **Bloc/Cubit** | Nhiều | **Rất tốt** | Event/state tường minh, dễ log & debug, quy ước rõ cho team lớn | Nhiều file, verbose |
| GetX | Rất ít | Kém | Viết cực nhanh | Gộp DI+routing+state, khó test, ít tách biệt |

**Cách trả lời gây ấn tượng:** không nói "X tốt nhất", mà nói theo bối cảnh:
- **Team lớn, app nhiều luồng nghiệp vụ, cần audit** → Bloc. Vì mỗi thay đổi state có một event tường minh, log được, và quy ước rõ ràng khiến 10 dev viết ra code giống nhau.
- **Team nhỏ/vừa, muốn ít boilerplate mà vẫn test tốt** → Riverpod.
- **State chỉ của một widget** (mở/đóng, focus, controller) → \`setState\`, đừng đưa lên global.

**Nguyên tắc chung quan trọng hơn cả việc chọn thư viện:**
1. State **cục bộ UI** ở lại widget; state **nghiệp vụ** lên state manager.
2. State manager **không biết** về widget — không import \`material.dart\` trong bloc/notifier.
3. Một **nguồn sự thật duy nhất** cho mỗi dữ liệu (thường là repository).
4. State nên là **immutable** và dùng sealed class/freezed để mô tả các trạng thái hợp lệ.

**Về GetX:** nếu được hỏi, nói thẳng đánh đổi: viết nhanh nhưng gộp quá nhiều trách nhiệm (DI + routing + state + utils), dùng service locator toàn cục nên khó test và khó biết dependency, và cộng đồng Flutter core không khuyến nghị. Không nên chê một chiều — nó hợp với prototype và team rất nhỏ.`,
    pitfalls: [
      'Đưa mọi state (kể cả trạng thái mở/đóng của một dropdown) lên global store → phức tạp vô ích.',
      'Nói "X tốt nhất" mà không nêu tiêu chí và bối cảnh.',
      'Để state manager import `flutter/material.dart` → không test được trên Dart VM thuần.',
      'Dùng hai giải pháp song song trong cùng codebase mà không có ranh giới rõ.',
    ],
    followUps: ['Riverpod vs Bloc — bạn chọn gì cho app 20 màn hình?', 'InheritedWidget hoạt động thế nào bên dưới?', 'Vì sao immutable state quan trọng?'],
  },
  {
    id: 'bloc-vs-cubit',
    groupId: 'flu-state',
    title: 'Bloc và Cubit khác nhau thế nào? Tại sao dùng Bloc?',
    levels: ['mid'],
    source: 'pdf',
    short:
      '**Cubit** phơi ra **method** (`increment()`) và `emit(state)` trực tiếp — ít boilerplate. **Bloc** nhận **Event** object và map event → state qua `on<Event>` — nhiều code hơn nhưng có **lịch sử event tường minh** (log được, replay được, dùng được các transformer như `debounce`/`throttle`). Dùng Bloc khi cần truy vết/kiểm soát luồng event; Cubit khi luồng đơn giản.',
    deep: `\`\`\`dart
// CUBIT: gọn, phù hợp phần lớn trường hợp
class CounterCubit extends Cubit<int> {
  CounterCubit() : super(0);
  void increment() => emit(state + 1);
}

// BLOC: event tường minh
sealed class SearchEvent {}
final class QueryChanged extends SearchEvent {
  const QueryChanged(this.query);
  final String query;
}

class SearchBloc extends Bloc<SearchEvent, SearchState> {
  SearchBloc(this._repo) : super(const SearchState.initial()) {
    on<QueryChanged>(
      _onQueryChanged,
      // Transformer: chỉ Bloc làm được — debounce + cancel request cũ
      transformer: (events, mapper) =>
          events.debounceTime(const Duration(milliseconds: 300)).switchMap(mapper),
    );
  }

  final SearchRepository _repo;

  Future<void> _onQueryChanged(QueryChanged e, Emitter<SearchState> emit) async {
    if (e.query.length < 2) return emit(const SearchState.initial());
    emit(const SearchState.loading());
    try {
      emit(SearchState.success(await _repo.search(e.query)));
    } catch (err) {
      emit(SearchState.error(err.toString()));
    }
  }
}
\`\`\`

**Lợi ích thực tế của Bloc mà Cubit không có:**
1. **Event transformer** — \`debounce\`, \`throttle\`, \`switchMap\` (cancel cái trước), \`sequential\` (xử lý tuần tự). Đây là lý do mạnh nhất để chọn Bloc cho search/infinite scroll.
2. **\`BlocObserver\` toàn cục** — log mọi event và mọi transition ở một chỗ, cực hữu ích để debug và gửi breadcrumb lên Crashlytics.
3. **Có thể tái hiện bug**: từ log event bạn dựng lại đúng chuỗi user đã làm.

\`\`\`dart
class AppBlocObserver extends BlocObserver {
  @override
  void onTransition(Bloc bloc, Transition transition) {
    super.onTransition(bloc, transition);
    logger.d('\${bloc.runtimeType}: \${transition.event} -> \${transition.nextState}');
  }
  @override
  void onError(BlocBase bloc, Object error, StackTrace st) {
    Crashlytics.recordError(error, st, reason: '\${bloc.runtimeType}');
    super.onError(bloc, error, st);
  }
}
\`\`\`

**\`BlocBuilder\` vs \`BlocListener\` vs \`BlocConsumer\` vs \`BlocSelector\`:**
| Widget | Dùng cho |
|---|---|
| \`BlocBuilder\` | Vẽ UI theo state |
| \`BlocListener\` | Side-effect một lần: navigate, snackbar, dialog |
| \`BlocConsumer\` | Cả hai |
| \`BlocSelector\` | Chỉ rebuild khi **một phần** state đổi (tối ưu) |

Quy tắc quan trọng: **navigate/snackbar phải ở \`BlocListener\`**, không ở \`BlocBuilder\` — vì builder có thể chạy lại nhiều lần và bạn sẽ navigate hai lần.

**Testing với \`bloc_test\`** rất gọn:
\`\`\`dart
blocTest<CounterCubit, int>(
  'tang len 1',
  build: () => CounterCubit(),
  act: (cubit) => cubit.increment(),
  expect: () => [1],
);
\`\`\``,
    pitfalls: [
      'Gọi `Navigator`/`showSnackBar` trong `BlocBuilder` → chạy nhiều lần, navigate trùng. Dùng `BlocListener`.',
      'Emit state mutable (cùng instance đã sửa) → Bloc so sánh `==` thấy giống → **UI không cập nhật**. Dùng `copyWith`/freezed.',
      'Một Bloc khổng lồ cho cả app → dùng Bloc theo feature.',
      'Dùng `Bloc` với event cho mọi thứ kể cả `increment()` → boilerplate vô ích, dùng Cubit.',
      'Quên `close()` bloc (thường `BlocProvider` tự lo, nhưng bloc tạo tay thì phải tự close).',
    ],
    followUps: ['Event transformer nào dùng cho infinite scroll?', 'Vì sao state phải immutable trong Bloc?', '`BlocSelector` tối ưu gì?'],
  },
  {
    id: 'riverpod-vs-provider',
    groupId: 'flu-state',
    title: 'Riverpod khác Provider và Bloc thế nào?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Riverpod là bản viết lại của Provider bởi cùng tác giả, sửa ba vấn đề: (1) **không cần `BuildContext`** — đọc provider ở đâu cũng được, kể cả trong provider khác; (2) **compile-safe** — không còn `ProviderNotFoundException` lúc runtime; (3) **auto-dispose** và **combine provider** dễ dàng. So với Bloc: ít boilerplate hơn nhiều, nhưng không có lịch sử event tường minh.',
    deep: `\`\`\`dart
// Provider (cũ): phụ thuộc context, thiếu provider -> crash lúc runtime
final repo = Provider.of<UserRepository>(context);

// Riverpod: provider là biến global type-safe -> thiếu là lỗi COMPILE
final userRepositoryProvider = Provider<UserRepository>((ref) {
  return UserRepositoryImpl(ref.watch(apiClientProvider));   // combine dễ dàng
});

final userProvider = FutureProvider.family<User, String>((ref, id) async {
  return ref.watch(userRepositoryProvider).getUser(id);
});

// Trong widget
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(userProvider(id));
    return user.when(
      loading: () => const CircularProgressIndicator(),
      error: (e, _) => Text('Lỗi: \$e'),
      data: (u) => Text(u.name),
    );
  }
}
\`\`\`

**Các loại provider và khi nào dùng:**
| Loại | Dùng cho |
|---|---|
| \`Provider\` | Giá trị/dependency không đổi (repository, api client) |
| \`FutureProvider\` | Dữ liệu async một lần (kèm \`AsyncValue\` có loading/error sẵn) |
| \`StreamProvider\` | Nguồn stream (Firestore, socket) |
| \`NotifierProvider\` / \`AsyncNotifierProvider\` | State có logic (thay cho \`StateNotifier\` cũ) |

**Ba tính năng đáng nói nhất:**
1. **\`AsyncValue\`** — bao gói loading/data/error sẵn, khỏi phải tự viết sealed state cho mọi màn hình. Tiết kiệm rất nhiều boilerplate so với Bloc.
2. **\`autoDispose\`** — provider tự huỷ khi không còn ai watch → không leak, không giữ dữ liệu cũ. Kèm \`ref.keepAlive()\` khi muốn giữ cache.
3. **\`family\`** — provider có tham số (\`userProvider(id)\`), mỗi tham số một instance.
4. **Override trong test** cực gọn:
\`\`\`dart
testWidgets('hien thi ten user', (tester) async {
  await tester.pumpWidget(ProviderScope(
    overrides: [userRepositoryProvider.overrideWithValue(FakeUserRepository())],
    child: const MyApp(),
  ));
});
\`\`\`

**Riverpod vs Bloc — nói theo tiêu chí:**
| | Riverpod | Bloc |
|---|---|---|
| Boilerplate | Ít | Nhiều |
| Truy vết state change | Qua \`ProviderObserver\` (được, nhưng không có event) | **Event tường minh**, log/replay tốt hơn |
| DI | Tích hợp sẵn | Cần \`get_it\`/\`provider\` riêng |
| Async caching | Sẵn (\`AsyncValue\`, \`autoDispose\`, \`family\`) | Tự làm |
| Quy ước cho team lớn | Lỏng hơn | **Chặt**, 10 dev viết giống nhau |

**riverpod_generator** (\`@riverpod\`) giảm thêm boilerplate và bắt lỗi tốt hơn — nên dùng cho dự án mới.`,
    pitfalls: [
      'Dùng `ref.watch` trong callback (onPressed) → nên là `ref.read`.',
      '`ref.read` trong `build` → không rebuild khi giá trị đổi.',
      'Quên `ProviderScope` ở root → provider không hoạt động.',
      'Dùng `autoDispose` cho state cần giữ khi chuyển tab → mất dữ liệu; cần `ref.keepAlive()`.',
      'Tạo provider bên trong `build` → instance mới mỗi lần rebuild.',
    ],
    followUps: ['`AsyncValue` xử lý loading/error thế nào?', '`family` + `autoDispose` kết hợp ra sao?', '`ref.listen` khác `ref.watch`?'],
  },
  {
    id: 'inherited-widget',
    groupId: 'flu-state',
    title: '`InheritedWidget` hoạt động thế nào? Nó là nền của cái gì?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      '`InheritedWidget` cho phép widget con **truy cập dữ liệu của ancestor trong O(1)** thay vì truyền tham số qua từng tầng. Element tree lưu một map từ type → element của InheritedWidget, nên `context.dependOnInheritedWidgetOfExactType()` là tra bảng, không phải đi bộ lên cây. Nó là nền của `Theme`, `MediaQuery`, `Navigator`, `Provider`, và cả `Riverpod`.',
    deep: `\`\`\`dart
class AppConfig extends InheritedWidget {
  const AppConfig({super.key, required this.apiUrl, required super.child});
  final String apiUrl;

  static AppConfig of(BuildContext context) {
    final result = context.dependOnInheritedWidgetOfExactType<AppConfig>();
    assert(result != null, 'Thiếu AppConfig trong cây widget');
    return result!;
  }

  // Quyết định widget nào ĐANG PHỤ THUỘC có cần rebuild không
  @override
  bool updateShouldNotify(AppConfig old) => apiUrl != old.apiUrl;
}
\`\`\`

**Hai method truy cập, khác nhau rất quan trọng:**
| Method | Đăng ký dependency | Hệ quả |
|---|---|---|
| \`dependOnInheritedWidgetOfExactType\` | **Có** | Widget rebuild khi \`updateShouldNotify\` true |
| \`getInheritedWidgetOfExactType\` | Không | Chỉ đọc một lần, không rebuild |

Tương ứng trong Provider là \`context.watch\` (có dependency) và \`context.read\` (không).

**\`updateShouldNotify\` là điểm tối ưu quan trọng:** nếu bạn trả \`true\` luôn, mọi widget phụ thuộc rebuild mỗi lần InheritedWidget rebuild. So sánh đúng field mới là cách giảm rebuild.

**Vấn đề của InheritedWidget thuần và cách các lib giải quyết:**
1. **Rebuild tất cả hay không rebuild gì** — không chọn được "chỉ rebuild khi field X đổi". \`InheritedModel\` giải quyết bằng "aspect"; Provider giải quyết bằng \`Selector\`; Riverpod bằng \`select\`.
2. **Không có lifecycle/dispose** — muốn giữ state có logic phải bọc thêm \`StatefulWidget\`. Đó chính là \`ChangeNotifierProvider\`.
3. **Boilerplate** — vì thế gần như không ai viết tay trong app thật; nhưng **hiểu nó là bắt buộc** để giải thích được vì sao \`Theme.of(context)\` nhanh và vì sao \`context\` quan trọng.

**Vì sao câu này hay được hỏi:** nó phân biệt người *dùng* Provider với người *hiểu* Flutter. Trả lời được "Element tree giữ map type→element nên tra là O(1)" là dấu hiệu rõ của mid/senior.`,
    pitfalls: [
      'Trả `true` vô điều kiện trong `updateShouldNotify` → rebuild thừa.',
      'Nghĩ `.of(context)` đi bộ lên cây mỗi lần (nó là tra map O(1)).',
      'Gọi `dependOnInheritedWidgetOfExactType` trong `initState` → chưa có dependency, dùng `didChangeDependencies`.',
      'Viết InheritedWidget tay cho state có logic thay vì dùng Provider/Riverpod.',
    ],
    followUps: ['`InheritedModel` giải quyết gì?', '`Selector` của Provider hoạt động thế nào?', 'Vì sao `Theme.of(context)` rẻ?'],
  },

  // ============ flu-bridge ============
  {
    id: 'method-channel-event-channel',
    groupId: 'flu-bridge',
    title: '`MethodChannel` và `EventChannel` khác nhau thế nào? Có gì tốt hơn?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      '**`MethodChannel`**: gọi một lần, có kết quả trả về — như một RPC (Flutter gọi native, hoặc native gọi Flutter). **`EventChannel`**: native **phát nhiều event** về Flutter dưới dạng Stream — dùng cho sensor, GPS, kết nối bluetooth. **`Pigeon`** (code-gen, type-safe) nên dùng thay MethodChannel viết tay; **FFI** cho C/C++ hiệu năng cao.',
    deep: `\`\`\`dart
// MethodChannel: request-response
const _channel = MethodChannel('com.example/battery');

Future<int> getBatteryLevel() async {
  try {
    return await _channel.invokeMethod<int>('getBatteryLevel') ?? -1;
  } on PlatformException catch (e) {
    logger.e('Lỗi native: \${e.code} \${e.message}');
    return -1;
  } on MissingPluginException {
    return -1;                       // chưa implement trên nền tảng này
  }
}

// EventChannel: stream liên tục
const _events = EventChannel('com.example/battery_stream');
Stream<int> get batteryStream => _events.receiveBroadcastStream().cast<int>();
\`\`\`

\`\`\`kotlin
// Android side
class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(engine: FlutterEngine) {
        super.configureFlutterEngine(engine)
        MethodChannel(engine.dartExecutor.binaryMessenger, "com.example/battery")
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "getBatteryLevel" -> {
                        val level = getBatteryLevel()
                        if (level >= 0) result.success(level)
                        else result.error("UNAVAILABLE", "Không đọc được pin", null)
                    }
                    else -> result.notImplemented()
                }
            }
    }
}
\`\`\`

**Ba điều bắt buộc phải nhớ:**
1. **Channel là async** và message được **serialize** (\`StandardMessageCodec\`) — chỉ truyền được kiểu cơ bản, \`List\`, \`Map\`, \`Uint8List\`. Object phức tạp phải tự map sang Map.
2. **Handler chạy trên platform main thread** (Android main thread) → làm việc nặng trong đó gây ANR. Phải chuyển sang coroutine/background rồi mới \`result.success\`.
3. **\`result.success/error\` chỉ được gọi ĐÚNG MỘT LẦN**, và **phải trên main thread** ở Android — gọi từ background thread là crash. Dùng \`Handler(Looper.getMainLooper()).post { result.success(...) }\` hoặc \`withContext(Dispatchers.Main)\`.

**Vì sao nên dùng Pigeon:**
| | MethodChannel tay | Pigeon |
|---|---|---|
| Tên method | String — sai là lỗi runtime | Sinh code, sai là lỗi compile |
| Kiểu dữ liệu | Tự cast \`Map\` | Class type-safe cả hai bên |
| Boilerplate | Nhiều | Sinh tự động |
| Refactor | Rủi ro | An toàn |

\`\`\`dart
// pigeons/battery_api.dart -> sinh code Dart + Kotlin + Swift
@HostApi()
abstract class BatteryApi {
  int getBatteryLevel();
  BatteryInfo getInfo();
}
\`\`\`

**FFI (\`dart:ffi\`)** khi cần gọi C/C++ với hiệu năng cao (mã hoá, xử lý ảnh, thư viện có sẵn) — **không qua channel, không serialize**, gọi trực tiếp. Nhanh hơn nhiều nhưng phải tự quản bộ nhớ.

**Cách chọn:** platform API thông thường → Pigeon. Stream sự kiện → EventChannel. Thư viện C/C++ hoặc hot path → FFI.`,
    pitfalls: [
      'Gọi `result.success` từ background thread trên Android → crash.',
      'Gọi `result` hai lần cho cùng một call → crash.',
      'Làm việc nặng trong `setMethodCallHandler` → ANR.',
      'Không bắt `MissingPluginException` → crash trên nền tảng chưa implement (hoặc sau hot restart).',
      'Truyền object lớn qua channel mỗi frame → chi phí serialize.',
    ],
    followUps: ['Pigeon sinh ra những gì?', '`BasicMessageChannel` dùng khi nào?', 'FFI khác channel về hiệu năng ra sao?'],
  },
  {
    id: 'flutter-native-shared-storage',
    groupId: 'flu-bridge',
    title: 'Chia sẻ dữ liệu giữa Flutter và native (SharedPreferences, khi add-to-app)?',
    levels: ['senior'],
    source: 'pdf',
    short:
      '`shared_preferences` của Flutter **thêm tiền tố `flutter.`** vào mọi key khi lưu xuống `SharedPreferences`/`UserDefaults` — nên native đọc key `token` sẽ không thấy gì, phải đọc `flutter.token`. Với dữ liệu quan trọng nên tránh phụ thuộc chi tiết cài đặt này: dùng `MethodChannel`/Pigeon làm hợp đồng rõ ràng, hoặc một storage layer thống nhất.',
    deep: `**Chi tiết cài đặt (đúng nhưng mong manh):**
\`\`\`dart
await prefs.setString('token', 'abc');   // Flutter
\`\`\`
\`\`\`kotlin
// Android đọc được, nhưng phải đúng tên file và tiền tố
val prefs = context.getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
val token = prefs.getString("flutter.token", null)
\`\`\`
\`\`\`swift
// iOS
let token = UserDefaults.standard.string(forKey: "flutter.token")
\`\`\`

**Vì sao không nên dựa vào nó:** tiền tố và tên file là **chi tiết cài đặt của plugin**, có thể đổi giữa các version (và đã từng gây vỡ khi \`shared_preferences\` đổi sang \`SharedPreferencesAsync\`/DataStore backend). Nếu native và Flutter đều phải đọc, hãy làm hợp đồng tường minh.

**Ba cách đúng hơn, theo mức độ nghiêm túc:**

1. **Pigeon/MethodChannel làm API** — native là chủ dữ liệu, Flutter gọi để lấy:
\`\`\`dart
@HostApi()
abstract class SessionApi {
  String? getAccessToken();
  void setAccessToken(String? token);
}
\`\`\`
Ưu điểm: một nguồn sự thật, đổi cài đặt bên native không ảnh hưởng Flutter.

2. **Một storage layer chung dùng key thống nhất**: viết plugin nội bộ đọc/ghi cùng file với cùng quy ước key cho cả ba bên.

3. **Với dữ liệu nhạy cảm** (token): **không** dùng SharedPreferences ở cả hai bên. Dùng \`flutter_secure_storage\` (nó bọc Keystore/Keychain) và phơi ra cho native qua channel — hoặc để native quản Keychain/Keystore rồi Flutter gọi lấy.

**Bối cảnh add-to-app (Flutter làm một phần trong app native):** đây là nơi câu hỏi này thực sự phát sinh. Những điểm phải xử lý:
- **Ai là chủ của session/auth?** Thường là native (vì nó khởi động trước). Flutter lấy qua channel lúc init.
- **Điều hướng**: Flutter không nên tự \`Navigator.pop\` ra khỏi module; phát event cho native để native đóng \`FlutterActivity\`/\`FlutterViewController\`.
- **FlutterEngine caching** (\`FlutterEngineGroup\`) để không trả phí khởi động engine mỗi lần mở màn hình Flutter.
- **Deep link**: native nhận trước rồi chuyển route cho Flutter qua channel.`,
    pitfalls: [
      'Đọc key không có tiền tố `flutter.` từ native → luôn null, debug rất mất thời gian.',
      'Dựa vào tên file `FlutterSharedPreferences` như một API ổn định.',
      'Lưu token vào SharedPreferences thay vì Keystore/Keychain.',
      'Hai bên cùng **ghi** một key → race condition và dữ liệu lệch. Chỉ nên một bên là chủ.',
    ],
    followUps: ['`FlutterEngineGroup` giúp gì?', 'Add-to-app thì ai quản navigation?', '`flutter_secure_storage` lưu ở đâu trên mỗi nền tảng?'],
  },

  // ============ flu-dart ============
  {
    id: 'dart-keys',
    groupId: 'flu-dart',
    title: '`ValueKey`, `ObjectKey`, `UniqueKey`, `GlobalKey` — dùng khi nào?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Key giúp Flutter biết **widget mới tương ứng với Element/State cũ nào** khi cây thay đổi. **`ValueKey`** so theo một giá trị (id) — dùng nhiều nhất. **`ObjectKey`** so theo identity của object. **`UniqueKey`** luôn khác nhau → **buộc tạo lại** state. **`GlobalKey`** cho phép truy cập State/Element từ bất kỳ đâu và giữ state khi widget **di chuyển** trong cây — đắt, dùng ít.',
    deep: `**Vì sao cần key — ví dụ kinh điển:**
\`\`\`dart
// Không key: đổi thứ tự -> State (màu, checkbox, controller) gắn SAI item
Column(children: items.map((i) => StatefulColorBox(item: i)).toList())

// Có key: Flutter khớp theo id, State đi theo đúng item
Column(children: items.map((i) => StatefulColorBox(key: ValueKey(i.id), item: i)).toList())
\`\`\`
Nguyên nhân gốc: \`canUpdate(old, new) = runtimeType giống && key giống\`. Không key thì \`key == null\` ở cả hai → Flutter khớp **theo vị trí** → item 1 giữ State của item 2.

| Key | So sánh theo | Dùng khi |
|---|---|---|
| \`ValueKey(id)\` | \`==\` của giá trị | **Mặc định** cho list item có id ổn định |
| \`ObjectKey(obj)\` | Identity của object | Item không có id, nhưng object instance ổn định |
| \`UniqueKey()\` | Luôn khác | **Buộc** tạo lại state (reset form, replay animation) |
| \`PageStorageKey\` | Giá trị | Lưu vị trí scroll khi widget ra/vào cây |
| \`GlobalKey\` | Toàn app | Truy cập State/context từ ngoài; giữ state khi widget đổi vị trí trong cây |

**\`UniqueKey\` — dùng có chủ ý:**
\`\`\`dart
// Buộc AnimatedSwitcher coi là widget mới -> chạy animation
AnimatedSwitcher(child: Text(value, key: UniqueKey()))

// Reset toàn bộ form về trạng thái ban đầu
setState(() => _formKey = UniqueKey());
\`\`\`
Nhưng đặt \`UniqueKey\` trong \`build\` của list item là **bug hiệu năng nghiêm trọng**: mỗi rebuild sinh key mới → mọi Element bị hủy và tạo lại → mất state, mất vị trí scroll, và rất chậm.

**\`GlobalKey\` — mạnh nhưng đắt:**
\`\`\`dart
final _formKey = GlobalKey<FormState>();
final _scaffoldKey = GlobalKey<ScaffoldState>();

if (_formKey.currentState!.validate()) { /* submit */ }
\`\`\`
Chi phí: Flutter phải giữ registry toàn cục, và widget có GlobalKey không được tối ưu như widget thường. Ngoài ra hai widget cùng GlobalKey trong cây cùng lúc → **exception**. Trong hầu hết trường hợp có cách khác tốt hơn (callback, state management) — trừ \`Form\` và một số API cũ.

**\`Key\` ở đâu trong widget:** luôn là tham số đầu và truyền lên \`super\`: \`const MyWidget({super.key})\`.`,
    pitfalls: [
      '`UniqueKey()` trong `build` của item list → hủy/tạo lại toàn bộ mỗi frame.',
      'Dùng index làm `ValueKey` trong list có thể sắp xếp lại → key đổi khi reorder, vô ích. Dùng id thật.',
      'Hai widget cùng `GlobalKey` tồn tại đồng thời → exception "Duplicate GlobalKey".',
      'Lạm dụng `GlobalKey` để "gọi method của widget con" thay vì dùng callback/state management.',
      'Nghĩ key chỉ để tối ưu — nó ảnh hưởng **tính đúng đắn** của state.',
    ],
    followUps: ['`canUpdate` dùng key thế nào?', '`PageStorageKey` giữ scroll position ra sao?', 'GlobalKey giữ state khi di chuyển trong cây bằng cách nào?'],
  },
  {
    id: 'dart-mixin',
    groupId: 'flu-dart',
    title: 'Mixin trong Dart là gì? Khác `extends` và `implements` thế nào?',
    levels: ['mid'],
    source: 'pdf',
    short:
      'Mixin cho phép **tái dùng code từ nhiều nguồn** mà không cần đa kế thừa: `class A extends B with M1, M2`. `extends` = kế thừa (chỉ một, có state và constructor). `implements` = chỉ lấy hợp đồng, phải tự viết hết. `with` = **lấy cả cài đặt**, nhiều mixin được, nhưng mixin **không có constructor**.',
    deep: `| | \`extends\` | \`implements\` | \`with\` (mixin) |
|---|---|---|---|
| Số lượng | 1 | Nhiều | Nhiều |
| Lấy cài đặt | ✅ | ❌ (phải tự viết hết) | ✅ |
| Có constructor | ✅ | — | ❌ |
| Có state (field) | ✅ | ❌ | ✅ |

\`\`\`dart
mixin Loggable {
  String get logTag => runtimeType.toString();       // dùng được thành viên của class
  void log(String msg) => debugPrint('[\$logTag] \$msg');
}

mixin CacheableMixin<T> {
  final Map<String, T> _cache = {};                  // mixin CÓ state được
  T? cached(String key) => _cache[key];
  void cache(String key, T value) => _cache[key] = value;
}

class UserRepository with Loggable, CacheableMixin<User> {
  Future<User> getUser(String id) async {
    final hit = cached(id);
    if (hit != null) { log('cache hit \$id'); return hit; }
    final user = await api.getUser(id);
    cache(id, user);
    return user;
  }
}
\`\`\`

**\`on\` để giới hạn mixin chỉ dùng được với một class nhất định** — rất hữu ích:
\`\`\`dart
mixin ValidationMixin on State {           // chỉ dùng được trong State
  bool validateEmail(String v) => RegExp(r'^[^@]+@[^@]+\\.[^@]+').hasMatch(v);
  void showError(String msg) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
      // truy cập được \`context\` vì \`on State\`
}

class LoginScreenState extends State<LoginScreen> with ValidationMixin { }
\`\`\`

**Thứ tự linearization — chi tiết hay được hỏi:** mixin được áp **từ trái sang phải**, cái sau **ghi đè** cái trước:
\`\`\`dart
class A extends Base with M1, M2 { }
// Thứ tự tra method: A -> M2 -> M1 -> Base
\`\`\`
\`super\` trong mixin trỏ tới cái **bên trái** nó trong chuỗi, không phải class cha trực tiếp. Đây là cơ chế cho phép "xâu chuỗi" hành vi.

**Mixin bạn dùng hàng ngày trong Flutter:**
| Mixin | Cho gì |
|---|---|
| \`SingleTickerProviderStateMixin\` | Một \`AnimationController\` |
| \`TickerProviderStateMixin\` | Nhiều controller |
| \`AutomaticKeepAliveClientMixin\` | Giữ state của item trong \`ListView\`/\`TabBarView\` |
| \`WidgetsBindingObserver\` | Lifecycle của app |
| \`RestorationMixin\` | Khôi phục state sau khi bị OS giết |

**Dart 3:** có thêm \`mixin class\` (dùng được cả như class và mixin) và các modifier \`sealed\`/\`final\`/\`base\`/\`interface\` để kiểm soát ai được extend/implement/mix.`,
    pitfalls: [
      'Mixin không có constructor → không truyền tham số vào được; phải dùng abstract getter hoặc `on`.',
      'Lạm dụng mixin làm "túi đựng hàm tiện ích" → khó biết method đến từ đâu, xung đột tên.',
      'Không biết thứ tự linearization → override không như mong đợi.',
      'Mixin có state chung mà nhiều class dùng → tưởng chia sẻ state (không, mỗi instance có state riêng).',
    ],
    followUps: ['`mixin ... on X` giới hạn gì?', 'Linearization giải quyết diamond problem thế nào?', '`mixin class` của Dart 3?'],
  },
  {
    id: 'dart-constructors',
    groupId: 'flu-dart',
    title: 'Factory constructor, named constructor, `const` vs `final` trong Dart?',
    levels: ['junior', 'mid'],
    source: 'pdf',
    short:
      '**Named constructor** (`User.fromJson`) là constructor phụ có tên — vẫn tạo instance mới. **Factory constructor** **không bắt buộc tạo instance mới**: nó có thể trả về object từ cache, trả về subclass, hoặc trả về instance đã có (singleton). **`final`** = gán một lần, giá trị có thể tính lúc runtime. **`const`** = hằng số **compile-time**, và object `const` được **canonicalize** (cùng giá trị = cùng instance).',
    deep: `\`\`\`dart
class User {
  const User({required this.id, required this.name});          // const constructor

  // Named: luôn tạo instance mới
  User.guest() : id = 'guest', name = 'Khách';

  // Factory: kiểm soát việc trả về
  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'] as String,
        name: json['name'] as String? ?? 'Không tên',
      );

  // Factory trả về subclass tuỳ dữ liệu
  factory User.fromRole(String role) => switch (role) {
        'admin' => AdminUser(),
        'guest' => User.guest(),
        _ => const User(id: '', name: ''),
      };

  final String id;
  final String name;
}

// Singleton bằng factory
class ApiClient {
  ApiClient._internal();
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;      // gọi ApiClient() luôn trả cùng object
}
\`\`\`

**\`const\` vs \`final\` — bảng phân biệt:**
| | \`final\` | \`const\` |
|---|---|---|
| Gán lại | ❌ | ❌ |
| Biết giá trị lúc nào | Runtime | **Compile time** |
| Field của instance | ✅ | Chỉ với \`static const\` |
| Canonicalize | ❌ | ✅ (cùng giá trị = **cùng instance**) |

\`\`\`dart
final now = DateTime.now();        // OK — tính lúc runtime
const now = DateTime.now();        // LỖI — không biết lúc compile

const a = EdgeInsets.all(8);
const b = EdgeInsets.all(8);
identical(a, b);                   // true! canonicalize
\`\`\`

**Vì sao canonicalize quan trọng cho Flutter:** \`const Text('a')\` ở hai chỗ là **cùng một object** → khi Flutter so sánh widget cũ/mới thấy \`identical\` → **bỏ qua cả subtree**. Đây là cơ chế đằng sau lời khuyên "dùng const widget ở mọi nơi có thể".

**Điều kiện để một constructor được \`const\`:** mọi field phải \`final\`, và không có thân hàm (không làm gì trong constructor body). Đó là lý do model dùng cho UI nên là immutable với \`final\` hết.

**Dart 3 records** — thay thế nhẹ cho class chỉ mang dữ liệu:
\`\`\`dart
(String, int) parse(String s) => (s.split(':')[0], int.parse(s.split(':')[1]));
final (name, age) = parse('An:30');
\`\`\``,
    pitfalls: [
      'Nghĩ factory constructor bắt buộc trả instance mới.',
      'Dùng `const` cho giá trị runtime → lỗi compile.',
      'Quên rằng `const` list vẫn có thể bị mutate nếu bạn khai báo `final List` — dùng `const []` hoặc `List.unmodifiable`.',
      'Không dùng `const` constructor cho widget → mất tối ưu skip subtree.',
      'Dùng factory singleton cho state toàn cục → khó test, khó reset.',
    ],
    followUps: ['Vì sao `const` widget giúp hiệu năng?', 'Records của Dart 3 thay thế được gì?', '`late final` dùng khi nào?'],
  },
  {
    id: 'dart-extension',
    groupId: 'flu-dart',
    title: 'Extension trong Dart: dùng để làm gì và giới hạn ở đâu?',
    levels: ['mid'],
    source: 'pdf',
    short:
      'Extension thêm method/getter vào **type có sẵn mà không sửa source** — kể cả type của SDK hay thư viện. Nó được giải quyết **tĩnh** (static dispatch) tại compile time theo *kiểu khai báo*, nên **không** override được method có sẵn và **không** hoạt động với `dynamic`.',
    deep: `\`\`\`dart
extension StringX on String {
  bool get isValidEmail => RegExp(r'^[^@]+@[^@]+\\.[^@]+').hasMatch(this);
  String get capitalized => isEmpty ? this : this[0].toUpperCase() + substring(1);
}

extension ContextX on BuildContext {
  ThemeData get theme => Theme.of(this);
  Size get screenSize => MediaQuery.sizeOf(this);
  void showSnack(String msg) =>
      ScaffoldMessenger.of(this).showSnackBar(SnackBar(content: Text(msg)));
}

extension WidgetX on Widget {
  Widget paddingAll(double v) => Padding(padding: EdgeInsets.all(v), child: this);
  Widget centered() => Center(child: this);
}

// Dùng: gọn và đọc được
context.showSnack('Đã lưu');
const Text('Xin chào').paddingAll(16).centered();
\`\`\`

**Ba giới hạn phải biết:**

1. **Static dispatch — theo kiểu khai báo, không theo kiểu thực tế:**
\`\`\`dart
extension on Object { String describe() => 'object'; }
extension on String { String describe() => 'string'; }

Object o = 'abc';
o.describe();     // -> 'object' (theo kiểu khai báo Object, KHÔNG phải String)
\`\`\`

2. **Không override được thành viên có sẵn:** nếu \`String\` đã có \`length\`, extension \`length\` của bạn sẽ bị bỏ qua.

3. **Không hoạt động với \`dynamic\`** — vì cần biết kiểu lúc compile.

**Xung đột tên** khi hai extension cùng thêm method trùng: dùng tên extension để chỉ rõ, hoặc \`import ... show/hide\`:
\`\`\`dart
StringX(myString).capitalized;             // chỉ định rõ extension nào
import 'other.dart' hide OtherStringX;
\`\`\`

**Extension phải được import** mới dùng được — nó không toàn cục như bạn tưởng. Đây là điểm hay gây bối rối cho người mới.

**Dùng có chừng mực:** extension trên \`Widget\` để tạo DSL (\`.paddingAll(16).centered()\`) đọc rất gọn nhưng gây tranh cãi trong team — nó khiến khó grep và khác với cách viết Flutter thông thường. Nên thống nhất quy ước trong team trước khi rải khắp codebase.

**Dart 3 \`extension type\`** (thay cho inline class) — tạo wrapper zero-cost quanh một type, ví dụ \`extension type UserId(String value)\` để phân biệt \`UserId\` với \`String\` ở tầng kiểu mà không tốn runtime.`,
    pitfalls: [
      'Quên import file chứa extension → method "không tồn tại".',
      'Tưởng extension override được method có sẵn.',
      'Dùng extension trên `dynamic`.',
      'Rải extension trên `Widget` tạo DSL riêng khiến người mới trong team không đọc được.',
      'Nhầm extension là dynamic dispatch → hành vi bất ngờ với biến kiểu cha.',
    ],
    followUps: ['`extension type` của Dart 3?', 'Xung đột extension giải quyết thế nào?', 'Vì sao extension là static dispatch?'],
  },

  // ============ flu-architecture ============
  {
    id: 'clean-architecture-flutter',
    groupId: 'flu-architecture',
    title: 'Clean Architecture trong Flutter tổ chức thế nào? Feature-first hay layer-first?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Ba tầng: **presentation** (widget + bloc/notifier) → **domain** (entity, use case, interface repository — **Dart thuần, không import Flutter**) → **data** (implementation repository, API, DB, DTO + mapper). Cách chia thư mục nên là **feature-first** (`lib/features/cart/{presentation,domain,data}`) chứ không layer-first, vì code cùng một feature thay đổi cùng nhau.',
    deep: `\`\`\`text
lib/
├── core/                       # dùng chung: theme, network, error, extension
├── features/
│   ├── cart/
│   │   ├── domain/
│   │   │   ├── entities/cart_item.dart          # Dart thuần
│   │   │   ├── repositories/cart_repository.dart # abstract class (interface)
│   │   │   └── usecases/add_to_cart.dart
│   │   ├── data/
│   │   │   ├── models/cart_item_dto.dart        # có fromJson/toJson
│   │   │   ├── datasources/cart_remote_ds.dart
│   │   │   └── repositories/cart_repository_impl.dart
│   │   └── presentation/
│   │       ├── bloc/cart_bloc.dart
│   │       └── pages/cart_page.dart
│   └── checkout/...
└── main.dart
\`\`\`

**Vì sao feature-first thắng layer-first:** khi làm task "thêm mã giảm giá vào giỏ hàng", với feature-first bạn mở **một** thư mục; với layer-first bạn nhảy giữa \`models/\`, \`repositories/\`, \`blocs/\`, \`pages/\`. Feature-first cũng là điều kiện để sau này tách thành **package riêng** (melos monorepo) khi app lớn.

**Dependency rule:** mũi tên phụ thuộc **luôn hướng vào trong**. \`domain\` không biết gì về \`data\` và \`presentation\`; nó chỉ khai báo interface, \`data\` implement.

\`\`\`dart
// domain — Dart thuần, test được trên Dart VM, không cần Flutter
abstract class CartRepository {
  Future<Result<List<CartItem>>> getItems();
  Future<Result<void>> addItem(String productId, int qty);
}

class AddToCart {
  const AddToCart(this._repo);
  final CartRepository _repo;

  Future<Result<void>> call(String productId, int qty) {
    if (qty <= 0) return Future.value(Result.failure(InvalidQuantity()));
    return _repo.addItem(productId, qty);
  }
}
\`\`\`

**DTO vs Entity — vì sao tách:** DTO khớp với JSON của server (có thể có field lạ, nullable bừa, tên snake_case); Entity là mô hình **bạn muốn làm việc với**. Tách ra để đổi API không làm vỡ domain và UI. Cái giá là phải viết mapper — với app nhỏ có thể gộp, nhưng phải là **quyết định có ý thức**.

**Trade-off nên nói ra:** Clean Architecture đầy đủ cho app 5 màn hình là **over-engineering** — 4 file cho một tính năng đọc dữ liệu. Câu trả lời trưởng thành: *"tôi áp dụng dependency rule và tách domain khỏi Flutter ngay từ đầu vì rẻ, còn use case và mapper thì thêm khi feature đủ phức tạp."*`,
    pitfalls: [
      '`domain` import `flutter/material.dart` → mất khả năng test thuần Dart và mất tính độc lập.',
      'Use case chỉ gọi thẳng repository một dòng, không có logic → tầng vô nghĩa.',
      'Layer-first cho app lớn → mỗi task phải nhảy 5 thư mục.',
      'DTO dùng luôn làm entity rồi UI phụ thuộc trực tiếp vào shape của API.',
      'Áp Clean đầy đủ cho app rất nhỏ mà không cân nhắc chi phí.',
    ],
    followUps: ['Khi nào bỏ bớt use case là hợp lý?', 'Melos/monorepo chia package thế nào?', '`Result`/`Either` xử lý lỗi ra sao?'],
  },

  // ============ flu-security ============
  {
    id: 'flutter-security',
    groupId: 'flu-security',
    title: 'Bảo mật Flutter: obfuscation, secure storage, certificate pinning?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      '**Obfuscation**: `flutter build --obfuscate --split-debug-info=<dir>` — bắt buộc lưu symbol để giải mã crash. **Secure storage**: `flutter_secure_storage` (bọc Keystore/Keychain), không dùng `shared_preferences` cho token. **Certificate pinning**: qua `SecurityContext`/`badCertificateCallback` của Dio hoặc plugin — nhớ pin kèm backup key. Điểm cộng của Flutter: release là **AOT native** nên khó reverse hơn Android Kotlin.',
    deep: `**1. Obfuscation:**
\`\`\`bash
flutter build appbundle --release \\
  --obfuscate \\
  --split-debug-info=build/symbols

# Giải mã stack trace từ crash report
flutter symbolize -i crash.txt -d build/symbols/app.android-arm64.symbols
\`\`\`
**Bắt buộc**: commit/lưu thư mục symbols theo từng bản release (giống \`mapping.txt\` của R8). Không có nó thì crash production chỉ là địa chỉ hex.

**Điều obfuscation KHÔNG che:**
- \`assets/\` — mọi file JSON, ảnh, config đọc được nguyên vẹn bằng \`unzip\`.
- String literal trong Dart code — vẫn nằm trong binary, \`strings\` là thấy.
- Native plugin (Kotlin/Swift) — cần R8/ProGuard riêng cho phần Android.

**2. Secure storage:**
\`\`\`dart
const storage = FlutterSecureStorage(
  aOptions: AndroidOptions(encryptedSharedPreferences: true),
  iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock_this_device),
);
await storage.write(key: 'refresh_token', value: token);
\`\`\`
\`first_unlock_this_device\` quan trọng: không đồng bộ sang iCloud/thiết bị khác.

**3. Certificate pinning với Dio:**
\`\`\`dart
final dio = Dio();
(dio.httpClientAdapter as IOHttpClientAdapter).createHttpClient = () {
  final client = HttpClient(context: SecurityContext(withTrustedRoots: false))
    ..badCertificateCallback = (cert, host, port) {
      final fingerprint = sha256.convert(cert.der).toString();
      return _pinnedFingerprints.contains(fingerprint);   // pin >= 2 key
    };
  return client;
};
\`\`\`

**4. API key — sự thật khó nghe:** \`--dart-define\` **không** làm secret an toàn; giá trị vẫn nằm trong binary. Cách duy nhất đúng là **proxy qua backend của bạn**. Nếu buộc phải nhúng key của bên thứ ba (Maps), hãy **giới hạn key theo package name + SHA fingerprint** ở phía nhà cung cấp.

**5. Checklist trước khi phát hành:**
| Việc | Kiểm tra |
|---|---|
| Obfuscate + lưu symbols | ✅ |
| Không log PII/token trong release | \`kReleaseMode\` guard cho logger |
| \`flutter_secure_storage\` cho token | ✅ |
| Chặn screenshot màn hình nhạy cảm | \`FLAG_SECURE\` (Android), \`isSecureTextEntry\`/overlay (iOS) |
| Root/jailbreak detection | Ghi log + giảm quyền, không hard-block |
| \`allowBackup=false\` (Android) | ✅ |
| Assets không chứa secret/config nội bộ | \`unzip\` kiểm tra |
| Play Integrity / App Attest | Cho luồng thanh toán |

**Vì sao Flutter khó reverse hơn:** Dart release compile sang mã máy ARM, không có bytecode dạng DEX đọc được bằng jadx. Attacker phải dùng Ghidra/IDA và Dart runtime không có symbol → chi phí cao hơn nhiều. Nhưng **không phải bất khả xâm phạm**: có công cụ chuyên dụng (reFlutter) để hook Flutter engine và bypass pinning.`,
    pitfalls: [
      'Obfuscate mà không lưu symbols → crash report vô dụng.',
      'Nghĩ `--dart-define` giữ được secret.',
      'Để config nội bộ trong `assets/` (endpoint staging, feature flag, danh sách user test).',
      'Pin một certificate không có backup → app chết khi cert hết hạn.',
      'Log token bằng `print`/`debugPrint` trong release (chúng vẫn chạy nếu không guard).',
    ],
    followUps: ['reFlutter bypass pinning thế nào?', 'Play Integrity trong Flutter tích hợp ra sao?', 'Chặn screenshot trên iOS làm thế nào?'],
  },

  // ============ flu-testing ============
  {
    id: 'flutter-testing-types',
    groupId: 'flu-testing',
    title: 'Unit test, widget test, golden test, integration test trong Flutter?',
    levels: ['mid'],
    source: 'pdf',
    short:
      '**Unit test**: logic thuần Dart, nhanh nhất. **Widget test**: dựng widget trong môi trường test ảo (`WidgetTester`), không cần thiết bị — đây là điểm mạnh lớn của Flutter, rất nhanh mà vẫn test được UI. **Golden test**: so sánh ảnh render với ảnh chuẩn, bắt regression giao diện. **Integration test**: chạy app thật trên thiết bị/emulator, test luồng end-to-end.',
    deep: `| Loại | Chạy ở | Tốc độ | Test gì |
|---|---|---|---|
| Unit | Dart VM | ms | Use case, mapper, bloc/notifier |
| **Widget** | Dart VM (headless) | ~10–100ms | Widget render đúng, tap/scroll, state → UI |
| Golden | Dart VM | ~100ms | Pixel-level regression |
| Integration | Thiết bị thật | giây–phút | Luồng đầy đủ, plugin native |

**Widget test:**
\`\`\`dart
testWidgets('hien danh sach va tap vao item', (tester) async {
  await tester.pumpWidget(MaterialApp(
    home: ProductList(products: [Product(id: '1', name: 'Cà phê')]),
  ));

  expect(find.text('Cà phê'), findsOneWidget);

  await tester.tap(find.byKey(const ValueKey('product_1')));
  await tester.pumpAndSettle();               // chờ animation xong

  expect(find.byType(ProductDetail), findsOneWidget);
});
\`\`\`

**\`pump\` vs \`pumpAndSettle\` — hay bị dùng sai:**
- \`pump()\` — chạy **một** frame. Dùng khi muốn kiểm tra state trung gian (ví dụ đang loading).
- \`pumpAndSettle()\` — chạy frame liên tục tới khi không còn animation. **Treo vô hạn** nếu có animation lặp mãi (\`CircularProgressIndicator\` không tắt) → dùng \`pump(Duration(...))\` thay thế.

**Golden test:**
\`\`\`dart
testWidgets('golden: product card', (tester) async {
  await tester.pumpWidget(const MaterialApp(home: ProductCard(...)));
  await expectLater(find.byType(ProductCard), matchesGoldenFile('goldens/product_card.png'));
});
// Cập nhật ảnh chuẩn: flutter test --update-goldens
\`\`\`
**Vấn đề của golden test:** ảnh render khác nhau giữa macOS và Linux (font rendering) → CI đỏ oan. Cách xử lý: chạy golden **chỉ trong Docker/CI cùng một image**, hoặc dùng \`golden_toolkit\`/\`alchemist\` để load font tường minh và giới hạn nền tảng.

**Integration test:**
\`\`\`dart
// integration_test/app_test.dart
IntegrationTestWidgetsFlutterBinding.ensureInitialized();

testWidgets('luong dang nhap', (tester) async {
  app.main();
  await tester.pumpAndSettle();
  await tester.enterText(find.byKey(const Key('email')), 'a@b.c');
  await tester.tap(find.byKey(const Key('login')));
  await tester.pumpAndSettle();
  expect(find.byType(HomePage), findsOneWidget);
});
\`\`\`
Chạy: \`flutter test integration_test\`, hoặc trên Firebase Test Lab cho nhiều thiết bị.

**Mock HTTP:** \`http_mock_adapter\` (Dio) hoặc \`MockClient\` của package \`http\`. Đừng gọi API thật trong test.

**Tỉ lệ nên nhắm:** nhiều unit + widget test (chúng chạy trong giây), rất ít integration test (chỉ luồng quan trọng nhất: đăng nhập, thanh toán).`,
    pitfalls: [
      '`pumpAndSettle` với animation vô hạn → test treo tới timeout.',
      'Golden test chạy trên nhiều OS khác nhau → CI đỏ do font rendering.',
      'Gọi API thật trong test → flaky và chậm.',
      'Không đặt `Key` cho widget cần tìm → phải `find.text` với chuỗi hiển thị, vỡ khi đổi copy hoặc đa ngôn ngữ.',
      'Viết integration test cho mọi thứ → CI 30 phút và flaky.',
    ],
    followUps: ['`pump` vs `pumpAndSettle`?', 'Golden test trên CI xử lý font thế nào?', '`mockNetworkImagesFor` giải quyết gì?'],
  },
]
