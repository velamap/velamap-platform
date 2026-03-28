'use client'

import { useEffect } from 'react'

export interface Shortcut {
  key: string          // e.g. 'k'
  meta?: boolean       // Cmd/Ctrl
  shift?: boolean
  alt?: boolean
  description: string  // for future shortcut-help overlay
  action: () => void
}

/**
 * Register an array of keyboard shortcuts.
 * All listeners are cleaned up on unmount.
 *
 * Example:
 *   useKeyboardShortcuts([
 *     { key: 'k', meta: true, description: 'Open search', action: () => inputRef.current?.focus() },
 *   ])
 */
export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      for (const s of shortcuts) {
        const metaMatch = s.meta ? (e.metaKey || e.ctrlKey) : !e.metaKey && !e.ctrlKey
        const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey
        const altMatch   = s.alt   ? e.altKey   : !e.altKey
        if (
          e.key.toLowerCase() === s.key.toLowerCase() &&
          metaMatch && shiftMatch && altMatch
        ) {
          e.preventDefault()
          s.action()
          return
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}
