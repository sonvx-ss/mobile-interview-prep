export type Level = 'junior' | 'mid' | 'senior'

export type TrackId =
  | 'general'
  | 'android'
  | 'flutter'
  | 'architecture'
  | 'system-design'
  | 'behavioral'

export interface CodeSample {
  lang: 'kotlin' | 'dart' | 'java' | 'xml' | 'yaml' | 'gradle' | 'bash' | 'sql' | 'json' | 'text'
  caption?: string
  source: string
}

export interface Question {
  /** slug ổn định — dùng làm key lưu tiến độ, đừng đổi sau khi phát hành */
  id: string
  groupId: string
  title: string
  levels: Level[]
  /** 2-4 câu để nói ngay khi interviewer hỏi */
  short: string
  /** giải thích sâu, markdown (hỗ trợ bảng GFM) */
  deep?: string
  code?: CodeSample[]
  /** lỗi/bẫy interviewer hay dùng để bắt bài */
  pitfalls?: string[]
  /** interviewer sẽ đào tiếp gì */
  followUps?: string[]
  tags?: string[]
  /** 'pdf' = có sẵn trong tài liệu gốc */
  source?: 'pdf' | 'authored'
}

export interface Group {
  id: string
  trackId: TrackId
  title: string
  blurb?: string
}

export interface Track {
  id: TrackId
  title: string
  emoji: string
  blurb: string
}

export const LEVELS: Level[] = ['junior', 'mid', 'senior']

export const LEVEL_LABEL: Record<Level, string> = {
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
}

export const LEVEL_CLASS: Record<Level, string> = {
  junior: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  mid: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  senior: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
}
