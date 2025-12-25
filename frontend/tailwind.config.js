/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: {
                    primary: '#0a0a0b',
                    surface: '#18181b',
                    elevated: '#27272a',
                },
                border: {
                    DEFAULT: '#3f3f46',
                    subtle: '#27272a',
                },
                accent: {
                    amber: '#f59e0b',
                    lime: '#84cc16',
                    teal: '#14b8a6',
                },
                text: {
                    primary: '#fafafa',
                    secondary: '#a1a1aa',
                    muted: '#71717a',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
