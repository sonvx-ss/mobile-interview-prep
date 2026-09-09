import { GROUPS, TRACKS } from '../data/tracks'
import { ALL_QUESTIONS } from '../data/questions'
import { useProgress } from '../lib/progress'
import { navigate } from '../lib/router'
import { StatBar } from '../components/StatBar'

export function StudyIndex() {
  const { marks } = useProgress()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
        Ôn tập theo chủ đề
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-500 dark:text-ink-400">
        Chọn một nhóm để bắt đầu. Trên máy tính, cây chủ đề luôn hiện ở thanh bên trái.
      </p>

      <div className="mt-8 space-y-8">
        {TRACKS.map((track) => {
          const groups = GROUPS.filter((g) => g.trackId === track.id)
          return (
            <section key={track.id}>
              <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-ink-900 dark:text-white">
                <span>{track.emoji}</span>
                {track.title}
              </h2>
              <p className="mb-3 text-[13px] text-ink-400">{track.blurb}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {groups.map((g) => {
                  const qs = ALL_QUESTIONS.filter((q) => q.groupId === g.id)
                  const known = qs.filter((q) => marks[q.id] === 'known').length
                  const unsure = qs.filter((q) => marks[q.id] === 'unsure').length
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => navigate(`/study/${g.id}`)}
                      disabled={qs.length === 0}
                      className="card p-3 text-left transition hover:border-accent-300 disabled:opacity-50 dark:hover:border-accent-700"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium text-ink-900 dark:text-white">
                          {g.title}
                        </span>
                        <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-400">
                          {qs.length ? `${known}/${qs.length}` : 'sắp có'}
                        </span>
                      </div>
                      {qs.length > 0 && (
                        <div className="mt-2">
                          <StatBar known={known} unsure={unsure} total={qs.length} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
