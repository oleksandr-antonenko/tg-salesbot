export interface LanguagePack {
  // Welcome messages
  welcomeText: string;
  languageSelected: string;
  welcomeMessage: string;

  // Error messages
  errorMessage: string;
  sessionError: string;

  // Stage-specific instructions for AI
  stageInstructions: {
    name_collection: string;
    trust_building: string;
    permission_request: string;
    situation_discovery: string;
    problem_identification: string;
    implication_development: string;
    need_payoff: string;
    proposal: string;
    closing: string;
    contact_collection: string;
    conversation_completed: string;
  };

  // AI prompts
  aiInstructions: {
    languageInstruction: string;
    responseLanguageReminder: string;
  };

  // Lead notification
  leadNotification: {
    newLead: string;
    nameAndContact: string;
    businessSector: string;
    summary: string;
    leadScore: string;
    dealClosed: string;
    notSpecified: string;
    client: string;
    bot: string;
    interestedFallback: string;
  };

  // Summary generation
  summaryPrompt: {
    instruction: string;
    focusOn: string;
    mainProblem: string;
    businessSector: string;
    interestLevel: string;
    format: string;
    example: string;
    responseOnly: string;
  };
}

export const languagePacks: Record<string, LanguagePack> = {
  en: {
    welcomeText:
      'Welcome! Please choose your preferred language:\nДобро пожаловать! Выберите предпочитаемый язык:\nЛаско просимо! Оберіть бажану мову:',
    languageSelected: 'Language selected!',
    welcomeMessage: `🤖 Hi! I'm Alex's AI assistant, here to show you how AI chatbots can revolutionize business sales!

Alex Antonenko is a seasoned Tech Lead and entrepreneur who's helped countless businesses boost their revenue with intelligent chatbot solutions.

Before we dive in, I'd love to get to know you better. What's your name? 😊`,

    errorMessage: 'Sorry, an error occurred. Please try again.',
    sessionError:
      'Sorry, there was an error starting a new session. Please try again.',

    stageInstructions: {
      name_collection:
        'ONLY ask for their name warmly. ABSOLUTELY NO mention of business, AI, chatbots, or sales. Just get their name and be friendly.',
      trust_building:
        "MANDATORY: say 'Nice to meet you, [NAME]! What business are you in?' IMPORTANT: ALWAYS end with a BUSINESS QUESTION. Salesperson LEADS with questions.",
      permission_request:
        'ONLY ask for permission to discuss their business. Be polite and respectful. Do NOT ask any actual business questions yet.',
      situation_discovery:
        'NOW you can ask about their business type and current processes. Use SPIN methodology - understand their SITUATION.',
      problem_identification:
        'Focus on finding their PROBLEMS and pain points. What challenges do they face?',
      implication_development:
        "Explore IMPLICATIONS of their problems. What happens if they don't solve these issues?",
      need_payoff:
        'Present the NEED-PAYOFF. How would solving their problems benefit them?',
      proposal:
        'Present your AI chatbot solution. Use AIDA - get attention, build interest, create desire.',
      closing:
        'Create urgency and guide toward action. Limited time offers, immediate benefits.',
      contact_collection:
        "FINAL STAGE: If contacts not collected yet - ask for them. If contacts received - say 'Thank you! Alex Antonenko will contact you soon. You can also reach him directly: @aleksandr_antonenko' and END conversation.",
      conversation_completed:
        'CONVERSATION ENDED: Thank them for their time, confirm Alex will contact them, give @aleksandr_antonenko contact. NO MORE questions. Just politely end.',
    },

    aiInstructions: {
      languageInstruction:
        'CRITICAL: RESPOND ONLY IN ENGLISH! NO OTHER LANGUAGES!',
      responseLanguageReminder: 'RESPOND IN ENGLISH ONLY!',
    },

    leadNotification: {
      newLead: '🎯 NEW LEAD!',
      nameAndContact: '**Name and Contact:**',
      businessSector: '**Business Sector:**',
      summary: '**Summary:**',
      leadScore: '📊 Lead Score:',
      dealClosed: 'Deal Closed',
      notSpecified: 'Not specified',
      client: 'Client',
      bot: 'Bot',
      interestedFallback: 'Interested in AI chatbot for business',
    },

    summaryPrompt: {
      instruction:
        'Analyze the conversation with a potential client and create a brief summary (maximum 100 characters) in English.',
      focusOn: 'Focus on:',
      mainProblem: '1. Main problem/need of the client',
      businessSector: '2. Their business sector',
      interestLevel: '3. Level of interest',
      format: 'Format: "Business sector - main problem/need"',
      example: 'Example: "Beauty salon - can\'t handle leads fast enough"',
      responseOnly: 'Respond only with the summary, no additional text.',
    },
  },

  ru: {
    welcomeText:
      'Welcome! Please choose your preferred language:\nДобро пожаловать! Выберите предпочитаемый язык:\nЛаско просимо! Оберіть бажану мову:',
    languageSelected: 'Язык выбран!',
    welcomeMessage: `🤖 Привет! Я ИИ-помощник Алекса, готов показать, как чат-боты могут революционизировать продажи бизнеса!

Алекс Антоненко — опытный Tech Lead и предприниматель, который помог бесчисленным компаниям увеличить доходы с помощью умных чат-ботов.

Для начала давайте познакомимся! Как вас зовут? 😊`,

    errorMessage: 'Извините, произошла ошибка. Попробуйте еще раз.',
    sessionError:
      'Извините, произошла ошибка при создании новой сессии. Попробуйте еще раз.',

    stageInstructions: {
      name_collection:
        'ТОЛЬКО спросите имя тепло и дружелюбно. АБСОЛЮТНО НИКАКИХ упоминаний бизнеса, ИИ, чат-ботов или продаж. Просто узнайте имя и будьте дружелюбны.',
      trust_building:
        "ОБЯЗАТЕЛЬНО скажите: 'Приятно познакомиться, [ИМЯ]! Каким бизнесом занимаетесь?' ВАЖНО: ВСЕГДА заканчивайте ВОПРОСОМ о бизнесе. Продавец ВЕДЕТ разговор вопросами.",
      permission_request:
        'ТОЛЬКО попросите разрешение обсудить их бизнес. Будьте вежливы и уважительны. НЕ задавайте пока никаких реальных бизнес-вопросов.',
      situation_discovery:
        'ТЕПЕРЬ можете спрашивать о типе бизнеса и текущих процессах. Используйте SPIN - поймите их СИТУАЦИЮ.',
      problem_identification:
        'Сосредоточьтесь на поиске их ПРОБЛЕМ и болевых точек. С какими вызовами они сталкиваются?',
      implication_development:
        'Изучите ПОСЛЕДСТВИЯ их проблем. Что случится, если они не решат эти вопросы?',
      need_payoff:
        'Представьте ВЫГОДУ. Как решение их проблем принесет им пользу?',
      proposal:
        'Представьте ваше решение ИИ-чатбота. Используйте AIDA - привлеките внимание, вызовите интерес, создайте желание.',
      closing:
        'Создайте срочность и направьте к действию. Ограниченные предложения, немедленные выгоды.',
      contact_collection:
        "ФИНАЛЬНАЯ СТАДИЯ: Если контакты еще не получены - спросите их. Если контакты получены - скажите 'Спасибо! Алекс Антоненко свяжется с вами в ближайшее время. Также можете написать ему напрямую: @aleksandr_antonenko' и ЗАВЕРШИТЕ разговор.",
      conversation_completed:
        'РАЗГОВОР ЗАВЕРШЕН: Поблагодарите за время, подтвердите что Алекс свяжется, дайте контакт @aleksandr_antonenko. Больше НЕ задавайте вопросов. Просто вежливо завершите.',
    },

    aiInstructions: {
      languageInstruction:
        'КРИТИЧЕСКИ ВАЖНО: ОТВЕЧАЙ ТОЛЬКО НА РУССКОМ ЯЗЫКЕ! НИКАКОГО АНГЛИЙСКОГО!',
      responseLanguageReminder: 'ОБЯЗАТЕЛЬНО ОТВЕЧАЙ НА РУССКОМ ЯЗЫКЕ!',
    },

    leadNotification: {
      newLead: '🎯 НОВЫЙ ЛИД!',
      nameAndContact: '**Имя и контакт:**',
      businessSector: '**Сфера бизнеса:**',
      summary: '**Резюме:**',
      leadScore: '📊 Lead Score:',
      dealClosed: 'Сделка закрыта',
      notSpecified: 'Не указано',
      client: 'Клиент',
      bot: 'Бот',
      interestedFallback: 'Заинтересован в AI чат-боте для бизнеса',
    },

    summaryPrompt: {
      instruction:
        'Проанализируй разговор с потенциальным клиентом и создай краткое резюме (максимум 100 символов) на русском языке.',
      focusOn: 'Сосредоточься на:',
      mainProblem: '1. Основной проблеме/потребности клиента',
      businessSector: '2. Сфере его бизнеса',
      interestLevel: '3. Уровне заинтересованности',
      format: 'Формат: "Сфера бизнеса - основная проблема/потребность"',
      example: 'Пример: "Салон красоты - не успевает обрабатывать лиды"',
      responseOnly: 'Ответь только резюме, без дополнительного текста.',
    },
  },

  uk: {
    welcomeText:
      'Welcome! Please choose your preferred language:\nДобро пожаловать! Выберите предпочитаемый язык:\nЛаско просимо! Оберіть бажану мову:',
    languageSelected: 'Мову обрано!',
    welcomeMessage: `🤖 Привіт! Я ІІ-помічник Олекса, готовий показати, як чат-боти можуть революціонізувати продажі бізнесу!

Олекс Антоненко — досвідчений Tech Lead та підприємець, який допоміг незліченним компаніям збільшити доходи за допомогою розумних чат-ботів.

Для початку давайте познайомимося! Як вас звати? 😊`,

    errorMessage: 'Вибачте, сталася помилка. Спробуйте ще раз.',
    sessionError:
      'Вибачте, сталася помилка при створенні нової сесії. Спробуйте ще раз.',

    stageInstructions: {
      name_collection:
        "ТІЛЬКИ запитайте ім'я тепло і дружелюбно. АБСОЛЮТНО ЖОДНИХ згадок бізнесу, ІІ, чат-ботів чи продажів. Просто дізнайтеся ім'я і будьте дружелюбними.",
      trust_building:
        "ОБОВ'ЯЗКОВО скажіть: 'Приємно познайомитися, [ІМ'Я]! Яким бізнесом займаєтеся?' ВАЖЛИВО: ЗАВЖДИ закінчуйте ЗАПИТАННЯМ про бізнес. Продавець ВЕДЕ розмову запитаннями.",
      permission_request:
        'ТІЛЬКИ попросіть дозвіл обговорити їхній бізнес. Будьте ввічливі і поважні. НЕ ставте поки жодних реальних бізнес-запитань.',
      situation_discovery:
        'ТЕПЕР можете запитувати про тип бізнесу і поточні процеси. Використовуйте SPIN - зрозумійте їхню СИТУАЦІЮ.',
      problem_identification:
        'Зосередьтеся на пошуку їхніх ПРОБЛЕМ і болючих точок. З якими викликами вони стикаються?',
      implication_development:
        'Вивчіть НАСЛІДКИ їхніх проблем. Що станеться, якщо вони не вирішать ці питання?',
      need_payoff:
        'Представте ВИГОДУ. Як вирішення їхніх проблем принесе їм користь?',
      proposal:
        'Представте ваше рішення ІІ-чатбота. Використовуйте AIDA - привертіть увагу, викличте інтерес, створіть бажання.',
      closing:
        'Створіть терміновість і направте до дії. Обмежені пропозиції, миттєві вигоди.',
      contact_collection:
        "ФІНАЛЬНА СТАДІЯ: Якщо контакти ще не отримані - запитайте їх. Якщо контакти отримані - скажіть 'Дякую! Олекс Антоненко зв'яжеться з вами найближчим часом. Також можете написати йому напряму: @aleksandr_antonenko' і ЗАВЕРШІТЬ розмову.",
      conversation_completed:
        "РОЗМОВА ЗАВЕРШЕНА: Подякуйте за час, підтвердьте що Олекс зв'яжеться, дайте контакт @aleksandr_antonenko. Більше НЕ ставте запитань. Просто ввічливо завершіть.",
    },

    aiInstructions: {
      languageInstruction:
        'КРИТИЧНО ВАЖЛИВО: ВІДПОВІДАЙ ТІЛЬКИ УКРАЇНСЬКОЮ МОВОЮ! ЖОДНОЇ АНГЛІЙСЬКОЇ!',
      responseLanguageReminder: "ОБОВ'ЯЗКОВО ВІДПОВІДАЙ УКРАЇНСЬКОЮ МОВОЮ!",
    },

    leadNotification: {
      newLead: '🎯 НОВИЙ ЛІД!',
      nameAndContact: "**Ім'я та контакт:**",
      businessSector: '**Сфера бізнесу:**',
      summary: '**Резюме:**',
      leadScore: '📊 Lead Score:',
      dealClosed: 'Угода закрита',
      notSpecified: 'Не вказано',
      client: 'Клієнт',
      bot: 'Бот',
      interestedFallback: 'Зацікавлений в ІІ чат-боті для бізнесу',
    },

    summaryPrompt: {
      instruction:
        'Проаналізуй розмову з потенційним клієнтом і створи коротке резюме (максимум 100 символів) українською мовою.',
      focusOn: 'Зосередься на:',
      mainProblem: '1. Основній проблемі/потребі клієнта',
      businessSector: '2. Сфері його бізнесу',
      interestLevel: '3. Рівні зацікавленості',
      format: 'Формат: "Сфера бізнесу - основна проблема/потреба"',
      example: 'Приклад: "Салон краси - не встигає обробляти ліди"',
      responseOnly: 'Дай тільки резюме, без додаткового тексту.',
    },
  },
};

export function getLanguagePack(language: string): LanguagePack {
  return languagePacks[language] || languagePacks.en;
}
