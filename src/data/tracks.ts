import type { Group, Track } from './types'

export const TRACKS: Track[] = [
  {
    id: 'general',
    title: 'Nền tảng chung',
    emoji: '🧱',
    blurb: 'OOP, JVM, bộ nhớ, thread, bảo mật, testing — phần nào interviewer nào cũng hỏi.',
  },
  {
    id: 'android',
    title: 'Android',
    emoji: '🤖',
    blurb: 'Lifecycle, Coroutine/Flow, Room, Compose, Hilt, Kotlin nâng cao.',
  },
  {
    id: 'flutter',
    title: 'Flutter',
    emoji: '🐦',
    blurb: 'Widget/Element/Render tree, event loop, isolate, state management, platform channel.',
  },
  {
    id: 'architecture',
    title: 'Architecture',
    emoji: '🏛️',
    blurb: 'Clean Architecture, MVVM, SOLID, design pattern, DI.',
  },
  {
    id: 'system-design',
    title: 'System Design (Mobile)',
    emoji: '🗺️',
    blurb: 'Caching, pagination, offline-first, sync, CI/CD, modularization.',
  },
  {
    id: 'behavioral',
    title: 'Behavioral (STAR)',
    emoji: '💬',
    blurb: 'Câu chuyện nghề: incident, refactor, conflict, deadline — kể theo khung STAR.',
  },
]

export const GROUPS: Group[] = [
  // ---- general ----
  { id: 'gen-oop', trackId: 'general', title: 'OOP & Java/JVM core', blurb: 'JVM/JRE/JDK, 4 tính chất OOP, abstract vs interface, static, access modifier.' },
  { id: 'gen-memory', trackId: 'general', title: 'Bộ nhớ & GC', blurb: 'Heap vs Stack, garbage collection, memory leak, reference types.' },
  { id: 'gen-concurrency', trackId: 'general', title: 'Thread / Process / Handler', blurb: 'Thread vs process, Looper/MessageQueue/Handler, race condition.' },
  { id: 'gen-security', trackId: 'general', title: 'Bảo mật ứng dụng mobile', blurb: 'SSL pinning, OAuth2/JWT, mã hoá, secure storage, OWASP Mobile Top 10, reverse engineering.' },
  { id: 'gen-testing', trackId: 'general', title: 'Testing & chất lượng', blurb: 'Unit/UI/integration test, mock-fake-stub, coverage bao nhiêu là đủ, TDD/ATDD/DDD.' },
  { id: 'gen-dsa', trackId: 'general', title: 'Data Structure & Algorithm', blurb: 'Cấu trúc dữ liệu hay dùng trong app mobile, độ phức tạp, đệ quy.' },

  // ---- android ----
  { id: 'and-foundation', trackId: 'android', title: 'Android Foundation', blurb: 'Activity/Fragment lifecycle, process death, launch mode, 4 component, deep link.' },
  { id: 'and-perf', trackId: 'android', title: 'Memory / Performance', blurb: 'Memory leak, ANR, jank frame, main thread blocking, 16KB page size, giảm size app.' },
  { id: 'and-concurrency', trackId: 'android', title: 'Concurrency', blurb: 'Coroutine, Dispatcher, structured concurrency, Flow/StateFlow/SharedFlow, RxJava.' },
  { id: 'and-storage', trackId: 'android', title: 'Storage / Database', blurb: 'SharedPreferences vs DataStore, Room, migration, transaction, index, offline-first.' },
  { id: 'and-security', trackId: 'android', title: 'Android Security', blurb: 'Keystore, EncryptedSharedPreferences, certificate pinning, R8/ProGuard, root detection.' },
  { id: 'and-di', trackId: 'android', title: 'Dependency Injection', blurb: 'Hilt, Dagger, Koin, scope, singleton lifecycle, service locator.' },
  { id: 'and-compose', trackId: 'android', title: 'Jetpack Compose', blurb: 'Recomposition, remember/rememberSaveable, stability, snapshot system, performance.' },
  { id: 'and-kotlin', trackId: 'android', title: 'Kotlin Advanced', blurb: 'inline/reified, scope function, sealed class, delegation, data class, null safety.' },
  { id: 'and-jetpack', trackId: 'android', title: 'Jetpack & Navigation', blurb: 'ViewModel, LiveData, Navigation, DataBinding, Lifecycle, WorkManager.' },
  { id: 'and-testing', trackId: 'android', title: 'Android Testing', blurb: 'JUnit, Espresso, Robolectric, test ViewModel/Flow, fake repository.' },
  { id: 'and-build', trackId: 'android', title: 'Build / Gradle / Release', blurb: 'APK vs AAB, build variant, product flavor, R8, app bundle, size optimization.' },

  // ---- flutter ----
  { id: 'flu-foundation', trackId: 'flutter', title: 'Flutter Foundation', blurb: 'Stateless vs Stateful, widget lifecycle, 3 cây widget/element/render, BuildContext.' },
  { id: 'flu-rendering', trackId: 'flutter', title: 'Rendering / Performance', blurb: 'Rendering pipeline, Skia/Impeller, UI vs raster thread, RepaintBoundary, const widget.' },
  { id: 'flu-state', trackId: 'flutter', title: 'State Management', blurb: 'setState, InheritedWidget, Provider, Bloc/Cubit, Riverpod, GetX, state lifting.' },
  { id: 'flu-concurrency', trackId: 'flutter', title: 'Dart Concurrency', blurb: 'Future, async/await, event loop, microtask queue, Isolate, compute.' },
  { id: 'flu-bridge', trackId: 'flutter', title: 'Native Bridge', blurb: 'MethodChannel, EventChannel, Pigeon, FFI, chia sẻ storage với native.' },
  { id: 'flu-architecture', trackId: 'flutter', title: 'Flutter Architecture', blurb: 'Clean architecture trong Flutter, feature-first, repository, use case.' },
  { id: 'flu-security', trackId: 'flutter', title: 'Flutter Security', blurb: 'Obfuscation, secure storage, certificate pinning, bảo vệ API key.' },
  { id: 'flu-testing', trackId: 'flutter', title: 'Flutter Testing', blurb: 'Unit, widget test, golden test, integration test, mocking.' },
  { id: 'flu-dart', trackId: 'flutter', title: 'Dart Advanced', blurb: 'Mixin, extension, factory/named constructor, const vs final, các loại Key.' },

  // ---- architecture ----
  { id: 'arch-clean', trackId: 'architecture', title: 'Clean Architecture', blurb: 'Layer, dependency rule, domain, use case, repository, DTO vs Entity vs UI Model, trade-off.' },
  { id: 'arch-presentation', trackId: 'architecture', title: 'MVVM / MVP / MVC', blurb: 'ViewModel, UI state, state holder, single source of truth, so sánh các pattern.' },
  { id: 'arch-patterns', trackId: 'architecture', title: 'Design Patterns', blurb: 'Factory, Builder, Singleton, Observer, Strategy, Adapter, Facade, Decorator, Command.' },
  { id: 'arch-solid', trackId: 'architecture', title: 'SOLID', blurb: 'SRP, OCP, LSP, ISP, DIP — kèm ví dụ mobile thật.' },
  { id: 'arch-di', trackId: 'architecture', title: 'DI nguyên lý', blurb: 'Constructor vs field injection, scope, runtime vs compile-time DI.' },
  { id: 'arch-realworld', trackId: 'architecture', title: 'Architecture thực chiến', blurb: 'Feature module, monolith vs modularization, error handling, navigation, design system.' },

  // ---- system design ----
  { id: 'sd-thinking', trackId: 'system-design', title: 'Tư duy kiến trúc', blurb: 'Scalability, maintainability, separation of concerns, trade-off thinking.' },
  { id: 'sd-dataflow', trackId: 'system-design', title: 'Luồng dữ liệu', blurb: 'Caching strategy, pagination, offline-first, sync, retry, conflict resolution.' },
  { id: 'sd-ops', trackId: 'system-design', title: 'CI/CD & Observability', blurb: 'Fastlane, GitHub Actions, Firebase App Distribution, build variant, logging + monitoring.' },
  { id: 'sd-ai', trackId: 'system-design', title: 'AI / Modern Workflow', blurb: 'MCP, sub-agent, skill, hook, AI-assisted development, Cursor/Copilot workflow.' },

  // ---- behavioral ----
  { id: 'beh-star', trackId: 'behavioral', title: 'Kể chuyện theo STAR', blurb: 'Cách dựng câu chuyện, tránh lỗi thường gặp, và 10 tình huống cần chuẩn bị sẵn.' },
]

export const trackById = (id: string) => TRACKS.find((t) => t.id === id)
export const groupById = (id: string) => GROUPS.find((g) => g.id === id)
export const groupsOfTrack = (trackId: string) => GROUPS.filter((g) => g.trackId === trackId)
