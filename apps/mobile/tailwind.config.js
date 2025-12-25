/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./App.{js,jsx,ts,tsx}",
        "./app/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                background: '#0a0a0b',
                surface: '#18181b',
                primary: '#f59e0b',
                secondary: '#10b981',
            },
        },
    },
    plugins: [],
}
