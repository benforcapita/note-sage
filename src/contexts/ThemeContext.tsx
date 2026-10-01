import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
type Theme = 'light' | 'dark';
const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | undefined>(undefined);
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try { const saved = localStorage.getItem('theme'); if (saved === 'light' || saved === 'dark') return saved; } catch { /* Optional preference storage. */ }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem('theme', theme); } catch { /* Theme works for this session without storage. */ }
  }, [theme]);
  return <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme(value => value === 'light' ? 'dark' : 'light') }}>{children}</ThemeContext.Provider>;
}
// A co-located provider/hook is intentional; the provider is the only component export.
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() { const context = useContext(ThemeContext); if (!context) throw new Error('useTheme requires ThemeProvider'); return context; }
