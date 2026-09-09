import type { Question } from '../types'

export const SYSTEM_DESIGN_QUESTIONS: Question[] = [
  // ============ sd-thinking ============
  {
    id: 'trade-off-thinking',
    groupId: 'sd-thinking',
    title: 'Khi thiết kế, bạn cân nhắc trade-off thế nào? (câu hỏi mở của senior)',
    levels: ['senior'],
    source: 'pdf',
    short:
      'Khung trả lời: (1) làm rõ **yêu cầu và ràng buộc** trước (bao nhiêu user, offline không, deadline, team mấy người); (2) nêu **2–3 phương án**; (3) so sánh theo tiêu chí **đo được** (thời gian phát triển, hiệu năng, khả năng bảo trì, rủi ro); (4) **chọn một** và nói rõ *điều kiện nào khiến bạn đổi ý*. Không có "kiến trúc tốt nhất", chỉ có "phù hợp với ràng buộc này".',
    deep: `**Bốn trục trade-off thường xuất hiện trong mobile:**

| Trục | Một đầu | Đầu kia |
|---|---|---|
| Tốc độ phát triển ↔ khả năng bảo trì | Viết thẳng vào ViewModel, ship trong 2 ngày | Clean + test, 1 tuần, nhưng sửa được sau 2 năm |
| Hiệu năng ↔ đơn giản | Cache nhiều tầng, tối ưu từng frame | Đọc lại từ DB mỗi lần, code dễ đọc |
| Offline ↔ nhất quán | Offline-first, dữ liệu có thể cũ/xung đột | Online-only, luôn đúng, nhưng mất mạng là màn trắng |
| App size ↔ tính năng | Bỏ lib, tự viết | Dùng SDK sẵn, +3 MB |

**Cách trả lời một câu system design mở** (ví dụ "thiết kế màn hình feed cho app tin tức"):
1. **Hỏi trước khi trả lời**: bao nhiêu item? có offline không? nội dung cập nhật mỗi bao lâu? có video không? user chủ yếu ở mạng nào?
2. **Vẽ luồng dữ liệu**: UI ← ViewModel ← Repository ← (Paging + Room + Remote).
3. **Nêu quyết định + lý do**: "Paging 3 với \`RemoteMediator\` để dữ liệu vào Room, UI chỉ đọc Room → offline hoạt động và không có double source of truth."
4. **Nêu điều bạn sẽ đo**: TTFD của feed, tỉ lệ cache hit, jank khi scroll (P90 frame time).
5. **Nêu điều kiện đổi ý**: "Nếu nội dung là realtime (chat) thì Room + Paging không đủ, tôi sẽ dùng socket + local queue."

**Điều interviewer thực sự đánh giá:** bạn có **hỏi ngược** không (người mới thường lao vào giải luôn), bạn có nêu **cái mình đánh đổi** không, và bạn có **đo lường** không hay chỉ theo cảm giác.

**Ba câu nên có trong câu trả lời:**
- *"Điều này phụ thuộc vào ... , cho tôi hỏi ..."*
- *"Tôi chọn X, đánh đổi là Y."*
- *"Tôi sẽ đo bằng Z; nếu Z vượt ngưỡng thì đổi sang phương án khác."*`,
    pitfalls: [
      'Lao vào giải ngay mà không hỏi ràng buộc.',
      'Đề xuất kiến trúc phức tạp nhất mình biết để "trông có vẻ senior".',
      'Không nêu nhược điểm của phương án mình chọn.',
      'Không nói cách đo lường → nghe như ý kiến cá nhân.',
    ],
    followUps: ['Bạn từng chọn giải pháp "kém hơn về kỹ thuật" vì lý do nghiệp vụ chưa?', 'Làm sao thuyết phục team về một quyết định kiến trúc?'],
  },

  // ============ sd-dataflow ============
  {
    id: 'caching-strategy',
    groupId: 'sd-dataflow',
    title: 'Caching strategy trên mobile: có những kiểu nào, chọn thế nào?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Bốn chiến lược: **cache-then-network** (hiện cache ngay, refresh nền — mặc định tốt nhất cho feed), **network-first with fallback** (dữ liệu phải mới, offline thì dùng cache), **cache-only** (dữ liệu tĩnh: danh mục, cấu hình), **network-only** (dữ liệu nhạy cảm/realtime: số dư, giá chứng khoán). Quan trọng hơn cả: **chỉ một nguồn sự thật** — cache nên là DB, không phải một `Map` trong RAM song song.',
    deep: `| Chiến lược | Trải nghiệm | Rủi ro | Dùng cho |
|---|---|---|---|
| **Cache-then-network** | Nội dung hiện ngay | Thấy dữ liệu cũ trong ~1s | Feed, list sản phẩm, profile |
| **Network-first + fallback** | Luôn mới nếu có mạng | Loading ở lần đầu | Chi tiết đơn hàng, tồn kho |
| **Cache-only (TTL)** | Nhanh nhất | Cần cơ chế invalidate | Danh mục, config, remote flag |
| **Network-only** | Luôn chính xác | Offline là không dùng được | Số dư, OTP, giá realtime |

**Cache-then-network với Room làm SSOT:**
\`\`\`kotlin
fun observeProducts(): Flow<List<Product>> = flow {
    // Room phát ngay dữ liệu cũ -> UI có nội dung tức thì
    emitAll(dao.observeAll().map { it.toDomain() })
}.onStart {
    // đồng thời refresh nền; kết quả ghi vào Room -> Flow tự phát lại
    refreshIfStale()
}

private suspend fun refreshIfStale() {
    val lastSync = prefs.lastSync()
    if (System.currentTimeMillis() - lastSync < 5.minutes.inWholeMilliseconds) return
    runCatching { api.getProducts() }
        .onSuccess { dao.replaceAll(it.map(ProductDto::toEntity)); prefs.setLastSync(now()) }
        .onFailure { logger.w("refresh thất bại, vẫn dùng cache", it) }   // không hiện lỗi
}
\`\`\`
Điểm quan trọng: refresh thất bại **không hiện lỗi chặn UI** — user vẫn thấy nội dung cũ, chỉ hiện một chỉ báo nhẹ.

**Ba tầng cache và vai trò:**
| Tầng | Ví dụ | Sống bao lâu | Dùng cho |
|---|---|---|---|
| Memory | \`LruCache\`, \`StateFlow\` | Đến khi process chết | Bitmap, kết quả tính toán đắt |
| Disk (DB) | Room, DataStore | Vĩnh viễn | **SSOT** cho dữ liệu app |
| HTTP | OkHttp \`Cache\` + \`Cache-Control\` | Theo header server | Ảnh, response tĩnh |

**Invalidation — phần khó nhất:**
1. **TTL** (đơn giản, đủ cho phần lớn): lưu \`lastSyncAt\`, hết hạn thì refresh.
2. **ETag / If-None-Match**: server trả **304 Not Modified** → tiết kiệm băng thông thật sự.
3. **Push invalidation**: server gửi silent push "dữ liệu X đã đổi" → client refresh. Chính xác nhất, phức tạp nhất.
4. **Version-based**: server trả \`config_version\`; client so sánh, khác thì tải lại.

**Bẫy hay gặp:** cache theo user nhưng **không clear khi logout** → user B thấy dữ liệu của user A. Phải xoá DB/cache trong luồng logout, hoặc namespace theo user id.`,
    pitfalls: [
      'Cache trong RAM song song với DB → hai nguồn sự thật.',
      'Không clear cache khi logout → rò dữ liệu giữa các user.',
      'Cache không có TTL/invalidation → user thấy dữ liệu cũ mãi và không hiểu vì sao.',
      'Cache dữ liệu nhạy cảm (số dư, thẻ) xuống disk không mã hoá.',
      'Hiện lỗi chặn UI khi refresh nền thất bại dù đã có cache.',
    ],
    followUps: ['ETag hoạt động thế nào?', 'OkHttp cache khác Room cache ở đâu?', 'Cache ảnh: Coil/Glide/`CachedNetworkImage` quản thế nào?'],
  },
  {
    id: 'pagination',
    groupId: 'sd-dataflow',
    title: 'Pagination: offset vs cursor, và implement thế nào cho đúng?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      '**Offset-based** (`?page=2&size=20`) đơn giản nhưng **bị trùng/mất item** khi dữ liệu thay đổi giữa các lần tải, và chậm trên bảng lớn (`OFFSET 100000` phải scan). **Cursor-based** (`?after=<id|timestamp>`) ổn định và nhanh — nên chọn cho feed. Trên Android dùng **Paging 3** (+ `RemoteMediator` nếu cần offline); trên Flutter dùng `infinite_scroll_pagination` hoặc tự quản với `ScrollController`.',
    deep: `**Vì sao offset sai với dữ liệu động:**
\`\`\`text
Lần 1: lấy item 1-20      -> [A B C ... T]
Có người đăng bài mới X  -> danh sách dịch xuống 1
Lần 2: lấy item 21-40     -> item T bị LẶP LẠI (vì nó đã dịch xuống vị trí 21)
\`\`\`
Cursor không bị: \`?after=T_id\` luôn trả về đúng phần sau T, bất kể có thêm/xoá gì.

| | Offset | Cursor |
|---|---|---|
| Nhảy tới trang N | ✅ | ❌ (chỉ tuần tự) |
| Ổn định khi dữ liệu đổi | ❌ | ✅ |
| Hiệu năng DB với trang sâu | Kém (\`OFFSET\` scan) | Tốt (index seek) |
| Biết tổng số trang | ✅ | Thường không |
| Dùng cho | Bảng admin, kết quả tìm kiếm tĩnh | **Feed, timeline, chat** |

**Paging 3 với offline (RemoteMediator) — kiến trúc đúng:**
\`\`\`kotlin
@OptIn(ExperimentalPagingApi::class)
class ProductRemoteMediator(
    private val api: ProductApi,
    private val db: AppDatabase,
) : RemoteMediator<Int, ProductEntity>() {

    override suspend fun load(loadType: LoadType, state: PagingState<Int, ProductEntity>): MediatorResult {
        val cursor = when (loadType) {
            LoadType.REFRESH -> null
            LoadType.PREPEND -> return MediatorResult.Success(endOfPaginationReached = true)
            LoadType.APPEND -> state.lastItemOrNull()?.id
                ?: return MediatorResult.Success(endOfPaginationReached = true)
        }
        return try {
            val page = api.getProducts(after = cursor, limit = 20)
            db.withTransaction {
                if (loadType == LoadType.REFRESH) db.productDao().clearAll()
                db.productDao().insertAll(page.items.map { it.toEntity() })
            }
            MediatorResult.Success(endOfPaginationReached = page.items.isEmpty())
        } catch (e: IOException) {
            MediatorResult.Error(e)     // UI hiện retry, dữ liệu cũ vẫn còn
        }
    }
}

// Repository: Room là SSOT, mediator chỉ bơm dữ liệu vào
fun products(): Flow<PagingData<Product>> = Pager(
    config = PagingConfig(pageSize = 20, prefetchDistance = 5, enablePlaceholders = false),
    remoteMediator = ProductRemoteMediator(api, db),
    pagingSourceFactory = { db.productDao().pagingSource() },
).flow.map { it.map(ProductEntity::toDomain) }
\`\`\`

**Bốn thứ hay bị làm sai:**
1. **Trạng thái đầy đủ**: cần xử lý *loading trang đầu*, *loading trang tiếp*, *lỗi trang đầu*, *lỗi trang tiếp*, *danh sách rỗng*, *hết dữ liệu*. Paging 3 cho \`LoadState\` cho từng cái — dùng \`.refresh\`, \`.append\`.
2. **Giữ vị trí scroll sau rotate/process death** — Paging + Room xử lý được; tự viết thì phải tự lưu.
3. **Duplicate key** khi API trả trùng → \`RecyclerView\`/\`ListView\` crash hoặc nhảy. Distinct theo id ở tầng data.
4. **prefetchDistance** quá nhỏ → user thấy loading; quá lớn → tải dữ liệu không cần. Thường 3–5 item.`,
    pitfalls: [
      'Dùng offset cho feed có dữ liệu thay đổi → item trùng hoặc bị mất.',
      'Không xử lý đủ trạng thái (rỗng, hết dữ liệu, lỗi trang tiếp).',
      'Gọi API trang tiếp trong `onBindViewHolder`/`build()` → gọi trùng nhiều lần.',
      'Không distinct theo id → duplicate key crash.',
      'Giữ toàn bộ item đã tải trong RAM mà không có DB → OOM với list dài.',
    ],
    followUps: ['`RemoteMediator` vs `PagingSource` khác nhau ở đâu?', 'Pull-to-refresh với Paging làm sao?', 'Thiết kế API cursor thế nào cho luồng có sort tuỳ ý?'],
  },
  {
    id: 'sync-conflict-retry',
    groupId: 'sd-dataflow',
    title: 'Sync mechanism, retry strategy và conflict resolution?',
    levels: ['senior'],
    source: 'pdf',
    short:
      'Sync gồm hai chiều: **pull** (lấy delta từ server theo `updatedSince`/cursor) và **push** (outbox queue đẩy thay đổi local lên, có idempotency key). Retry dùng **exponential backoff + jitter**, chỉ retry lỗi tạm thời (mạng, 5xx, 429), **không** retry lỗi nghiệp vụ (4xx). Conflict giải bằng **version/ETag** — server trả 409, client fetch lại và merge hoặc để user chọn.',
    deep: `**Pull — sync delta thay vì tải lại toàn bộ:**
\`\`\`text
GET /notes?updated_since=2026-09-01T10:00:00Z&cursor=abc
-> { items: [...], next_cursor: "def", server_time: "..." }
\`\`\`
Lưu \`server_time\` do **server** trả (không dùng đồng hồ client — có thể sai vài năm) làm mốc cho lần sync sau. Xoá thì cần **tombstone** (\`deleted_at\`) để client biết bản ghi đã bị xoá — nếu chỉ bỏ khỏi response, client không phân biệt được "đã xoá" và "không thay đổi".

**Push — outbox với idempotency:**
\`\`\`kotlin
suspend fun pushOutbox() {
    // Xử lý FIFO để không gửi UPDATE trước CREATE
    outboxDao.pending().forEach { entry ->
        val result = runCatching {
            api.execute(
                entry.operation,
                entry.payload,
                idempotencyKey = entry.id.toString(),   // server dedupe -> retry an toàn
            )
        }
        when {
            result.isSuccess -> outboxDao.delete(entry.id)
            result.isPermanentFailure() -> outboxDao.markFailed(entry.id)   // 4xx: đừng retry mãi
            else -> outboxDao.incrementAttempts(entry.id)                   // để WorkManager retry
        }
    }
}
\`\`\`

**Retry strategy — bảng quyết định:**
| Lỗi | Retry? | Cách |
|---|---|---|
| Không có mạng | ✅ | Chờ có mạng (WorkManager constraint) |
| Timeout, 5xx | ✅ | Exponential backoff + jitter, max 3–5 lần |
| 429 Too Many Requests | ✅ | **Tôn trọng header \`Retry-After\`** |
| 401 | Một lần sau khi refresh token | Nếu refresh fail → logout |
| 400/409/422 (lỗi nghiệp vụ) | ❌ | Báo user hoặc đánh dấu failed |

**Vì sao cần jitter:** nếu 10.000 client cùng mất mạng rồi cùng có mạng lại, backoff thuần khiến tất cả retry đúng cùng thời điểm → **thundering herd** làm sập server. Jitter (thêm random) phân tán chúng ra.
\`\`\`kotlin
fun delayFor(attempt: Int): Duration {
    val base = (1L shl attempt).coerceAtMost(60).seconds     // 1,2,4,8...60s
    val jitter = Random.nextLong(0, base.inWholeMilliseconds / 2)
    return base + jitter.milliseconds
}
\`\`\`

**Conflict resolution — ba mức:**
1. **Last-write-wins theo server version** — đơn giản, mất dữ liệu ngầm. OK cho dữ liệu ít quan trọng.
2. **Merge theo field** — mỗi field có version riêng; A đổi title, B đổi body thì giữ cả hai.
3. **Để user chọn** — hiện "bản trên máy / bản trên server / gộp". Đúng nhất cho tài liệu, ghi chú.

Cơ chế phát hiện: client gửi \`If-Match: <version đang có>\`; server so sánh, khác thì trả **409** kèm bản mới nhất → client xử lý theo mức đã chọn.

**Điều bắt buộc phải hiển thị cho user:** trạng thái sync của từng bản ghi (đã đồng bộ / đang chờ / thất bại). Nếu không, user tưởng đã lưu rồi mất dữ liệu — đây là lỗi trải nghiệm nghiêm trọng hơn cả bug kỹ thuật.`,
    pitfalls: [
      'Không có idempotency key → retry tạo bản ghi trùng.',
      'Retry lỗi 4xx → vòng lặp vô tận, tốn pin và spam server.',
      'Backoff không jitter → thundering herd.',
      'Dùng đồng hồ client làm mốc sync hoặc để so sánh conflict.',
      'Xoá bản ghi mà không có tombstone → client không bao giờ biết nó đã bị xoá.',
      'Không hiện trạng thái sync cho user.',
    ],
    followUps: ['CRDT có đáng dùng trên mobile không?', '`Retry-After` xử lý thế nào?', 'Sync khi user có 2 thiết bị cùng offline sửa một bản ghi?'],
  },

  // ============ sd-ops ============
  {
    id: 'cicd-mobile',
    groupId: 'sd-ops',
    title: 'CI/CD cho mobile: pipeline gồm gì, ký app và quản secret thế nào?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Pipeline tối thiểu: **lint + static analysis → unit test → build → distribute (Firebase App Distribution/TestFlight) → release lên store**. Trên **PR** chạy phần nhanh (lint + unit test); trên **main/tag** mới build và phát hành. Signing key và secret nằm trong **CI secret store** (GitHub Secrets, base64 encode keystore), **không bao giờ** trong git. **Fastlane** để đóng gói các bước; **GitHub Actions** để chạy.',
    deep: `**Pipeline theo trigger:**
| Trigger | Chạy gì | Mục tiêu thời gian |
|---|---|---|
| PR | ktlint/detekt, unit test, build debug | < 10 phút |
| Merge vào \`develop\` | + build staging, upload App Distribution | < 20 phút |
| Tag \`v*\` | + build release đã ký, upload store (draft) | < 40 phút |
| Nightly | + integration test trên Firebase Test Lab, benchmark | không giới hạn |

\`\`\`yaml
# .github/workflows/android.yml (rút gọn)
name: Android CI
on:
  pull_request:
  push: { tags: ['v*'] }

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '17', cache: gradle }
      - run: ./gradlew ktlintCheck detekt testDebugUnitTest

  release:
    if: startsWith(github.ref, 'refs/tags/v')
    needs: check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Giải mã keystore từ secret
        run: echo "\${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > app/release.jks
      - run: ./gradlew bundleRelease
        env:
          KEYSTORE_PASSWORD: \${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: \${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: \${{ secrets.KEY_PASSWORD }}
      - uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: \${{ secrets.PLAY_SERVICE_ACCOUNT }}
          packageName: com.example.app
          releaseFiles: app/build/outputs/bundle/release/app-release.aab
          track: internal
\`\`\`

**Quản secret — quy tắc:**
| Secret | Lưu ở |
|---|---|
| Keystore (.jks) | Base64 trong CI secret, giải mã lúc build, **xoá sau khi build** |
| Mật khẩu keystore/alias | CI secret, truyền qua env var |
| \`google-services.json\` (có key nhưng không phải secret nghiêm ngặt) | Repo được, hoặc CI secret nếu tách môi trường |
| Play/App Store service account | CI secret |
| API key backend | **Không nhúng vào app** — proxy qua server |

Với iOS, **Fastlane Match** lưu certificate/profile trong một git repo riêng đã mã hoá — giải quyết cơn đau đầu code signing.

**Ba việc nâng chất lượng pipeline mà ít team làm:**
1. **Gradle build cache + configuration cache** và cache Gradle giữa các run → giảm CI time đáng kể.
2. **Danger/PR check tự động**: cảnh báo PR quá lớn, thiếu test, tăng APK size (\`diffuse\` so sánh size với bản base).
3. **Upload mapping/symbols tự động** lên Crashlytics trong bước release — quên là crash report vô dụng.

**Flutter tương đương:** \`flutter analyze\` → \`flutter test\` → \`flutter build appbundle/ipa\` → upload. Nhớ pin phiên bản Flutter trong CI (\`subosito/flutter-action\` với version cố định) để build tái lập được.`,
    pitfalls: [
      'Commit keystore hoặc mật khẩu vào git.',
      'Chạy toàn bộ test (kể cả integration) trên mỗi PR → CI 40 phút, dev bỏ qua kết quả.',
      'Không upload mapping/symbols → crash production không đọc được.',
      'Không pin version Flutter/AGP/JDK trong CI → build "tự nhiên vỡ".',
      'Không có bước kiểm tra APK size → app phình dần mà không ai biết.',
    ],
    followUps: ['Fastlane Match giải quyết gì?', 'Làm sao rút ngắn CI time?', 'Rollout theo phần trăm trên Play hoạt động thế nào?'],
  },
  {
    id: 'logging-monitoring',
    groupId: 'sd-ops',
    title: 'Logging và monitoring: đo gì và đo thế nào trong production?',
    levels: ['senior'],
    source: 'pdf',
    short:
      'Bốn nhóm chỉ số: **stability** (crash-free users, ANR rate), **performance** (cold start, jank/frozen frames, thời gian API), **business** (conversion, retention của luồng chính), **error đã xử lý** (non-fatal — vì lỗi bạn catch gọn sẽ không tạo crash và bạn sẽ không biết nó xảy ra). Công cụ: Crashlytics/Sentry + Firebase Performance + Play Console Android vitals.',
    deep: `**Chỉ số và ngưỡng tham chiếu:**
| Chỉ số | Ngưỡng nên nhắm | Nguồn |
|---|---|---|
| Crash-free users | > 99.5% | Crashlytics |
| ANR rate | < 0.47% (ngưỡng "bad" của Play) | Play Console vitals |
| Cold start (P90) | < 2s | Firebase Perf / vitals |
| Frozen frames (> 700ms) | < 0.1% | vitals / JankStats |
| Slow frames | < 5% | vitals |
| API P95 latency | tuỳ endpoint | Firebase Perf / backend |

**Logging đúng cách — ba nguyên tắc:**
1. **Không log PII/secret.** Token, số điện thoại, email, địa chỉ, số thẻ. Log \`userId\` (đã hash nếu cần) thay vì thông tin nhận dạng được.
2. **Log dạng có cấu trúc, không phải chuỗi.** \`log("checkout_failed", mapOf("step" to "payment", "error_code" to code))\` — để query được, không phải grep.
3. **Log ở đúng mức.** \`debug\` chỉ trong dev build; \`info\` cho mốc nghiệp vụ; \`warn/error\` cho thứ cần hành động. Log mọi thứ ở \`error\` = không ai đọc nữa.

\`\`\`kotlin
// Guard logger theo build type để không rò trong release
object Logger {
    fun d(msg: String) { if (BuildConfig.DEBUG) Log.d(TAG, msg) }

    fun recordNonFatal(t: Throwable, context: Map<String, String> = emptyMap()) {
        Firebase.crashlytics.apply {
            context.forEach { (k, v) -> setCustomKey(k, v) }
            recordException(t)          // lỗi ĐÃ xử lý -> vẫn cần biết tần suất
        }
    }
}
\`\`\`

**Breadcrumb — thứ giúp bug tái hiện được:** ghi lại chuỗi hành động trước khi crash (màn hình đã đi qua, action đã bấm, request id cuối). Với Bloc, \`BlocObserver\` là chỗ hoàn hảo để tự động ghi breadcrumb mọi event.

**Ba cái bẫy về đo lường:**
1. **Chỉ nhìn giá trị trung bình.** Cold start trung bình 1.2s trông đẹp nhưng P95 là 6s — 5% user có trải nghiệm tệ. Luôn nhìn **P90/P95/P99**.
2. **Chỉ đo trên máy dev.** Máy dev là flagship có mạng WiFi tốt. Phải phân đoạn theo **thiết bị, phiên bản Android, loại mạng**.
3. **Đo mà không có ngưỡng cảnh báo.** Dashboard không ai xem thì vô ích — đặt alert (crash-free tụt dưới 99%, ANR tăng gấp đôi) gửi vào Slack.

**Distributed tracing với backend:** truyền một \`trace-id\` từ app trong header, backend log cùng id → khi user báo lỗi bạn tra được cả luồng client + server. Đây là điều rất ít team mobile làm và là điểm cộng lớn khi nói ra.`,
    pitfalls: [
      'Log token/PII trong release.',
      'Chỉ theo dõi crash mà bỏ ANR (ANR làm user uninstall nhiều hơn crash).',
      'Không log non-fatal → không biết lỗi đã xử lý xảy ra bao nhiêu lần.',
      'Chỉ nhìn trung bình, không nhìn percentile.',
      'Không có alert → phát hiện sự cố qua review 1 sao trên store.',
    ],
    followUps: ['Sampling analytics thế nào để không tốn quota?', 'Đo cold start trong production bằng gì?', 'Trace-id xuyên client–server làm sao?'],
  },

  // ============ sd-ai ============
  {
    id: 'ai-assisted-dev-workflow',
    groupId: 'sd-ai',
    title: 'AI-assisted development: bạn dùng thế nào trong công việc thật?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Câu trả lời tốt là **cụ thể và có giới hạn**: dùng AI cho việc *có thể kiểm chứng nhanh* — sinh boilerplate (mapper, DTO, test case), giải thích code lạ, review sơ bộ, viết migration script, chuyển đổi cú pháp. **Không** dùng cho quyết định kiến trúc, code có logic nghiệp vụ quan trọng chưa hiểu rõ, hay bất cứ gì bạn không đọc và test lại được. Điểm mấu chốt: **bạn chịu trách nhiệm cho code, không phải AI**.',
    deep: `**Nơi AI thực sự tiết kiệm thời gian (và tại sao an toàn):**
| Việc | Vì sao an toàn |
|---|---|
| Sinh DTO/mapper từ JSON mẫu | Sai là compile lỗi hoặc test đỏ ngay |
| Viết test case cho hàm đã có | Bạn đọc được assert đúng/sai |
| Giải thích code legacy | Bạn đối chiếu với code thật |
| Chuyển đổi cú pháp (Java→Kotlin, XML→Compose) | Compile + test bắt lỗi |
| Viết regex, SQL migration, script CI | Test được ngay |
| Review sơ bộ trước khi gửi PR | Chỉ là gợi ý, người vẫn review |

**Nơi cần rất cẩn thận:**
- **Quyết định kiến trúc** — AI không biết ràng buộc team, deadline, hay nợ kỹ thuật của bạn.
- **Code bảo mật** (crypto, auth) — dễ sinh ra code *trông đúng* nhưng dùng ECB, IV cố định, hoặc so sánh chuỗi không constant-time.
- **API mới/version mới** — thông tin có thể lỗi thời; luôn đối chiếu tài liệu chính thức.
- **Dữ liệu nhạy cảm** — không dán source code nội bộ, key, hay dữ liệu user vào công cụ không được duyệt.

**MCP (Model Context Protocol)** — nếu được hỏi: là giao thức mở để công cụ AI **kết nối với nguồn dữ liệu và tool bên ngoài** (repo, issue tracker, DB, CI) theo một chuẩn chung, thay vì mỗi tích hợp viết riêng. Ứng dụng thực tế trong dev mobile: cho agent đọc được Jira ticket, log Crashlytics, và codebase để đề xuất fix — nhưng phải kiểm soát quyền đọc/ghi.

**Sub-agent / agent workflow:** chia một việc lớn thành các agent chuyên trách (một tìm code, một viết test, một review) rồi tổng hợp. Hữu ích cho refactor diện rộng hoặc điều tra bug xuyên nhiều module. Rủi ro: agent chạy tự động có thể sửa nhiều thứ hơn bạn muốn → luôn xem diff trước khi commit.

**Cách trả lời gây ấn tượng:** kể một ví dụ cụ thể có **con số** và có **giới hạn bạn tự đặt**:
*"Tôi dùng AI để sinh 40 mapper DTO→Entity khi migrate API v1→v2, mất 1 giờ thay vì 1 ngày; nhưng tôi viết test cho mapper trước rồi mới sinh code, để test là thứ kiểm chứng. Còn quyết định có tách module hay không thì tôi tự làm và mang ra thảo luận với team."*`,
    pitfalls: [
      'Nói "em không dùng AI" (nghe như không cập nhật) hoặc "em dùng AI cho mọi thứ" (nghe như không kiểm soát).',
      'Không nêu được giới hạn hay cách kiểm chứng.',
      'Commit code AI sinh mà chưa đọc/chưa test.',
      'Dán code nội bộ hoặc secret vào công cụ chưa được duyệt.',
      'Tin thông tin về API/version mới mà không đối chiếu tài liệu.',
    ],
    followUps: [
      'Bạn kiểm chứng code AI sinh ra bằng cách nào?',
      'Team bạn có quy tắc gì về dùng AI với code nội bộ?',
      'MCP giải quyết vấn đề gì so với plugin riêng lẻ?',
    ],
  },
]
