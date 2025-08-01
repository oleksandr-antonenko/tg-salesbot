export interface OwnerConfig {
  name: string;
  shortName: string;
  telegramHandle: string;
  title: string;
  bio: {
    en: string;
    ru: string;
    uk: string;
    de: string;
  };
}

export const ownerConfig: OwnerConfig = {
  name: 'Alex Antonenko',
  shortName: 'Alex',
  telegramHandle: '@aleksandr_antonenko',
  title: 'Tech Lead & AI Chatbot Developer',
  bio: {
    en: "Alex Antonenko is a seasoned Tech Lead and entrepreneur who's helped countless businesses boost their revenue with intelligent chatbot solutions.",
    ru: 'Алекс Антоненко — опытный Tech Lead и предприниматель, который помог бесчисленным компаниям увеличить доходы с помощью умных чат-ботов.',
    uk: 'Олекс Антоненко — досвідчений Tech Lead та підприємець, який допоміг незліченним компаніям збільшити доходи за допомогою розумних чат-ботів.',
    de: 'Alex Antonenko ist ein erfahrener Tech Lead und Unternehmer, der unzähligen Unternehmen geholfen hat, ihre Einnahmen mit intelligenten Chatbot-Lösungen zu steigern.',
  },
};

export function getOwnerConfig(): OwnerConfig {
  return ownerConfig;
}
