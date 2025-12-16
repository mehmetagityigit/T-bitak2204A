
// Bu dosya, uygulamanın çalıştığı ortama (Vite, Webpack, CRA) göre
// Environment Variable'ları güvenli bir şekilde okur.

// Vite, build sırasında "import.meta.env.VITE_..." gördüğü yeri statik olarak değiştirir.
// Bu yüzden değişken isimlerini dinamik (getEnvVar(key)) olarak değil,
// açıkça yazarak çağırmalıyız.

let apiKey = "";
let pythonApiUrl = "";

// 1. API KEY Çözümleme
try {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    apiKey = import.meta.env.VITE_API_KEY || import.meta.env.REACT_APP_API_KEY || "";
  }
} catch (e) {}

if (!apiKey && typeof process !== 'undefined' && process.env) {
  apiKey = process.env.VITE_API_KEY || process.env.REACT_APP_API_KEY || process.env.API_KEY || "";
}

// 2. Python URL Çözümleme
try {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    pythonApiUrl = import.meta.env.VITE_PYTHON_API_URL || import.meta.env.REACT_APP_PYTHON_API_URL || "";
  }
} catch (e) {}

if (!pythonApiUrl && typeof process !== 'undefined' && process.env) {
  pythonApiUrl = process.env.VITE_PYTHON_API_URL || process.env.REACT_APP_PYTHON_API_URL || process.env.PYTHON_API_URL || "";
}

// Varsayılan değer
if (!pythonApiUrl) {
  pythonApiUrl = "http://localhost:5000/api/chat";
}

// Debug için konsola yaz (Sadece geliştirme aşamasında görülsün diye)
if (!apiKey) {
  console.warn("⚠️ SağlıkAsist: Gemini API Anahtarı bulunamadı! Vercel Environment Variables ayarlarını kontrol edin (VITE_API_KEY).");
} else {
  console.log("✅ SağlıkAsist: API Anahtarı başarıyla yüklendi.");
}

export const GEMINI_API_KEY = apiKey;
export const PYTHON_API_URL = pythonApiUrl;
