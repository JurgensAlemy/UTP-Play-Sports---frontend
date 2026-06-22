/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class', // <--- Esta es la magia. Obliga a Tailwind a obedecer al botón.
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}