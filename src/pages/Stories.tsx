import { useMemo, useState } from 'react'
import { STORY_PROMPTS } from '../data/stories'
import { useLocalState } from '../lib/useLocalState'
import { IconChevron, IconDownload, IconCheck } from '../components/Icons'
import { ProgressRing } from '../components/ProgressRing'

interface StoryDraft {
  situation: string
  task: string
  action: string
  result: string
}

type Drafts = Record<string, StoryDraft>

const EMPTY: StoryDraft = { situation: '', task: '', action: '', result: '' }

const PARTS = [
  { key: 'situation' as const, letter: 'S', label: 'Situation — bối cảnh' },
  { key: 'task' as const, letter: 'T', label: 'Task — nhiệm vụ của bạn' },
  { key: 'action' as const, letter: 'A', label: 'Action — bạn đã làm gì' },
  { key: 'result' as const, letter: 'R', label: 'Result — kết quả & bài học' },
]

export function Stories() {
  const [drafts, setDrafts] = useLocalState<Drafts>('star-drafts', {})
  const [openId, setOpenId] = useState<string | null>(STORY_PROMPTS[0].id)

  const completed = useMemo(
    () =>
      STORY_PROMPTS.filter((p) => {
        const d = drafts[p.id]
        return d && d.situation.trim() && d.action.trim() && d.result.trim()
      }).length,
    [drafts],
  )

  const update = (id: string, part: keyof StoryDraft, value: string) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] ?? EMPTY), [part]: value } }))

  const exportMarkdown = () => {
    const lines: string[] = ['# Interview Stories (STAR)', '']
    for (const p of STORY_PROMPTS) {
      const d = drafts[p.id]
      if (!d || !(d.situation || d.task || d.action || d.result)) continue
      lines.push(`## ${p.title}`, '')
      for (const part of PARTS) {
        const text = d[part.key].trim()
        if (text) lines.push(`**${part.letter} — ${part.label.split('—')[1].trim()}**`, '', text, '')
      }
      lines.push('---', '')
    }
    if (lines.length <= 2) {
      alert('Bạn chưa viết câu chuyện nào để xuất.')
      return
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'star-stories.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
          Interview Stories (STAR)
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-500 dark:text-ink-400">
          10 tình huống interviewer hầu như luôn hỏi. Viết sẵn câu chuyện của{' '}
          <strong className="font-semibold text-ink-700 dark:text-ink-200">chính bạn</strong> — dùng
          “tôi” chứ không “chúng tôi”, và Result phải có số liệu. Nội dung lưu trong trình duyệt này.
        </p>
      </header>

      <div className="card mb-6 flex flex-wrap items-center gap-4 p-4">
        <ProgressRing value={completed / STORY_PROMPTS.length} size={56} stroke={6} />
        <div className="min-w-[160px] flex-1">
          <p className="text-sm font-semibold text-ink-900 dark:text-white">
            {completed}/{STORY_PROMPTS.length} câu chuyện đã viết
          </p>
          <p className="mt-0.5 text-[13px] text-ink-500 dark:text-ink-400">
            Cần ít nhất S, A, R để tính là hoàn thành. 6–8 câu chuyện tốt là đủ cho mọi buổi phỏng vấn.
          </p>
        </div>
        <button type="button" onClick={exportMarkdown} className="btn shrink-0">
          <IconDownload />
          Xuất Markdown
        </button>
      </div>

      <div className="space-y-3">
        {STORY_PROMPTS.map((prompt) => {
          const draft = drafts[prompt.id] ?? EMPTY
          const isOpen = openId === prompt.id
          const done = !!(draft.situation.trim() && draft.action.trim() && draft.result.trim())
          const filled = PARTS.filter((p) => draft[p.key].trim()).length

          return (
            <section key={prompt.id} className="card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : prompt.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-ink-50 dark:hover:bg-ink-800/40"
              >
                <IconChevron
                  className={`shrink-0 text-ink-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-ink-900 dark:text-white">{prompt.title}</span>
                    {done && (
                      <IconCheck className="shrink-0 text-emerald-600" width={14} height={14} />
                    )}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-ink-400">
                    Đo: {prompt.measures}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-400">
                  {filled}/4
                </span>
              </button>

              {isOpen && (
                <div className="animate-fade-in border-t border-ink-100 p-4 dark:border-ink-800">
                  <div className="mb-4 rounded-lg border-l-[3px] border-accent-400 bg-accent-50/50 px-3.5 py-2.5 dark:bg-accent-900/15">
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent-700 dark:text-accent-300">
                      Nhất định phải có
                    </p>
                    <ul className="list-disc space-y-1 pl-4 text-[13px] leading-relaxed text-ink-700 dark:text-ink-200">
                      {prompt.mustHave.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    {PARTS.map((part) => (
                      <div key={part.key}>
                        <label className="mb-1 flex items-baseline gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-ink-800 text-[11px] font-bold text-white dark:bg-ink-200 dark:text-ink-900">
                            {part.letter}
                          </span>
                          <span className="text-sm font-medium text-ink-800 dark:text-ink-100">
                            {part.label}
                          </span>
                        </label>
                        <p className="mb-1.5 pl-7 text-[12.5px] leading-relaxed text-ink-400">
                          {prompt.hints[part.key]}
                        </p>
                        <textarea
                          value={draft[part.key]}
                          onChange={(e) => update(prompt.id, part.key, e.target.value)}
                          rows={part.key === 'action' ? 6 : 3}
                          placeholder="Viết câu chuyện của bạn…"
                          className="w-full resize-y rounded-lg border border-ink-200 bg-white px-3 py-2 text-[14px] leading-relaxed outline-none transition placeholder:text-ink-300 focus:border-accent-400 dark:border-ink-700 dark:bg-ink-950 dark:placeholder:text-ink-600"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
