import { LanguagePack } from './types';
import { createEnglishPack } from './languages/en';
import { createRussianPack } from './languages/ru';
import { createUkrainianPack } from './languages/uk';
import { createGermanPack } from './languages/de';

// Language pack creators registry
const languageCreators: Record<string, () => LanguagePack> = {
  en: createEnglishPack,
  ru: createRussianPack,
  uk: createUkrainianPack,
  de: createGermanPack,
};

// Cache for generated language packs
let cachedLanguagePacks: Record<string, LanguagePack> | null = null;

export function getAllLanguagePacks(): Record<string, LanguagePack> {
  if (!cachedLanguagePacks) {
    cachedLanguagePacks = {};
    for (const [code, creator] of Object.entries(languageCreators)) {
      cachedLanguagePacks[code] = creator();
    }
  }
  return cachedLanguagePacks;
}

export function getLanguagePack(languageCode: string): LanguagePack {
  const packs = getAllLanguagePacks();
  return packs[languageCode] || packs.en; // Default to English
}

export function getAvailableLanguages(): LanguagePack[] {
  const packs = getAllLanguagePacks();
  return Object.values(packs);
}

export function getAvailableLanguageCodes(): string[] {
  return Object.keys(languageCreators);
}

export function generateWelcomeText(): string {
  const languages = getAvailableLanguages();
  const welcomeTexts: Record<string, string> = {
    en: 'Welcome! Please choose your preferred language:',
    ru: 'Добро пожаловать! Выберите предпочитаемый язык:',
    uk: 'Ласкаво просимо! Оберіть бажану мову:',
    de: 'Willkommen! Bitte wählen Sie Ihre bevorzugte Sprache:',
  };

  // Collect unique welcome texts
  const textLines: string[] = [];
  for (const lang of languages) {
    const text = welcomeTexts[lang.languageCode];
    if (text && !textLines.includes(text)) {
      textLines.push(text);
    }
  }

  return textLines.join('\n');
}

// Force refresh of language packs (useful for dynamic updates)
export function refreshLanguagePacks(): void {
  cachedLanguagePacks = null;
}
