/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // 確保切換 html.dark 時有作用
    theme: {
        extend: {},
    },
    plugins: [],
}