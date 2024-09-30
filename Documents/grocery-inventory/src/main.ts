import './style.css'

document.getElementById("tbody")!.innerHTML = `${import.meta.env.VITE_GOOGLE_SHEET_URL}`;