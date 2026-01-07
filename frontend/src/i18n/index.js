import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import des fichiers de traduction
import fr from './locales/fr.json';
import en from './locales/en.json';
import de from './locales/de.json';
import es from './locales/es.json';
import it from './locales/it.json';
import nl from './locales/nl.json';
import pt from './locales/pt.json';
import sv from './locales/sv.json';

// Configuration des langues disponibles
export const LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷', country: 'France' },
  { code: 'en', name: 'English', flag: '🇬🇧', country: 'United Kingdom' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', country: 'Allemagne' },
  { code: 'es', name: 'Español', flag: '🇪🇸', country: 'Espagne' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', country: 'Italie' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱', country: 'Pays-Bas' },
  { code: 'pt', name: 'Português', flag: '🇵🇹', country: 'Portugal' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪', country: 'Suède' },
];

// Ressources de traduction
const resources = {
  fr: { translation: fr },
  en: { translation: en },
  de: { translation: de },
  es: { translation: es },
  it: { translation: it },
  nl: { translation: nl },
  pt: { translation: pt },
  sv: { translation: sv },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'worldauto-language',
    },
  });

export default i18n;
