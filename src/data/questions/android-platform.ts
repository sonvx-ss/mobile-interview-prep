import type { Question } from '../types'

export const ANDROID_PLATFORM_QUESTIONS: Question[] = [
  // ============ and-storage ============
  {
    id: 'sharedpreferences-vs-datastore',
    groupId: 'and-storage',
    title: 'SharedPreferences vs DataStore? `commit()` và `apply()` khác gì?',
    levels: ['junior', 'mid'],
    source: 'pdf',
    short:
      '`commit()` ghi **đồng bộ** — chặn thread gọi nó và trả về `Boolean` thành công/thất bại. `apply()` ghi **bất đồng bộ**, không trả kết quả, nhưng cập nhật in-memory ngay nên `get` sau đó vẫn ra giá trị mới. **DataStore** là bản thay thế hiện đại: API `suspend`/`Flow`, không bao giờ chặn main thread, xử lý lỗi tường minh, và transactional.',
    deep: `**\`commit()\` vs \`apply()\`:**

| | \`commit()\` | \`apply()\` |
|---|---|---|
| Ghi disk | Đồng bộ — **block thread** | Bất đồng bộ |
| Trả về | \`Boolean\` | \`Unit\` |
| Cập nhật in-memory | Ngay | **Ngay** (nên \`get\` sau đó vẫn đúng) |
| Rủi ro | ANR nếu gọi trên main thread | Không biết được nếu ghi thất bại |

Chi tiết ít người biết: nếu bạn đã gọi \`apply()\` và nó **đang** ghi, thì một lời gọi \`commit()\` sau đó sẽ **bị chặn** cho tới khi mọi \`apply()\` trước đó hoàn tất. Nên trộn lẫn hai cái là cách nhanh nhất tạo ANR khó tái hiện.

**Vấn đề lớn hơn của SharedPreferences** — vì sao Google thay nó:
1. **Lần \`getSharedPreferences()\` đầu tiên đọc toàn bộ file XML đồng bộ**, dù bạn gọi từ main thread. File lớn = ANR ngay lúc khởi động.
2. Không có cách báo lỗi (\`apply()\` fail thì bạn không biết).
3. Không transactional, không type-safe.
4. Không phát tín hiệu thay đổi dạng Flow (\`OnSharedPreferenceChangeListener\` thì thô sơ).

**DataStore hai loại:**
- **Preferences DataStore** — key/value, thay thế trực tiếp SharedPreferences.
- **Proto DataStore** — có schema (protobuf), type-safe hoàn toàn. Tốt cho object phức tạp.

**Cả hai đều KHÔNG phải DB.** DataStore đọc/ghi cả file mỗi lần → không dùng cho dữ liệu lớn hay cần query. Dữ liệu dạng bảng → Room.`,
    code: [
      {
        lang: 'kotlin',
        caption: 'Preferences DataStore: đọc bằng Flow, ghi bằng suspend, có xử lý lỗi',
        source: `private val Context.dataStore by preferencesDataStore(name = "settings")

class SettingsRepository @Inject constructor(@ApplicationContext ctx: Context) {
    private val store = ctx.dataStore
    private val darkKey = booleanPreferencesKey("dark_mode")

    val darkMode: Flow<Boolean> = store.data
        .catch { e ->
            // File hỏng -> trả mặc định thay vì crash (SharedPreferences không làm được)
            if (e is IOException) emit(emptyPreferences()) else throw e
        }
        .map { it[darkKey] ?: false }

    suspend fun setDarkMode(enabled: Boolean) {
        store.edit { it[darkKey] = enabled }   // transactional, không block main thread
    }
}`,
      },
      {
        lang: 'kotlin',
        caption: 'Migrate từ SharedPreferences sang DataStore',
        source: `val Context.dataStore by preferencesDataStore(
    name = "settings",
    produceMigrations = { ctx ->
        listOf(SharedPreferencesMigration(ctx, "old_prefs_name"))
    },
)`,
      },
    ],
    pitfalls: [
      'Dùng `commit()` trên main thread → ANR khi file lớn.',
      'Nghĩ `apply()` là "hoàn toàn an toàn" — nó vẫn ghi disk trong background và có thể fail âm thầm.',
      'Lưu token/PII vào SharedPreferences thường (máy root đọc được) — dùng `EncryptedSharedPreferences`.',
      'Dùng DataStore để lưu list hàng nghìn phần tử — nó rewrite cả file mỗi lần ghi.',
      'Quên `.catch { }` cho `store.data` → file hỏng là crash.',
    ],
    followUps: ['Proto DataStore vs Preferences DataStore?', 'DataStore có an toàn với multi-process không? (Không)', 'Migrate dần thế nào?'],
  },
  {
    id: 'room-basics',
    groupId: 'and-storage',
    title: 'Room hoạt động thế nào? `suspend` DAO và `Flow` DAO khác gì?',
    levels: ['mid'],
    source: 'pdf',
    short:
      'Room là ORM sinh code lúc **compile time** — nó **verify câu SQL của bạn khi build**, đó là giá trị lớn nhất so với SQLite thuần. DAO trả `suspend fun` cho truy vấn **một lần**; trả `Flow<T>` cho truy vấn **quan sát liên tục** — Room tự phát lại khi bảng liên quan thay đổi.',
    deep: `**Ba thành phần:** \`@Entity\` (bảng) → \`@Dao\` (truy vấn) → \`@Database\` (điểm gom, giữ version).

\`\`\`kotlin
@Entity(
    tableName = "users",
    indices = [Index(value = ["email"], unique = true)],   // index cho cột hay query
)
data class UserEntity(
    @PrimaryKey val id: String,
    val email: String,
    val name: String,
    @ColumnInfo(name = "updated_at") val updatedAt: Long,
)

@Dao
interface UserDao {
    @Query("SELECT * FROM users WHERE id = :id")
    suspend fun getUser(id: String): UserEntity?          // một lần

    @Query("SELECT * FROM users ORDER BY name")
    fun observeUsers(): Flow<List<UserEntity>>            // liên tục, tự phát lại khi bảng đổi

    @Upsert
    suspend fun upsert(user: UserEntity)

    @Transaction                                          // nhiều thao tác -> nguyên tử
    suspend fun replaceAll(users: List<UserEntity>) {
        deleteAll()
        insertAll(users)
    }
}
\`\`\`

**\`Flow\` DAO — chi tiết quan trọng:** Room theo dõi ở mức **bảng**, không phải dòng. Nên \`observeUsers()\` phát lại khi *bất kỳ* dòng nào trong \`users\` đổi, kể cả dòng không liên quan tới query của bạn. Với query nặng, thêm \`.distinctUntilChanged()\` để tránh render lại vô ích.

**Transaction:** \`@Transaction\` đảm bảo nguyên tử. Bắt buộc dùng khi (1) nhiều thao tác phải cùng thành công, (2) \`@Relation\` với nhiều bảng (Room chạy nhiều query, cần transaction để dữ liệu nhất quán).

**Index:** thiếu index trên cột trong \`WHERE\`/\`ORDER BY\` → full table scan. Room cảnh báo khi có \`@ForeignKey\` không index. Kiểm tra bằng \`EXPLAIN QUERY PLAN\`. Nhưng index cũng làm **ghi chậm hơn** và tốn dung lượng → chỉ index cột thật sự query nhiều.

**Kiểm tra ở compile time:** Room bắt lỗi SQL, sai tên cột, thiếu migration — nên bug DB lộ ra lúc build thay vì trên máy user. Đây là lý do chọn Room thay vì raw SQLite.`,
    pitfalls: [
      'Query trả về kiểu không `suspend`/`Flow` → Room throw "Cannot access database on the main thread".',
      'Quên `@Transaction` cho `@Relation` phức tạp → dữ liệu không nhất quán.',
      'Trả `Flow` cho query rất nặng và không `distinctUntilChanged` → mỗi lần ghi bất kỳ đều recompute.',
      'Dùng `allowMainThreadQueries()` để "cho nhanh" — che ANR.',
      'Lưu list/object bằng `@TypeConverter` với JSON rồi query theo nội dung bên trong → không thể index.',
    ],
    followUps: ['Room migration làm thế nào?', '`@Relation` vs JOIN thủ công?', 'Paging 3 tích hợp với Room ra sao?'],
  },
  {
    id: 'room-migration',
    groupId: 'and-storage',
    title: 'Room migration: làm thế nào cho an toàn?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Mỗi lần đổi schema phải **tăng `version`** và cung cấp `Migration` từ version cũ sang mới, nếu không app **crash** (`IllegalStateException`) trên máy đã cài bản trước. Bắt buộc: **export schema** (`room.schemaLocation`) và **viết test migration** với `MigrationTestHelper`. `fallbackToDestructiveMigration()` **xoá sạch dữ liệu user** — không bao giờ dùng ở production.',
    deep: `\`\`\`kotlin
val MIGRATION_2_3 = object : Migration(2, 3) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("ALTER TABLE users ADD COLUMN phone TEXT")
        db.execSQL("CREATE INDEX IF NOT EXISTS index_users_email ON users(email)")
    }
}

Room.databaseBuilder(ctx, AppDatabase::class.java, "app.db")
    .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
    .build()
\`\`\`

**AutoMigration (Room 2.4+)** cho các thay đổi đơn giản (thêm cột, thêm bảng, rename có annotation):
\`\`\`kotlin
@Database(
    entities = [UserEntity::class],
    version = 3,
    autoMigrations = [AutoMigration(from = 2, to = 3)],
    exportSchema = true,
)
abstract class AppDatabase : RoomDatabase()
\`\`\`
AutoMigration **không** xử lý được thay đổi phức tạp (đổi kiểu cột, tách bảng, biến đổi dữ liệu) — vẫn phải viết \`Migration\` thủ công, hoặc \`AutoMigration\` kèm \`spec\`.

**Bốn việc bắt buộc phải làm:**
1. **Export schema** — thêm \`ksp { arg("room.schemaLocation", "\$projectDir/schemas") }\` và **commit file JSON vào git**. Không có nó thì không viết được test migration và không biết schema bản đã release là gì.
2. **Test migration**:
\`\`\`kotlin
@get:Rule
val helper = MigrationTestHelper(
    InstrumentationRegistry.getInstrumentation(),
    AppDatabase::class.java,
)

@Test
fun migrate2To3() {
    helper.createDatabase(TEST_DB, 2).use { db ->
        db.execSQL("INSERT INTO users VALUES ('1','a@b.c','A',0)")
    }
    val db = helper.runMigrationsAndValidate(TEST_DB, 3, true, MIGRATION_2_3)
    db.query("SELECT phone FROM users WHERE id='1'").use {
        assertThat(it.moveToFirst()).isTrue()
        assertThat(it.isNull(0)).isTrue()      // cột mới, giá trị null
    }
}
\`\`\`
3. **Migration nhiều bước phải test cả chuỗi** — user có thể nhảy từ version 1 lên 5 (bỏ qua các bản giữa). Room chạy tuần tự 1→2→3→4→5, nên phải có đủ mọi bước.
4. **Không đổi migration đã release.** Nếu đã phát hành \`MIGRATION_2_3\` có bug, thêm \`MIGRATION_3_4\` để sửa, đừng sửa cái cũ.

**SQLite không hỗ trợ \`ALTER COLUMN\`** → đổi kiểu cột phải: tạo bảng mới → copy dữ liệu → drop bảng cũ → rename. Nhớ tắt/bật foreign key và làm trong transaction.`,
    pitfalls: [
      '`fallbackToDestructiveMigration()` trong release → xoá toàn bộ dữ liệu offline của user.',
      'Không commit schema JSON → không test được, và không biết bản đã release có schema gì.',
      'Chỉ test 4→5 mà quên user còn ở version 2.',
      'Sửa migration đã phát hành.',
      'Migration nặng (biến đổi hàng triệu dòng) chạy trên main thread lúc mở app → ANR.',
    ],
    followUps: ['AutoMigration xử lý được gì và không được gì?', 'Đổi kiểu cột trong SQLite làm sao?', 'Migration lỗi trên máy user thì recover thế nào?'],
  },
  {
    id: 'offline-first-android',
    groupId: 'and-storage',
    title: 'Offline-first: kiến trúc và cách xử lý xung đột?',
    levels: ['senior'],
    source: 'pdf',
    short:
      'Nguyên tắc cốt lõi: **DB local là single source of truth**, UI **chỉ đọc từ DB** (qua `Flow`), network chỉ là cơ chế *đồng bộ vào DB*. Ghi thì ghi local ngay (optimistic) + đưa vào **outbox queue** để WorkManager đẩy lên server, có retry. Xung đột giải quyết bằng **last-write-wins theo server timestamp** (đơn giản), hoặc merge theo field, hoặc để user chọn.',
    deep: `**Kiến trúc:**
\`\`\`text
UI  <-- Flow --  Room (source of truth)
                   ^                 ^
                   |                 |
             sync (đọc)         outbox (ghi)
                   |                 |
                 Remote API  <-- WorkManager
\`\`\`
Điểm quan trọng: UI **không bao giờ** đọc trực tiếp từ network. Nhờ vậy màn hình luôn có dữ liệu để vẽ, kể cả offline, và không có state "loading" nhấp nháy khi rotate.

**Ghi khi offline — outbox pattern:**
\`\`\`kotlin
@Entity(tableName = "outbox")
data class OutboxEntry(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val entityType: String,
    val entityId: String,
    val operation: String,          // CREATE / UPDATE / DELETE
    val payload: String,            // JSON
    val createdAt: Long,
    val attempts: Int = 0,
)

suspend fun updateNote(note: Note) {
    db.withTransaction {
        noteDao.upsert(note.copy(syncState = PENDING))    // UI thấy ngay
        outboxDao.insert(note.toOutboxEntry(UPDATE))
    }
    syncScheduler.scheduleSync()                          // WorkManager, có constraint network
}
\`\`\`

**Bốn vấn đề bắt buộc phải giải và cách giải:**

| Vấn đề | Cách giải |
|---|---|
| ID của bản ghi tạo offline | Sinh **UUID ở client** (không dùng auto-increment của server), server nhận id đó → không cần map lại |
| Gửi trùng khi retry | **Idempotency key** trong header, server dedupe |
| Xung đột khi cùng bản ghi bị sửa hai nơi | Version/ETag: gửi kèm version đang có; server trả **409** nếu cũ → client fetch lại và merge |
| Thứ tự thao tác | Outbox xử lý **FIFO theo entity**; không gửi UPDATE trước CREATE |

**Ba chiến lược conflict resolution:**
1. **Last-write-wins theo server clock** — đơn giản, mất dữ liệu ngầm. Chấp nhận được với dữ liệu ít quan trọng.
2. **Merge theo field** — mỗi field có timestamp riêng; A đổi title, B đổi body thì giữ cả hai. Cần schema phức tạp hơn.
3. **Để user quyết** — hiện dialog "bản trên máy / bản trên server". Đúng nhất cho dữ liệu quan trọng (note, tài liệu).

**Đừng dùng \`updatedAt\` của client** làm căn cứ so sánh — đồng hồ máy user có thể sai vài năm. Luôn dùng timestamp/version do **server** cấp.

**Trạng thái hiển thị cho user:** mỗi entity nên có \`syncState\` (SYNCED / PENDING / FAILED) để UI hiện icon "đang chờ đồng bộ" — user cần biết dữ liệu của họ đã lên server chưa.`,
    pitfalls: [
      'UI đọc từ network trước, fallback DB → offline là màn trắng, và có hai nguồn sự thật.',
      'Dùng auto-increment id của server → không tạo được bản ghi khi offline.',
      'Không có idempotency key → retry tạo bản ghi trùng.',
      'So sánh conflict bằng đồng hồ client.',
      'Không hiện trạng thái sync cho user → user tưởng đã lưu xong rồi mất dữ liệu.',
    ],
    followUps: [
      'CRDT giải quyết conflict thế nào và có đáng dùng trên mobile?',
      'Đồng bộ delta (chỉ lấy thay đổi từ lần cuối) thiết kế API ra sao?',
      'Xử lý xoá: soft delete hay tombstone?',
    ],
  },

  // ============ and-di ============
  {
    id: 'hilt-vs-koin-vs-dagger',
    groupId: 'and-di',
    title: 'Hilt, Dagger và Koin khác nhau thế nào? Chọn cái nào?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      '**Dagger/Hilt** là DI **compile-time**: lỗi thiếu dependency bị bắt **khi build**, không có overhead reflection lúc chạy, nhưng build chậm hơn. **Koin** là **service locator runtime**: viết nhanh, không code gen, nhưng thiếu binding chỉ nổ **lúc runtime**. **Hilt** = Dagger + template sẵn cho Android (component theo lifecycle). Dự án Android production: chọn **Hilt**. Koin phù hợp KMP hoặc dự án nhỏ/prototype.',
    deep: `| | Hilt / Dagger | Koin |
|---|---|---|
| Bản chất | DI compile-time (code gen) | Service locator runtime (DSL) |
| Lỗi thiếu binding | **Compile error** | Runtime crash |
| Hiệu năng runtime | Không overhead | Có (tra bảng, reflection nhẹ) |
| Thời gian build | Chậm hơn (KSP/KAPT) | Không ảnh hưởng |
| Học | Dốc | Dễ |
| Boilerplate | Nhiều hơn (Hilt đã giảm nhiều) | Rất ít |
| KMP | Dagger không; Hilt không | **Có** |
| Test | Dễ (\`@TestInstallIn\`, \`@BindValue\`) | Dễ (\`loadKoinModules\`) |

**Điểm mấu chốt về khái niệm:** Koin *về mặt kỹ thuật* là **Service Locator**, không phải DI thuần — class **chủ động đi lấy** dependency (\`by inject()\`) thay vì **được đưa vào** qua constructor. Hệ quả: phụ thuộc bị ẩn (không đọc được từ signature của constructor) và class bị buộc vào framework Koin. Nói được điều này là ăn điểm.

**Scope trong Hilt** — bảng phải nhớ:

| Annotation | Component | Sống theo |
|---|---|---|
| \`@Singleton\` | \`SingletonComponent\` | Application |
| \`@ActivityRetainedScoped\` | \`ActivityRetainedComponent\` | **Sống qua rotate** (như ViewModel) |
| \`@ViewModelScoped\` | \`ViewModelComponent\` | Một ViewModel |
| \`@ActivityScoped\` | \`ActivityComponent\` | Activity (chết khi rotate) |
| \`@FragmentScoped\` | \`FragmentComponent\` | Fragment |

\`\`\`kotlin
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides @Singleton
    fun okHttp(): OkHttpClient = OkHttpClient.Builder().build()

    @Provides @Singleton
    fun api(client: OkHttpClient): Api = Retrofit.Builder()
        .baseUrl(BuildConfig.BASE_URL).client(client)
        .addConverterFactory(MoshiConverterFactory.create())
        .build().create(Api::class.java)
}

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    // @Binds hiệu quả hơn @Provides khi chỉ map interface -> impl (không sinh method)
    @Binds abstract fun bind(impl: UserRepositoryImpl): UserRepository
}

@HiltViewModel
class UserViewModel @Inject constructor(
    private val repo: UserRepository,
    private val handle: SavedStateHandle,     // Hilt inject sẵn
) : ViewModel()
\`\`\`

**Dùng KSP thay KAPT** cho Hilt — build nhanh hơn đáng kể (2× trở lên trên module lớn).`,
    pitfalls: [
      'Inject `@ActivityContext` vào class `@Singleton` → **memory leak** (singleton giữ Activity mãi).',
      'Dùng `@Singleton` cho mọi thứ → object sống suốt đời app dù chỉ cần một màn hình.',
      'Nhầm `@ActivityScoped` với `@ActivityRetainedScoped` — cái đầu chết khi rotate.',
      'Dùng `@Provides` khi `@Binds` đủ (chậm hơn, sinh nhiều code hơn).',
      'Nói Koin là DI mà không biết nó là service locator.',
    ],
    followUps: [
      '`@Binds` vs `@Provides`?',
      'Multibinding (`@IntoSet`, `@IntoMap`) dùng để làm gì?',
      'Test với `@TestInstallIn` thế nào?',
      'Hilt trong multi-module project tổ chức ra sao?',
    ],
  },
  {
    id: 'di-vs-service-locator',
    groupId: 'and-di',
    title: 'Dependency Injection và Service Locator khác nhau thế nào?',
    levels: ['mid'],
    source: 'pdf',
    short:
      'Với **DI**, dependency được **đưa vào** từ bên ngoài (thường qua constructor) — class không biết ai tạo ra chúng. Với **Service Locator**, class **tự đi lấy** từ một registry toàn cục. DI tốt hơn vì phụ thuộc **hiện rõ trong signature**, dễ test bằng cách truyền fake, và class không phụ thuộc vào framework.',
    deep: `\`\`\`kotlin
// Service Locator: phụ thuộc bị ẩn
class UserViewModel : ViewModel() {
    private val repo = ServiceLocator.get<UserRepository>()   // đọc constructor không biết gì
    // Test: phải set up ServiceLocator toàn cục trước mỗi test, dễ rò state giữa các test
}

// DI: phụ thuộc là phần của hợp đồng
class UserViewModel(private val repo: UserRepository) : ViewModel()
// Test: UserViewModel(FakeUserRepository()) — hết.
\`\`\`

**Ba điểm khác biệt thực tế:**
1. **Khả năng đọc hiểu**: constructor cho biết class cần gì. Với service locator bạn phải đọc hết thân class.
2. **Khả năng test**: DI không cần thiết lập gì toàn cục. Service locator cần init/reset registry, và test dễ ảnh hưởng lẫn nhau.
3. **Compile-time safety**: thiếu binding trong Dagger/Hilt là **lỗi build**. Với service locator là crash runtime — có thể lọt lên production ở nhánh code ít đi qua.

**Tại sao service locator vẫn tồn tại:** đơn giản, không cần code gen, và trong Android có chỗ **buộc** phải dùng nó — những class do **hệ thống khởi tạo** (Activity, Fragment, Service, Worker) không có constructor của bạn. Đó chính là lý do Hilt cần \`@AndroidEntryPoint\`: nó sinh code để *inject vào field* của những class này, tức là một dạng service locator được kiểm soát ở biên.

**Nguyên tắc:** dùng constructor injection ở **mọi nơi bạn kiểm soát được việc khởi tạo**; chỉ dùng field injection / locator tại **biên với framework**.`,
    pitfalls: [
      'Field injection ở khắp nơi (`@Inject lateinit var`) trong class bạn tự tạo được — mất hết lợi ích của DI.',
      'Truyền cả DI container/`Context` vào constructor rồi lấy dependency từ đó → service locator đội lốt DI.',
      'Nghĩ "dùng Hilt là đã DI đúng" — vẫn có thể viết field injection sai ở mọi chỗ.',
    ],
    followUps: ['Vì sao Hilt cần `@AndroidEntryPoint`?', 'Constructor injection với class do hệ thống tạo thì làm sao? (AssistedInject)'],
  },
  {
    id: 'hilt-scope-lifecycle',
    groupId: 'and-di',
    title: 'Scope trong Hilt: chọn sai gây hậu quả gì?',
    levels: ['mid', 'senior'],
    short:
      'Scope quyết định **một instance được chia sẻ trong phạm vi nào và sống bao lâu**. Chọn scope quá rộng (`@Singleton` cho mọi thứ) → tốn RAM, giữ state cũ, và nếu giữ Context của Activity thì **leak**. Chọn quá hẹp → mỗi lần inject tạo instance mới, cache/OkHttp bị nhân bản. Quy tắc: **object được inject phải có scope hẹp hơn hoặc bằng scope của thứ nó giữ**.',
    deep: `**Không scope (unscoped) là mặc định và thường đúng:** mỗi lần inject tạo mới. Dùng cho object nhẹ, không state — UseCase, Mapper.

**Khi nào cần scope:**
| Cần | Scope |
|---|---|
| OkHttp, Retrofit, Room database, DataStore | \`@Singleton\` (đắt để tạo, thread-safe, không giữ Activity) |
| State chia sẻ giữa các Fragment trong một luồng (checkout) | \`@ActivityRetainedScoped\` hoặc ViewModel theo nav graph |
| Cache tạm của một màn hình | \`@ViewModelScoped\` |
| Object cần Activity context (dialog helper) | \`@ActivityScoped\` |

**Quy tắc leak — quan trọng nhất:**
\`\`\`kotlin
// LEAK: @Singleton giữ Activity mãi mãi
@Singleton
class NavigationHelper @Inject constructor(@ActivityContext private val ctx: Context)

// OK
@ActivityScoped
class NavigationHelper @Inject constructor(@ActivityContext private val ctx: Context)

// OK
@Singleton
class ThemeManager @Inject constructor(@ApplicationContext private val ctx: Context)
\`\`\`
Hilt **không** bắt được lỗi này khi build nếu bạn lấy Context qua \`@ApplicationContext\` rồi cast, nên phải tự cẩn thận. (Nó có bắt được nếu bạn inject binding từ component hẹp vào component rộng.)

**\`@ActivityRetainedScoped\` là scope hay bị bỏ qua nhưng rất hữu ích:** nó sống qua rotate (gắn với \`ViewModelStore\` của Activity), nên dùng cho state của một luồng nhiều màn hình mà không cần dựng shared ViewModel.

**State toàn cục ẩn trong \`@Singleton\`:** nếu \`@Singleton class UserSession\` giữ user đang đăng nhập, thì sau logout bạn phải **tự reset** nó — dễ quên và gây bug "đăng nhập account khác vẫn thấy dữ liệu cũ". Cân nhắc scope theo phiên đăng nhập (custom component) hoặc reset tường minh.`,
    pitfalls: [
      '`@Singleton` mặc định cho mọi class → RAM và state cũ.',
      'Giữ Activity context trong scope rộng hơn Activity.',
      'Quên reset singleton giữ session khi logout.',
      'Nhầm `@ActivityScoped` (chết khi rotate) với `@ActivityRetainedScoped` (sống qua rotate).',
    ],
    followUps: ['Custom component/scope trong Hilt tạo thế nào?', 'Logout thì clear state ở đâu?', 'Hilt bắt được lỗi scope nào ở compile time?'],
  },

  // ============ and-security ============
  {
    id: 'android-keystore-r8',
    groupId: 'and-security',
    title: 'Android Keystore, EncryptedSharedPreferences và R8/ProGuard — mỗi cái giải quyết gì?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      '**Keystore** giữ khoá mã hoá trong phần cứng (TEE/StrongBox) — khoá **không bao giờ ra khỏi** đó, app chỉ nhờ nó ký/giải mã. **EncryptedSharedPreferences** dùng khoá từ Keystore để mã hoá cả key và value của prefs. **R8** làm shrink + obfuscate + optimize code — nó chống **đọc hiểu**, không phải chống truy cập dữ liệu. Ba thứ giải quyết ba vấn đề khác nhau, không thay thế nhau.',
    deep: `**Keystore — điều then chốt:** private key được sinh *bên trong* hardware keystore và không thể export. Kể cả máy root cũng không lấy được khoá ra (chỉ có thể *nhờ* keystore dùng khoá nếu chạy được code trong app). Có thể yêu cầu **user authentication** (biometric/PIN) mỗi lần dùng khoá:

\`\`\`kotlin
val spec = KeyGenParameterSpec.Builder("payment_key",
        KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
    .setUserAuthenticationRequired(true)        // cần biometric
    .setUserAuthenticationParameters(30, KeyProperties.AUTH_BIOMETRIC_STRONG)
    .setIsStrongBoxBacked(true)                 // chip bảo mật riêng nếu máy có
    .build()
\`\`\`
Lưu ý: khoá yêu cầu auth sẽ **bị vô hiệu** khi user đổi/xoá lock screen hoặc thêm dấu vân tay mới (\`setInvalidatedByBiometricEnrollment\`) → phải xử lý \`KeyPermanentlyInvalidatedException\` và cho user đăng nhập lại.

**R8 — ba việc nó làm:**
1. **Shrink**: xoá class/method không dùng (giảm dex đáng kể).
2. **Obfuscate**: đổi tên → \`a.b.c()\`. Sinh ra \`mapping.txt\` — **bắt buộc lưu lại** để giải mã crash.
3. **Optimize**: inline, bỏ code chết, đơn giản hoá control flow. **Full mode** (mặc định từ AGP 8) tối ưu mạnh hơn nhưng giả định code không dùng reflection tuỳ tiện.

**Cái R8 hay phá và cách giữ:**
\`\`\`text
# Model dùng reflection (Gson/Moshi)
-keep class com.example.model.** { *; }
# Hoặc tốt hơn: dùng Moshi codegen / kotlinx.serialization -> không cần rule

# Giữ tên field cho Gson nhưng cho phép rename class
-keepclassmembers class * { @com.google.gson.annotations.SerializedName <fields>; }

# Enum dùng valueOf()
-keepclassmembers enum * { public static **[] values(); public static ** valueOf(java.lang.String); }

# Giữ dòng số để đọc được stack trace
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
\`\`\`

**Điều R8 KHÔNG làm:** không mã hoá string. Endpoint, API key, thông điệp lỗi vẫn nằm nguyên trong DEX và \`strings\` là đọc được. Đó là vì sao secret phải ở server.`,
    pitfalls: [
      'Tưởng R8 = mã hoá. Nó chỉ đổi tên; logic và string vẫn đọc được bằng jadx.',
      'Không lưu `mapping.txt` mỗi bản release → crash production không đọc được.',
      'Không test release build (chỉ test debug) → R8 phá reflection và crash chỉ xảy ra trên Play.',
      'Không xử lý `KeyPermanentlyInvalidatedException` → user thêm vân tay mới là app hỏng.',
      'Dùng AES/ECB hoặc IV cố định khi tự mã hoá.',
    ],
    followUps: ['StrongBox vs TEE?', 'R8 full mode phá gì?', 'Làm sao upload mapping tự động lên Crashlytics?'],
  },

  // ============ and-build ============
  {
    id: 'apk-vs-aab',
    groupId: 'and-build',
    title: 'APK và AAB (App Bundle) khác nhau thế nào? Cấu trúc APK gồm gì?',
    levels: ['mid'],
    source: 'pdf',
    short:
      '**APK** là file cài đặt hoàn chỉnh, chứa **mọi** ABI/density/language. **AAB** là định dạng **publish** — bạn upload lên Play, Play **sinh APK riêng cho từng thiết bị** (split APK) nên user tải nhỏ hơn 20–35%. Từ 8/2021, app mới **buộc** phải nộp AAB. AAB không cài trực tiếp được; muốn test thì dùng `bundletool`.',
    deep: `**Cấu trúc APK** (là một file ZIP):
\`\`\`text
app.apk
├── AndroidManifest.xml       (binary XML)
├── classes.dex, classes2.dex (bytecode DEX; nhiều file nếu multidex)
├── resources.arsc            (bảng resource đã compile)
├── res/                      (drawable, layout đã compile)
├── assets/                   (file thô, đọc bằng AssetManager)
├── lib/<abi>/*.so            (native library theo kiến trúc CPU)
└── META-INF/                 (chữ ký, MANIFEST.MF)
\`\`\`

**AAB gồm** \`base/\` + các \`feature module\` + metadata; Play dùng nó để tạo:
- **Split theo ABI** (arm64-v8a / armeabi-v7a / x86_64)
- **Split theo density** (hdpi/xhdpi/xxhdpi…)
- **Split theo language**
- **Feature module** on-demand

**Play App Signing** — điểm quan trọng về vận hành: với AAB, **Google giữ app signing key**, bạn chỉ giữ **upload key**. Hệ quả:
- Mất upload key thì **reset được** (liên hệ Google). Trước đây mất signing key là mất app vĩnh viễn.
- SHA-256 fingerprint dùng cho **App Links và Google Sign-In phải lấy của app signing key** (trong Play Console), không phải upload key. Đây là bẫy triển khai rất hay gặp.

**Test AAB trước khi phát hành:**
\`\`\`bash
# Sinh bộ APK từ bundle cho đúng thiết bị đang cắm
bundletool build-apks --bundle=app.aab --output=app.apks \\
  --ks=upload.jks --ks-key-alias=upload
bundletool install-apks --apks=app.apks

# Xem kích thước tải về thực tế của từng cấu hình
bundletool get-size total --apks=app.apks
\`\`\`

**Universal APK** (\`--mode=universal\`) khi cần một APK chạy mọi thiết bị (phân phối ngoài Play, QA nội bộ).`,
    pitfalls: [
      'Dùng fingerprint của upload key cho App Links / Google Sign-In → không hoạt động trên bản Play.',
      'Nghĩ AAB cài trực tiếp được — không, phải qua `bundletool`.',
      'Không test bản release đã ký từ bundle → lỗi chỉ xuất hiện trên Play (R8, resource shrinking).',
      'Bỏ `armeabi-v7a` mà chưa kiểm tra tỉ lệ user máy 32-bit.',
    ],
    followUps: ['Play Feature Delivery các loại?', '`bundletool get-size` để làm gì?', 'Multidex còn cần không? (minSdk 21+ thì native)'],
  },
  {
    id: 'build-variant-flavor',
    groupId: 'and-build',
    title: 'Build type, product flavor và build variant khác nhau thế nào?',
    levels: ['mid'],
    source: 'pdf',
    short:
      '**Build type** = *cách build* (debug/release: minify, debuggable, signing). **Product flavor** = *phiên bản sản phẩm* (free/paid, dev/staging/prod, brand khác nhau). **Build variant** = tổ hợp của cả hai: `devDebug`, `prodRelease`… Số variant = (số build type) × (số flavor mỗi dimension nhân với nhau).',
    deep: `\`\`\`kotlin
android {
    buildTypes {
        debug {
            applicationIdSuffix = ".debug"        // cài song song với bản release
            isMinifyEnabled = false
            isDebuggable = true
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            signingConfig = signingConfigs.getByName("release")
        }
        create("staging") { initWith(getByName("release")); applicationIdSuffix = ".staging" }
    }

    flavorDimensions += listOf("env", "tier")
    productFlavors {
        create("dev")  { dimension = "env"; buildConfigField("String", "BASE_URL", "\\"https://dev.api.com\\"") }
        create("prod") { dimension = "env"; buildConfigField("String", "BASE_URL", "\\"https://api.com\\"") }
        create("free") { dimension = "tier" }
        create("paid") { dimension = "tier" }
    }
}
// Variant: devFreeDebug, devPaidDebug, prodFreeRelease, ... (2 x 2 x 3 = 12)
\`\`\`

**Source set theo variant** — tính năng mạnh nhất và hay bị bỏ qua:
\`\`\`text
src/main/java/          -- code chung
src/dev/java/           -- chỉ build cho flavor dev
src/prod/java/          -- chỉ build cho flavor prod
src/debug/res/          -- resource riêng cho debug (app name có hậu tố)
src/devDebug/java/      -- riêng cho đúng variant devDebug
\`\`\`
Dùng nó để: bật/tắt debug menu, đổi endpoint, thay implementation của analytics (no-op ở dev), khác icon và app name theo môi trường.

**Lưu ý số lượng variant:** 12 variant làm CI và IDE sync rất chậm. Dùng \`variantFilter\`/\`androidComponents.beforeVariants\` để loại tổ hợp vô nghĩa (ví dụ không cần \`devPaidRelease\`).

**Không đặt secret trong \`buildConfigField\`** rồi tưởng an toàn — nó nằm nguyên trong DEX. Chỉ dùng cho giá trị không bí mật (base URL, feature flag).`,
    pitfalls: [
      'Nhồi nhiều dimension → hàng chục variant, IDE sync và CI chậm.',
      'Copy code giữa các source set flavor → phân kỳ dần, sửa bug một chỗ quên chỗ kia.',
      'Đặt API key trong `buildConfigField` và commit vào git.',
      'Quên `applicationIdSuffix` cho debug → không cài được song song bản Play, khó so sánh.',
    ],
    followUps: ['`variantFilter` dùng thế nào?', 'Signing config nên lưu ở đâu trong CI?', 'Khác biệt `buildConfigField` và `resValue`?'],
  },

  // ============ and-jetpack ============
  {
    id: 'viewmodel-la-gi',
    groupId: 'and-jetpack',
    title: 'ViewModel là gì? Vì sao nó sống sót qua rotate?',
    levels: ['junior', 'mid'],
    source: 'pdf',
    short:
      'ViewModel giữ **state và logic của UI**, tách khỏi View để (1) sống sót qua **configuration change**, (2) test được trên JVM, (3) chia sẻ được giữa các Fragment. Nó sống sót nhờ `ViewModelStore` được giữ trong `NonConfigurationInstance` của Activity và bàn giao cho instance mới; chỉ `onCleared()` khi Activity **finish thật**.',
    deep: `**Ba nguyên tắc bất di bất dịch:**
1. **ViewModel không được giữ reference tới View, Activity, Fragment, hay Context của Activity** — nó sống lâu hơn chúng → leak. Cần Context thì inject \`@ApplicationContext\`, hoặc tốt hơn là đừng cần Context (đẩy việc đó xuống repository).
2. ViewModel **không biết gì về Android UI**: không \`Toast\`, không \`Resources.getString\`, không \`Navigation\`. Nó phát ra *state* và *event*, View quyết định vẽ thế nào.
3. ViewModel là **state holder**, không phải nơi chứa business logic phức tạp — logic nghiệp vụ ở use case/domain.

\`\`\`kotlin
@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val getProfile: GetProfileUseCase,
    handle: SavedStateHandle,
) : ViewModel() {
    private val userId: String = checkNotNull(handle["userId"])

    val state: StateFlow<ProfileUiState> = getProfile(userId)
        .map { ProfileUiState.Success(it) as ProfileUiState }
        .catch { emit(ProfileUiState.Error(it.message.orEmpty())) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), ProfileUiState.Loading)
}
\`\`\`

**Ba cách lấy ViewModel và scope tương ứng:**
| Cách | Scope |
|---|---|
| \`by viewModels()\` | Fragment/Activity hiện tại |
| \`by activityViewModels()\` | Activity — chia sẻ giữa các Fragment |
| \`by navGraphViewModels(R.id.checkout_graph)\` | Một nav graph con — chia sẻ trong một luồng, tự clear khi ra khỏi luồng |

**Điều ViewModel KHÔNG làm được:** sống sót qua **process death**. Muốn vậy phải dùng \`SavedStateHandle\`.

**\`viewModelScope\`** dùng \`SupervisorJob + Dispatchers.Main.immediate\` và tự cancel ở \`onCleared()\` — nên đừng đặt việc "phải hoàn thành" (upload) trong đó.`,
    pitfalls: [
      'Giữ `Context`/`View`/`Fragment` trong ViewModel → leak.',
      'Gọi `Resources.getString` trong ViewModel → không đổi được theo locale runtime và khó test. Trả về resource id hoặc một sealed type, để View resolve.',
      'Nghĩ ViewModel sống sót process death.',
      'Nhồi toàn bộ business logic vào ViewModel → ViewModel 1000 dòng, không tái dùng được.',
      'Tạo ViewModel bằng `ViewModelProvider` với factory sai scope → mất state khi rotate.',
    ],
    followUps: [
      '`onCleared()` được gọi khi nào chính xác?',
      'Share ViewModel giữa Fragment: cách nào tốt nhất?',
      'ViewModel trong Compose lấy thế nào? (`hiltViewModel()`)',
    ],
  },
  {
    id: 'navigation-component',
    groupId: 'and-jetpack',
    title: 'Navigation Component: nav graph, NavHost, NavController và Safe Args?',
    levels: ['mid'],
    source: 'pdf',
    short:
      '**Nav graph** là file XML (hoặc Kotlin DSL/Compose) khai báo mọi *destination* và *action* ở một chỗ. **NavHost** là container hiển thị destination hiện tại. **NavController** là object điều khiển việc chuyển màn hình và quản lý back stack. **Safe Args** sinh code type-safe cho tham số, thay cho `Bundle` với key dạng string.',
    deep: `\`\`\`kotlin
// Safe Args: type-safe, sai kiểu là lỗi compile
val action = HomeFragmentDirections.actionHomeToDetail(productId = "p1", fromDeepLink = false)
findNavController().navigate(action)

// Nhận: argument tự động có trong SavedStateHandle -> sống qua process death
class DetailViewModel @Inject constructor(handle: SavedStateHandle) : ViewModel() {
    private val productId: String = checkNotNull(handle["productId"])
}
\`\`\`

**Điều hướng khi logout / xoá back stack:**
\`\`\`kotlin
findNavController().navigate(
    R.id.loginFragment,
    null,
    navOptions {
        popUpTo(R.id.nav_graph) { inclusive = true }   // xoá sạch stack
    },
)
\`\`\`

**Nested graph** để nhóm một luồng và chia sẻ ViewModel trong luồng đó:
\`\`\`kotlin
private val viewModel: CheckoutViewModel by navGraphViewModels(R.id.checkout_graph) {
    defaultViewModelProviderFactory
}
// ViewModel tự clear khi user rời khỏi checkout_graph
\`\`\`

**Kiến trúc single-Activity** là mục tiêu của Navigation: một Activity + nhiều Fragment/Composable. Lợi: back stack tập trung, transition dễ, deep link khai báo một chỗ, không phải lo launch mode.

**Deep link trong nav graph:**
\`\`\`xml
<fragment android:id="@+id/detailFragment" ...>
    <deepLink app:uri="https://example.com/product/{productId}" />
    <argument android:name="productId" app:argType="string" />
</fragment>
\`\`\`
Navigation tự tạo \`intent-filter\` tương ứng (cần \`<nav-graph>\` trong manifest) và tự parse param.

**Navigation trong Compose**: \`NavHost\` + \`composable(route)\`. Từ Navigation 2.8 có **type-safe navigation** với \`@Serializable\` route object — thay hẳn cho route dạng string ghép tay.`,
    pitfalls: [
      'Gọi `findNavController()` trong `onCreateView` (view chưa attach) → crash. Gọi trong `onViewCreated`.',
      'Navigate hai lần rất nhanh (double tap) → hai destination cùng lên stack. Sửa bằng cách kiểm tra `currentDestination`, hoặc debounce click.',
      'Truyền object lớn qua Safe Args (Parcelable nặng) → `TransactionTooLargeException`. Truyền id.',
      'Trong Compose, ghép route bằng string thủ công rồi lỗi typo lúc runtime — dùng type-safe route.',
      'Dùng `popBackStack()` mà không kiểm tra kết quả → không rõ đã pop được hay chưa.',
    ],
    followUps: [
      'Nested graph vs multiple graph?',
      'Truyền kết quả về màn hình trước làm sao? (`savedStateHandle` của previous back stack entry)',
      'Type-safe navigation trong Compose 2.8 hoạt động thế nào?',
    ],
  },
  {
    id: 'livedata-vs-flow-jetpack',
    groupId: 'and-jetpack',
    title: 'LiveData là gì? Còn nên dùng không?',
    levels: ['junior', 'mid'],
    source: 'pdf',
    short:
      'LiveData là observable holder **lifecycle-aware**: nó chỉ phát dữ liệu khi observer ở trạng thái **STARTED/RESUMED** và **tự gỡ observer** khi lifecycle bị destroy — nhờ đó không leak và không update UI khi màn hình không hiển thị. Ngày nay Google khuyến nghị **StateFlow** cho code Kotlin; LiveData vẫn hữu ích khi interop với Java hoặc codebase cũ.',
    deep: `**Ba điều LiveData làm tốt** (và là lý do nó từng thắng RxJava trong app Android):
1. Lifecycle-aware sẵn — không cần \`repeatOnLifecycle\`.
2. Tự gỡ observer → không leak.
3. Giữ giá trị cuối → màn hình recreate là có dữ liệu ngay.

**Ba hạn chế khiến Google chuyển sang Flow:**
1. **Gắn với main thread** — \`setValue\` phải trên main thread (\`postValue\` thì async và **có thể bỏ giá trị trung gian** nếu gọi liên tiếp).
2. **Gần như không có operator** — chỉ \`map\`, \`switchMap\`, \`distinctUntilChanged\`. Không debounce, không combine, không retry.
3. **Là API Android** → không dùng được ở tầng domain/data thuần Kotlin, và không dùng được trong KMP.

**"SingleLiveEvent problem":** LiveData luôn replay giá trị cuối cho observer mới → rotate là hiện lại snackbar/navigate lần hai. Cộng đồng đã sinh ra \`SingleLiveEvent\`, \`Event wrapper\`, \`EventObserver\`… tất cả đều là workaround. Đây chính là lý do SharedFlow/Channel ra đời cho event.

**Migrate dần:**
\`\`\`kotlin
// Repository trả Flow (Kotlin thuần), ViewModel phơi ra LiveData cho UI cũ
val users: LiveData<List<User>> = repo.observeUsers().asLiveData()

// Hoặc ngược lại, khi cần Flow từ LiveData cũ
val flow = legacyLiveData.asFlow()
\`\`\`

**Trường hợp LiveData vẫn hợp lý:** Java code, codebase lớn đang dùng nó, hoặc \`MediatorLiveData\` đã viết sẵn và chạy ổn. Không cần rewrite chỉ để hiện đại.`,
    pitfalls: [
      'Observe bằng `this` thay vì `viewLifecycleOwner` trong Fragment → observer nhân bản.',
      'Dùng LiveData cho event một lần → hiện lại sau rotate.',
      '`postValue` gọi liên tiếp nhiều lần → chỉ giá trị cuối được phát (không phải bug, là thiết kế, nhưng hay gây bất ngờ).',
      'Đưa LiveData xuống tầng domain/data → làm tầng đó phụ thuộc Android.',
    ],
    followUps: ['`setValue` vs `postValue`?', '`MediatorLiveData` tương đương gì trong Flow? (`combine`)', 'Vì sao StateFlow cần initial value mà LiveData không?'],
  },
]
