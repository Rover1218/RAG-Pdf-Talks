'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/useTheme';

export default function ThemeToggle() {
    const { theme, toggle } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid rendering the icon until mounted so SSR markup (which can't know the
    // client theme) doesn't mismatch. The button shell still renders for layout.
    useEffect(() => setMounted(true), []);

    const isDark = theme === 'dark';

    return (
        <button
            type="button"
            className="theme-toggle"
            onClick={toggle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            <span className="icon-wrap" suppressHydrationWarning>
                {mounted && (isDark ? <Sun size={18} /> : <Moon size={18} />)}
            </span>

            <style jsx>{`
                .theme-toggle {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: var(--border-radius-md);
                    background: var(--color-bg-subtle);
                    color: var(--color-text-secondary);
                    border: 1px solid var(--color-border);
                    transition: all var(--duration-fast) ease;
                }
                .theme-toggle:hover {
                    color: var(--color-accent-fg);
                    border-color: var(--color-accent-primary);
                    background: var(--color-accent-soft);
                }
                .theme-toggle:focus-visible {
                    outline: none;
                    box-shadow: 0 0 0 3px var(--color-accent-ring);
                }
                .icon-wrap {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            `}</style>
        </button>
    );
}
