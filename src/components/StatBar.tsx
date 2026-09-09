export function StatBar({
  known,
  unsure,
  total,
}: {
  known: number
  unsure: number
  total: number
}) {
  const k = total ? (known / total) * 100 : 0
  const u = total ? (unsure / total) * 100 : 0

  return (
    <div
      className="flex h-1.5 w-full overflow-hidden rounded-full bg-ink-150 bg-ink-100 dark:bg-ink-800"
      role="img"
      aria-label={`${known} đã chắc, ${unsure} chưa chắc, tổng ${total}`}
    >
      <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${k}%` }} />
      <div className="bg-amber-400 transition-all duration-500" style={{ width: `${u}%` }} />
    </div>
  )
}
