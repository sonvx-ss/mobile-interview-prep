import { memo, type ReactNode } from 'react'

/**
 * Tiêu đề câu hỏi là chuỗi thuần nhưng có dùng `backtick` cho tên API.
 * Render chúng thành inline code thay vì hiện dấu backtick thô.
 */
export const CodeTitle = memo(function CodeTitle({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  if (!text.includes('`')) return <>{text}</>

  const parts = text.split('`')
  const nodes: ReactNode[] = parts.map((part, i) =>
    // phần lẻ nằm giữa hai backtick -> code
    i % 2 === 1 ? (
      <code
        key={i}
        className={
          className ??
          'rounded border border-ink-200 bg-ink-50 px-1 py-px font-mono text-[0.88em] font-normal text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100'
        }
      >
        {part}
      </code>
    ) : (
      part
    ),
  )
  return <>{nodes}</>
})
