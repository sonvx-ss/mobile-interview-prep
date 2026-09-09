import { useCallback, useMemo, useState } from 'react'
import { buildMockSet } from '../data/selectors'
import { questionById } from '../data/questions'
import { groupById, trackById, TRACKS } from '../data/tracks'
import { LEVELS, LEVEL_LABEL, type Level, type TrackId } from '../data/types'
import { useLocalState } from '../lib/useLocalState'
import { useProgress, MARK_LABEL, type Mark } from '../lib/progress'
import { QuestionCard } from '../components/QuestionCard'
import { Timer } from '../components/Timer'
import { ProgressRing } from '../components/ProgressRing'
import { IconChevron, IconPlay, IconRefresh } from '../components/Icons'
import { CodeTitle } from '../components/CodeTitle'
import { navigate } from '../lib/router'

/** Thời lượng gợi ý mỗi câu theo level (giây) */
const SECONDS_BY_LEVEL: Record<Level, number> = { junior: 120, mid: 180, senior: 240 }

const SELECTABLE_TRACKS: TrackId[] = ['android', 'flutter', 'general', 'architecture', 'system-design']

interface MockSession {
  questionIds: string[]
  index: number
  level: Level
  secondsPerQuestion: number
  /** id -> tự đánh giá sau khi xem đáp án */
  scores: Record<string, Mark>
  startedAt: number
  finished: boolean
}

export function Mock() {
  const [session, setSession] = useLocalState<MockSession | null>('mock-session', null)
  const [trackIds, setTrackIds] = useLocalState<TrackId[]>('mock-tracks', ['android'])
  const [level, setLevel] = useLocalState<Level>('mock-level', 'mid')
  const [count, setCount] = useLocalState<number>('mock-count', 12)
  const [includeBehavioral, setIncludeBehavioral] = useLocalState('mock-behavioral', true)

  const start = () => {
    const set = buildMockSet({ trackIds, level, count, includeBehavioral })
    if (set.length === 0) return
    setSession({
      questionIds: set.map((q) => q.id),
      index: 0,
      level,
      secondsPerQuestion: SECONDS_BY_LEVEL[level],
      scores: {},
      startedAt: Date.now(),
      finished: false,
    })
  }

  if (!session) {
    return (
      <Setup
        trackIds={trackIds}
        setTrackIds={setTrackIds}
        level={level}
        setLevel={setLevel}
        count={count}
        setCount={setCount}
        includeBehavioral={includeBehavioral}
        setIncludeBehavioral={setIncludeBehavioral}
        onStart={start}
      />
    )
  }

  if (session.finished) {
    return <Summary session={session} onRestart={() => setSession(null)} />
  }

  return <Running session={session} setSession={setSession} onAbort={() => setSession(null)} />
}

// ---------------- Thiết lập ----------------

function Setup(props: {
  trackIds: TrackId[]
  setTrackIds: (v: TrackId[]) => void
  level: Level
  setLevel: (v: Level) => void
  count: number
  setCount: (v: number) => void
  includeBehavioral: boolean
  setIncludeBehavioral: (v: boolean) => void
  onStart: () => void
}) {
  const {
    trackIds,
    setTrackIds,
    level,
    setLevel,
    count,
    setCount,
    includeBehavioral,
    setIncludeBehavioral,
    onStart,
  } = props

  const preview = useMemo(
    () => buildMockSet({ trackIds, level, count, includeBehavioral, seed: 1 }),
    [trackIds, level, count, includeBehavioral],
  )

  const available = useMemo(
    () => buildMockSet({ trackIds, level, count: 999, includeBehavioral, seed: 1 }).length,
    [trackIds, level, includeBehavioral],
  )

  const toggleTrack = (id: TrackId) =>
    setTrackIds(trackIds.includes(id) ? trackIds.filter((t) => t !== id) : [...trackIds, id])

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
        Mock interview
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-500 dark:text-ink-400">
        Bộ đề ngẫu nhiên trải đều các nhóm chủ đề. Mỗi câu có đồng hồ riêng — hãy{' '}
        <strong className="font-semibold text-ink-700 dark:text-ink-200">trả lời thành tiếng</strong>{' '}
        trước khi xem đáp án mẫu, rồi tự đánh giá.
      </p>

      <div className="mt-7 space-y-6">
        <Field label="Chủ đề" hint="Chọn nhiều được">
          <div className="flex flex-wrap gap-2">
            {SELECTABLE_TRACKS.map((id) => {
              const t = TRACKS.find((x) => x.id === id)!
              const on = trackIds.includes(id)
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleTrack(id)}
                  aria-pressed={on}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                    on
                      ? 'border-accent-500 bg-accent-50 text-accent-800 dark:bg-accent-900/30 dark:text-accent-200'
                      : 'border-ink-200 text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800'
                  }`}
                >
                  {t.emoji} {t.title}
                </button>
              )
            })}
          </div>
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
            <input
              type="checkbox"
              checked={includeBehavioral}
              onChange={(e) => setIncludeBehavioral(e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-accent-600 focus:ring-accent-400"
            />
            Thêm câu behavioral (STAR)
          </label>
        </Field>

        <Field label="Level" hint={`Đồng hồ: ${SECONDS_BY_LEVEL[level] / 60} phút mỗi câu`}>
          <div className="flex gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                aria-pressed={level === l}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  level === l
                    ? 'border-accent-500 bg-accent-50 text-accent-800 dark:bg-accent-900/30 dark:text-accent-200'
                    : 'border-ink-200 text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800'
                }`}
              >
                {LEVEL_LABEL[l]}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Số câu" hint={`Có ${available} câu phù hợp với lựa chọn hiện tại`}>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={5}
              max={Math.max(5, Math.min(30, available))}
              step={1}
              value={Math.min(count, Math.max(5, available))}
              onChange={(e) => setCount(Number(e.target.value))}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-ink-200 accent-accent-600 dark:bg-ink-700"
            />
            <span className="w-10 shrink-0 text-right font-mono text-sm tabular-nums text-ink-700 dark:text-ink-200">
              {Math.min(count, Math.max(5, available))}
            </span>
          </div>
        </Field>
      </div>

      <button
        type="button"
        onClick={onStart}
        disabled={preview.length === 0}
        className="btn btn-primary mt-8 w-full justify-center py-2.5 text-[15px]"
      >
        <IconPlay />
        Bắt đầu — {preview.length} câu, khoảng{' '}
        {Math.round((preview.length * SECONDS_BY_LEVEL[level]) / 60)} phút
      </button>

      {preview.length === 0 && (
        <p className="mt-3 text-center text-sm text-rose-600">
          Chưa có câu nào khớp. Hãy chọn thêm chủ đề hoặc đổi level.
        </p>
      )}

      {preview.length > 0 && (
        <details className="mt-5">
          <summary className="cursor-pointer text-sm text-ink-400 hover:text-ink-600">
            Xem trước các nhóm chủ đề sẽ xuất hiện
          </summary>
          <ul className="mt-2 space-y-1 text-[13px] text-ink-500 dark:text-ink-400">
            {[...new Set(preview.map((q) => q.groupId))].map((gid) => (
              <li key={gid}>
                · {trackById(groupById(gid)?.trackId ?? '')?.emoji} {groupById(gid)?.title}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink-900 dark:text-white">{label}</h2>
        {hint && <span className="text-xs text-ink-400">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

// ---------------- Đang làm ----------------

function Running({
  session,
  setSession,
  onAbort,
}: {
  session: MockSession
  setSession: (updater: (prev: MockSession | null) => MockSession | null) => void
  onAbort: () => void
}) {
  const [running, setRunning] = useState(true)
  const [timerKeySalt, setTimerKeySalt] = useState(0)

  const question = questionById(session.questionIds[session.index])
  const total = session.questionIds.length
  const group = question ? groupById(question.groupId) : undefined
  const track = group ? trackById(group.trackId) : undefined

  const setScore = useCallback(
    (mark: Mark) =>
      setSession((prev) =>
        prev ? { ...prev, scores: { ...prev.scores, [session.questionIds[prev.index]]: mark } } : prev,
      ),
    [setSession, session.questionIds],
  )

  const goto = useCallback(
    (delta: number) => {
      setSession((prev) => {
        if (!prev) return prev
        const next = prev.index + delta
        if (next < 0) return prev
        if (next >= prev.questionIds.length) return { ...prev, finished: true }
        return { ...prev, index: next }
      })
      setRunning(true)
    },
    [setSession],
  )

  if (!question) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-ink-500">Không tải được câu hỏi này.</p>
        <button type="button" className="btn mt-4" onClick={onAbort}>
          Bắt đầu lại
        </button>
      </div>
    )
  }

  const currentScore = session.scores[question.id]

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      {/* Thanh trạng thái */}
      <div className="no-print sticky top-14 z-10 -mx-4 mb-5 border-b border-ink-100 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 dark:border-ink-800 dark:bg-ink-950/95">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-ink-700 dark:text-ink-200">
            Câu <span className="font-mono tabular-nums">{session.index + 1}</span> / {total}
            <span className="ml-2 text-xs font-normal text-ink-400">
              {LEVEL_LABEL[session.level]} · {track?.emoji} {group?.title}
            </span>
          </span>
          <button
            type="button"
            onClick={() => {
              if (confirm('Kết thúc buổi mock này và xem kết quả?'))
                setSession((p) => (p ? { ...p, finished: true } : p))
            }}
            className="shrink-0 text-xs text-ink-400 underline decoration-dotted hover:text-ink-700"
          >
            Kết thúc sớm
          </button>
        </div>

        <Timer
          seconds={session.secondsPerQuestion}
          running={running}
          onToggle={() => setRunning((r) => !r)}
          onReset={() => setTimerKeySalt((s) => s + 1)}
          onExpire={() => setRunning(false)}
          resetKey={`${question.id}-${timerKeySalt}`}
        />

        {/* Dải tiến độ các câu */}
        <div className="mt-2.5 flex gap-1">
          {session.questionIds.map((id, i) => {
            const s = session.scores[id]
            return (
              <span
                key={id}
                title={`Câu ${i + 1}${s ? `: ${MARK_LABEL[s]}` : ''}`}
                className={`h-1 flex-1 rounded-full ${
                  i === session.index
                    ? 'bg-accent-500'
                    : s === 'known'
                      ? 'bg-emerald-400'
                      : s === 'unsure'
                        ? 'bg-amber-400'
                        : s === 'todo'
                          ? 'bg-rose-300'
                          : 'bg-ink-200 dark:bg-ink-700'
                }`}
              />
            )
          })}
        </div>
      </div>

      <QuestionCard question={question} quizMode key={question.id} />

      {/* Tự đánh giá + điều hướng */}
      <div className="no-print mt-5 rounded-xl border border-ink-200 bg-ink-50/60 p-4 dark:border-ink-800 dark:bg-ink-900/50">
        <p className="mb-2.5 text-sm font-medium text-ink-700 dark:text-ink-200">
          Bạn trả lời câu này thế nào?
        </p>
        <div className="flex flex-wrap gap-2">
          {(['known', 'unsure', 'todo'] as Mark[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setScore(m)}
              aria-pressed={currentScore === m}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                currentScore === m
                  ? m === 'known'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                    : m === 'unsure'
                      ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                      : 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300'
                  : 'border-ink-200 text-ink-600 hover:bg-white dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800'
              }`}
            >
              {m === 'known' ? 'Trả lời tốt' : m === 'unsure' ? 'Trả lời được một phần' : 'Chưa trả lời được'}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => goto(-1)}
            disabled={session.index === 0}
            className="btn px-2.5"
            aria-label="Câu trước"
          >
            <IconChevron className="rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => goto(1)}
            className="btn btn-primary flex-1 justify-center py-2.5"
          >
            {session.index === total - 1 ? 'Xem kết quả' : 'Câu tiếp theo'}
            <IconChevron />
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------- Kết quả ----------------

function Summary({ session, onRestart }: { session: MockSession; onRestart: () => void }) {
  const { setMark } = useProgress()

  const answered = session.questionIds.filter((id) => session.scores[id])
  const good = answered.filter((id) => session.scores[id] === 'known')
  const partial = answered.filter((id) => session.scores[id] === 'unsure')
  const missed = answered.filter((id) => session.scores[id] === 'todo')
  const minutes = Math.max(1, Math.round((Date.now() - session.startedAt) / 60000))

  // Nhóm chủ đề yếu nhất
  const weakByGroup = useMemo(() => {
    const map = new Map<string, { weak: number; total: number }>()
    for (const id of session.questionIds) {
      const q = questionById(id)
      if (!q) continue
      const s = map.get(q.groupId) ?? { weak: 0, total: 0 }
      s.total++
      if (session.scores[id] === 'todo' || session.scores[id] === 'unsure') s.weak++
      map.set(q.groupId, s)
    }
    return [...map.entries()]
      .filter(([, v]) => v.weak > 0)
      .sort((a, b) => b[1].weak / b[1].total - a[1].weak / a[1].total)
      .slice(0, 4)
  }, [session])

  const saveToProgress = () => {
    for (const [id, mark] of Object.entries(session.scores)) setMark(id, mark)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
        Kết quả buổi mock
      </h1>
      <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
        {LEVEL_LABEL[session.level]} · {session.questionIds.length} câu · khoảng {minutes} phút
      </p>

      <div className="card mt-6 flex flex-wrap items-center gap-6 p-5">
        <ProgressRing
          value={answered.length ? good.length / answered.length : 0}
          size={72}
          stroke={7}
        />
        <div className="min-w-[180px] flex-1 space-y-1.5 text-sm">
          <Row label="Trả lời tốt" value={good.length} className="text-emerald-600 dark:text-emerald-400" />
          <Row label="Được một phần" value={partial.length} className="text-amber-600 dark:text-amber-400" />
          <Row label="Chưa trả lời được" value={missed.length} className="text-rose-600 dark:text-rose-400" />
          {answered.length < session.questionIds.length && (
            <Row
              label="Chưa tự đánh giá"
              value={session.questionIds.length - answered.length}
              className="text-ink-400"
            />
          )}
        </div>
      </div>

      {weakByGroup.length > 0 && (
        <section className="mt-7">
          <h2 className="mb-2.5 text-sm font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
            Nên ôn lại trước
          </h2>
          <div className="space-y-2">
            {weakByGroup.map(([gid, v]) => {
              const g = groupById(gid)
              const t = g ? trackById(g.trackId) : undefined
              return (
                <button
                  key={gid}
                  type="button"
                  onClick={() => navigate(`/study/${gid}`)}
                  className="card flex w-full items-center gap-3 p-3 text-left transition hover:border-accent-300 dark:hover:border-accent-700"
                >
                  <span className="shrink-0">{t?.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink-900 dark:text-white">
                      {g?.title}
                    </span>
                    <span className="text-xs text-ink-400">
                      {v.weak}/{v.total} câu trong nhóm này bạn chưa vững
                    </span>
                  </span>
                  <IconChevron className="shrink-0 text-ink-300" />
                </button>
              )
            })}
          </div>
        </section>
      )}

      <section className="mt-7">
        <h2 className="mb-2.5 text-sm font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
          Chi tiết từng câu
        </h2>
        <ul className="card divide-y divide-ink-100 dark:divide-ink-800">
          {session.questionIds.map((id, i) => {
            const q = questionById(id)
            const s = session.scores[id]
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => q && navigate(`/study/${q.groupId}?q=${q.id}`)}
                  className="flex w-full items-start gap-3 p-3 text-left transition hover:bg-ink-50 dark:hover:bg-ink-800/50"
                >
                  <span className="mt-0.5 shrink-0 font-mono text-xs tabular-nums text-ink-400">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-sm text-ink-800 dark:text-ink-100">
                    <CodeTitle text={q?.title ?? id} />
                  </span>
                  <span
                    className={`chip shrink-0 ${
                      s === 'known'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                        : s === 'unsure'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                          : s === 'todo'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300'
                            : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'
                    }`}
                  >
                    {s ? MARK_LABEL[s] : '—'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            saveToProgress()
            onRestart()
          }}
          className="btn btn-primary flex-1 justify-center py-2.5"
        >
          Lưu vào tiến độ &amp; làm bộ mới
        </button>
        <button type="button" onClick={onRestart} className="btn justify-center px-4 py-2.5">
          <IconRefresh />
          Bỏ qua
        </button>
      </div>
      <p className="mt-2.5 text-xs text-ink-400">
        “Lưu vào tiến độ” sẽ ghi kết quả tự đánh giá của buổi này vào trạng thái từng câu ở phần Ôn tập.
      </p>
    </div>
  )
}

function Row({
  label,
  value,
  className,
}: {
  label: string
  value: number
  className?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-ink-500 dark:text-ink-400">{label}</span>
      <span className={`font-mono font-semibold tabular-nums ${className ?? ''}`}>{value}</span>
    </div>
  )
}
