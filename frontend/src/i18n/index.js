import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import pt from './locales/pt.json';

const storedLanguage = localStorage.getItem('language');
const browserLanguage = navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en';

const initialLanguage = storedLanguage || browserLanguage;

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    pt: { translation: pt }
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
});

i18n.on('languageChanged', (language) => {
  localStorage.setItem('language', language);
});

export default i18n;

