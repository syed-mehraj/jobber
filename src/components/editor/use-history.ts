'use client'

import { useCallback, useReducer } from 'react'
import type { ResumeContent } from '@/resume/types'

/*
 * Undo/redo for the resume content. Typing in one field is grouped into a single undo step
 * (a new step starts when you switch field or pause for more than a second).
 */

type State = { past: ResumeContent[]; present: ResumeContent; future: ResumeContent[]; lastKey: string; lastAt: number }

type Action =
  | { type: 'set'; content: ResumeContent; key?: string }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset'; content: ResumeContent }

const LIMIT = 100

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'set': {
      if (a.content === s.present) return s
      const now = Date.now()
      const merge = a.key !== undefined && a.key === s.lastKey && now - s.lastAt < 1000
      return {
        past: merge ? s.past : [...s.past, s.present].slice(-LIMIT),
        present: a.content,
        future: [],
        lastKey: a.key ?? '',
        lastAt: now,
      }
    }
    case 'undo': {
      const prev = s.past.at(-1)
      if (!prev) return s
      return { past: s.past.slice(0, -1), present: prev, future: [s.present, ...s.future], lastKey: '', lastAt: 0 }
    }
    case 'reset':
      return { past: [], present: a.content, future: [], lastKey: '', lastAt: 0 }
    case 'redo': {
      const next = s.future[0]
      if (!next) return s
      return { past: [...s.past, s.present], present: next, future: s.future.slice(1), lastKey: '', lastAt: 0 }
    }
  }
}

export function useHistory(initial: ResumeContent) {
  const [state, dispatch] = useReducer(reducer, {
    past: [],
    present: initial,
    future: [],
    lastKey: '',
    lastAt: 0,
  })
  /** Replace the content. Pass `key` (e.g. the field path) to group quick edits into one undo step. */
  const set = useCallback((content: ResumeContent, key?: string) => dispatch({ type: 'set', content, key }), [])
  const undo = useCallback(() => dispatch({ type: 'undo' }), [])
  const redo = useCallback(() => dispatch({ type: 'redo' }), [])
  /** Replace the content and clear the undo history (Discard changes). */
  const reset = useCallback((content: ResumeContent) => dispatch({ type: 'reset', content }), [])
  return {
    content: state.present,
    set,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  }
}
