'use client'

import { createContext, use, useState, type ReactNode } from 'react'

type MenuState = { open: boolean; setOpen: (open: boolean) => void }

const MenuContext = createContext<MenuState | null>(null)

/**
 * Holds whether the menu is open, above the header's loading boundary. The header first renders without
 * counts and is replaced when they arrive; keeping the state here means an open menu stays open.
 */
export function MenuStateProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return <MenuContext value={{ open, setOpen }}>{children}</MenuContext>
}

export function useMenuState(): MenuState {
  const state = use(MenuContext)
  // Outside a provider (tests, the style guide) fall back to local state.
  const [open, setOpen] = useState(false)
  return state ?? { open, setOpen }
}
