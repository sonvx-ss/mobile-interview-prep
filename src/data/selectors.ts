import { ALL_QUESTIONS } from './questions'
import { GROUPS, TRACKS } from './tracks'
import type { Level, Question, TrackId } from './types'

const groupTrack = new Map(GROUPS.map((g) => [g.id, g.trackId]))

export const trackOfQuestion = (q: Question): TrackId | undefined => groupTrack.get(q.groupId)

export const questionsOfTrack = (trackId: TrackId) =>
  ALL_QUESTIONS.filter((q) => groupTrack.get(q.groupId) === trackId)

export interface CountsByTrack {
  trackId: TrackId
  total: number
  byLevel: Record<Level, number>
}

export const countsByTrack = (): CountsByTrack[] =>
  TRACKS.map((t) => {
    const qs = questionsOfTrack(t.id)
    return {
      trackId: t.id,
      total: qs.length,
      byLevel: {
        junior: qs.filter((q) => q.levels.includes('junior')).length,
        mid: qs.filter((q) => q.levels.includes('mid')).length,
        senior: qs.filter((q) => q.levels.includes('senior')).length,
      },
    }
  })

/** Tìm kiếm không dấu, khớp trong tiêu đề / tag / nội dung chốt nhanh. */
const deaccent = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'D')
    .toLowerCase()

export function searchQuestions(query: string, limit = 40): Question[] {
  const q = deaccent(query.trim())
  if (q.length < 2) return []
  const terms = q.split(/\s+/)

  const scored = ALL_QUESTIONS.map((item) => {
    const title = deaccent(item.title)
    const tags = deaccent((item.tags ?? []).join(' '))
    const body = deaccent(item.short)
    let score = 0
    for (const t of terms) {
      if (title.includes(t)) score += 10
      else if (tags.includes(t)) score += 6
      else if (body.includes(t)) score += 3
      else return { item, score: -1 } // mọi term phải khớp đâu đó
    }
    if (title.startsWith(terms[0])) score += 5
    return { item, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.item)
}

/**
 * Sinh bộ đề mock: trải đều các nhóm chủ đề của track đã chọn, lọc theo level.
 * Dùng shuffle có seed để cùng một bộ đề tái tạo được khi cần.
 */
export function buildMockSet(opts: {
  trackIds: TrackId[]
  level: Level
  count: number
  includeBehavioral: boolean
  seed?: number
}): Question[] {
  const { trackIds, level, count, includeBehavioral } = opts
  const tracks = includeBehavioral ? [...trackIds, 'behavioral' as TrackId] : trackIds

  const pool = ALL_QUESTIONS.filter((q) => {
    const t = groupTrack.get(q.groupId)
    return t !== undefined && tracks.includes(t) && q.levels.includes(level)
  })

  // Nhóm theo groupId rồi rút vòng tròn -> trải đều chủ đề, không dồn vào một nhóm
  const buckets = new Map<string, Question[]>()
  for (const q of pool) {
    const arr = buckets.get(q.groupId) ?? []
    arr.push(q)
    buckets.set(q.groupId, arr)
  }

  const rand = mulberry32(opts.seed ?? Date.now())
  const groupOrder = shuffle([...buckets.keys()], rand)
  for (const key of groupOrder) buckets.set(key, shuffle(buckets.get(key)!, rand))

  const picked: Question[] = []
  let round = 0
  while (picked.length < count) {
    let addedThisRound = 0
    for (const key of groupOrder) {
      const arr = buckets.get(key)!
      if (round < arr.length) {
        picked.push(arr[round])
        addedThisRound++
        if (picked.length >= count) break
      }
    }
    if (addedThisRound === 0) break // đã hết câu
    round++
  }
  return picked
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
