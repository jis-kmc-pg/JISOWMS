'use client';

import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>('light');
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

    // 시스템 테마 감지
    useEffect(() => {
        const saved = localStorage.getItem('theme') as Theme | null;
        const initial = saved || 'system';
        setThemeState(initial);
        applyTheme(initial);
    }, []);

    // 시스템 테마 변경 감지
    useEffect(() => {
        if (theme !== 'system') return;

        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => {
            const isDark = e.matches;
            document.documentElement.classList.toggle('dark', isDark);
            setResolvedTheme(isDark ? 'dark' : 'light');
        };

        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [theme]);

    const applyTheme = useCallback((t: Theme) => {
        let isDark = false;
        if (t === 'dark') {
            isDark = true;
        } else if (t === 'system') {
            isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        document.documentElement.classList.toggle('dark', isDark);
        setResolvedTheme(isDark ? 'dark' : 'light');
    }, []);

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
        localStorage.setItem('theme', t);
        applyTheme(t);
    }, [applyTheme]);

    const toggleTheme = useCallback(() => {
        const next = resolvedTheme === 'dark' ? 'light' : 'dark';
        setTheme(next);
    }, [resolvedTheme, setTheme]);

    return { theme, resolvedTheme, setTheme, toggleTheme };
}
