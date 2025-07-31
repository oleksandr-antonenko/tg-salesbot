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
  ): Promise<ProcessMessageResponse> {
    try {
      const language = session.language;
      this.logger.log(`Processing message in language: "${language}" for stage: "${session.conversationStage}"`);
      
      // Анализируем сообщение для извлечения данных
      const extractedData = await this.analyzeUserMessage(userMessage, language);
      const leadScore = this.calculateLeadScore(userMessage, session, extractedData);
      
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
        Analyze this user message and extract information:
        "${message}"
        
        Return a JSON object with extracted data:
        {
          "businessType": "if mentioned (e.g., restaurant, shop, salon, etc.)",
          "challenges": "business problems mentioned",
          "budget": "any budget/money concerns mentioned",
          "urgency": "low/medium/high based on language urgency",
          "hasName": true/false if message contains a person's name,
          "isPositiveResponse": true/false if user responds positively/friendly,
          "gavePermission": true/false if user gives permission to ask questions
        }
        
        Respond ONLY with valid JSON, no other text.
      `;
      
      const response = await this.geminiService.generateResponse(analysisPrompt);
      const cleanResponse = response.replace(/```json|```/g, '').trim();
      
      return JSON.parse(cleanResponse);
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
      'closing': 8
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
    // Если lead score низкий, остаемся на текущей стадии для дополнительного выяснения
    if (leadScore < 3 && currentStage !== 'greeting') {
      return currentStage;
    }
    
    switch (currentStage) {
      case 'greeting':
        return 'name_collection';
        
      case 'name_collection':
        // Переходим к установлению доверия если AI извлек имя или позитивная реакция
        return extractedData.hasName || extractedData.isPositiveResponse || leadScore >= 2 ? 'trust_building' : 'name_collection';
        
      case 'trust_building':
        // После установления доверия просим разрешение на вопросы
        return extractedData.isPositiveResponse || leadScore >= 2 ? 'permission_request' : 'trust_building';
        
      case 'permission_request':
        // Переходим к ситуации только после получения разрешения по AI анализу
        return extractedData.gavePermission || leadScore >= 3 ? 'situation_discovery' : 'permission_request';
        
      case 'situation_discovery':
        // Переходим к проблемам если AI извлек информацию о бизнесе или достаточный lead score
        return extractedData.businessType || leadScore >= 4 ? 'problem_identification' : 'situation_discovery';
        
      case 'problem_identification':
        // Переходим к последствиям если AI извлек проблемы или достаточный lead score
        return extractedData.challenges || leadScore >= 5 ? 'implication_development' : 'problem_identification';
        
      case 'implication_development':
        // Переходим к выгодам если lead score достаточно высокий
        return leadScore >= 6 ? 'need_payoff' : 'implication_development';
        
      case 'need_payoff':
        // Переходим к предложению если есть интерес (высокий lead score)
        return leadScore >= 7 ? 'proposal' : 'need_payoff';
        
      case 'proposal':
        // Переходим к закрытию если есть сильный интерес
        return leadScore >= 8 ? 'closing' : 'proposal';
        
      case 'closing':
        return 'closing'; // Остаемся на закрытии
        
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
