import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en/translation.json';
import elTranslation from './locales/el/translation.json';
import deTranslation from './locales/de/translation.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslation },
    el: { translation: elTranslation },
    de: { translation: deTranslation },
  },
  lng: 'en', // Default language (Greek)
  fallbackLng: 'en', // Fallback language if translation is missing
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  compatibilityJSON: 'v3'
});

export default i18n;