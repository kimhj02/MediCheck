import type { HospitalEvaluationSummary } from '../types/hospital'

const GRADE_KEYS: (keyof HospitalEvaluationSummary)[] = [
  'asmGrd01', 'asmGrd03', 'asmGrd04', 'asmGrd05', 'asmGrd06', 'asmGrd07', 'asmGrd08', 'asmGrd09', 'asmGrd10',
  'asmGrd12', 'asmGrd13', 'asmGrd14', 'asmGrd15', 'asmGrd16', 'asmGrd17', 'asmGrd18', 'asmGrd19',
  'asmGrd20', 'asmGrd21', 'asmGrd22', 'asmGrd23', 'asmGrd24',
]

/** 심평원 등급 문자열에서 1~5 숫자만 추출. "등급제외" 등은 무시 */
function parseGrade(value: string | null | undefined): number | null {
  if (value == null || value === '') return null
  const n = parseInt(value.trim(), 10)
  return n >= 1 && n <= 5 ? n : null
}

/** 평가 요약에서 유효한 등급(1~5)들의 평균을 구해 1~5 구간으로 반환. 없으면 null */
export function getEvaluationStarScore(evaluation: HospitalEvaluationSummary | null | undefined): number | null {
  if (!evaluation) return null
  const grades: number[] = []
  for (const key of GRADE_KEYS) {
    const v = evaluation[key]
    const g = parseGrade(typeof v === 'string' ? v : null)
    if (g != null) grades.push(g)
  }
  if (grades.length === 0) return null
  const sum = grades.reduce((a, b) => a + b, 0)
  const avg = sum / grades.length
  return Math.round(avg) as number
}

interface EvaluationStarsProps {
  /** 1~5 점수. 이 범위 밖이면 별 표시 안 함 */
  score: number | null
  /** 별 개수 (기본 5) */
  max?: number
  /** 크기: sm | md | lg */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClass = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
}

/** 점수를 별(★/☆) 아이콘으로 표시. score가 1~5일 때만 별 렌더링 */
export function EvaluationStars({ score, max = 5, size = 'md', className = '' }: EvaluationStarsProps) {
  if (score == null || score < 0 || score > max) return null

  const filled = Math.min(max, Math.max(0, Math.round(score)))
  const empty = max - filled

  return (
    <span
      className={`inline-flex items-center gap-0.5 ${sizeClass[size]} ${className}`}
      role="img"
      aria-label={`심평원 평가 ${filled}점 만점 ${max}점`}
    >
      {'★'.repeat(filled)}
      {'☆'.repeat(empty)}
    </span>
  )
}
