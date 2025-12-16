
// Bu dosya, uygulamanın çalıştığı ortama (Vite, Webpack, CRA) göre
// Environment Variable'ları güvenli bir şekilde okur.
// "process is not defined" hatasını önler.

const getEnvVar = (key: string): string | undefined => {
  // 1. Vite (import.meta.env) Kontrolü
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) { /* ignore error */ }

  // 2. Process.env (Node.js / Create React App) Kontrolü
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) { /* ignore error */ }

  return undefined;
};

// Gemini API Key
// Vercel'de Environment Variable eklerken 'VITE_API_KEY' veya 'REACT_APP_API_KEY' adını kullanın.
export const GEMINI_API_KEY = 
  getEnvVar("VITE_API_KEY") || 
  getEnvVar("REACT_APP_API_KEY") || 
  getEnvVar("API_KEY") || 
  "";

// Python API URL
export const PYTHON_API_URL = 
  getEnvVar("VITE_PYTHON_API_URL") || 
  getEnvVar("REACT_APP_PYTHON_API_URL") || 
  getEnvVar("PYTHON_API_URL") || 
  "http://localhost:5000/api/chat";
