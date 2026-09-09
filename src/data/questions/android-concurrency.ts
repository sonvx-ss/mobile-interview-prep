import type { Question } from '../types'

export const ANDROID_CONCURRENCY_QUESTIONS: Question[] = [
  {
    id: 'coroutine-la-gi',
    groupId: 'and-concurrency',
    title: 'Coroutine là gì? Khác thread ở đâu?',
    levels: ['junior', 'mid'],
    source: 'pdf',
    short:
      'Coroutine là **tác vụ có thể tạm dừng (suspend) và tiếp tục mà không chặn thread**. Nó không phải thread — nhiều nghìn coroutine chạy trên vài thread. Khi coroutine `suspend`, thread được **trả lại cho pool** để làm việc khác; khi kết quả sẵn sàng, coroutine tiếp tục (có thể trên thread khác).',
    deep: `| | Thread | Coroutine |
|---|---|---|
| Chi phí | ~1 MB stack, tạo bởi OS | Vài trăm byte, quản lý bởi thư viện |
| Số lượng khả thi | Hàng trăm | Hàng trăm nghìn |
| Chặn khi chờ | Có (thread ngủ) | Không (thread được nhả ra) |
| Huỷ | \`interrupt()\`, khó và không đáng tin | \`cancel()\`, cooperative và có cấu trúc |
| Chuyển ngữ cảnh | Context switch của OS (đắt) | Chỉ là gọi hàm (rẻ) |

**Cơ chế bên dưới — trả lời được là ăn điểm lớn:** compiler biến hàm \`suspend\` thành **state machine** (CPS — continuation passing style). Mỗi điểm \`suspend\` là một state; hàm được thêm tham số ẩn \`Continuation\` để biết chỗ tiếp tục.

\`\`\`kotlin
suspend fun load(): User { val u = api.getUser(); return u }

// compiler sinh ra (giản lược):
fun load(cont: Continuation<User>): Any {
    when (cont.label) {
        0 -> { cont.label = 1; return api.getUser(cont) }   // có thể trả về COROUTINE_SUSPENDED
        1 -> return cont.result as User
    }
}
\`\`\`

Nên "suspend không chặn thread" là hệ quả trực tiếp: hàm **return thật** khi suspend, thread đi làm việc khác, rồi được gọi lại sau.

**Ba khái niệm không được lẫn:**
- \`suspend\` — hàm *có thể* tạm dừng; nó **không** tự chuyển thread.
- \`Dispatcher\` — quyết định chạy trên thread nào.
- \`Scope\` — quyết định coroutine sống bao lâu và bị cancel khi nào.`,
    code: [
      {
        lang: 'kotlin',
        caption: 'suspend function nên tự lo dispatcher (main-safe)',
        source: `// Xấu: bắt caller phải nhớ đổi dispatcher
suspend fun readFile(): String = File(path).readText()      // block nếu gọi từ Main!

// Tốt: main-safe — gọi từ đâu cũng an toàn
suspend fun readFile(): String = withContext(Dispatchers.IO) {
    File(path).readText()
}

// Trong ViewModel: chỉ cần launch, không cần biết bên dưới dùng thread nào
fun load() = viewModelScope.launch {
    _state.value = UiState.Loading
    _state.value = runCatching { readFile() }
        .fold({ UiState.Success(it) }, { UiState.Error(it) })
}`,
      },
    ],
    pitfalls: [
      'Nghĩ `suspend` tự động chuyển sang background thread — không. `suspend fun` không có `withContext` vẫn chạy trên thread của caller.',
      'Bắt caller phải `withContext(Dispatchers.IO)` — theo convention của Google, **suspend function phải main-safe**, tự lo dispatcher bên trong.',
      '`GlobalScope.launch` — không ai cancel, coroutine sống ngoài lifecycle.',
      'Dùng `runBlocking` để "gọi suspend function từ code thường" trong app — trên main thread là ANR.',
    ],
    followUps: ['CPS transformation là gì?', '`suspend` có gọi được từ Java không? Vì sao?', '`Dispatchers.Main.immediate` khác `Main`?'],
  },
  {
    id: 'structured-concurrency',
    groupId: 'and-concurrency',
    title: 'Structured concurrency là gì? `Job` vs `SupervisorJob`?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Structured concurrency nghĩa là **mọi coroutine đều có cha**, và cha **không kết thúc trước con**; cancel cha thì cancel toàn bộ con; con lỗi thì lan lên cha. Với `Job` thường, một con thất bại **giết cả nhóm**. Với `SupervisorJob`, con thất bại **không ảnh hưởng anh em** — dùng cho màn hình có nhiều nguồn dữ liệu độc lập.',
    deep: `\`\`\`kotlin
// Job thường: profile lỗi -> orders bị cancel luôn
coroutineScope {
    launch { loadProfile() }   // throw
    launch { loadOrders() }    // bị cancel theo
}

// SupervisorJob: mỗi phần độc lập
supervisorScope {
    launch { runCatching { loadProfile() } }
    launch { runCatching { loadOrders() } }   // vẫn chạy dù profile lỗi
}
\`\`\`

**\`viewModelScope\` dùng \`SupervisorJob\`** sẵn — nên một \`launch\` lỗi không giết cả ViewModel. Nhưng lưu ý: nếu bạn \`launch\` **lồng trong** một \`launch\`, coroutine lồng dùng \`Job\` thường → lỗi vẫn lan lên và giết cả nhóm lồng đó.

**Ba builder và cách chúng báo lỗi** — chỗ này hay bị nhầm nhất:

| Builder | Trả về | Lỗi được báo khi nào |
|---|---|---|
| \`launch\` | \`Job\` | **Ngay lập tức**, lan lên parent → \`CoroutineExceptionHandler\` |
| \`async\` | \`Deferred<T>\` | **Chỉ khi gọi \`await()\`** — nếu không await, exception bị "nuốt" |
| \`coroutineScope { }\` | giá trị cuối | Rethrow tại chỗ gọi |

Nên: \`try/catch\` quanh \`launch { }\` **không bắt được** exception bên trong; phải catch **bên trong** block, hoặc dùng \`CoroutineExceptionHandler\`.

**\`CancellationException\` là ngoại lệ đặc biệt:** nó là tín hiệu cancel bình thường, **không** phải lỗi. Vì thế:

\`\`\`kotlin
// SAI: nuốt luôn tín hiệu cancel -> coroutine không cancel được
try { doWork() } catch (e: Exception) { log(e) }

// ĐÚNG
try {
    doWork()
} catch (e: CancellationException) {
    throw e                      // phải rethrow
} catch (e: Exception) {
    log(e)
}
// hoặc dùng runCatching cẩn thận -- runCatching cũng bắt CancellationException!
\`\`\``,
    code: [
      {
        lang: 'kotlin',
        caption: 'Chạy song song đúng cách và xử lý lỗi từng phần',
        source: `// Tuần tự: 2 giây
val user = api.getUser()
val orders = api.getOrders()

// Song song: 1 giây
coroutineScope {
    val user = async { api.getUser() }
    val orders = async { api.getOrders() }
    Profile(user.await(), orders.await())
}

// Song song nhưng chấp nhận từng phần lỗi
supervisorScope {
    val user = async { runCatching { api.getUser() } }
    val orders = async { runCatching { api.getOrders() } }
    Profile(user.await().getOrNull(), orders.await().getOrElse { emptyList() })
}`,
      },
    ],
    pitfalls: [
      '`try/catch` bọc ngoài `launch { }` — không bắt được gì.',
      '`async` mà không `await` → exception mất tăm.',
      'Bắt `Exception` mà không rethrow `CancellationException` → coroutine không cancel được, gây leak.',
      '`runCatching` cũng bắt `CancellationException` — cẩn thận khi dùng trong coroutine có thể bị cancel.',
    ],
    followUps: [
      '`coroutineScope` vs `supervisorScope`?',
      '`CoroutineExceptionHandler` đặt ở đâu mới có tác dụng?',
      '`withTimeout` throw gì? Có bị bắt bởi catch chung không?',
    ],
  },
  {
    id: 'coroutine-cancellation',
    groupId: 'and-concurrency',
    title: 'Cancellation trong coroutine hoạt động thế nào?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Cancellation là **cooperative** — gọi `cancel()` chỉ *đánh dấu* job là cancelled và ném `CancellationException` **ở điểm suspend tiếp theo**. Code CPU-bound trong vòng lặp không có điểm suspend sẽ **chạy tiếp cho tới hết**. Muốn cancel được thì phải chủ động kiểm tra `isActive` hoặc gọi `yield()`.',
    deep: `\`\`\`kotlin
// Không cancel được: vòng lặp không có suspension point
viewModelScope.launch(Dispatchers.Default) {
    var i = 0L
    while (i < 10_000_000_000) { i++ }     // cancel() vô tác dụng
}

// Cancel được — 3 cách
while (isActive) { i++ }                    // 1. kiểm tra cờ
while (true) { yield(); i++ }               // 2. yield() vừa nhường thread vừa check cancel
ensureActive()                              // 3. throw ngay nếu đã cancelled
\`\`\`

**Dọn tài nguyên khi bị cancel:**
\`\`\`kotlin
val job = launch {
    try {
        openCamera()
        collectFrames()
    } finally {
        // finally CÓ chạy khi cancel, nhưng đã ở trạng thái cancelled
        // -> không gọi được suspend function ở đây, trừ khi:
        withContext(NonCancellable) { saveDraft() }
        closeCamera()   // code thường thì OK
    }
}
\`\`\`

**Cancel job cũ trước khi chạy job mới** — pattern rất hay dùng cho search/refresh:
\`\`\`kotlin
private var searchJob: Job? = null

fun search(q: String) {
    searchJob?.cancel()                    // huỷ request trước
    searchJob = viewModelScope.launch { _results.value = repo.search(q) }
}

// Hoặc reactive hơn, không cần quản Job thủ công:
val results = queryFlow
    .debounce(300)
    .flatMapLatest { repo.search(it) }     // flatMapLatest tự cancel cái trước
\`\`\`

**Timeout:**
- \`withTimeout\` → throw \`TimeoutCancellationException\`.
- \`withTimeoutOrNull\` → trả \`null\`, không throw. Thường dễ dùng hơn.`,
    pitfalls: [
      'Nghĩ `cancel()` dừng ngay lập tức — nó chỉ đánh dấu.',
      'Gọi suspend function trong `finally` sau khi cancel → bị `CancellationException` ngay; phải dùng `withContext(NonCancellable)`.',
      'Bắt `Exception` chung trong coroutine mà nuốt luôn `CancellationException`.',
      'Quên rằng `viewModelScope` tự cancel ở `onCleared()` — nên đừng chạy việc "phải hoàn thành" (upload, ghi log quan trọng) trong đó; dùng WorkManager.',
    ],
    followUps: [
      '`flatMapLatest` vs `flatMapMerge` vs `flatMapConcat`?',
      '`NonCancellable` dùng khi nào và rủi ro gì?',
      'Retrofit call có thực sự bị cancel ở tầng socket không?',
    ],
  },
  {
    id: 'flow-vs-livedata-stateflow-sharedflow',
    groupId: 'and-concurrency',
    title: 'Flow, StateFlow, SharedFlow, LiveData — chọn cái nào?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      '**Flow** lạnh (cold): chỉ chạy khi có collector, mỗi collector một luồng riêng — dùng cho *nguồn dữ liệu*. **StateFlow** nóng, luôn có **giá trị hiện tại**, conflate và bỏ giá trị trùng — dùng cho **UI state**. **SharedFlow** nóng, **không giữ giá trị**, replay cấu hình được — dùng cho **event một lần** (navigate, show snackbar). **LiveData** là thế hệ cũ, lifecycle-aware sẵn nhưng chỉ chạy trên main thread và không có operator.',
    deep: `| | Flow | StateFlow | SharedFlow | LiveData |
|---|---|---|---|---|
| Cold/Hot | Cold | Hot | Hot | Hot |
| Có giá trị hiện tại | ❌ | ✅ \`.value\` | ❌ | ✅ \`.value\` |
| Cần initial value | — | **Có** | Không | Không |
| Bỏ giá trị trùng lặp | Không | **Có** (\`distinctUntilChanged\`) | Không | Không |
| Replay | — | 1 (luôn) | Cấu hình \`replay = n\` | 1 |
| Lifecycle-aware | Không (cần \`repeatOnLifecycle\`) | Không | Không | **Có** |
| Operator phong phú | ✅ | ✅ | ✅ | Rất hạn chế |
| Dùng cho | Nguồn dữ liệu | **UI state** | **Event một lần** | Legacy |

**Vì sao StateFlow cho state và SharedFlow cho event:**
- State phải **có giá trị lúc nào cũng dùng được** (màn hình recreate là render lại ngay) → StateFlow.
- Event **không được replay** khi rotate (nếu không sẽ hiện lại snackbar hoặc navigate hai lần) → SharedFlow với \`replay = 0\`. Đây chính là "SingleLiveEvent problem" của thời LiveData.

**Nhưng cách tốt nhất cho event lại không phải SharedFlow**: dùng \`Channel(Channel.BUFFERED).receiveAsFlow()\`. Lý do: SharedFlow \`replay=0\` **mất event** nếu emit khi chưa có collector (lúc màn hình đang recreate), còn Channel thì buffer lại. Google khuyến nghị đưa event vào **chính state** (\`data class UiState(val message: String? = null)\` rồi consume) — an toàn nhất với process death.

**\`stateIn\` — cách chuyển cold Flow sang StateFlow đúng:**
\`\`\`kotlin
val users: StateFlow<List<User>> = repo.observeUsers()
    .stateIn(
        scope = viewModelScope,
        // Giữ upstream 5 giây sau khi collector cuối rời đi:
        // rotate không làm reload lại DB/network
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = emptyList(),
    )
\`\`\`
\`WhileSubscribed(5_000)\` là con số Google khuyến nghị và là chi tiết hay được hỏi.

**Vì sao vẫn nên biết LiveData:** codebase cũ đầy nó, và \`asLiveData()\`/\`asFlow()\` là cầu nối khi migrate dần.`,
    code: [
      {
        lang: 'kotlin',
        caption: 'Mẫu ViewModel chuẩn: state bằng StateFlow, event bằng Channel',
        source: `class CartViewModel(private val repo: CartRepository) : ViewModel() {

    private val _state = MutableStateFlow(CartUiState())
    val state: StateFlow<CartUiState> = _state.asStateFlow()

    private val _events = Channel<CartEvent>(Channel.BUFFERED)
    val events = _events.receiveAsFlow()

    fun checkout() = viewModelScope.launch {
        _state.update { it.copy(isLoading = true) }         // update: CAS, an toàn concurrent
        repo.checkout()
            .onSuccess { _events.send(CartEvent.NavigateToSuccess(it.orderId)) }
            .onFailure { _events.send(CartEvent.ShowError(it.message.orEmpty())) }
        _state.update { it.copy(isLoading = false) }
    }
}

// Phía UI
lifecycleScope.launch {
    repeatOnLifecycle(Lifecycle.State.STARTED) {
        launch { viewModel.state.collect { render(it) } }
        launch { viewModel.events.collect { handle(it) } }
    }
}`,
      },
    ],
    pitfalls: [
      'Dùng StateFlow cho event → rotate là hiện lại snackbar / navigate lần hai.',
      'Collect Flow bằng `lifecycleScope.launch` trần → vẫn chạy khi app ở background, tốn pin và có thể crash khi update UI.',
      'Quên `WhileSubscribed` → dùng `Eagerly` thì upstream chạy mãi; dùng `Lazily` thì rotate không reload nhưng cũng không bao giờ dừng.',
      '`_state.value = _state.value.copy(...)` thay vì `_state.update { }` → race condition.',
      '`MutableStateFlow` bỏ giá trị trùng — emit cùng một object hai lần thì collector chỉ nhận một lần (chú ý khi state là `List` mutable).',
    ],
    followUps: [
      '`SharingStarted.WhileSubscribed(5000)` — vì sao 5 giây?',
      'Vì sao Google khuyên đưa event vào state thay vì kênh riêng?',
      '`callbackFlow` dùng để làm gì?',
    ],
  },
  {
    id: 'flow-operators',
    groupId: 'and-concurrency',
    title: 'Các operator Flow quan trọng: `map`, `flatMapLatest`, `debounce`, `combine`, `zip`, `buffer`, `conflate`?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Nhóm theo mục đích: **biến đổi** (`map`, `filter`, `transform`), **làm phẳng** (`flatMapLatest` cancel cái trước, `flatMapMerge` chạy song song, `flatMapConcat` tuần tự), **kết hợp** (`combine` lấy giá trị mới nhất của mỗi nguồn, `zip` ghép theo cặp), **kiểm soát nhịp** (`debounce`, `sample`, `conflate`, `buffer`), **vòng đời** (`onStart`, `onEach`, `catch`, `onCompletion`, `retryWhen`).',
    deep: `**\`combine\` vs \`zip\` — hay bị hỏi:**
\`\`\`text
A: --1-----2-----3-->
B: ----a-------b---->

combine: ----1a--2a--2b--3b-->    (mỗi lần BẤT KỲ nguồn nào phát, dùng giá trị mới nhất của cả hai)
zip:     ----1a------2b------>    (chờ đủ cặp; nguồn nhanh phải đợi nguồn chậm)
\`\`\`
Với UI, gần như luôn dùng \`combine\` (ví dụ: state = combine(query, filter, sortOrder)).

**Ba \`flatMap\`:**
| Operator | Hành vi | Dùng cho |
|---|---|---|
| \`flatMapLatest\` | **Cancel** flow trước khi có giá trị mới | Search, refresh — chỉ cần kết quả mới nhất |
| \`flatMapMerge\` | Chạy song song, kết quả trộn lẫn | Tải nhiều chi tiết cùng lúc |
| \`flatMapConcat\` | Tuần tự, chờ xong mới làm tiếp | Cần giữ đúng thứ tự |

**\`buffer\` vs \`conflate\` vs \`collectLatest\`** — khi producer nhanh hơn consumer:
- \`buffer(n)\`: xếp hàng, không mất giá trị nào, consumer chạy song song với producer.
- \`conflate\`: **bỏ giá trị trung gian**, chỉ giữ cái mới nhất → đúng cho UI (không ai cần state cũ).
- \`collectLatest\`: **cancel block đang xử lý** để xử lý giá trị mới.

**Xử lý lỗi và retry:**
\`\`\`kotlin
repo.observeUsers()
    .onStart { emit(Loading) }
    .retryWhen { cause, attempt ->
        // backoff luỹ tiến, chỉ retry lỗi mạng, tối đa 3 lần
        if (cause is IOException && attempt < 3) { delay(1000L * (attempt + 1)); true } else false
    }
    .catch { emit(Error(it)) }        // catch chỉ bắt lỗi của UPSTREAM
    .flowOn(Dispatchers.IO)           // đổi dispatcher cho upstream, không ảnh hưởng downstream
    .collect { render(it) }
\`\`\`

**Hai quy tắc quan trọng:**
1. \`flowOn\` chỉ ảnh hưởng **upstream** (các operator viết *trước* nó). Đó là vì sao đặt \`flowOn\` ở cuối, gần \`collect\`.
2. \`catch\` **không** bắt được lỗi trong \`collect\` — lỗi trong collect phải try/catch bình thường.

**"replay" trong tài liệu gốc**: với Flow lạnh, \`shareIn(scope, replay = 1, WhileSubscribed())\` biến nó thành hot flow có replay — dùng để nhiều collector chia sẻ một upstream (một kết nối socket, một query DB) thay vì mỗi collector chạy lại.`,
    code: [
      {
        lang: 'kotlin',
        caption: 'Search reactive — gộp nhiều operator',
        source: `private val query = MutableStateFlow("")
private val filter = MutableStateFlow(Filter.ALL)

val results: StateFlow<SearchUiState> =
    combine(query.debounce(300).distinctUntilChanged(), filter) { q, f -> q to f }
        .filter { (q, _) -> q.length >= 2 }
        .flatMapLatest { (q, f) ->                 // gõ tiếp -> cancel request cũ
            repo.search(q, f)
                .map { SearchUiState.Success(it) as SearchUiState }
                .onStart { emit(SearchUiState.Loading) }
                .catch { emit(SearchUiState.Error(it)) }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), SearchUiState.Idle)`,
      },
    ],
    pitfalls: [
      'Dùng `flatMapMerge` cho search → kết quả cũ về sau kết quả mới, UI nhảy lung tung.',
      'Đặt `flowOn` sai chỗ (đầu chuỗi) và tưởng nó đổi dispatcher cho toàn bộ.',
      'Dùng `map` để gọi API bên trong (blocking) mà không `flowOn(Dispatchers.IO)`.',
      '`catch` rồi tưởng bắt được cả lỗi của `collect`.',
      '`debounce` trên StateFlow của UI state (nó đã conflate) — thường vô nghĩa hoặc gây trễ.',
    ],
    followUps: ['`shareIn` vs `stateIn`?', '`distinctUntilChangedBy` dùng khi nào?', 'Backpressure trong Flow xử lý ra sao so với RxJava?'],
  },
  {
    id: 'rxjava-vs-flow',
    groupId: 'and-concurrency',
    title: 'RxJava và Coroutine/Flow khác nhau thế nào? Có nên migrate?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Cả hai đều là reactive, nhưng Coroutine/Flow **là ngôn ngữ** (suspend, structured concurrency, cancel tự động theo scope) còn RxJava **là thư viện** (phải tự `dispose`, API rất rộng, backpressure tường minh qua `Flowable`). Flow ít API hơn nhưng đọc như code tuần tự và tích hợp sẵn với Jetpack. Với dự án mới: chọn Flow. Với dự án RxJava lớn: **migrate dần theo module**, không rewrite.',
    deep: `| | RxJava | Coroutine / Flow |
|---|---|---|
| Bản chất | Thư viện | Tính năng ngôn ngữ + thư viện |
| Huỷ | \`Disposable.dispose()\` thủ công | Tự động theo \`CoroutineScope\` |
| Thread | \`subscribeOn\`/\`observeOn\` | \`Dispatchers\` + \`flowOn\`/\`withContext\` |
| Backpressure | \`Flowable\` với strategy tường minh | Suspend tự nhiên tạo backpressure; \`buffer\`/\`conflate\` |
| Xử lý lỗi | \`onError\`, \`onErrorResumeNext\` | try/catch bình thường + \`catch\` operator |
| Số lượng operator | Rất nhiều (500+) | Ít hơn, nhưng đủ và dễ tự viết |
| Học | Dốc | Dễ hơn với người biết code tuần tự |
| Kích thước lib | ~2 MB | Nhỏ hơn, và Kotlin stdlib đã có |
| Interop Jetpack | Cần adapter | Native (Room, Paging, DataStore, WorkManager, Compose) |

**Bảng chuyển đổi khái niệm:**
| RxJava | Coroutine/Flow |
|---|---|
| \`Single<T>\` | \`suspend fun (): T\` |
| \`Maybe<T>\` | \`suspend fun (): T?\` |
| \`Completable\` | \`suspend fun (): Unit\` |
| \`Observable<T>\`/\`Flowable<T>\` | \`Flow<T>\` |
| \`BehaviorSubject\` | \`MutableStateFlow\` |
| \`PublishSubject\` | \`MutableSharedFlow(replay = 0)\` |
| \`switchMap\` | \`flatMapLatest\` |
| \`flatMap\` | \`flatMapMerge\` |
| \`concatMap\` | \`flatMapConcat\` |
| \`CompositeDisposable\` | \`CoroutineScope\` (tự cancel) |

**Chiến lược migrate thực tế** (câu trả lời của senior):
1. **Không rewrite**. Dùng \`kotlinx-coroutines-rx3\` để hai bên sống chung: \`.asFlow()\`, \`.asObservable()\`, \`rxSingle { }\`, \`await()\`.
2. Migrate **từ trong ra ngoài**: đổi tầng data (Retrofit trả \`suspend\`, Room trả \`Flow\`) trước, giữ RxJava ở tầng presentation.
3. Code **mới** viết bằng Flow, code cũ chỉ đổi khi phải sửa nó.
4. Đặt ranh giới rõ ràng ở repository để hai model không lẫn vào nhau.

**Điều RxJava vẫn làm tốt hơn:** một số operator phức tạp (\`window\`, \`groupBy\`, \`throttleFirst\` với nhiều biến thể) và backpressure strategy tường minh. Nhưng phần lớn app mobile không cần đến mức đó.`,
    pitfalls: [
      'Nói "Flow tốt hơn hoàn toàn" — interviewer muốn nghe trade-off và chiến lược migrate, không phải fanboy.',
      'Đề xuất rewrite toàn bộ codebase RxJava — dấu hiệu thiếu kinh nghiệm dự án lớn.',
      'Quên rằng quên `dispose()` trong RxJava là nguyên nhân leak số một của các codebase cũ.',
      'Nhầm `Observable` (không backpressure) với `Flowable` (có).',
    ],
    followUps: [
      'Backpressure trong Flow được xử lý bằng cách nào? (suspend của producer)',
      '`Observable` vs `Flowable` khác gì?',
      'Bạn đã migrate module nào chưa? Gặp vấn đề gì?',
    ],
  },
  {
    id: 'dispatchers',
    groupId: 'and-concurrency',
    title: '`Dispatchers.Main`, `IO`, `Default`, `Unconfined` — chọn thế nào?',
    levels: ['junior', 'mid'],
    short:
      '**Main**: UI. **Default**: việc CPU-bound (số thread = số core). **IO**: việc blocking I/O (tới 64 thread, vì thread đang chờ không dùng CPU). **Unconfined**: không cố định thread — chỉ dùng cho test hoặc trường hợp rất đặc biệt, không dùng trong code app.',
    deep: `| Dispatcher | Số thread | Ví dụ đúng |
|---|---|---|
| \`Main\` | 1 | Cập nhật UI, đọc \`state.value\` để render |
| \`Main.immediate\` | 1 | Như Main nhưng chạy ngay nếu đã ở main thread (tránh một vòng post) |
| \`Default\` | = core (min 2) | Parse JSON lớn, sort 10k item, resize bitmap, mã hoá |
| \`IO\` | tới 64 (dùng chung pool với Default) | Đọc file, query DB không suspend, socket, \`SharedPreferences\` |
| \`Unconfined\` | không xác định | Chỉ trong test, hoặc operator không cần thread cố định |

**Quy tắc thực chiến:** trong app dùng thư viện hiện đại, bạn **gần như không cần \`withContext\`**:
- Room \`suspend\` DAO tự chạy trên executor riêng.
- Retrofit \`suspend\` tự chạy trên OkHttp dispatcher.
- Chỉ cần \`withContext\` khi gọi API **blocking** cũ (đọc file thủ công, lib Java đồng bộ) hoặc làm việc CPU nặng.

**\`Dispatchers.IO\` và \`Default\` chia sẻ pool** → chuyển giữa chúng thường không tạo thread mới, chỉ đổi "quota" → rẻ.

**Inject dispatcher để test được** — đây là dấu hiệu code chất lượng:
\`\`\`kotlin
class ImageProcessor @Inject constructor(
    @DefaultDispatcher private val dispatcher: CoroutineDispatcher,
) {
    suspend fun process(bitmap: Bitmap) = withContext(dispatcher) { /* CPU nặng */ }
}

// Test: truyền UnconfinedTestDispatcher() -> chạy đồng bộ, không cần chờ
\`\`\`

**\`limitedParallelism\`** khi cần giới hạn số việc song song (ví dụ chỉ cho 4 upload cùng lúc):
\`\`\`kotlin
private val uploadDispatcher = Dispatchers.IO.limitedParallelism(4)
\`\`\``,
    pitfalls: [
      'Dùng `Dispatchers.IO` cho việc CPU-bound → 64 thread giành CPU với main thread → jank.',
      'Hardcode `Dispatchers.IO` trong class → không test được (phải chờ thời gian thật). Inject dispatcher.',
      '`withContext(Dispatchers.Main)` chỉ để set state khi state đã là StateFlow — không cần, StateFlow thread-safe.',
      'Dùng `Unconfined` trong code production vì "nghe có vẻ nhanh".',
    ],
    followUps: ['`Main.immediate` giải quyết vấn đề gì?', 'Vì sao IO là 64 thread?', '`newSingleThreadContext` thay bằng gì?'],
  },
  {
    id: 'workmanager',
    groupId: 'and-concurrency',
    title: 'WorkManager dùng khi nào? Khác coroutine và Service ra sao?',
    levels: ['mid'],
    source: 'pdf',
    short:
      'WorkManager cho việc **phải hoàn thành dù app bị đóng hoặc máy khởi động lại** — nó lưu công việc vào **DB nội bộ** và tự chọn backend (JobScheduler hoặc AlarmManager) theo API level. Dùng nó cho upload ảnh, sync định kỳ, gửi log. Coroutine trong `viewModelScope` chết theo màn hình; Service background bị chặn từ Android 8.',
    deep: `**Cây quyết định:**
\`\`\`text
Việc phải hoàn thành dù app đóng / máy reboot?   -> WorkManager
User đang chủ động theo dõi (nhạc, GPS, gọi)?     -> Foreground Service
Chỉ cần trong lúc màn hình đang mở?               -> viewModelScope.launch
Cần chính xác thời điểm (báo thức, lịch)?         -> AlarmManager (exact alarm)
\`\`\`

**Điểm mạnh của WorkManager:**
- **Bền vững**: work được lưu trong Room nội bộ → sống qua process death và reboot.
- **Constraint**: chỉ chạy khi có WiFi, đang sạc, pin đủ, storage đủ.
- **Retry với backoff** tự động (\`Result.retry()\`).
- **Chuỗi công việc**: \`beginWith(a).then(b).then(c)\`, hoặc chạy song song rồi gộp.
- **Unique work**: \`enqueueUniqueWork\` với \`ExistingWorkPolicy.KEEP/REPLACE/APPEND\` → không bị enqueue trùng khi user bấm nhiều lần.

**Giới hạn phải biết:**
- **Không chính xác về thời gian.** Chu kỳ tối thiểu của \`PeriodicWorkRequest\` là **15 phút**, và OS có thể trễ hơn nhiều do Doze/App Standby. Cần đúng giờ → \`AlarmManager\` với \`setExactAndAllowWhileIdle\` (và Android 12+ cần quyền \`SCHEDULE_EXACT_ALARM\`).
- **Nhà sản xuất Trung Quốc** (Xiaomi, Huawei, Oppo) có battery optimization hung hãn, có thể giết work. Với việc quan trọng thật, phải có cơ chế đối chiếu ở server.
- Việc dài > 10 phút cần \`setForeground\` (ForegroundInfo) để không bị giết.`,
    code: [
      {
        lang: 'kotlin',
        caption: 'CoroutineWorker với Hilt, constraint và retry',
        source: `@HiltWorker
class UploadWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val repo: MediaRepository,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val id = inputData.getString(KEY_ID) ?: return Result.failure()
        return try {
            repo.upload(id)
            Result.success()
        } catch (e: IOException) {
            if (runAttemptCount < 3) Result.retry() else Result.failure()
        }
    }
}

// Enqueue: unique + constraint + backoff
val request = OneTimeWorkRequestBuilder<UploadWorker>()
    .setInputData(workDataOf(KEY_ID to mediaId))
    .setConstraints(
        Constraints.Builder()
            .setRequiredNetworkType(NetworkType.UNMETERED)   // chỉ WiFi
            .setRequiresBatteryNotLow(true)
            .build()
    )
    .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
    .build()

WorkManager.getInstance(context)
    .enqueueUniqueWork("upload-\$mediaId", ExistingWorkPolicy.KEEP, request)`,
      },
    ],
    pitfalls: [
      'Dùng `PeriodicWorkRequest` cho việc cần đúng giờ — tối thiểu 15 phút và có thể trễ hàng giờ.',
      'Không dùng `enqueueUniqueWork` → user bấm 5 lần thì upload 5 lần.',
      'Truyền object lớn qua `inputData` (giới hạn ~10 KB) — truyền id, đọc lại từ DB.',
      'Giả định work luôn chạy được trên mọi máy — cần đối chiếu server cho việc quan trọng.',
    ],
    followUps: [
      'WorkManager chọn backend nào theo API level?',
      'Doze mode ảnh hưởng gì?',
      '`ExistingWorkPolicy.KEEP` vs `REPLACE` vs `APPEND`?',
    ],
  },
]
