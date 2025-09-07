/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    safelist: ['theme-standard', 'theme-dark', 'theme-neon'],
    theme: {
        extend: {
            colors: {
                base: 'var(--color-base)',
                surface: 'var(--color-surface)',
                content: 'var(--color-content)',
                muted: 'var(--color-muted)',
                subtle: 'var(--color-subtle)',
                primary: 'var(--color-primary)',
                secondary: 'var(--color-secondary)',
                accent: 'var(--color-accent)',
                success: 'var(--color-success)',
                warning: 'var(--color-warning)',
            },
        },
    },
    plugins: [],
}
