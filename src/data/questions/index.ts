import type { Question } from '../types'
import { GENERAL_QUESTIONS } from './general'
import { GENERAL_SEC_TEST_QUESTIONS } from './general-security-testing'
import { ANDROID_CORE_QUESTIONS } from './android-core'
import { ANDROID_CONCURRENCY_QUESTIONS } from './android-concurrency'
import { ANDROID_PLATFORM_QUESTIONS } from './android-platform'
import { ANDROID_KOTLIN_COMPOSE_QUESTIONS } from './android-kotlin-compose'
import { FLUTTER_CORE_QUESTIONS } from './flutter-core'
import { FLUTTER_ADVANCED_QUESTIONS } from './flutter-advanced'
import { ARCHITECTURE_QUESTIONS } from './architecture'
import { SYSTEM_DESIGN_QUESTIONS } from './system-design'
import { BEHAVIORAL_QUESTIONS } from './behavioral'

export const ALL_QUESTIONS: Question[] = [
  ...GENERAL_QUESTIONS,
  ...GENERAL_SEC_TEST_QUESTIONS,
  ...ANDROID_CORE_QUESTIONS,
  ...ANDROID_CONCURRENCY_QUESTIONS,
  ...ANDROID_PLATFORM_QUESTIONS,
  ...ANDROID_KOTLIN_COMPOSE_QUESTIONS,
  ...FLUTTER_CORE_QUESTIONS,
  ...FLUTTER_ADVANCED_QUESTIONS,
  ...ARCHITECTURE_QUESTIONS,
  ...SYSTEM_DESIGN_QUESTIONS,
  ...BEHAVIORAL_QUESTIONS,
]

// Cảnh báo sớm nếu có id trùng — id là key lưu tiến độ nên phải duy nhất.
if (import.meta.env.DEV) {
  const seen = new Set<string>()
  for (const q of ALL_QUESTIONS) {
    if (seen.has(q.id)) console.error(`[data] id câu hỏi bị trùng: ${q.id}`)
    seen.add(q.id)
  }
}

export const questionById = (id: string) => ALL_QUESTIONS.find((q) => q.id === id)

export const questionsOfGroup = (groupId: string) =>
  ALL_QUESTIONS.filter((q) => q.groupId === groupId)
