import type { Question } from '../types'

export const ARCHITECTURE_QUESTIONS: Question[] = [
  // ============ arch-clean ============
  {
    id: 'clean-architecture-layers',
    groupId: 'arch-clean',
    title: 'Clean Architecture gồm những tầng nào? Dependency rule là gì?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Ba tầng trong app mobile: **presentation** (UI + state holder) → **domain** (entity, use case, **interface** repository) → **data** (implement repository, API, DB). **Dependency rule**: phụ thuộc chỉ được hướng **vào trong** — domain **không biết gì** về data và presentation. Cơ chế thực hiện: domain khai báo interface, data implement (dependency inversion).',
    deep: `\`\`\`text
   presentation  ──┐
                   ├──►  domain  ◄──  data
                   │   (không phụ thuộc ai)
        (cả hai phụ thuộc vào domain, không phụ thuộc lẫn nhau)
\`\`\`

| Tầng | Chứa gì | Được import gì |
|---|---|---|
| **domain** | Entity, UseCase, interface Repository, business rule | **Không gì** ngoài stdlib (không Android, không Flutter) |
| **data** | RepositoryImpl, API service, DAO, DTO, Mapper | domain |
| **presentation** | ViewModel/Bloc, UI state, widget/composable | domain (**không** data) |

**Điều then chốt — dependency inversion:** nếu domain gọi trực tiếp \`ApiService\` thì domain phụ thuộc data → sai chiều. Nên domain khai báo:
\`\`\`kotlin
// domain — không biết dữ liệu đến từ đâu
interface UserRepository {
    suspend fun getUser(id: String): User
    fun observeUsers(): Flow<List<User>>
}

class GetUserProfile @Inject constructor(
    private val userRepo: UserRepository,       // interface của chính domain
    private val orderRepo: OrderRepository,
) {
    suspend operator fun invoke(id: String): Profile = coroutineScope {
        val user = async { userRepo.getUser(id) }
        val orders = async { orderRepo.recentOrders(id) }
        Profile(user.await(), orders.await())    // logic phối hợp nằm ở đây
    }
}
\`\`\`
\`data\` implement interface đó. Chiều mũi tên compile-time hướng vào domain, còn chiều luồng dữ liệu runtime thì ra ngoài — đó là "inversion".

**Lợi ích thật, nói được mới thuyết phục:**
1. **Test**: domain test được trên JVM/Dart VM thuần, không cần Android/Flutter → test chạy trong ms.
2. **Đổi hạ tầng không đụng nghiệp vụ**: đổi Retrofit → Ktor, Room → Realm, REST → GraphQL chỉ sửa tầng data.
3. **Chia việc song song**: người làm UI và người làm API chỉ cần thống nhất interface trong domain.
4. **Ranh giới module**: domain có thể là một Gradle module/Dart package riêng, compiler bảo vệ ranh giới.

**Trade-off phải nói ra** (xem câu riêng về trade-off): nhiều file, nhiều mapper, và cho app nhỏ thì chi phí lớn hơn lợi ích.`,
    pitfalls: [
      'Domain import `android.*`/`flutter/material.dart` → mất toàn bộ lợi ích.',
      'Presentation import trực tiếp từ data (dùng DTO trong UI) → đổi API là vỡ UI.',
      'Repository interface đặt ở tầng data → sai chiều phụ thuộc.',
      'Coi Clean Architecture là "phải có 3 module Gradle" — nó là quy tắc phụ thuộc, không phải cấu trúc thư mục.',
    ],
    followUps: ['Vì sao interface repository ở domain mà không ở data?', 'Domain có được dùng coroutine/`Flow` không? (được — là Kotlin stdlib)', 'Chia module Gradle theo tầng hay theo feature?'],
  },
  {
    id: 'clean-vs-mvvm-tradeoff',
    groupId: 'arch-clean',
    title: 'Tại sao dùng Clean Architecture thay vì MVVM? Cả hai đều 3 tầng mà?',
    levels: ['senior'],
    source: 'pdf',
    short:
      'Chúng **không cùng loại**: MVVM là **presentation pattern** (trả lời "UI và state tương tác thế nào"), Clean Architecture là **application architecture** (trả lời "toàn bộ app phụ thuộc nhau thế nào"). Thực tế bạn dùng **cả hai**: MVVM *bên trong* tầng presentation của Clean. Nếu chỉ có MVVM, business logic thường trôi hết vào ViewModel và ViewModel phụ thuộc trực tiếp vào Retrofit/Room.',
    deep: `**Điểm khác biệt cốt lõi:**

| | MVVM thuần | Clean Architecture |
|---|---|---|
| Phạm vi | Chỉ tầng UI | Toàn app |
| Business logic ở đâu | ViewModel (hoặc rải rác) | Use case ở domain |
| ViewModel phụ thuộc | Thường là Repository *cụ thể* | Interface của domain |
| Đổi nguồn dữ liệu | Sửa ViewModel | Chỉ sửa data layer |
| Tái dùng logic giữa nhiều màn hình | Copy hoặc kế thừa ViewModel | Dùng lại use case |
| Test business logic | Phải dựng ViewModel + Android test deps | Dart/JVM thuần |

**Ba vấn đề thực tế của MVVM thuần khi app lớn:**
1. **God ViewModel**: \`CheckoutViewModel\` 900 dòng gồm validate giỏ hàng, tính phí ship, áp voucher, gọi 5 API, xử lý lỗi. Không tái dùng được ở màn hình nào khác.
2. **Logic bị nhân bản**: quy tắc "voucher chỉ áp cho đơn > 200k" xuất hiện ở cả \`CartViewModel\` và \`CheckoutViewModel\` — sửa một chỗ, quên chỗ kia.
3. **Không test được business rule tách biệt**: muốn test quy tắc voucher phải dựng cả ViewModel với mock Retrofit.

Clean giải quyết bằng cách rút logic đó ra \`ApplyVoucher\` use case — một class 30 dòng, test bằng 10 unit test JVM thuần, và dùng ở cả hai màn hình.

**Cách trả lời trưởng thành nhất:** *"Câu hỏi này giả định chúng loại trừ nhau, nhưng không. Tôi dùng MVVM trong presentation và Clean cho toàn app. Với app dưới ~10 màn hình tôi thường bỏ tầng use case và cho ViewModel gọi repository trực tiếp — vẫn giữ dependency rule (repository là interface ở domain) nhưng không thêm lớp use case chỉ để chuyển tiếp một lời gọi. Khi logic bắt đầu bị copy-paste giữa các ViewModel, đó là lúc thêm use case."*

Đây là câu đo **tư duy trade-off** hơn là đo kiến thức thuật ngữ. Người trả lời "Clean tốt hơn vì tách tầng" bị coi là học vẹt.`,
    pitfalls: [
      'Trả lời "Clean tốt hơn" mà không nêu chúng khác phạm trù.',
      'Không nêu được trade-off (số file, mapper, thời gian onboard người mới).',
      'Nói MVVM và Clean loại trừ nhau.',
      'Bảo vệ Clean cho mọi dự án bất kể quy mô.',
    ],
    followUps: ['App bao nhiêu màn hình thì Clean bắt đầu đáng?', 'MVI khác MVVM ở đâu?', 'Bạn từng bỏ tầng nào của Clean chưa và vì sao?'],
  },
  {
    id: 'dto-entity-uimodel',
    groupId: 'arch-clean',
    title: 'DTO, Entity, UI Model — vì sao phải có ba loại model? Mapper pattern?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      '**DTO** khớp với JSON của server (tên field, nullable bừa, có field bạn không cần). **Entity/Domain model** là mô hình bạn *muốn* làm việc với — non-null, đúng kiểu, có business rule. **UI Model** là dữ liệu đã format sẵn để vẽ (chuỗi giá đã có "₫", trạng thái đã thành enum hiển thị). Mapper là hàm chuyển giữa chúng, đặt ở tầng sở hữu model đích.',
    deep: `\`\`\`kotlin
// DTO — data layer, khớp API, mọi thứ nullable vì server có thể trả thiếu
@JsonClass(generateAdapter = true)
data class UserDto(
    @Json(name = "user_id") val userId: String?,
    @Json(name = "full_name") val fullName: String?,
    @Json(name = "created_at") val createdAt: String?,   // ISO string
    @Json(name = "internal_flags") val internalFlags: List<String>?,  // không dùng
)

// Domain — non-null, kiểu đúng, chỉ giữ những gì nghiệp vụ cần
data class User(
    val id: String,
    val name: String,
    val createdAt: Instant,
)

// UI Model — đã format sẵn, widget/composable chỉ việc vẽ
data class UserUiModel(
    val id: String,
    val name: String,
    val joinedLabel: String,     // "Tham gia 3 tháng trước"
    val avatarInitial: String,   // "A"
)

// Mapper ở data layer: nơi duy nhất biết về shape của API
fun UserDto.toDomain(): User = User(
    id = requireNotNull(userId) { "user_id null" },
    name = fullName?.takeIf { it.isNotBlank() } ?: "Người dùng",
    createdAt = createdAt?.let(Instant::parse) ?: Instant.EPOCH,
)
\`\`\`

**Ba lý do tách thật sự đáng giá:**
1. **API đổi không lan ra toàn app.** Server đổi \`full_name\` → \`name\`, bạn sửa **một** mapper. Nếu UI dùng trực tiếp DTO thì phải sửa 15 file.
2. **Chống nullable lan tràn.** Server trả nullable → nếu dùng DTO khắp nơi, mọi chỗ đều phải \`?.\` và \`?: ""\`. Mapper là **một chỗ duy nhất** quyết định giá trị mặc định hoặc từ chối dữ liệu xấu.
3. **UI model tránh format trong build/onBind.** Format ngày tháng, tiền tệ trong \`onBindViewHolder\` là logic chạy 60 lần/giây; tính sẵn trong ViewModel là chạy một lần.

**Chi phí phải thừa nhận:** 3 model + 2 mapper cho một loại dữ liệu. Với app nhỏ hoặc CRUD đơn giản, gộp DTO + Entity là quyết định hợp lý — **miễn là có ý thức**, không phải vì chưa nghĩ tới.

**Cách giảm boilerplate:**
- Dùng codegen: \`freezed\` (Dart), \`kotlinx.serialization\`/Moshi codegen.
- Mapper là **extension function** thuần → test rất dễ, và đây nên là chỗ có test coverage cao nhất vì bug ở mapper rất âm thầm.
- Không tạo UI model nếu domain model đã đủ để vẽ; chỉ tạo khi cần format hoặc kết hợp nhiều nguồn.

**Nơi đặt mapper:** DTO→Domain ở **data** (data biết cả hai). Domain→UI ở **presentation** (nó biết cách hiển thị). Domain **không bao giờ** chứa mapper sang DTO.`,
    pitfalls: [
      'Dùng DTO xuyên suốt lên UI → đổi API là vỡ toàn bộ.',
      'Đặt mapper ở domain → domain phải biết về DTO, phá dependency rule.',
      'Tạo 3 model cho mọi thứ kể cả entity chỉ có 2 field.',
      'Không test mapper — đây là nơi bug âm thầm nhiều nhất (parse ngày sai timezone, default sai).',
      'Format ngày/tiền trong `build()`/`onBindViewHolder` thay vì trong UI model.',
    ],
    followUps: ['Khi nào gộp DTO và Entity là hợp lý?', 'Xử lý DTO có field bắt buộc bị null thế nào?', '`freezed`/`kotlinx.serialization` giảm boilerplate ra sao?'],
  },
  {
    id: 'clean-architecture-tradeoff',
    groupId: 'arch-clean',
    title: 'Trade-off của Clean Architecture là gì?',
    levels: ['senior'],
    source: 'pdf',
    short:
      'Cái giá: **nhiều file và nhiều lớp gián tiếp** (một tính năng đọc dữ liệu có thể cần 6–8 file), **mapper boilerplate**, **thời gian onboard dài hơn**, và nguy cơ **use case rỗng** chỉ chuyển tiếp lời gọi. Nó đáng khi app **sống lâu, nhiều người làm, nghiệp vụ phức tạp**; không đáng cho MVP, POC, hoặc app dưới ~10 màn hình chủ yếu CRUD.',
    deep: `**Chi phí cụ thể — đếm được:**
Một tính năng "xem chi tiết sản phẩm" theo Clean đầy đủ:
\`\`\`text
domain/entities/Product.kt
domain/repositories/ProductRepository.kt
domain/usecases/GetProductDetail.kt
data/models/ProductDto.kt
data/mappers/ProductMapper.kt
data/datasources/ProductRemoteDataSource.kt
data/repositories/ProductRepositoryImpl.kt
presentation/ProductDetailViewModel.kt
presentation/ProductDetailUiState.kt
presentation/ProductDetailScreen.kt
\`\`\`
10 file cho một màn hình đọc dữ liệu. Với MVVM đơn giản có thể là 3.

**Bốn chi phí thật:**
1. **Navigation trong IDE**: đọc luồng phải nhảy 5 file. Với dev mới, "sản phẩm được load từ đâu?" trở thành câu hỏi 10 phút.
2. **Use case rỗng**: 80% use case trong dự án thực chỉ là \`repo.getX(id)\` — một lớp gián tiếp không mang giá trị.
3. **Mapper**: mỗi lần thêm field phải sửa 3 chỗ.
4. **Onboarding**: dev mới cần hiểu quy ước trước khi viết được dòng đầu tiên.

**Khi nào Clean thắng rõ rệt:**
| Tình huống | Vì sao đáng |
|---|---|
| App > 2 năm, nhiều đợt đổi người | Quy ước rõ khiến code nhất quán |
| Nghiệp vụ phức tạp (fintech, logistics, y tế) | Business rule tách riêng, test được, audit được |
| Nhiều nền tảng dùng chung logic (KMP) | domain là module chia sẻ |
| Team ≥ 5 người | Ranh giới module giảm conflict |
| Sắp đổi hạ tầng (REST → GraphQL) | Chỉ sửa data layer |

**Cách áp dụng có mức độ — câu trả lời tốt nhất:**
1. **Luôn giữ**: dependency rule (domain không biết framework), repository là interface, tách UI state khỏi UI.
2. **Thêm khi cần**: use case (khi logic bị copy giữa ViewModel), UI model (khi cần format phức tạp), tách module Gradle (khi build time hoặc conflict trở thành vấn đề).
3. **Bỏ được**: use case chuyển tiếp một dòng, DTO riêng cho API đơn giản và ổn định, data source layer khi chỉ có một nguồn.

Nói được điều này chứng tỏ bạn từng **trả giá** cho Clean, không chỉ đọc về nó.`,
    pitfalls: [
      'Trả lời "Clean không có nhược điểm" → mất điểm ngay.',
      'Áp Clean đầy đủ cho MVP 2 tuần.',
      'Tạo use case cho mọi lời gọi repository, kể cả pass-through.',
      'Chia 15 module Gradle cho app 10 màn hình → build chậm hơn, không lợi gì.',
    ],
    followUps: ['Bạn từng bỏ tầng nào và kết quả thế nào?', 'Làm sao thuyết phục team áp dụng dần?', 'Đo được lợi ích của Clean bằng chỉ số gì?'],
  },

  // ============ arch-presentation ============
  {
    id: 'mvvm-vs-mvp-vs-mvc',
    groupId: 'arch-presentation',
    title: 'MVC, MVP, MVVM và MVI khác nhau thế nào?',
    levels: ['mid'],
    source: 'pdf',
    short:
      '**MVC**: Controller nhận input, cập nhật Model, View đọc Model. **MVP**: Presenter giữ **reference tới View qua interface** và *ra lệnh* cho View (`view.showLoading()`). **MVVM**: ViewModel **không biết View**; nó phơi ra **state observable**, View tự bind. **MVI**: như MVVM nhưng state là **một object immutable duy nhất** và mọi thay đổi đi qua **Intent/Event** tường minh.',
    deep: `| | MVC | MVP | MVVM | MVI |
|---|---|---|---|---|
| Ai biết ai | Controller ↔ View | Presenter **giữ** View interface | ViewModel **không** biết View | ViewModel không biết View |
| Cập nhật UI | View đọc Model | Presenter gọi \`view.showX()\` | View observe state | View render **một** state |
| Số state | Rải rác | Rải rác | Có thể nhiều field | **Một** state immutable |
| Test | Khó (View lẫn logic) | Tốt (mock View interface) | Tốt (assert state) | **Rất tốt** (state là giá trị) |
| Boilerplate | Ít | Trung bình (nhiều interface) | Ít | Nhiều hơn (Intent + Reducer) |

**Vì sao MVP thất thế:** Presenter phải giữ \`View\` interface → phải \`detachView()\` khi Activity destroy (quên là leak), và mỗi màn hình cần một interface với 10 method (\`showLoading\`, \`hideLoading\`, \`showError\`, \`showUsers\`...). Tệ hơn: khi Presenter gọi \`view.showLoading()\` rồi \`view.showUsers()\`, UI có thể ở **trạng thái không hợp lệ** giữa hai lời gọi.

**MVVM sửa điều đó:** ViewModel phơi state, View là **hàm của state**. Không có lệnh imperative, không có trạng thái trung gian không hợp lệ.

**MVI đi thêm một bước:** thay vì nhiều field state độc lập (dễ tạo tổ hợp vô nghĩa), dùng **một** sealed state:
\`\`\`kotlin
// MVVM lỏng — 8 tổ hợp, nhiều cái vô nghĩa
data class UiState(
    val isLoading: Boolean = false,
    val users: List<User> = emptyList(),
    val error: String? = null,          // isLoading=true & error!=null là gì?
)

// MVI — chỉ trạng thái hợp lệ tồn tại
sealed interface UiState {
    data object Loading : UiState
    data class Success(val users: List<User>, val isRefreshing: Boolean) : UiState
    data class Error(val message: String, val retryable: Boolean) : UiState
}

// Mọi thay đổi qua Intent tường minh -> log được, replay được
sealed interface Intent {
    data object Refresh : Intent
    data class Search(val query: String) : Intent
}
\`\`\`

**Bloc của Flutter chính là MVI.** \`Event\` = Intent, \`State\` = state immutable, \`Bloc\` = reducer.

**Cách chọn:** MVVM là mặc định tốt cho Android/Flutter hiện nay. Lên MVI khi màn hình có **nhiều trạng thái phức tạp** (form nhiều bước, màn hình có 6 nguồn dữ liệu) hoặc cần **truy vết** thay đổi state để debug.`,
    pitfalls: [
      'Nói ViewModel "biết View" — nó không, đó là MVP.',
      'Dùng Boolean/nullable rải rác làm state rồi có tổ hợp vô nghĩa.',
      'Gọi `Toast`/`Navigator` từ ViewModel → đó là MVP đội lốt MVVM.',
      'Không biết Bloc là MVI khi phỏng vấn Flutter.',
    ],
    followUps: ['MVI xử lý side-effect (navigate) thế nào?', 'Vì sao MVP cần `detachView`?', 'Single state object có nhược điểm gì?'],
  },
  {
    id: 'ui-state-single-source-of-truth',
    groupId: 'arch-presentation',
    title: 'UI state và single source of truth: thiết kế thế nào?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      '**Single source of truth (SSOT)**: mỗi dữ liệu chỉ có **một nơi** là chủ; mọi nơi khác chỉ *quan sát* nó. Trên mobile, SSOT của dữ liệu bền là **DB local**, còn SSOT của những gì đang hiển thị là **UI state trong ViewModel**. Nguyên tắc: UI **không giữ state riêng** trùng với ViewModel, và ViewModel **không** đọc dữ liệu từ hai đường (network + DB) song song.',
    deep: `**Vi phạm SSOT hay gặp nhất:**
\`\`\`kotlin
// SAI: hai nguồn sự thật cho cùng dữ liệu
class CartViewModel {
    val items = MutableStateFlow<List<Item>>(emptyList())   // bản copy trong RAM

    fun addItem(item: Item) {
        items.update { it + item }         // cập nhật bản copy
        viewModelScope.launch { repo.add(item) }   // và cả DB
    }
}
// -> DB thêm thất bại nhưng UI đã hiện thêm rồi. Hai nguồn lệch nhau.

// ĐÚNG: DB là nguồn duy nhất, UI chỉ quan sát
class CartViewModel {
    val state: StateFlow<CartUiState> = repo.observeCart()   // DB -> Flow -> UI
        .map { CartUiState.Success(it) }
        .stateIn(viewModelScope, WhileSubscribed(5_000), CartUiState.Loading)

    fun addItem(item: Item) = viewModelScope.launch {
        repo.add(item)     // ghi DB -> Flow tự phát -> UI tự cập nhật
    }
}
\`\`\`
Lợi: không thể lệch, và optimistic update vẫn làm được (ghi DB với cờ \`pending\` trước, sync sau).

**Thiết kế UI state — bốn quy tắc:**
1. **Một class state cho một màn hình**, immutable, chứa **mọi** thứ cần để vẽ.
2. **Không nhồi tổ hợp vô nghĩa** — dùng sealed cho các trạng thái loại trừ nhau; dùng field bổ sung cho thứ có thể đồng thời (\`isRefreshing\` trong \`Success\`).
3. **State đã được xử lý sẵn** — nếu UI cần \`"3 sản phẩm, tổng 450.000₫"\` thì tính trong ViewModel, đừng tính trong \`build()\`/\`onBind\`.
4. **Event ≠ state.** Navigate/snackbar là hành động một lần, không thuộc state (nếu để trong state, rotate là chạy lại).

\`\`\`kotlin
sealed interface CartUiState {
    data object Loading : CartUiState
    data object Empty : CartUiState
    data class Success(
        val items: List<CartItemUi>,
        val totalLabel: String,          // đã format
        val isRefreshing: Boolean = false,
        val isCheckoutEnabled: Boolean,  // đã áp business rule
    ) : CartUiState
    data class Error(val message: String) : CartUiState
}
\`\`\`

**"Unidirectional data flow" (UDF)** là cách gọi kiến trúc này: state chảy **xuống** (ViewModel → UI), event chảy **lên** (UI → ViewModel). Không có đường ngang, không có UI tự sửa state.

**Ứng dụng ngoài UI:** SSOT cũng trả lời câu "cache ở đâu?" → cache là **DB**, không phải một \`Map\` trong repository song song với DB. Có hai cache là có hai nguồn sự thật.`,
    pitfalls: [
      'UI giữ bản copy của state rồi tự sửa → lệch với ViewModel.',
      'Đọc dữ liệu từ network và DB song song rồi "chọn cái nào có trước" → race và dữ liệu nhảy.',
      'Tính toán/format trong `build()`/`onBindViewHolder`.',
      'Đặt event (navigate) vào state → chạy lại sau rotate.',
      'Cache trong RAM song song với DB.',
    ],
    followUps: ['Optimistic update mà vẫn giữ SSOT thế nào?', 'State cho màn hình có 5 nguồn dữ liệu thiết kế ra sao?', 'UDF khác two-way binding thế nào?'],
  },

  // ============ arch-solid ============
  {
    id: 'solid-principles',
    groupId: 'arch-solid',
    title: 'Năm nguyên lý SOLID — cho ví dụ trong app mobile?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      '**S**RP: một class một lý do để thay đổi. **O**CP: mở rộng được mà không sửa code cũ. **L**SP: lớp con thay được lớp cha mà không phá hành vi. **I**SP: interface nhỏ, client không bị buộc phụ thuộc method nó không dùng. **D**IP: phụ thuộc vào abstraction, không vào implementation. Điều interviewer muốn nghe là **ví dụ thật từ code của bạn**, không phải định nghĩa.',
    deep: `**SRP — "một lý do để thay đổi", không phải "một việc":**
\`\`\`kotlin
// Vi phạm: 3 lý do thay đổi (API đổi, DB đổi, quy tắc hiển thị đổi)
class UserManager {
    fun fetchFromApi(): UserDto { }
    fun saveToDb(user: UserDto) { }
    fun formatDisplayName(user: UserDto): String { }
}

// Tách theo lý do thay đổi
class UserRemoteDataSource   // đổi khi API đổi
class UserDao                // đổi khi schema đổi
class UserUiMapper           // đổi khi quy tắc hiển thị đổi
\`\`\`
Dấu hiệu vi phạm dễ nhận: class tên \`...Manager\`, \`...Helper\`, \`...Utils\` với 500 dòng.

**OCP:**
\`\`\`kotlin
// Vi phạm: thêm phương thức thanh toán mới -> sửa hàm cũ (rủi ro hồi quy)
fun pay(method: String, amount: Long) = when (method) {
    "momo" -> payMomo(amount)
    "vnpay" -> payVnpay(amount)
    // thêm "zalopay" -> phải sửa ở đây
}

// Tuân thủ: thêm implementation mới, không sửa code có sẵn
interface PaymentMethod { suspend fun pay(amount: Long): Result<Receipt> }
class MomoPayment : PaymentMethod
class ZaloPayPayment : PaymentMethod        // thêm file mới là xong
\`\`\`

**LSP — vi phạm kinh điển:**
\`\`\`kotlin
// Lớp con làm yếu hợp đồng của lớp cha -> caller bị bất ngờ
open class Repository { open fun getAll(): List<User> = api.getAll() }
class CachedRepository : Repository() {
    override fun getAll(): List<User> = throw UnsupportedOperationException()  // PHÁ LSP
}
\`\`\`
Cũng vi phạm khi lớp con **thu hẹp input được chấp nhận** hoặc **mở rộng exception ném ra**.

**ISP:**
\`\`\`kotlin
// Vi phạm: read-only screen bị buộc phụ thuộc cả write
interface UserRepository {
    suspend fun getUser(id: String): User
    suspend fun updateUser(user: User)
    suspend fun deleteUser(id: String)
    suspend fun exportToCsv(): File          // chỉ admin dùng
}

// Tách nhỏ
interface UserReader { suspend fun getUser(id: String): User }
interface UserWriter { suspend fun updateUser(user: User) }
\`\`\`
Lợi ích cụ thể: khi test màn hình xem-chi-tiết, fake chỉ cần implement 1 method thay vì 4.

**DIP:**
\`\`\`kotlin
// Vi phạm: ViewModel phụ thuộc class cụ thể của Retrofit
class UserViewModel(private val api: UserApiService)   // đổi sang Ktor -> sửa ViewModel

// Tuân thủ
class UserViewModel(private val repo: UserRepository)  // interface do domain định nghĩa
\`\`\`

**Cách trả lời tốt:** chọn **2 nguyên lý** và kể một lần bạn *sửa* vi phạm thật, kèm kết quả ("sau khi tách \`PaymentMethod\`, thêm ZaloPay mất 1 ngày thay vì 3 và không có regression").`,
    pitfalls: [
      'Đọc thuộc 5 định nghĩa mà không có ví dụ → dấu hiệu học vẹt.',
      'Hiểu SRP là "một class một method".',
      'Lạm dụng ISP tạo hàng chục interface một method → phức tạp vô ích.',
      'Áp OCP cho mọi thứ (tạo abstraction cho code chỉ có một implementation và sẽ không bao giờ có cái thứ hai).',
    ],
    followUps: ['Bạn từng vi phạm nguyên lý nào và trả giá thế nào?', 'YAGNI có xung đột với OCP không?', 'Vi phạm LSP hay gặp nhất trong Android là gì?'],
  },

  // ============ arch-patterns ============
  {
    id: 'creational-patterns',
    groupId: 'arch-patterns',
    title: 'Factory, Builder, Singleton — dùng ở đâu trong app mobile?',
    levels: ['mid'],
    source: 'pdf',
    short:
      '**Factory** tách việc *quyết định tạo object nào* khỏi nơi dùng — dùng khi kiểu object phụ thuộc dữ liệu runtime. **Builder** để tạo object có nhiều tham số tùy chọn mà không cần 10 constructor — `OkHttpClient.Builder`, `Notification.Builder`. **Singleton** cho object chỉ nên có một (Room DB, OkHttp) — nhưng trên mobile nên để **DI quản lý** thay vì `object`/static.',
    deep: `**Factory:**
\`\`\`kotlin
// Factory method: quyết định implementation theo dữ liệu
object PaymentFactory {
    fun create(type: PaymentType): PaymentMethod = when (type) {
        PaymentType.MOMO -> MomoPayment(api)
        PaymentType.VNPAY -> VnPayPayment(api)
        PaymentType.COD -> CodPayment()
    }
}
\`\`\`
Trong Dart, \`factory constructor\` là hỗ trợ ngôn ngữ cho pattern này. Trong Android, \`ViewModelProvider.Factory\` là ví dụ bạn dùng hàng ngày.

**Builder:**
\`\`\`kotlin
val client = OkHttpClient.Builder()
    .connectTimeout(15, TimeUnit.SECONDS)
    .addInterceptor(authInterceptor)
    .certificatePinner(pinner)
    .build()
\`\`\`
**Trong Kotlin, Builder thường không cần** vì đã có **named argument + default value**:
\`\`\`kotlin
data class RequestConfig(
    val url: String,
    val timeout: Duration = 15.seconds,
    val retries: Int = 3,
    val headers: Map<String, String> = emptyMap(),
)
RequestConfig(url = "...", retries = 5)   // gọn hơn Builder
\`\`\`
Nói được điều này cho thấy bạn hiểu pattern trong ngữ cảnh ngôn ngữ, không áp máy móc từ Java.

**Singleton — và vì sao nên cẩn thận:**
\`\`\`kotlin
// Cách Kotlin: object là singleton lazy, thread-safe
object AppLogger { fun log(msg: String) { } }

// Nhưng trên mobile, cách tốt hơn: để DI quản lý
@Module @InstallIn(SingletonComponent::class)
object DatabaseModule {
    @Provides @Singleton
    fun db(@ApplicationContext ctx: Context): AppDatabase =
        Room.databaseBuilder(ctx, AppDatabase::class.java, "app.db").build()
}
\`\`\`
| | \`object\` / static | \`@Singleton\` qua DI |
|---|---|---|
| Test | Khó (không thay được) | Dễ (override binding) |
| Reset state (logout) | Thủ công, dễ quên | Theo scope component |
| Phụ thuộc hiện rõ | Không (ẩn) | Có (trong constructor) |
| Nguy cơ leak Context | Cao | Được kiểm soát bởi scope |

**Ba vấn đề của Singleton phải nói được:** (1) là **global state** → khó test và khó suy luận; (2) giữ Context sai → leak; (3) sống qua logout → dữ liệu user cũ rò sang user mới.`,
    pitfalls: [
      'Dùng Builder trong Kotlin/Dart khi named argument đã đủ.',
      '`object` giữ Activity context → leak.',
      'Singleton giữ session không reset khi logout.',
      'Factory với `when` khổng lồ → vi phạm OCP; cân nhắc map từ type → provider (multibinding).',
    ],
    followUps: ['Abstract Factory khác Factory Method?', 'Multibinding của Dagger thay Factory thế nào?', 'Singleton có thread-safe không trong Kotlin? (`object` có)'],
  },
  {
    id: 'behavioral-structural-patterns',
    groupId: 'arch-patterns',
    title: 'Observer, Strategy, Adapter, Facade, Decorator, Command — ví dụ thực tế?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Bạn đã dùng chúng hàng ngày: **Observer** = `Flow`/`LiveData`/`Stream`. **Strategy** = truyền interface để đổi hành vi (`Comparator`, `PaymentMethod`). **Adapter** = mapper DTO↔Entity, `RecyclerView.Adapter`. **Facade** = repository che 3 data source đằng sau một API. **Decorator** = `OkHttp Interceptor`, Kotlin `by` delegation. **Command** = event/intent trong MVI, `WorkRequest`.',
    deep: `| Pattern | Trong Android/Flutter |
|---|---|
| **Observer** | \`Flow\`, \`StateFlow\`, \`LiveData\`, \`Stream\`, \`ValueNotifier\`, \`BlocBuilder\` |
| **Strategy** | \`PaymentMethod\` interface, \`Comparator\`, \`CacheStrategy\`, \`RetryPolicy\` |
| **Adapter** | Mapper DTO→Entity, \`RecyclerView.Adapter\`, wrapper cho SDK bên thứ ba |
| **Facade** | \`Repository\` che remote + local + cache; \`AnalyticsFacade\` che Firebase + Amplitude |
| **Decorator** | \`OkHttp Interceptor\`, Kotlin \`class X : Y by impl\`, \`Dio Interceptor\` |
| **Command** | \`Intent\`/\`Event\` trong MVI/Bloc, \`WorkRequest\`, undo stack |
| **Template Method** | \`BaseViewModel.launchSafely\`, \`AbstractCoroutineWorker\` |
| **Chain of Responsibility** | Chuỗi \`Interceptor\` của OkHttp/Dio |

**Decorator qua Interceptor — ví dụ đẹp nhất:**
\`\`\`kotlin
// Mỗi interceptor "bọc" thêm một hành vi, không sửa code có sẵn
OkHttpClient.Builder()
    .addInterceptor(AuthInterceptor(tokenStore))     // thêm header
    .addInterceptor(RetryInterceptor(maxRetries = 3)) // thêm retry
    .addInterceptor(LoggingInterceptor())            // thêm log
    .build()
\`\`\`
Đây là Decorator **và** Chain of Responsibility cùng lúc.

**Strategy làm code test được:**
\`\`\`kotlin
interface RetryPolicy { fun delayFor(attempt: Int): Duration }

class ExponentialBackoff : RetryPolicy {
    override fun delayFor(attempt: Int) = (1L shl attempt).seconds
}
class NoDelay : RetryPolicy {                        // dùng trong test
    override fun delayFor(attempt: Int) = Duration.ZERO
}

class SyncWorker(private val retryPolicy: RetryPolicy)
// Test không phải chờ 8 giây thật
\`\`\`

**Facade — nơi repository thật sự là pattern:**
\`\`\`kotlin
class UserRepositoryImpl(
    private val remote: UserRemoteDataSource,
    private val dao: UserDao,
    private val cache: MemoryCache,
) : UserRepository {
    // Caller chỉ thấy MỘT method; 3 nguồn phía sau là chi tiết cài đặt
    override fun observeUser(id: String): Flow<User> = flow {
        cache.get(id)?.let { emit(it) }
        emitAll(dao.observe(id).onStart { refreshFromRemote(id) })
    }
}
\`\`\`

**Cách trả lời gây ấn tượng:** đừng đọc định nghĩa GoF. Hãy nói *"Interceptor của OkHttp là Decorator + Chain of Responsibility; tôi từng dùng nó để thêm refresh token mà không sửa một dòng nào trong 40 API call có sẵn"* — nó chứng minh bạn nhận ra pattern trong code thật.`,
    pitfalls: [
      'Đọc định nghĩa GoF mà không nối được với code hàng ngày.',
      'Áp pattern khi không cần → "pattern-itis": tạo Strategy cho một hành vi duy nhất mãi mãi.',
      'Nhầm Adapter (đổi interface) với Facade (đơn giản hoá nhiều interface).',
      'Nhầm Decorator (thêm hành vi, cùng interface) với Proxy (kiểm soát truy cập).',
    ],
    followUps: ['Decorator khác Proxy thế nào?', 'Adapter khác Facade?', 'Bạn từng bỏ một pattern vì nó làm code phức tạp hơn chưa?'],
  },

  // ============ arch-di ============
  {
    id: 'constructor-vs-field-injection',
    groupId: 'arch-di',
    title: 'Constructor injection vs field injection, runtime DI vs compile-time DI?',
    levels: ['mid'],
    source: 'pdf',
    short:
      '**Constructor injection** là mặc định đúng: phụ thuộc hiện rõ trong signature, object luôn ở trạng thái hợp lệ sau khi tạo, và test chỉ cần `new`. **Field injection** chỉ dùng ở **biên với framework** — class do hệ thống khởi tạo (Activity, Fragment, Worker). **Compile-time DI** (Dagger/Hilt) bắt lỗi lúc build; **runtime DI** (Koin) bắt lỗi lúc chạy.',
    deep: `\`\`\`kotlin
// Constructor injection — phụ thuộc là phần của hợp đồng
class UserViewModel @Inject constructor(
    private val getUser: GetUserProfile,
    private val analytics: Analytics,
) : ViewModel()
// Test: UserViewModel(FakeGetUser(), NoOpAnalytics()) — không cần framework

// Field injection — chỉ vì Activity do hệ thống tạo, ta không kiểm soát constructor
@AndroidEntryPoint
class MainActivity : AppCompatActivity() {
    @Inject lateinit var analytics: Analytics
}
\`\`\`

| | Constructor | Field |
|---|---|---|
| Phụ thuộc hiện rõ | ✅ | ❌ (phải đọc thân class) |
| Object hợp lệ ngay sau tạo | ✅ | ❌ (\`lateinit\` chưa gán) |
| Immutable (\`val\`) | ✅ | ❌ (phải \`var\` + \`lateinit\`) |
| Test không cần framework | ✅ | ❌ |
| Dùng được với class do hệ thống tạo | ❌ | ✅ |

**Compile-time vs runtime DI:**
| | Compile-time (Dagger/Hilt/KSP) | Runtime (Koin) |
|---|---|---|
| Thiếu binding | **Lỗi build** | Crash runtime |
| Chu trình phụ thuộc | Lỗi build | Stack overflow runtime |
| Thời gian build | Chậm hơn | Không ảnh hưởng |
| Startup runtime | Nhanh (code đã sinh) | Có chi phí dựng graph |
| Đọc lỗi | Thông báo Dagger khó đọc | Dễ đọc hơn |

**Vì sao compile-time thắng cho app production:** một binding bị thiếu ở nhánh code ít đi qua (màn hình chỉ admin thấy) sẽ **lọt lên production** với runtime DI, còn compile-time thì không thể build được. Đổi lại là build chậm hơn — dùng **KSP** thay KAPT để giảm đáng kể.

**Assisted injection** — khi cần kết hợp dependency từ graph *và* tham số runtime:
\`\`\`kotlin
class DetailViewModel @AssistedInject constructor(
    private val repo: ProductRepository,   // từ DI graph
    @Assisted private val productId: String,  // từ runtime
) : ViewModel() {
    @AssistedFactory
    interface Factory { fun create(productId: String): DetailViewModel }
}
\`\`\`
(Với ViewModel thì \`SavedStateHandle\` + Safe Args thường là cách gọn hơn.)`,
    pitfalls: [
      'Field injection ở class bạn tự tạo được → mất lợi ích DI.',
      'Truyền DI container/`Context` vào constructor rồi lấy dependency từ đó → service locator đội lốt.',
      'Dùng KAPT thay KSP → build chậm gấp đôi trên module lớn.',
      'Quá nhiều tham số constructor (> 5–6) → dấu hiệu class làm quá nhiều việc, không phải lỗi của DI.',
    ],
    followUps: ['`@AssistedInject` dùng khi nào?', 'KSP vs KAPT khác gì?', 'Chu trình phụ thuộc phát hiện thế nào?'],
  },

  // ============ arch-realworld ============
  {
    id: 'modularization',
    groupId: 'arch-realworld',
    title: 'Monolith vs modularization: chia module thế nào và được gì?',
    levels: ['senior'],
    source: 'pdf',
    short:
      'Chia module để (1) **build nhanh hơn** nhờ parallel + incremental build, (2) **ranh giới được compiler bảo vệ** thay vì chỉ bằng code review, (3) **giảm conflict** khi nhiều người làm, (4) mở đường cho **Play Feature Delivery**. Chia theo **feature** (`:feature:cart`) chứ không theo tầng, cộng với `:core:*` cho phần dùng chung. Cái giá: cấu hình Gradle phức tạp, và chia sai thì build **chậm hơn** monolith.',
    deep: `**Cấu trúc thường dùng (theo Now in Android của Google):**
\`\`\`text
:app                        # gắn kết, navigation graph gốc
:feature:cart               # UI + ViewModel + navigation của một feature
:feature:checkout
:feature:profile
:core:designsystem          # theme, component dùng chung
:core:data                  # repository implementation
:core:domain                # entity, use case
:core:network               # Retrofit/Ktor, interceptor
:core:database              # Room
:core:testing               # fake, test utils
\`\`\`

**Quy tắc phụ thuộc:** \`:feature:*\` **không được** phụ thuộc lẫn nhau. Nếu cart cần mở checkout, nó không import \`:feature:checkout\` mà dùng **route/deep link** hoặc một interface navigation ở \`:core\`. Vi phạm quy tắc này là cách nhanh nhất biến multi-module thành "monolith có nhiều file build.gradle".

**Lợi ích build — nhưng có điều kiện:**
| | Monolith | Multi-module đúng | Multi-module sai |
|---|---|---|---|
| Sửa một file UI | Rebuild cả app | Rebuild 1 module | Rebuild cả cây phụ thuộc |
| Build song song | Không | Có | Hạn chế |

Điều kiện để có lợi: **dùng \`api\` rất tiết kiệm, \`implementation\` mặc định**. \`api\` khiến phụ thuộc "rò" sang module khác → sửa một file trong \`:core:network\` là rebuild mọi module. Đây là lỗi phổ biến nhất khiến multi-module chậm hơn monolith.

**Công cụ đáng nêu:**
- **Convention plugin** (\`build-logic/\`) thay vì copy-paste 40 dòng \`android { }\` vào mỗi module.
- **Version catalog** (\`gradle/libs.versions.toml\`) để version tập trung.
- **Gradle configuration cache + build cache** — thường cho lợi ích lớn hơn cả việc chia module.
- **Module graph assertion** (plugin kiểm tra ai được phụ thuộc ai) để quy tắc không bị vi phạm âm thầm.

**Khi nào chưa nên chia:** app < 10 màn hình, team ≤ 3 người, build đã dưới 1 phút. Chia module lúc đó chỉ thêm chi phí. Dấu hiệu **đã đến lúc**: build > 3–5 phút, nhiều conflict trong cùng file, hoặc cần feature on-demand.

**Trong Flutter:** tương đương là chia thành **package** trong monorepo với **melos**. Cùng nguyên tắc: feature-first, core dùng chung, không phụ thuộc chéo giữa feature.`,
    pitfalls: [
      'Chia theo tầng (`:data`, `:domain`, `:ui`) → mọi task đụng cả 3 module, không có lợi ích build.',
      'Dùng `api` bừa bãi → phụ thuộc rò khắp nơi, build chậm hơn monolith.',
      'Feature phụ thuộc feature → cây phụ thuộc rối, không tách được.',
      'Chia 20 module cho app nhỏ → thời gian configuration của Gradle lấn hết lợi ích.',
      'Không có convention plugin → 20 file `build.gradle.kts` gần giống nhau, sửa version phải sửa 20 chỗ.',
    ],
    followUps: [
      '`api` vs `implementation` khác gì về build?',
      'Feature này cần mở feature kia thì làm sao?',
      'Đo build time trước/sau bằng gì? (Gradle build scan)',
    ],
  },
  {
    id: 'error-handling-architecture',
    groupId: 'arch-realworld',
    title: 'Thiết kế error handling xuyên các tầng thế nào?',
    levels: ['senior'],
    source: 'pdf',
    short:
      'Nguyên tắc: **biến exception của hạ tầng thành kiểu lỗi của domain ngay tại biên data**, rồi truyền lên bằng `Result`/`Either` (kiểu tường minh) thay vì để exception bay xuyên tầng. Presentation map lỗi domain sang thông điệp cho user. Ba loại lỗi phải phân biệt: **lỗi có thể retry** (mạng), **lỗi nghiệp vụ** (hết hàng), **lỗi lập trình** (không catch, để crash).',
    deep: `\`\`\`kotlin
// domain: kiểu lỗi thuộc nghiệp vụ, không phải IOException
sealed interface AppError {
    data object NoConnection : AppError
    data object Timeout : AppError
    data class Server(val code: Int) : AppError
    data object Unauthorized : AppError
    data class Business(val code: String, val message: String) : AppError   // server gửi
    data class Unknown(val cause: Throwable) : AppError
}

// data: nơi DUY NHẤT biết về HttpException/IOException
private inline fun <T> safeCall(block: () -> T): Result<T, AppError> = try {
    Result.Success(block())
} catch (e: CancellationException) {
    throw e                                   // KHÔNG bắt cancel
} catch (e: UnknownHostException) {
    Result.Failure(AppError.NoConnection)
} catch (e: SocketTimeoutException) {
    Result.Failure(AppError.Timeout)
} catch (e: HttpException) {
    when (e.code()) {
        401 -> Result.Failure(AppError.Unauthorized)
        in 400..499 -> Result.Failure(e.parseBusinessError())
        else -> Result.Failure(AppError.Server(e.code()))
    }
} catch (e: Throwable) {
    Result.Failure(AppError.Unknown(e))
}

// presentation: map sang thông điệp user đọc được
fun AppError.toUserMessage(): UiText = when (this) {
    NoConnection -> UiText.Res(R.string.error_no_connection)
    Timeout -> UiText.Res(R.string.error_timeout)
    is Business -> UiText.Raw(message)        // server đã việt hoá
    Unauthorized -> UiText.Res(R.string.error_session_expired)
    else -> UiText.Res(R.string.error_generic)
}
\`\`\`

**Ba quyết định thiết kế cần nói được:**

1. **\`Result\` vs exception.** \`Result\` làm lỗi **hiện trong signature** → compiler nhắc bạn xử lý; exception thì im lặng và dễ lọt lên crash. Đánh đổi: verbose hơn. Quy ước thực dụng: dùng \`Result\` cho lỗi **dự kiến được** (mạng, nghiệp vụ), để exception cho lỗi **lập trình** (\`IllegalStateException\` khi state không thể xảy ra) — những lỗi này *nên* crash để bạn biết mà sửa.

2. **Lỗi nào retry, lỗi nào không.** Mã hoá vào kiểu: \`NoConnection\`/\`Timeout\`/\`Server(5xx)\` là retryable; \`Business\`/\`Unauthorized\`/\`Server(4xx)\` thì không. UI dùng thông tin này để hiện nút "Thử lại" hay không.

3. **Xử lý 401 tập trung** ở interceptor (refresh token, nếu thất bại thì phát event logout toàn app) — không để mỗi màn hình tự xử lý.

**Không được làm:**
- Hiện \`e.message\` của exception cho user (\`"Failed to connect to /10.0.2.2:8080"\`).
- \`catch (e: Exception) { }\` rỗng — lỗi biến mất, bug không tìm được.
- Bắt \`CancellationException\` (phá cancel của coroutine).
- Để \`HttpException\` của Retrofit đi lên tới UI (UI biết về HTTP là phá dependency rule).

**Quan sát trong production:** log lỗi non-fatal kèm **breadcrumb** (màn hình, action, request id) lên Crashlytics/Sentry — vì lỗi được xử lý gọn không tạo crash, bạn sẽ **không biết** nó xảy ra bao nhiêu lần nếu không log.`,
    pitfalls: [
      'Hiện message kỹ thuật cho user.',
      '`catch (e: Exception) {}` rỗng làm lỗi biến mất.',
      'Bắt `CancellationException` → coroutine không cancel được.',
      'Để exception của Retrofit/Room lan tới presentation.',
      'Không log lỗi đã xử lý → không biết tần suất thật.',
      'Xử lý 401 rải rác ở từng màn hình.',
    ],
    followUps: [
      '`Result` của Kotlin vs `Either` của Arrow?',
      'Retry với exponential backoff implement ở tầng nào?',
      'Offline thì hiện lỗi hay hiện dữ liệu cache?',
    ],
  },
]
