import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';
import { ConversationService } from '../database/conversation.service';
import * as langdetect from 'langdetect';

interface ConversationSession {
  userId: string;
  userName?: string;
  language: string;
  conversationStage: string;
  conversationId?: number;
  dbUserId?: number;
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
  leadScore?: number;
  extractedData?: {
    businessType?: string;
    challenges?: string;
    budget?: string;
    urgency?: 'low' | 'medium' | 'high';
  };
}

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly conversationService: ConversationService,
  ) {}

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
      en: `🤖 Hi! I'm Alex's AI assistant, here to show you how AI chatbots can revolutionize business sales!

Alex Antonenko is a seasoned Tech Lead and entrepreneur who's helped countless businesses boost their revenue with intelligent chatbot solutions.

Before we dive in, I'd love to get to know you better. What's your name? 😊`,
      ru: `🤖 Привет! Я ИИ-помощник Алекса, готов показать, как чат-боты могут революционизировать продажи бизнеса!

Алекс Антоненко — опытный Tech Lead и предприниматель, который помог бесчисленным компаниям увеличить доходы с помощью умных чат-ботов.

Для начала давайте познакомимся! Как вас зовут? 😊`,
    };

    return Promise.resolve(
      welcomeMessages[language as keyof typeof welcomeMessages] ||
        welcomeMessages.en,
    );
  }

  async processMessage(
    userMessage: string,
    session: ConversationSession,
    conversationHistory?: Array<{role: 'user' | 'bot', message: string}>,
  ): Promise<ProcessMessageResponse> {
    try {
      const language = session.language;
      this.logger.log(`Processing message: "${userMessage}" | Stage: "${session.conversationStage}" | Language: "${language}"`);
      
      // Анализируем сообщение для извлечения данных
      const extractedData = await this.analyzeUserMessage(userMessage, language);
      const leadScore = this.calculateLeadScore(userMessage, session, extractedData);
      
      this.logger.log(`AI Analysis: ${JSON.stringify(extractedData)} | Lead Score: ${leadScore}`);
      
      let updatedStage = session.conversationStage;
      const updatedUserData = { ...session.userData };

      // Обновляем данные пользователя на основе AI анализа
      if (extractedData.businessType) {
        updatedUserData.businessType = extractedData.businessType;
      }
      if (extractedData.challenges) {
        updatedUserData.currentChallenges = extractedData.challenges;
      }
      if (extractedData.budget) {
        updatedUserData.budget = extractedData.budget;
      }

      // Умная логика перехода между стадиями SPIN на основе AI анализа
      updatedStage = this.determineNextStage(session.conversationStage, extractedData, leadScore, userMessage);

      const response = await this.geminiService.generateSalesResponse(
        userMessage,
        {
          conversationStage: updatedStage,
          userData: updatedUserData,
          previousStage: session.conversationStage,
          conversationHistory,
        },
        language,
      );

      // Обновляем lead score в базе данных если есть conversationId
      if (session.conversationId && leadScore > 0) {
        await this.conversationService.updateConversationStage(
          session.conversationId,
          updatedStage
        );
      }

      return {
        message: response,
        updatedSession: {
          language,
          conversationStage: updatedStage,
          userData: updatedUserData,
        },
        leadScore,
        extractedData,
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



  getSalesStagePrompt(stage: string, language: string): string {
    const prompts: Record<string, Record<string, string>> = {
      en: {
        name_collection:
          'Build RAPPORT: Ask for their name to establish personal connection. Be warm and friendly.',
        trust_building:
          'Build TRUST: Show genuine interest, acknowledge their name, make them feel comfortable. Create safe environment.',
        permission_request:
          'Ask PERMISSION: Politely request permission to ask a few questions about their business. This shows respect.',
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
        name_collection:
          'Установите РАППОРТ: спросите имя для создания личной связи. Будьте теплыми и дружелюбными.',
        trust_building:
          'Установите ДОВЕРИЕ: проявите искренний интерес, обратитесь по имени, создайте комфорт. Безопасная среда.',
        permission_request:
          'Просите РАЗРЕШЕНИЕ: вежливо попросите разрешение задать несколько вопросов о бизнесе. Это проявление уважения.',
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

  private async analyzeUserMessage(message: string, language: string): Promise<{
    businessType?: string;
    challenges?: string;
    budget?: string;
    urgency?: 'low' | 'medium' | 'high';
    hasName?: boolean;
    isPositiveResponse?: boolean;
    gavePermission?: boolean;
  }> {
    try {
      const analysisPrompt = `
        Analyze this user message VERY CAREFULLY and extract information:
        "${message}"
        
        Be EXTREMELY CONSERVATIVE in your analysis. Only return true for fields when you are 100% certain.
        
        Return a JSON object with extracted data:
        {
          "businessType": "only if explicitly mentioned business type (e.g., restaurant, shop, salon, etc.)",
          "challenges": "only if explicit business problems mentioned", 
          "budget": "only if explicit budget/money concerns mentioned",
          "urgency": "low/medium/high based on language urgency",
          "hasName": true/false (ONLY TRUE if message contains a clear person's name like 'Меня зовут Александр' or 'My name is John'),
          "isPositiveResponse": true/false (ONLY TRUE for clear positive responses like 'да', 'хорошо', 'конечно', 'yes', 'sure', 'ok'),
          "gavePermission": true/false (ONLY TRUE for explicit permission like 'да, можете', 'конечно, спрашивайте', 'yes, go ahead', 'sure, ask away')
        }
        
        BE CONSERVATIVE: When in doubt, return false/null. Don't guess or infer.
        
        Respond ONLY with valid JSON, no other text.
      `;
      
      const response = await this.geminiService.generateResponse(analysisPrompt);
      const cleanResponse = response.replace(/```json|```/g, '').trim();
      
      const result = JSON.parse(cleanResponse);
      this.logger.log(`AI Analysis result: ${JSON.stringify(result)}`);
      
      return result;
    } catch (error) {
      this.logger.warn('Failed to analyze user message:', error);
      return {};
    }
  }

  private calculateLeadScore(
    message: string, 
    session: ConversationSession, 
    extractedData: any
  ): number {
    let score = 0;
    
    // Длина сообщения (более детальные ответы = выше интерес)
    if (message.length > 50) score += 1;
    if (message.length > 100) score += 1;
    
    // Упоминание бизнеса
    if (extractedData.businessType) score += 2;
    
    // Упоминание проблем
    if (extractedData.challenges) score += 2;
    
    // Упоминание бюджета
    if (extractedData.budget) score += 3;
    
    // Уровень срочности
    if (extractedData.urgency === 'high') score += 3;
    if (extractedData.urgency === 'medium') score += 2;
    if (extractedData.urgency === 'low') score += 1;
    
    // Прогресс по стадиям SPIN
    const stageScores = {
      'greeting': 1,
      'name_collection': 1,
      'trust_building': 2,
      'permission_request': 2,
      'situation_discovery': 3,
      'problem_identification': 4,
      'implication_development': 5,
      'need_payoff': 6,
      'proposal': 7,
      'closing': 8,
      'contact_collection': 10
    };
    
    score += stageScores[session.conversationStage] || 0;
    
    // Положительные слова (интерес к решению)
    const positiveWords = ['да', 'интересно', 'хочу', 'нужно', 'подходит', 'yes', 'interested', 'want', 'need', 'sounds good'];
    const lowerMessage = message.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
    score += positiveCount;
    
    return Math.min(score, 10); // Максимум 10
  }

  private determineNextStage(
    currentStage: string,
    extractedData: any,
    leadScore: number,
    userMessage: string
  ): string {
    this.logger.log(`Stage transition analysis: ${currentStage} -> extractedData: ${JSON.stringify(extractedData)} -> leadScore: ${leadScore}`);
    
    switch (currentStage) {
      case 'greeting':
        return 'name_collection';
        
      case 'name_collection':
        // Переходим если сообщение содержит имя (любое слово без спецсимволов)
        const containsName = /^[А-Яа-яA-Za-z\s]{2,20}$/.test(userMessage.trim());
        if (containsName || extractedData.hasName) {
          this.logger.log('Stage transition: name_collection -> trust_building (name detected)');
          return 'trust_building';
        }
        // Остаемся на сборе имени
        return 'name_collection';
        
      case 'trust_building':
        // Сразу переходим к выяснению бизнеса, пропуская запрос разрешения
        this.logger.log('Stage transition: trust_building -> situation_discovery (direct to business)');
        return 'situation_discovery';
        
      case 'permission_request':
        // Переходим к бизнес-вопросам если пользователь не отказался явно
        const userRefused = userMessage.toLowerCase().includes('нет') || 
                           userMessage.toLowerCase().includes('no') ||
                           userMessage.toLowerCase().includes('не хочу') ||
                           userMessage.toLowerCase().includes('не надо');
        
        if (!userRefused) {
          this.logger.log('Stage transition: permission_request -> situation_discovery (no explicit refusal)');
          return 'situation_discovery';
        }
        return 'permission_request';
        
      case 'situation_discovery':
        // Переходим если пользователь ответил на вопрос о бизнесе (любой ответ кроме односложных)
        if (userMessage.length > 3 || extractedData.businessType) {
          this.logger.log('Stage transition: situation_discovery -> problem_identification (business response received)');
          return 'problem_identification';
        }
        return 'situation_discovery';
        
      case 'problem_identification':
        // Переходим если пользователь дал развернутый ответ о проблемах
        if (userMessage.length > 10 || extractedData.challenges) {
          this.logger.log('Stage transition: problem_identification -> implication_development (problem response received)');
          return 'implication_development';
        }
        return 'problem_identification';
        
      case 'implication_development':
        // Переходим если пользователь понимает последствия
        if (userMessage.length > 5 || leadScore >= 5) {
          this.logger.log('Stage transition: implication_development -> need_payoff (implications understood)');
          return 'need_payoff';
        }
        return 'implication_development';
        
      case 'need_payoff':
        // Переходим к предложению если пользователь проявляет интерес
        if (userMessage.length > 3 || leadScore >= 5) {
          this.logger.log('Stage transition: need_payoff -> proposal (interest shown)');
          return 'proposal';
        }
        return 'need_payoff';
        
      case 'proposal':
        // Переходим к закрытию если пользователь не отказался
        if (userMessage.length > 2 || leadScore >= 4) {
          this.logger.log('Stage transition: proposal -> closing (ready to close)');
          return 'closing';
        }
        return 'proposal';
        
      case 'closing':
        // Переходим к сбору контактов если пользователь согласился
        const userAgreed = userMessage.toLowerCase().includes('да') || 
                          userMessage.toLowerCase().includes('yes') ||
                          userMessage.toLowerCase().includes('согласен') ||
                          userMessage.toLowerCase().includes('устраивает') ||
                          userMessage.toLowerCase().includes('подходит') ||
                          userMessage.toLowerCase().includes('agree') ||
                          userMessage.toLowerCase().includes('sure') ||
                          userMessage.toLowerCase().includes('ok');
        
        if (userAgreed) {
          this.logger.log('Stage transition: closing -> contact_collection (deal closed)');
          return 'contact_collection';
        }
        return 'closing';
        
      case 'contact_collection':
        return 'contact_collection'; // Остаемся на сборе контактов
        
      default:
        return 'name_collection';
    }
  }

  async getConversationAnalytics(conversationId: number): Promise<{
    totalMessages: number;
    averageLeadScore: number;
    stagesReached: string[];
    keyInsights: string[];
  }> {
    try {
      const conversation = await this.conversationService.getCurrentConversation(conversationId);
      if (!conversation) {
        return {
          totalMessages: 0,
          averageLeadScore: 0,
          stagesReached: [],
          keyInsights: []
        };
      }

      const userMessages = conversation.messages.filter(m => m.messageType === 'user');
      const stages = [...new Set(conversation.messages.map(m => m.conversationStage).filter(Boolean))];
      
      // Анализируем все сообщения пользователя для получения insights
      const insights: string[] = [];
      let totalScore = 0;
      
      for (const message of userMessages) {
        const extractedData = await this.analyzeUserMessage(message.content, 'en');
        if (extractedData.businessType) {
          insights.push(`Business type: ${extractedData.businessType}`);
        }
        if (extractedData.challenges) {
          insights.push(`Challenge: ${extractedData.challenges}`);
        }
        if (extractedData.budget) {
          insights.push(`Budget concern: ${extractedData.budget}`);
        }
        
        // Примерный расчет lead score для каждого сообщения
        totalScore += this.calculateLeadScore(message.content, {} as ConversationSession, extractedData);
      }

      return {
        totalMessages: userMessages.length,
        averageLeadScore: userMessages.length > 0 ? totalScore / userMessages.length : 0,
        stagesReached: stages,
        keyInsights: [...new Set(insights)] // убираем дубликаты
      };
    } catch (error) {
      this.logger.error('Error analyzing conversation:', error);
      return {
        totalMessages: 0,
        averageLeadScore: 0,
        stagesReached: [],
        keyInsights: []
      };
    }
  }
}
