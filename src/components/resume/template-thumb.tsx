import { ResumePage } from '@/resume/render'
import type { ResumeDesign } from '@/resume/design'
import type { ResumeContent } from '@/resume/types'

const PAGE_W = 794
const PAGE_H = 1123
const WIDTH = 120
const SCALE = WIDTH / PAGE_W
const HEIGHT = Math.round(PAGE_H * SCALE) // 170

/**
 * A small preview of a resume in one design, for the style picker: the real page, scaled down.
 * It is decoration (hidden from screen readers and not clickable); the label beside it names the style.
 * Its text carries data-path like the main page, so queries for editing should stay inside the main page.
 */
export function TemplateThumb({ content, design }: { content: ResumeContent; design: ResumeDesign }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative overflow-hidden rounded-[4px] border border-line bg-white select-none"
      style={{ width: WIDTH, height: HEIGHT }}
    >
      <div style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${SCALE})`, transformOrigin: 'top left' }}>
        <ResumePage content={content} design={design} />
      </div>
    </div>
  )
}
