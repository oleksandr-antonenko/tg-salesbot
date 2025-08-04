import { LanguagePack } from './types';

export interface B2CLanguagePack extends LanguagePack {
  b2cStageInstructions: {
    greeting: string;
    attention: string;
    interest: string;
    desire: string;
    action: string;
    follow_up: string;
    completed: string;
  };
  
  b2cWelcomeMessage: string;
  productQuestions: {
    preferences: string;
    budget: string;
    lifestyle: string;
    problems: string;
  };
  
  urgencyPhrases: {
    limitedTime: string;
    limitedStock: string;
    specialOffer: string;
    freeShipping: string;
  };
  
  socialProof: {
    customerReviews: string;
    bestseller: string;
    trending: string;
    recommended: string;
  };
  
  ctaButtons: {
    addToCart: string;
    buyNow: string;
    learnMore: string;
    viewProduct: string;
    getOffer: string;
  };
}

export function createB2CEnglishPack(): B2CLanguagePack {
  const basePack = {
    languageCode: 'en',
    languageName: 'English',
    flagEmoji: '🇺🇸',
    languageSelected: 'Welcome to our store!',
    welcomeMessage: "Hi! I'm here to help you find the perfect products. What brings you to our store today?",
    errorMessage: 'Sorry, something went wrong. Let me help you get back on track!',
    sessionError: 'Oops! Let me start fresh with you.',
    stageInstructions: {
      name_collection: 'Ask for their name warmly and what they\'re looking for today.',
      trust_building: 'Build rapport and ask about their needs and preferences.',
      permission_request: 'Not used in B2C flow',
      situation_discovery: 'Discover their lifestyle and product needs.',
      problem_identification: 'Identify what problems they want to solve.',
      implication_development: 'Show how their problems affect their daily life.',
      need_payoff: 'Present how products will improve their life.',
      proposal: 'Present specific product recommendations.',
      closing: 'Guide them to purchase with urgency and benefits.',
      contact_collection: 'Collect contact for follow-up and order updates.',
      conversation_completed: 'Thank them and provide order/contact details.',
    },
    aiInstructions: {
      languageInstruction: 'RESPOND IN ENGLISH ONLY - friendly, conversational B2C tone',
      responseLanguageReminder: 'Keep responses friendly and customer-focused in English!',
    },
    leadNotification: {
      newLead: '🛍️ NEW CUSTOMER!',
      nameAndContact: '**Customer Info:**',
      businessSector: '**Interests:**',
      summary: '**Shopping Summary:**',
      leadScore: '📊 Engagement Score:',
      dealClosed: 'Purchase Completed',
      notSpecified: 'Browsing',
      client: 'Customer',
      bot: 'Assistant',
      interestedFallback: 'Interested in products',
    },
    summaryPrompt: {
      instruction: 'Summarize this customer interaction focusing on their shopping intent.',
      focusOn: 'Focus on:',
      mainProblem: '1. What they are looking for',
      businessSector: '2. Their interests/preferences',
      interestLevel: '3. Purchase intent level',
      format: 'Format: "Interest - shopping goal"',
      example: 'Example: "Skincare - looking for anti-aging products"',
      responseOnly: 'Respond only with the summary.',
    },
  };

  return {
    ...basePack,
    b2cWelcomeMessage: "🛍️ Welcome! I'm your personal shopping assistant. I'll help you find exactly what you're looking for. What brings you here today?",
    
    b2cStageInstructions: {
      greeting: 'Welcome warmly, ask their name and what they\'re shopping for today.',
      attention: 'GRAB ATTENTION: Mention trending products, special offers, or ask about their interests. Create excitement!',
      interest: 'BUILD INTEREST: Ask about their lifestyle, needs, and problems they want to solve. Show how products fit their life.',
      desire: 'CREATE DESIRE: Present specific products with benefits (not features). Use social proof, reviews, and show value.',
      action: 'DRIVE ACTION: Create urgency with limited time/stock. Address objections. Guide to "Add to Cart" or "Buy Now".',
      follow_up: 'RE-ENGAGE: Offer different products, ask about concerns, provide additional value or discounts.',
      completed: 'THANK & UPSELL: Thank them, confirm order details, suggest complementary products for next time.',
    },

    productQuestions: {
      preferences: 'What type of products do you usually love?',
      budget: 'What\'s your budget range for this purchase?',
      lifestyle: 'Tell me about your lifestyle - what\'s important to you?',
      problems: 'What problem are you hoping to solve with this purchase?',
    },

    urgencyPhrases: {
      limitedTime: '⏰ Limited time offer - ends soon!',
      limitedStock: '🔥 Only a few left in stock!',
      specialOffer: '✨ Special offer just for you!',
      freeShipping: '🚚 Free shipping on orders over $50!',
    },

    socialProof: {
      customerReviews: '⭐ Customers love this! 4.8/5 stars',
      bestseller: '🏆 Bestseller - #1 choice this month',
      trending: '📈 Trending now - everyone\'s talking about it',
      recommended: '👥 Recommended by 9 out of 10 customers',
    },

    ctaButtons: {
      addToCart: '🛒 Add to Cart',
      buyNow: '💳 Buy Now',
      learnMore: '📖 Learn More',
      viewProduct: '👀 View Product',
      getOffer: '🎁 Get Special Offer',
    },
  };
}

export function createB2CRussianPack(): B2CLanguagePack {
  const basePack = {
    languageCode: 'ru',
    languageName: 'Русский',
    flagEmoji: '🇷🇺',
    languageSelected: 'Добро пожаловать в наш магазин!',
    welcomeMessage: 'Привет! Я помогу вам найти идеальные товары. Что привело вас в наш магазин?',
    errorMessage: 'Извините, что-то пошло не так. Давайте начнем сначала!',
    sessionError: 'Упс! Давайте начнем заново.',
    stageInstructions: {
      name_collection: 'Тепло спросите имя и что они ищут сегодня.',
      trust_building: 'Стройте доверие и спрашивайте о потребностях.',
      permission_request: 'Не используется в B2C потоке',
      situation_discovery: 'Узнайте их образ жизни и потребности в товарах.',
      problem_identification: 'Определите проблемы, которые они хотят решить.',
      implication_development: 'Покажите, как проблемы влияют на их жизнь.',
      need_payoff: 'Представьте, как товары улучшат их жизнь.',
      proposal: 'Предложите конкретные товары.',
      closing: 'Направьте к покупке с срочностью и выгодами.',
      contact_collection: 'Соберите контакты для последующего общения.',
      conversation_completed: 'Поблагодарите и предоставьте информацию о заказе.',
    },
    aiInstructions: {
      languageInstruction: 'ОТВЕЧАЙТЕ ТОЛЬКО НА РУССКОМ - дружелюбный B2C тон',
      responseLanguageReminder: 'Отвечайте дружелюбно и ориентированно на клиента на русском!',
    },
    leadNotification: {
      newLead: '🛍️ НОВЫЙ ПОКУПАТЕЛЬ!',
      nameAndContact: '**Информация о клиенте:**',
      businessSector: '**Интересы:**',
      summary: '**Сводка покупок:**',
      leadScore: '📊 Оценка вовлеченности:',
      dealClosed: 'Покупка завершена',
      notSpecified: 'Просматривает',
      client: 'Клиент',
      bot: 'Ассистент',
      interestedFallback: 'Интересуется товарами',
    },
    summaryPrompt: {
      instruction: 'Суммируйте взаимодействие с клиентом, сосредоточившись на намерении покупки.',
      focusOn: 'Сосредоточьтесь на:',
      mainProblem: '1. Что они ищут',
      businessSector: '2. Их интересы/предпочтения',
      interestLevel: '3. Уровень намерения покупки',
      format: 'Формат: "Интерес - цель покупки"',
      example: 'Пример: "Уход за кожей - ищет средства против старения"',
      responseOnly: 'Отвечайте только сводкой.',
    },
  };

  return {
    ...basePack,
    b2cWelcomeMessage: '🛍️ Добро пожаловать! Я ваш персональный помощник по покупкам. Помогу найти именно то, что вам нужно. Что вас интересует?',
    
    b2cStageInstructions: {
      greeting: 'Тепло поприветствуйте, спросите имя и что они покупают сегодня.',
      attention: 'ПРИВЛЕКИТЕ ВНИМАНИЕ: Упомяните популярные товары, специальные предложения или спросите об интересах.',
      interest: 'РАЗВИВАЙТЕ ИНТЕРЕС: Спрашивайте об образе жизни, потребностях и проблемах. Покажите, как товары подходят.',
      desire: 'СОЗДАВАЙТЕ ЖЕЛАНИЕ: Представьте товары с выгодами, используйте отзывы и покажите ценность.',
      action: 'ПОБУЖДАЙТЕ К ДЕЙСТВИЮ: Создайте срочность, отвечайте на возражения, ведите к "Добавить в корзину".',
      follow_up: 'ПОВТОРНО ПРИВЛЕКАЙТЕ: Предложите другие товары, спросите о проблемах, дайте скидки.',
      completed: 'БЛАГОДАРИТЕ И ДОПРОДАВАЙТЕ: Поблагодарите, подтвердите заказ, предложите дополнительные товары.',
    },

    productQuestions: {
      preferences: 'Какие товары вам обычно нравятся?',
      budget: 'Какой у вас бюджет на эту покупку?',
      lifestyle: 'Расскажите о своем образе жизни - что для вас важно?',
      problems: 'Какую проблему вы хотите решить этой покупкой?',
    },

    urgencyPhrases: {
      limitedTime: '⏰ Ограниченное предложение - скоро закончится!',
      limitedStock: '🔥 Осталось всего несколько штук!',
      specialOffer: '✨ Специальное предложение именно для вас!',
      freeShipping: '🚚 Бесплатная доставка при заказе от 3000₽!',
    },

    socialProof: {
      customerReviews: '⭐ Клиенты в восторге! 4.8/5 звезд',
      bestseller: '🏆 Хит продаж - выбор №1 этого месяца',
      trending: '📈 В тренде - все об этом говорят',
      recommended: '👥 Рекомендуют 9 из 10 покупателей',
    },

    ctaButtons: {
      addToCart: '🛒 В корзину',
      buyNow: '💳 Купить сейчас',
      learnMore: '📖 Подробнее',
      viewProduct: '👀 Смотреть товар',
      getOffer: '🎁 Получить предложение',
    },
  };
}

export function createB2CUkrainianPack(): B2CLanguagePack {
  const basePack = {
    languageCode: 'uk',
    languageName: 'Українська',
    flagEmoji: '🇺🇦',
    languageSelected: 'Ласкаво просимо до нашого магазину!',
    welcomeMessage: 'Привіт! Я допоможу вам знайти ідеальні товари. Що привело вас до нашого магазину?',
    errorMessage: 'Вибачте, щось пішло не так. Давайте почнемо спочатку!',
    sessionError: 'Упс! Давайте почнемо заново.',
    stageInstructions: {
      name_collection: 'Тепло запитайте ім\'я та що вони шукають сьогодні.',
      trust_building: 'Будуйте довіру та питайте про потреби.',
      permission_request: 'Не використовується в B2C потоці',
      situation_discovery: 'Дізнайтеся їх спосіб життя та потреби в товарах.',
      problem_identification: 'Визначте проблеми, які вони хочуть вирішити.',
      implication_development: 'Покажіть, як проблеми впливають на їх життя.',
      need_payoff: 'Представте, як товари покращать їх життя.',
      proposal: 'Запропонуйте конкретні товари.',
      closing: 'Направте до покупки з терміновістю та вигодами.',
      contact_collection: 'Зберіть контакти для подальшого спілкування.',
      conversation_completed: 'Подякуйте та надайте інформацію про замовлення.',
    },
    aiInstructions: {
      languageInstruction: 'ВІДПОВІДАЙТЕ ТІЛЬКИ УКРАЇНСЬКОЮ - дружелюбний B2C тон',
      responseLanguageReminder: 'Відповідайте дружелюбно та орієнтовано на клієнта українською!',
    },
    leadNotification: {
      newLead: '🛍️ НОВИЙ ПОКУПЕЦЬ!',
      nameAndContact: '**Інформація про клієнта:**',
      businessSector: '**Інтереси:**',
      summary: '**Зведення покупок:**',
      leadScore: '📊 Оцінка залученості:',
      dealClosed: 'Покупка завершена',
      notSpecified: 'Переглядає',
      client: 'Клієнт',
      bot: 'Асистент',
      interestedFallback: 'Цікавиться товарами',
    },
    summaryPrompt: {
      instruction: 'Підсумуйте взаємодію з клієнтом, зосередившись на наміренні покупки.',
      focusOn: 'Зосередьтеся на:',
      mainProblem: '1. Що вони шукають',
      businessSector: '2. Їх інтереси/уподобання',
      interestLevel: '3. Рівень наміру покупки',
      format: 'Формат: "Інтерес - мета покупки"',
      example: 'Приклад: "Догляд за шкірою - шукає засоби проти старіння"',
      responseOnly: 'Відповідайте тільки зведенням.',
    },
  };

  return {
    ...basePack,
    b2cWelcomeMessage: '🛍️ Ласкаво просимо! Я ваш персональний помічник з покупками. Допоможу знайти саме те, що вам потрібно. Що вас цікавить?',
    
    b2cStageInstructions: {
      greeting: 'Тепло привітайте, запитайте ім\'я та що вони купують сьогодні.',
      attention: 'ПРИВЕРТАЙТЕ УВАГУ: Згадайте популярні товари, спеціальні пропозиції або запитайте про інтереси.',
      interest: 'РОЗВИВАЙТЕ ІНТЕРЕС: Питайте про спосіб життя, потреби та проблеми. Покажіть, як товари підходять.',
      desire: 'СТВОРЮЙТЕ БАЖАННЯ: Представте товари з вигодами, використовуйте відгуки та покажіть цінність.',
      action: 'СПОНУКАЙТЕ ДО ДІЇ: Створіть терміновість, відповідайте на заперечення, ведіть до "Додати до кошика".',
      follow_up: 'ПОВТОРНО ЗАЛУЧАЙТЕ: Запропонуйте інші товари, запитайте про проблеми, дайте знижки.',
      completed: 'ДЯКУЙТЕ ТА ДОПРОДАВАЙТЕ: Подякуйте, підтвердьте замовлення, запропонуйте додаткові товари.',
    },

    productQuestions: {
      preferences: 'Які товари вам зазвичай подобаються?',
      budget: 'Який у вас бюджет на цю покупку?',
      lifestyle: 'Розкажіть про свій спосіб життя - що для вас важливо?',
      problems: 'Яку проблему ви хочете вирішити цією покупкою?',
    },

    urgencyPhrases: {
      limitedTime: '⏰ Обмежена пропозиція - скоро закінчиться!',
      limitedStock: '🔥 Залишилося лише кілька штук!',
      specialOffer: '✨ Спеціальна пропозиція саме для вас!',
      freeShipping: '🚚 Безкоштовна доставка при замовленні від 1200₴!',
    },

    socialProof: {
      customerReviews: '⭐ Клієнти в захваті! 4.8/5 зірок',
      bestseller: '🏆 Хіт продажів - вибір №1 цього місяця',
      trending: '📈 У тренді - всі про це говорять',
      recommended: '👥 Рекомендують 9 з 10 покупців',
    },

    ctaButtons: {
      addToCart: '🛒 До кошика',
      buyNow: '💳 Купити зараз',
      learnMore: '📖 Детальніше',
      viewProduct: '👀 Дивитися товар',
      getOffer: '🎁 Отримати пропозицію',
    },
  };
}

export function createB2CGermanPack(): B2CLanguagePack {
  const basePack = {
    languageCode: 'de',
    languageName: 'Deutsch',
    flagEmoji: '🇩🇪',
    languageSelected: 'Willkommen in unserem Shop!',
    welcomeMessage: 'Hallo! Ich helfe Ihnen, die perfekten Produkte zu finden. Was führt Sie heute zu unserem Shop?',
    errorMessage: 'Entschuldigung, etwas ist schief gelaufen. Lassen Sie uns von vorne anfangen!',
    sessionError: 'Ups! Lassen Sie uns neu starten.',
    stageInstructions: {
      name_collection: 'Fragen Sie freundlich nach dem Namen und was sie heute suchen.',
      trust_building: 'Bauen Sie Vertrauen auf und fragen Sie nach Bedürfnissen.',
      permission_request: 'Wird im B2C-Flow nicht verwendet',
      situation_discovery: 'Erfahren Sie mehr über ihren Lebensstil und Produktbedürfnisse.',
      problem_identification: 'Identifizieren Sie Probleme, die sie lösen möchten.',
      implication_development: 'Zeigen Sie, wie Probleme ihr tägliches Leben beeinträchtigen.',
      need_payoff: 'Stellen Sie dar, wie Produkte ihr Leben verbessern werden.',
      proposal: 'Schlagen Sie spezifische Produkte vor.',
      closing: 'Führen Sie mit Dringlichkeit und Vorteilen zum Kauf.',
      contact_collection: 'Sammeln Sie Kontakte für Follow-up und Bestellupdates.',
      conversation_completed: 'Bedanken Sie sich und geben Sie Bestell-/Kontaktdetails.',
    },
    aiInstructions: {
      languageInstruction: 'NUR AUF DEUTSCH ANTWORTEN - freundlicher B2C-Ton',
      responseLanguageReminder: 'Antworten Sie freundlich und kundenorientiert auf Deutsch!',
    },
    leadNotification: {
      newLead: '🛍️ NEUER KUNDE!',
      nameAndContact: '**Kundeninfo:**',
      businessSector: '**Interessen:**',
      summary: '**Einkaufszusammenfassung:**',
      leadScore: '📊 Engagement-Score:',
      dealClosed: 'Kauf abgeschlossen',
      notSpecified: 'Stöbert',
      client: 'Kunde',
      bot: 'Assistent',
      interestedFallback: 'Interessiert an Produkten',
    },
    summaryPrompt: {
      instruction: 'Fassen Sie diese Kundeninteraktion zusammen, fokussiert auf die Kaufabsicht.',
      focusOn: 'Fokussieren Sie sich auf:',
      mainProblem: '1. Was sie suchen',
      businessSector: '2. Ihre Interessen/Präferenzen',
      interestLevel: '3. Kaufabsichtsniveau',
      format: 'Format: "Interesse - Einkaufsziel"',
      example: 'Beispiel: "Hautpflege - sucht Anti-Aging-Produkte"',
      responseOnly: 'Antworten Sie nur mit der Zusammenfassung.',
    },
  };

  return {
    ...basePack,
    b2cWelcomeMessage: '🛍️ Willkommen! Ich bin Ihr persönlicher Einkaufsassistent. Ich helfe Ihnen, genau das zu finden, wonach Sie suchen. Was interessiert Sie heute?',
    
    b2cStageInstructions: {
      greeting: 'Begrüßen Sie herzlich, fragen Sie nach dem Namen und was sie heute kaufen.',
      attention: 'AUFMERKSAMKEIT ERREGEN: Erwähnen Sie Trendprodukte, Sonderangebote oder fragen Sie nach Interessen.',
      interest: 'INTERESSE AUFBAUEN: Fragen Sie nach Lebensstil, Bedürfnissen und Problemen. Zeigen Sie, wie Produkte passen.',
      desire: 'VERLANGEN SCHAFFEN: Präsentieren Sie Produkte mit Vorteilen, nutzen Sie Bewertungen und zeigen Sie Wert.',
      action: 'ZUM HANDELN BEWEGEN: Schaffen Sie Dringlichkeit, gehen Sie auf Einwände ein, führen Sie zu "In den Warenkorb".',
      follow_up: 'ERNEUT ANSPRECHEN: Bieten Sie andere Produkte an, fragen Sie nach Bedenken, geben Sie Rabatte.',
      completed: 'DANKEN & ZUSATZVERKAUF: Danken Sie, bestätigen Sie die Bestellung, schlagen Sie zusätzliche Produkte vor.',
    },

    productQuestions: {
      preferences: 'Welche Art von Produkten gefällt Ihnen normalerweise?',
      budget: 'Welches Budget haben Sie für diesen Kauf?',
      lifestyle: 'Erzählen Sie mir von Ihrem Lebensstil - was ist Ihnen wichtig?',
      problems: 'Welches Problem möchten Sie mit diesem Kauf lösen?',
    },

    urgencyPhrases: {
      limitedTime: '⏰ Zeitlich begrenztes Angebot - endet bald!',
      limitedStock: '🔥 Nur noch wenige auf Lager!',
      specialOffer: '✨ Sonderangebot nur für Sie!',
      freeShipping: '🚚 Kostenloser Versand ab 50€!',
    },

    socialProof: {
      customerReviews: '⭐ Kunden lieben es! 4.8/5 Sterne',
      bestseller: '🏆 Bestseller - #1 Wahl diesen Monat',
      trending: '📈 Derzeit im Trend - alle reden darüber',
      recommended: '👥 Von 9 von 10 Kunden empfohlen',
    },

    ctaButtons: {
      addToCart: '🛒 In den Warenkorb',
      buyNow: '💳 Jetzt kaufen',
      learnMore: '📖 Mehr erfahren',
      viewProduct: '👀 Produkt ansehen',
      getOffer: '🎁 Angebot erhalten',
    },
  };
}

// Registry for B2C language packs
const b2cLanguageCreators: Record<string, () => B2CLanguagePack> = {
  en: createB2CEnglishPack,
  ru: createB2CRussianPack,
  uk: createB2CUkrainianPack,
  de: createB2CGermanPack,
};

export function getB2CLanguagePack(languageCode: string): B2CLanguagePack {
  const creator = b2cLanguageCreators[languageCode];
  if (creator) {
    return creator();
  }
  // Fallback to English
  return createB2CEnglishPack();
}

export function getAvailableB2CLanguages(): Array<{
  code: string;
  name: string;
  flag: string;
}> {
  return Object.keys(b2cLanguageCreators).map(code => {
    const pack = b2cLanguageCreators[code]();
    return {
      code: pack.languageCode,
      name: pack.languageName,
      flag: pack.flagEmoji,
    };
  });
}