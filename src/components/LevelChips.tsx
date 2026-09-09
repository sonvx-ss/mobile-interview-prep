import { LEVEL_CLASS, LEVEL_LABEL, type Level } from '../data/types'

export function LevelChips({ levels }: { levels: Level[] }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {levels.map((l) => (
        <span key={l} className={`chip ${LEVEL_CLASS[l]}`}>
          {LEVEL_LABEL[l]}
        </span>
      ))}
    </span>
  )
}
