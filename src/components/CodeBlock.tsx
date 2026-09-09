import { useState } from 'react'
import { Markdown } from './Markdown'
import { IconCopy, IconCheck } from './Icons'
import type { CodeSample } from '../data/types'

export function CodeBlock({ sample }: { sample: CodeSample }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sample.source)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      /* clipboard bị chặn — bỏ qua */
    }
  }

  return (
    <figure className="group relative">
      {sample.caption && (
        <figcaption className="mb-1 text-xs font-medium text-ink-500 dark:text-ink-400">
          {sample.caption}
        </figcaption>
      )}
      <button
        type="button"
        onClick={copy}
        title="Copy code"
        className="absolute right-2 top-2 z-10 rounded-md border border-ink-200 bg-white/90 p-1.5 text-ink-500
                   opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100
                   hover:text-ink-800 dark:border-ink-700 dark:bg-ink-900/90 dark:text-ink-400"
        style={{ top: sample.caption ? '1.75rem' : '0.5rem' }}
      >
        {copied ? <IconCheck className="text-emerald-600" /> : <IconCopy />}
      </button>
      <Markdown>{`\`\`\`${sample.lang}\n${sample.source}\n\`\`\``}</Markdown>
    </figure>
  )
}
