import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';
import * as langdetect from 'langdetect';

interface ConversationSession {
  userId: string;
  userName?: string;
  language: string;
  conversationStage: string;
  userData: {
    businessType?: string;
    currentChallenges?: string;
    budget?: string;
    timeline?: string;
    contactInfo?: string;
  };
}

interface ProcessMessageResponse {
  message: string;
  updatedSession?: Partial<ConversationSession>;
}

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(private readonly geminiService: GeminiService) {}

  detectLanguage(text: string): Promise<string> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const detected = (langdetect as any).detect(text) as Array<{
        lang: string;
        prob: number;
      }>;
      return Promise.resolve(detected[0]?.lang || 'en');
    } catch {
      this.logger.warn('Language detection failed, defaulting to English');
      return Promise.resolve('en');
    }
  }

  generateWelcomeMessage(language: string): Promise<string> {
    const welcomeMessages = {
      en: `🤖 Hi! I'm Alex's AI assistant, here to show you how AI chatbots can revolutionize your business sales!

Alex Antonenko is a seasoned Tech Lead and entrepreneur who's helped countless businesses boost their revenue with intelligent chatbot solutions.

What type of business are you running? I'd love to understand how we can help you grow! 🚀`,
      ru: `🤖 Привет! Я ИИ-помощник Алекса, готов показать, как чат-боты могут революционизировать продажи вашего бизнеса!

Алекс Антоненко — опытный Tech Lead и предприниматель, который помог бесчисленным компаниям увеличить доходы с помощью умных чат-ботов.

Какой у вас тип бизнеса? Хочу понять, как мы можем помочь вам расти! 🚀`,
    };

    return Promise.resolve(
      welcomeMessages[language as keyof typeof welcomeMessages] ||
        welcomeMessages.en,
    );
  }

  async processMessage(
    userMessage: string,
    session: ConversationSession,
  ): Promise<ProcessMessageResponse> {
    try {
      const language = await this.detectLanguage(userMessage);
      let updatedStage = session.conversationStage;
      const updatedUserData = { ...session.userData };

      // SPIN Selling approach - analyze conversation stage
      switch (session.conversationStage) {
        case 'greeting':
          updatedStage = 'situation_discovery';
          break;
        case 'situation_discovery': {
          const businessInfo = this.extractBusinessInfo(userMessage);
          if (businessInfo) {
            updatedUserData.businessType = businessInfo;
            updatedStage = 'problem_identification';
          }
          break;
        }
        case 'problem_identification': {
          const challenges = this.extractChallenges(userMessage);
          if (challenges) {
            updatedUserData.currentChallenges = challenges;
            updatedStage = 'implication_development';
          }
          break;
        }
        case 'implication_development':
          updatedStage = 'need_payoff';
          break;
        case 'need_payoff':
          updatedStage = 'proposal';
          break;
        case 'proposal':
          updatedStage = 'closing';
          break;
      }

      const response = await this.geminiService.generateSalesResponse(
        userMessage,
        {
          conversationStage: updatedStage,
          userData: updatedUserData,
          previousStage: session.conversationStage,
        },
        language,
      );

      return {
        message: response,
        updatedSession: {
          language,
          conversationStage: updatedStage,
          userData: updatedUserData,
        },
      };
    } catch (error) {
      this.logger.error('Error processing message:', error);
      const errorMessage =
        session.language === 'ru'
          ? 'Извините, произошла ошибка. Расскажите еще раз о вашем бизнесе?'
          : 'Sorry, there was an error. Could you tell me more about your business?';

      return { message: errorMessage };
    }
  }

  private extractBusinessInfo(message: string): string | null {
    const businessKeywords = [
      'shop',
      'store',
      'retail',
      'ecommerce',
      'restaurant',
      'cafe',
      'hotel',
      'service',
      'consulting',
      'agency',
      'startup',
      'company',
      'business',
      'магазин',
      'ресторан',
      'кафе',
      'отель',
      'сервис',
      'консалтинг',
      'агентство',
      'стартап',
      'компания',
      'бизнес',
    ];

    const lowerMessage = message.toLowerCase();
    const foundKeyword = businessKeywords.find((keyword) =>
      lowerMessage.includes(keyword),
    );
    return foundKeyword ? message : null;
  }

  private extractChallenges(message: string): string | null {
    const challengeKeywords = [
      'problem',
      'issue',
      'challenge',
      'difficult',
      'struggle',
      'low sales',
      'customers',
      'support',
      'time',
      'busy',
      'expensive',
      'проблема',
      'сложность',
      'трудность',
      'низкие продажи',
      'клиенты',
      'поддержка',
      'время',
      'занят',
      'дорого',
    ];

    const lowerMessage = message.toLowerCase();
    const hasChallenge = challengeKeywords.some((keyword) =>
      lowerMessage.includes(keyword),
    );
    return hasChallenge ? message : null;
  }

  getSalesStagePrompt(stage: string, language: string): string {
    const prompts: Record<string, Record<string, string>> = {
      en: {
        situation_discovery:
          "Ask about their business type, size, and current customer interaction methods. Use SPIN: What's your current SITUATION?",
        problem_identification:
          'Identify specific PROBLEMS with current customer service or sales processes. What challenges are you facing?',
        implication_development:
          'Explore IMPLICATIONS: What happens if these problems persist? Lost sales? Customer dissatisfaction?',
        need_payoff:
          'Present NEED-PAYOFF: How would solving this improve their business? Increase sales, save time, better customer experience?',
        proposal:
          'Present AI chatbot solution tailored to their needs. Use AIDA: grab ATTENTION, build INTEREST, create DESIRE.',
        closing:
          'Create ACTION: Guide toward PoC order. Limited time offer, risk-free trial, immediate benefits.',
      },
      ru: {
        situation_discovery:
          'Спросите о типе бизнеса, размере и текущих методах взаимодействия с клиентами. SPIN: какая у вас СИТУАЦИЯ?',
        problem_identification:
          'Выявите конкретные ПРОБЛЕМЫ с текущим обслуживанием клиентов или процессами продаж. С какими вызовами сталкиваетесь?',
        implication_development:
          'Изучите ПОСЛЕДСТВИЯ: что будет, если эти проблемы останутся? Потерянные продажи? Недовольные клиенты?',
        need_payoff:
          'Представьте ВЫГОДУ: как решение этого улучшит бизнес? Увеличение продаж, экономия времени, лучший опыт клиентов?',
        proposal:
          'Представьте решение ИИ-чатбота под их нужды. AIDA: привлеките ВНИМАНИЕ, вызовите ИНТЕРЕС, создайте ЖЕЛАНИЕ.',
        closing:
          'Создайте ДЕЙСТВИЕ: направьте к заказу PoC. Ограниченное предложение, безрисковый тест, немедленные выгоды.',
      },
    };

    return prompts[language]?.[stage] || prompts.en?.[stage] || '';
  }
}
