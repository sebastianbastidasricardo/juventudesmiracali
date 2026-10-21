import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  // Asegurar sincronización en el montaje
  useEffect(() => {
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    setIsDark(isCurrentlyDark);
  }, []);

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    const willBeDark = !isCurrentlyDark;

    if (willBeDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    }
  };

  return (
    <div className="relative inline-flex items-center justify-center p-1">
      <button
        type="button"
        onClick={toggleTheme}
        className="relative touch-manipulation select-none rounded-2xl w-12 h-12 bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/90 dark:hover:bg-slate-700/80 active:scale-90 transition-all border border-slate-200/70 dark:border-slate-700/60 shadow-xs flex items-center justify-center cursor-pointer before:absolute before:-inset-2 before:content-[''] before:rounded-3xl"
        title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        aria-label="Alternar modo claro y oscuro"
      >
        {isDark ? (
          <Sun className="h-5 w-5 text-amber-400 transition-all stroke-[2] pointer-events-none" />
        ) : (
          <Moon className="h-5 w-5 text-indigo-600 transition-all stroke-[2] pointer-events-none" />
        )}
      </button>
    </div>
  );
}
