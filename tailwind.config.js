/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                base: 'var(--color-base)',
                content: 'var(--color-content)',
                muted: 'var(--color-muted)',
                primary: 'var(--color-primary)',
                secondary: 'var(--color-secondary)',
                accent: 'var(--color-accent)',
            },
        },
    },
    plugins: [],
}
