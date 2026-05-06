import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import tr from './tr.json'

async function initI18n(): Promise<void> {
  // Read persisted language from electron-store via IPC.
  // Falls back to 'en' if not set or IPC is unavailable.
  let savedLanguage: string = 'en'
  try {
    const raw = await window.api?.getStoreData?.('language')
    if (typeof raw === 'string' && (raw === 'en' || raw === 'tr')) {
      savedLanguage = raw
    }
  } catch {
    // ignore
  }

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      tr: { translation: tr }
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    saveMissing: true,
    missingKeyHandler: (lng, _ns, key) => {
      console.warn(`[i18n] Missing key: "${key}" for language: ${lng}`)
    }
  })
}

void initI18n()

export default i18n

