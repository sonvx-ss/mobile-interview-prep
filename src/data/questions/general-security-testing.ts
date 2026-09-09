import type { Question } from '../types'

export const GENERAL_SEC_TEST_QUESTIONS: Question[] = [
  // ============ gen-security ============
  {
    id: 'ssl-pinning',
    groupId: 'gen-security',
    title: 'SSL/Certificate pinning là gì? Pin cái gì và rủi ro vận hành?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Pinning là việc app **chỉ tin đúng certificate/public key mà bạn khai báo trước**, thay vì tin toàn bộ CA store của thiết bị. Nó chặn MITM bằng CA giả hoặc CA do user tự cài (Charles/Burp). Nên pin **public key (SPKI hash)** chứ không pin cả certificate, và **luôn pin kèm backup key**, nếu không app sẽ chết cứng khi cert hết hạn.',
    deep: `**Ba mức pinning:**
| Pin gì | Ưu | Nhược |
|---|---|---|
| Certificate | Chặt nhất | Cert đổi (thường 1 năm, Let's Encrypt 90 ngày) là app chết |
| **Public key (SPKI)** | Đổi cert vẫn dùng lại key → an toàn hơn về vận hành | Phải bảo vệ private key |
| Intermediate CA | Ít vỡ nhất | Lỏng nhất |

**Cách làm trên Android — hai lựa chọn:**

1. \`network_security_config.xml\` — khai báo, không cần code, nhưng chỉ Android 7+ và không đổi được lúc runtime.
2. OkHttp \`CertificatePinner\` — linh hoạt, chạy mọi version, và pin được theo host.

**Rủi ro vận hành phải nói ra được** (đây là chỗ phân biệt senior):
- Cert hết hạn mà app chưa update → **toàn bộ user cũ mất kết nối**, không có cách sửa từ server. Vì thế: pin ≥ 2 key (key hiện tại + key backup chưa dùng), đặt \`expiration\` cho pin, và có **kill switch** (remote config để tắt pinning) — nhưng kill switch lại là lỗ hổng nếu không xác thực.
- Pin làm hỏng debug: dev/QA không proxy được. Giải pháp là chỉ bật pinning ở build \`release\`, và cho phép user-added CA trong \`debug\` qua \`network_security_config\` theo build type.

**Pinning không phải là bảo mật tuyệt đối**: attacker root máy có thể dùng Frida hook \`CertificatePinner.check()\` để vô hiệu hoá. Pinning nâng chi phí tấn công, không loại bỏ nó. Trên Flutter/Dart, hook khó hơn một chút vì code là AOT native.`,
    code: [
      {
        lang: 'kotlin',
        caption: 'OkHttp CertificatePinner — pin SPKI kèm backup',
        source: `val pinner = CertificatePinner.Builder()
    .add("api.example.com", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=") // key hiện tại
    .add("api.example.com", "sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=") // key backup
    .build()

val client = OkHttpClient.Builder()
    .apply { if (BuildConfig.BUILD_TYPE == "release") certificatePinner(pinner) }
    .build()`,
      },
      {
        lang: 'xml',
        caption: 'network_security_config.xml — cho phép proxy chỉ ở debug',
        source: `<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <debug-overrides>
        <trust-anchors>
            <certificates src="user" />   <!-- chỉ debug mới tin CA do user cài -->
        </trust-anchors>
    </debug-overrides>
</network-security-config>`,
      },
    ],
    pitfalls: [
      'Pin đúng một certificate và không có backup → app "tự sát" đúng ngày cert hết hạn.',
      'Bật pinning cho cả debug rồi QA không test được API.',
      'Tự implement `TrustManager` chấp nhận tất cả (`checkServerTrusted` để trống) trong lúc debug rồi quên xoá — đây là lỗ hổng bị Google Play cảnh báo và là lỗi bảo mật hay gặp nhất.',
    ],
    followUps: [
      'Nếu cần đổi cert gấp mà app đã pin cứng thì làm gì?',
      'Frida bypass pinning thế nào và chống ra sao? (root detection, integrity check, obfuscation)',
      'Cleartext traffic bị chặn từ Android nào? (9 / API 28)',
    ],
  },
  {
    id: 'oauth2-jwt',
    groupId: 'gen-security',
    title: 'OAuth2 và JWT: app mobile nên dùng flow nào, lưu token ở đâu?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'App mobile là **public client** (không giữ được secret) nên phải dùng **Authorization Code + PKCE**, tuyệt đối không dùng Implicit hay Password Grant. **Access token** ngắn hạn giữ trong RAM, **refresh token** dài hạn lưu vào **EncryptedSharedPreferences / Keystore** (Android) hoặc **Keychain** (iOS). JWT chỉ là *định dạng* token có thể tự xác thực — nó **không được mã hoá**, ai cũng decode xem được payload.',
    deep: `**Vì sao PKCE:** app mobile không thể giữ \`client_secret\` (ai cũng decompile được APK). PKCE thay secret tĩnh bằng cặp \`code_verifier\` (random, giữ trong RAM) và \`code_challenge = SHA256(verifier)\` sinh mới mỗi lần login — attacker chặn được \`authorization_code\` cũng không đổi được thành token vì không có verifier.

\`\`\`text
App: tạo verifier -> gửi challenge + mở browser (Custom Tab)
User: đăng nhập trên trang của Identity Provider
IdP: redirect về app kèm authorization_code
App: đổi code + verifier -> access_token + refresh_token
\`\`\`

**Bắt buộc dùng Custom Tabs / ASWebAuthenticationSession**, không dùng WebView — WebView cho phép app đọc được thứ user nhập, nên IdP lớn (Google) chặn hẳn.

**JWT — ba phần \`header.payload.signature\`, base64url, không mã hoá:**
- Không bao giờ đặt dữ liệu nhạy cảm vào payload.
- Client **được** decode để đọc \`exp\` (chủ động refresh trước khi hết hạn) nhưng **không được** tin \`role\`/\`permission\` trong đó để quyết định bảo mật — chỉ dùng để vẽ UI. Server luôn phải verify lại.
- Stateless nên **không revoke được** trước \`exp\` → giữ \`exp\` ngắn (5–15 phút) và revoke ở tầng refresh token.

**Refresh token rotation**: mỗi lần refresh, server phát refresh token mới và vô hiệu cái cũ. Nếu thấy một refresh token cũ được dùng lại → dấu hiệu bị đánh cắp → thu hồi cả family.`,
    code: [
      {
        lang: 'kotlin',
        caption: 'Refresh token đồng thời: Mutex chống "refresh storm"',
        source: `class TokenAuthenticator(
    private val store: TokenStore,
    private val authApi: AuthApi,
) : Authenticator {
    private val mutex = Mutex()

    override fun authenticate(route: Route?, response: Response): Request? = runBlocking {
        // 5 request 401 cùng lúc -> chỉ 1 lần refresh thật
        mutex.withLock {
            val current = store.accessToken
            val failed = response.request.header("Authorization")?.removePrefix("Bearer ")
            if (current != null && current != failed) {
                // thread khác đã refresh xong -> dùng luôn token mới
                return@withLock response.request.retryWith(current)
            }
            val new = runCatching { authApi.refresh(store.refreshToken ?: return@withLock null) }
                .getOrNull() ?: run { store.clear(); return@withLock null }  // buộc logout
            store.save(new)
            response.request.retryWith(new.accessToken)
        }
    }
}`,
      },
    ],
    pitfalls: [
      'Dùng Resource Owner Password Grant ("gửi user/pass lên /token") — đã bị OAuth 2.1 loại bỏ.',
      'Lưu refresh token vào `SharedPreferences` thường: máy root đọc được ngay.',
      'Tin `role` trong JWT ở client để phân quyền thật.',
      'Không xử lý 401 đồng thời → 10 request cùng refresh, server revoke chéo, user bị logout ngẫu nhiên.',
    ],
    followUps: [
      'Access token nên sống bao lâu? Đánh đổi gì?',
      'Làm sao logout ngay lập tức khi JWT là stateless?',
      'Biometric gate cho refresh token: implement thế nào?',
    ],
  },
  {
    id: 'secure-storage',
    groupId: 'gen-security',
    title: 'Lưu dữ liệu nhạy cảm ở đâu trên mobile?',
    levels: ['mid'],
    source: 'pdf',
    short:
      'Nguyên tắc đầu tiên: **không lưu nếu không bắt buộc**. Nếu buộc phải lưu, dùng **Android Keystore** (khoá không bao giờ ra khỏi hardware-backed keystore/StrongBox) qua `EncryptedSharedPreferences`/`EncryptedFile`, và **Keychain** trên iOS. Trong Flutter dùng `flutter_secure_storage` — nó bọc chính hai cơ chế này.',
    deep: `**Thứ tự ưu tiên:**
1. Không lưu (token ngắn hạn giữ trong RAM).
2. Keystore/Keychain (khoá do hardware giữ, có thể yêu cầu biometric để dùng).
3. DB/file **đã mã hoá** bằng khoá lấy từ Keystore (SQLCipher, \`EncryptedFile\`).
4. \`SharedPreferences\`/\`UserDefaults\` thường — chỉ cho dữ liệu **không** nhạy cảm.

**Điều then chốt về Keystore:** private key **không bao giờ được trích xuất** ra khỏi keystore. App chỉ *yêu cầu keystore ký/giải mã hộ*. Nên dù attacker đọc được file mã hoá cũng không có khoá — trừ khi họ chạy được code **trong chính app đó** (root + Frida).

\`\`\`kotlin
// EncryptedSharedPreferences (androidx.security:security-crypto)
val masterKey = MasterKey.Builder(context)
    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
    .setUserAuthenticationRequired(true, 30)  // cần biometric, hiệu lực 30s
    .build()

val prefs = EncryptedSharedPreferences.create(
    context, "secure_prefs", masterKey,
    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
)
\`\`\`

**Những chỗ dữ liệu nhạy cảm bị rò mà ai cũng quên:**
- **Log**: \`Log.d(TAG, "token=\$token")\` — logcat đọc được, và Crashlytics upload luôn.
- **Screenshot / recents**: thêm \`FLAG_SECURE\` cho màn hình có thông tin thẻ.
- **Backup**: \`android:allowBackup="true"\` (mặc định) cho phép \`adb backup\` kéo cả prefs ra. Đặt \`false\` hoặc dùng \`dataExtractionRules\`.
- **Clipboard**: copy OTP/mật khẩu ra clipboard là app khác đọc được.
- **WebView cache**, và **file trong External Storage** (world-readable trước scoped storage).

**API key trong app:** không có cách nào giữ bí mật thật sự trong client. Đúng nhất là **proxy qua backend của bạn**. Obfuscation chỉ làm chậm attacker.`,
    pitfalls: [
      'Hardcode API key/secret trong `BuildConfig` rồi tưởng an toàn vì đã ProGuard — string vẫn nằm nguyên trong DEX.',
      'Quên `allowBackup="false"` cho app có dữ liệu nhạy cảm.',
      'Log token/PII trong build release.',
      'Dùng AES ECB hoặc IV cố định khi tự mã hoá — luôn dùng GCM với IV random mỗi lần.',
    ],
    followUps: [
      'StrongBox khác TEE thế nào?',
      'Nếu user đổi/xoá lock screen thì khoá trong Keystore ra sao? (khoá cần auth bị vô hiệu)',
      'Làm sao bảo vệ API key của bên thứ ba (Maps, payment)?',
    ],
  },
  {
    id: 'owasp-mobile-top-10',
    groupId: 'gen-security',
    title: 'OWASP Mobile Top 10 — bạn quan tâm nhất mục nào và vì sao?',
    levels: ['senior'],
    source: 'pdf',
    short:
      'Đừng đọc thuộc 10 mục. Hãy chọn 3 mục có rủi ro cao nhất cho app của bạn và nói cách bạn xử lý: **M1 Improper Credential Usage** (token/API key lưu sai), **M2 Inadequate Supply Chain Security** (dependency & CI), **M9 Insecure Data Storage**. Kèm cách phòng cụ thể sẽ ăn điểm hơn kể tên cả 10.',
    deep: `**Bản 2024 (rút gọn thành việc cần làm):**

| Mã | Rủi ro | Việc cụ thể trong dự án |
|---|---|---|
| M1 | Improper Credential Usage | Không hardcode secret; token vào Keystore; proxy API key qua backend |
| M2 | Inadequate Supply Chain Security | Pin version dependency, quét CVE (\`gradle dependencyCheck\`, Dependabot), ký build trong CI có approval |
| M3 | Insecure Authentication/Authorization | PKCE, không tin claim ở client, kiểm tra quyền ở server |
| M4 | Insufficient Input/Output Validation | Validate deep link param, SQL injection qua raw query, WebView \`javascriptInterface\` |
| M5 | Insecure Communication | TLS 1.2+, chặn cleartext, pinning |
| M6 | Inadequate Privacy Controls | Khai báo Data Safety đúng, giảm PII trong log/analytics |
| M7 | Insufficient Binary Protections | R8 + obfuscation, integrity check, chống tamper |
| M8 | Security Misconfiguration | \`debuggable=false\`, \`allowBackup=false\`, exported component đúng, WebView tắt file access |
| M9 | Insecure Data Storage | Mã hoá DB, \`FLAG_SECURE\`, không log token |
| M10 | Insufficient Cryptography | Không tự viết crypto, không AES/ECB, không MD5/SHA1 |

**Cách trả lời gây ấn tượng:** kể một lần bạn *tìm ra* một vấn đề thật. Ví dụ: "Chúng tôi phát hiện một \`activity\` xử lý deep link để \`exported=true\` mà không validate param, cho phép app khác mở màn hình thanh toán với \`amount\` tuỳ ý. Sửa bằng cách chuyển sang App Links có verify domain và validate toàn bộ param ở entry point."`,
    pitfalls: [
      'Đọc thuộc lòng 10 mục mà không kể được ứng dụng thực tế.',
      'Nói "app chúng tôi không có gì nhạy cảm" — mọi app đều có token, PII, hoặc entry point exported.',
      'Bỏ qua M8: `exported` mặc định thay đổi từ Android 12 (bắt buộc khai báo tường minh nếu có intent-filter).',
    ],
    followUps: ['Bạn có bao giờ tự pentest app của mình chưa?', 'Deep link bị hijack thế nào và App Links khắc phục ra sao?'],
  },
  {
    id: 'reverse-engineering-obfuscation',
    groupId: 'gen-security',
    title: 'Reverse engineering app mobile: công cụ nào, và chống bằng cách gì?',
    levels: ['senior'],
    source: 'pdf',
    short:
      'Bộ công cụ chuẩn: **jadx / apktool / dex2jar** để đọc code Java/Kotlin, **Ghidra / IDA Pro** cho native lib (.so), **Frida / Objection** để hook runtime, **mitmproxy / Burp** cho traffic. Chống bằng nhiều lớp: **R8 obfuscation + resource shrinking**, **native code cho logic quan trọng**, **root/emulator/debugger detection**, **integrity check (Play Integrity API)** — nhưng phải hiểu đây là *tăng chi phí tấn công*, không phải chặn được.',
    deep: `**Đọc app tĩnh:**
- \`apktool d app.apk\` → resource, manifest, smali.
- \`jadx-gui app.apk\` → xem trực tiếp code gần-Java. Với app không obfuscate, đọc như đọc source.
- \`strings libnative.so\` + Ghidra để tìm key hardcode.

**Tấn công động (nguy hiểm hơn):**
- **Frida** hook method lúc runtime: bypass \`isRooted()\`, bypass \`CertificatePinner.check()\`, đọc tham số hàm mã hoá. Đây là lý do mọi kiểm tra bảo mật **thực hiện ở client đều có thể bị vô hiệu**.
- **Objection** tự động hoá các bypass phổ biến.

**Phòng thủ theo lớp (defense in depth):**
1. **R8 full mode** — rename + inline + remove code chết. Bắt buộc giữ \`mapping.txt\` để đọc crash.
2. **Đưa logic sống còn xuống native (C++)** hoặc lên server. Chỉ server-side là *thật sự* an toàn.
3. **Play Integrity API** (Android) / **DeviceCheck + App Attest** (iOS): server xác thực rằng request đến từ **bản build chính hãng trên thiết bị không bị can thiệp**. Đây là biện pháp mạnh nhất hiện có vì việc kiểm tra nằm ở server.
4. **Root/emulator/debugger/Frida detection** — dùng để *ghi log và giảm quyền*, không nên hard-block (false positive với dev, custom ROM).
5. **String encryption** cho endpoint/key nhúng trong app.

**Flutter đặc thù:** release build là AOT ARM native → jadx không đọc được Dart logic, khó reverse hơn Android/Kotlin đáng kể. Nhưng \`flutter build --obfuscate --split-debug-info\` vẫn cần thiết, và \`assets/\` (bao gồm JSON, ảnh) thì đọc được nguyên vẹn.`,
    code: [
      {
        lang: 'bash',
        caption: 'Kiểm tra app của chính mình',
        source: `# Xem cấu trúc + manifest đã decode
apktool d app-release.apk -o out/

# Đọc code (app không obfuscate sẽ hiện tên class/method thật)
jadx-gui app-release.apk

# Tìm secret bị hardcode
grep -rE "(api[_-]?key|secret|password|Bearer )" out/ | head -50

# Xem app có debuggable / allowBackup không
aapt dump badging app-release.apk | grep -i debug`,
      },
      {
        lang: 'bash',
        caption: 'Flutter: obfuscate và giữ symbol để giải mã stack trace',
        source: `flutter build appbundle --release \\
  --obfuscate \\
  --split-debug-info=build/symbols

# Giải mã stack trace từ crash report
flutter symbolize -i crash.txt -d build/symbols/app.android-arm64.symbols`,
      },
    ],
    pitfalls: [
      'Tưởng obfuscation = mã hoá. R8 chỉ **đổi tên**; logic vẫn đọc được, string vẫn nguyên.',
      'Quên lưu `mapping.txt`/symbols mỗi lần release → không đọc được crash sản xuất.',
      'Hard-block máy root → mất một lượng user thật (dev, power user) mà attacker vẫn bypass được.',
      'Tin vào kiểm tra ở client. Nguyên tắc: mọi thứ chạy trên máy user đều nằm trong tay user.',
    ],
    followUps: [
      'Play Integrity API xác thực gì mà client-side check không làm được?',
      'Vì sao Flutter release khó reverse hơn Android native?',
      'R8 full mode có phá reflection không? Xử lý thế nào?',
    ],
  },

  // ============ gen-testing ============
  {
    id: 'test-pyramid',
    groupId: 'gen-testing',
    title: 'Kim tự tháp test trên mobile: chia tỉ lệ thế nào?',
    levels: ['mid'],
    source: 'pdf',
    short:
      'Nhiều **unit test** (nhanh, chạy trên JVM, không cần thiết bị) → ít hơn là **integration/component test** (ViewModel + repository + DB in-memory) → rất ít **UI/E2E test** (Espresso/integration_test, chậm và hay flaky). Tỉ lệ tham chiếu của Google: khoảng **70/20/10**.',
    deep: `| Tầng | Chạy ở đâu | Tốc độ | Test gì |
|---|---|---|---|
| Unit | JVM (\`test/\`) | ms | UseCase, Mapper, ViewModel, logic thuần |
| Integration | JVM + Robolectric hoặc emulator | trăm ms – s | ViewModel + Room in-memory, Retrofit + MockWebServer |
| UI / E2E | Thiết bị/emulator (\`androidTest/\`) | s – phút | Luồng người dùng quan trọng nhất (login, checkout) |

**Cách khiến kiến trúc dễ test** — đây mới là điều interviewer thật sự hỏi:
- ViewModel nhận **interface** repository qua constructor → test thay bằng fake, không cần mock framework.
- Không gọi \`Dispatchers.Main\` trực tiếp; inject \`CoroutineDispatcher\` (hoặc dùng \`MainDispatcherRule\`).
- Không lấy thời gian bằng \`System.currentTimeMillis()\` rải rác; inject \`Clock\`.
- Logic ra khỏi Activity/Fragment/Widget → những chỗ này khó test nhất.

**Test cái gì trước nếu ít thời gian:** logic tính tiền/quy tắc nghiệp vụ, mapper (nơi bug âm thầm), và state machine của ViewModel. Đừng test getter/setter để đẩy coverage.`,
    code: [
      {
        lang: 'kotlin',
        caption: 'Test ViewModel với fake + TestDispatcher',
        source: `class MainDispatcherRule(
    private val dispatcher: TestDispatcher = StandardTestDispatcher(),
) : TestWatcher() {
    override fun starting(d: Description) = Dispatchers.setMain(dispatcher)
    override fun finished(d: Description) = Dispatchers.resetMain()
}

class UserViewModelTest {
    @get:Rule val mainRule = MainDispatcherRule()

    @Test
    fun \`hien loi khi repository that bai\`() = runTest {
        val vm = UserViewModel(FakeUserRepository(failWith = IOException()))

        vm.load("u1")
        advanceUntilIdle()

        assertThat(vm.state.value).isInstanceOf(UiState.Error::class.java)
    }
}`,
      },
    ],
    pitfalls: [
      'Kim tự tháp ngược: chỉ có E2E test → CI chạy 40 phút, flaky, không ai tin kết quả.',
      'Test implementation thay vì behavior (assert "repository.getUser được gọi 1 lần" thay vì assert state đầu ra) → refactor là vỡ test.',
      'Dùng `Thread.sleep` trong test thay vì `runTest`/`advanceUntilIdle`.',
    ],
    followUps: ['Robolectric đánh đổi gì so với emulator?', 'Test flaky thì bạn xử lý thế nào?'],
  },
  {
    id: 'mock-fake-stub',
    groupId: 'gen-testing',
    title: 'Mock, Fake, Stub, Spy khác nhau thế nào? Nên dùng cái nào?',
    levels: ['mid'],
    source: 'pdf',
    short:
      '**Stub**: trả về dữ liệu cố định. **Fake**: có cài đặt thật nhưng đơn giản hoá (in-memory repository). **Mock**: object để **verify tương tác** (đã gọi hàm gì, mấy lần). **Spy**: object thật nhưng ghi lại lời gọi. Thực chiến: **ưu tiên Fake**, dùng Mock chỉ khi bản chất hành vi *là* tương tác (ví dụ verify analytics đã bắn event).',
    deep: `\`\`\`kotlin
// STUB — chỉ trả dữ liệu định trước
class StubUserRepository(private val user: User) : UserRepository {
    override suspend fun getUser(id: String) = user
}

// FAKE — hành vi thật, lưu in-memory; test được cả create/update/delete
class FakeUserRepository : UserRepository {
    private val users = mutableMapOf<String, User>()
    var failWith: Throwable? = null

    override suspend fun getUser(id: String): User {
        failWith?.let { throw it }
        return users[id] ?: error("not found")
    }
    override suspend fun save(user: User) { users[user.id] = user }
}

// MOCK — verify tương tác (MockK)
val analytics = mockk<Analytics>(relaxed = true)
viewModel.onCheckout()
verify(exactly = 1) { analytics.track("checkout_started") }
\`\`\`

**Vì sao ưu tiên Fake:**
- Mock làm test **gắn chặt vào cấu trúc code**: đổi thứ tự gọi hàm là vỡ test dù hành vi không đổi.
- Mock dễ tạo "test luôn xanh": bạn stub đúng thứ bạn nghĩ code làm, nên test chỉ xác nhận giả định của bạn.
- Fake tái sử dụng được ở nhiều test, và chính nó là một dạng tài liệu về hợp đồng của interface.

**Trường hợp Mock đúng là lựa chọn tốt:** verify side-effect không có kết quả trả về — analytics, logging, gửi notification, gọi \`WorkManager.enqueue\`.`,
    pitfalls: [
      'Mock cả lớp mình đang test (mock chính SUT) → test vô nghĩa.',
      'Mock data class / model thuần thay vì tạo object thật.',
      '`verify` mọi lời gọi → test giòn, mọi refactor đều đỏ.',
      'Mock `Context`, `SharedPreferences` thay vì Robolectric hoặc fake — mock 20 method rồi vẫn không đúng hành vi thật.',
    ],
    followUps: ['MockK vs Mockito trên Kotlin (final class, coroutine)?', 'Khi nào dùng `MockWebServer` thay vì fake repository?'],
  },
  {
    id: 'test-coverage-bao-nhieu',
    groupId: 'gen-testing',
    title: 'Unit test nên bao phủ bao nhiêu %?',
    levels: ['mid', 'senior'],
    source: 'pdf',
    short:
      'Không có con số đúng, và trả lời "80%" mà không giải thích là bẫy. Câu trả lời tốt: **coverage là chỉ báo, không phải mục tiêu**. Hãy đặt ngưỡng cao (80–90%) cho **domain/business logic**, thấp hoặc miễn cho UI/DI/generated code, và quan trọng hơn cả là **coverage không giảm** theo từng PR.',
    deep: `**Vì sao 100% là phản tác dụng:** 100% line coverage vẫn có thể bỏ sót toàn bộ edge case (coverage đo *dòng được chạy*, không đo *assert có đúng không*). Ngược lại, đuổi theo con số khiến team viết test rác cho getter/setter.

**Cách đặt ngưỡng theo tầng — đây là câu trả lời của senior:**

| Tầng | Ngưỡng gợi ý | Lý do |
|---|---|---|
| domain (use case, entity, rule) | 90%+ | Logic nghiệp vụ, bug ở đây tốn tiền thật |
| data (mapper, repository) | 80% | Mapper là nơi bug âm thầm nhất |
| presentation (ViewModel) | 70–80% | State machine cần test, còn format text thì không |
| UI (Compose/Widget/Activity) | thấp / không đo | Đắt, giòn; thay bằng vài E2E cho luồng chính |
| DI module, generated, DTO | loại khỏi phép đo | Nhiễu số liệu |

**Chỉ số nên nhìn cùng coverage:**
- **Mutation testing** (Pitest) — đo test có *thực sự bắt lỗi* không, mạnh hơn coverage nhiều.
- **Coverage của code mới trong PR** (\`diff coverage\`) — thực tế hơn coverage toàn repo với dự án legacy.
- Số bug lọt ra production, và crash-free users rate.

Với codebase legacy: đừng đặt mục tiêu tổng. Áp quy tắc **"code mới phải có test, code cũ có test khi bạn sửa nó"** (boy scout rule).`,
    pitfalls: [
      'Nói "100%" — nghe như chưa từng làm dự án thật.',
      'Nói một con số mà không phân biệt theo tầng.',
      'Bỏ qua việc loại generated code khỏi phép đo → số liệu vô nghĩa.',
    ],
    followUps: ['Mutation testing là gì?', 'Dự án legacy 0% coverage, bạn bắt đầu từ đâu?'],
  },
  {
    id: 'tdd-atdd-ddd',
    groupId: 'gen-testing',
    title: 'TDD, ATDD và DDD là gì? Bạn áp dụng thật chưa?',
    levels: ['senior'],
    source: 'pdf',
    short:
      '**TDD**: red → green → refactor, viết test trước từng đơn vị code. **ATDD**: viết **acceptance test** (theo ngôn ngữ nghiệp vụ, cùng PO/QA) trước khi code feature — trả lời "làm đúng thứ cần làm chưa". **DDD**: cách *thiết kế* domain theo ngôn ngữ nghiệp vụ (entity, aggregate, bounded context) — không phải kỹ thuật test.',
    deep: `| | Trả lời câu hỏi | Ai tham gia | Đầu ra |
|---|---|---|---|
| TDD | "Code có đúng không?" | Dev | Unit test |
| ATDD/BDD | "Có làm đúng thứ user cần không?" | Dev + QA + PO | Acceptance criteria dạng Given/When/Then |
| DDD | "Mô hình domain có đúng không?" | Dev + domain expert | Ubiquitous language, aggregate, bounded context |

**TDD trong thực tế mobile:** rất hiệu quả ở **domain layer** (use case tính giá, quy tắc giảm giá, state machine) — nơi input/output rõ ràng. Rất khó và ít giá trị ở UI layer. Trả lời trung thực kiểu này đáng tin hơn là "em luôn TDD 100%".

**DDD trong app mobile:** phần dùng được nhiều nhất là **ubiquitous language** (đặt tên class đúng theo từ ngữ nghiệp vụ: \`Order\`, \`Voucher\`, \`FulfillmentStatus\` chứ không \`DataManager2\`) và **bounded context** làm cơ sở để **chia module** (\`:feature:cart\`, \`:feature:checkout\` với model riêng, không dùng chung một \`Order\` khổng lồ). Aggregate/repository thì thường đã có sẵn qua Clean Architecture.

Cách nói ăn điểm: "Ở dự án X, chúng tôi dùng ATDD cho luồng thanh toán: QA và PO viết Given/When/Then trước, dev biến chúng thành integration test, nhờ đó không còn tranh cãi 'requirement là thế này hay thế kia' lúc review."`,
    pitfalls: [
      'Nhầm DDD là "Design Driven Development" hoặc coi nó là kỹ thuật test.',
      'Nói mình luôn TDD mọi thứ — người phỏng vấn có kinh nghiệm sẽ không tin.',
      'Viết test *sau* rồi gọi là TDD.',
    ],
    followUps: ['BDD khác ATDD ở đâu?', 'Bounded context giúp chia module thế nào?'],
  },

  // ============ gen-dsa ============
  {
    id: 'dsa-trong-mobile',
    groupId: 'gen-dsa',
    title: 'Cấu trúc dữ liệu nào thực sự hay dùng trong app mobile?',
    levels: ['junior', 'mid'],
    source: 'pdf',
    short:
      'Thực tế 90% là **List/ArrayList** (RecyclerView, ListView.builder), **Map/HashMap** (cache, lookup theo id), **Set** (kiểm tra tồn tại, chống trùng), **LinkedHashMap** (nền của `LruCache`), và **Queue/Deque** (message queue, undo stack). Điều interviewer đo là bạn có **chọn đúng theo độ phức tạp** không, chứ không phải cài lại cấu trúc từ đầu.',
    deep: `| Thao tác | List | HashMap / HashSet | LinkedList |
|---|---|---|---|
| Truy cập theo index | O(1) | — | O(n) |
| Tìm theo key/giá trị | O(n) | **O(1)** trung bình | O(n) |
| Thêm cuối | O(1) khấu hao | O(1) | O(1) |
| Thêm/xoá giữa | O(n) | O(1) | O(1) nếu đã có node |

**Ba tình huống thật hay được hỏi:**

1. **"Danh sách 5000 item, lọc theo id thấy chậm"** → đang \`list.find { it.id == id }\` trong \`onBindViewHolder\` → O(n) mỗi lần bind → O(n²). Sửa: dựng \`Map<String, Item>\` một lần.

\`\`\`kotlin
// Xấu: O(n) mỗi lần bind
val selected = items.find { it.id == selectedId }

// Tốt: dựng index một lần, O(1) mỗi lần tra
private val byId: Map<String, Item> = items.associateBy { it.id }
val selected = byId[selectedId]
\`\`\`

2. **"Cần LRU cache"** → \`LinkedHashMap(capacity, 0.75f, accessOrder = true)\` + override \`removeEldestEntry\`, hoặc dùng luôn \`LruCache\` của Android.

3. **"DiffUtil so sánh 2 list"** → hiểu vì sao cần \`areItemsTheSame\` (theo id) và \`areContentsTheSame\` (theo nội dung), và vì sao thuật toán Myers là O(n) bộ nhớ chứ không phải so sánh brute force.

**Đệ quy** (có trong tài liệu): quan trọng nhất là biết giới hạn stack và biết chuyển sang vòng lặp hoặc \`tailrec\` — xem câu về \`StackOverflowError\`.`,
    pitfalls: [
      'Dùng `List.contains` trong vòng lặp → O(n²). Chuyển sang `Set`.',
      'Nhét logic O(n) vào `onBindViewHolder` hoặc `build()` của widget — chạy hàng chục lần mỗi giây.',
      'Object dùng làm key HashMap mà không override `equals`/`hashCode` (Kotlin `data class` làm sẵn; class thường thì không).',
    ],
    followUps: [
      'HashMap va chạm (collision) xử lý thế nào? Vì sao cần `hashCode` tốt?',
      'DiffUtil hoạt động ra sao và vì sao phải chạy nó off main thread với list lớn?',
    ],
  },
]
