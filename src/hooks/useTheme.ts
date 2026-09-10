import { useCallback, useEffect, useState } from 'react'
import { loadTheme, saveTheme, type ThemeMode } from '@/lib/storage'

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => loadTheme())

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', theme === 'dark' ? '#09090b' : '#EDF6FD')
  }, [theme])

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode)
    saveTheme(mode)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return { theme, setTheme, toggleTheme }
}
