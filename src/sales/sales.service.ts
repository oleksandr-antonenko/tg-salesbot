import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';
import { ConversationService } from '../database/conversation.service';
import { getLanguagePack } from '../localization/language-packs';
import * as langdetect from 'langdetect';

interface ConversationSession {
  userId: string;
  userName?: string; // Telegram username
  userProvidedName?: string; // Name provided by user
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
  extractedContacts?: {
    phone?: string;
    email?: string;
    telegram?: string;
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
      const detectedLang = detected[0]?.lang || 'en';

      // Map language detection results to our supported languages
      if (detectedLang === 'uk' || detectedLang === 'ukrainian') {
        return Promise.resolve('uk');
      } else if (detectedLang === 'ru' || detectedLang === 'russian') {
        return Promise.resolve('ru');
      } else {
        return Promise.resolve('en');
      }
    } catch {
      this.logger.warn('Language detection failed, defaulting to English');
      return Promise.resolve('en');
    }
  }

  generateWelcomeMessage(language: string): Promise<string> {
    const languagePack = getLanguagePack(language);
    return Promise.resolve(languagePack.welcomeMessage);
  }

  async processMessage(
    userMessage: string,
    session: ConversationSession,
    conversationHistory?: Array<{ role: 'user' | 'bot'; message: string }>,
  ): Promise<ProcessMessageResponse> {
    try {
      const language = session.language;
      this.logger.log(
        `Processing message: "${userMessage}" | Stage: "${session.conversationStage}" | Language: "${language}"`,
      );

      // Analyze message to extract data
      const extractedData = await this.analyzeUserMessage(userMessage);
      const leadScore = this.calculateLeadScore(
        userMessage,
        session,
        extractedData,
      );

      this.logger.log(
        `AI Analysis: ${JSON.stringify(extractedData)} | Lead Score: ${leadScore}`,
      );

      let updatedStage = session.conversationStage;
      const updatedUserData = { ...session.userData };

      // Update user data based on AI analysis
      if (extractedData.businessType) {
        updatedUserData.businessType = extractedData.businessType;
      }
      if (extractedData.challenges) {
        updatedUserData.currentChallenges = extractedData.challenges;
      }
      if (extractedData.budget) {
        updatedUserData.budget = extractedData.budget;
      }

      // Update extracted contacts
      let updatedContacts = { ...session.extractedContacts };
      if (extractedData.contactInfo) {
        updatedContacts = {
          ...updatedContacts,
          ...extractedData.contactInfo,
        };
      }

      // Save user-provided name
      let userProvidedName = session.userProvidedName;
      if (
        extractedData.hasName &&
        session.conversationStage === 'name_collection'
      ) {
        // Extract name from message (take first word that looks like a name)
        const nameMatch = userMessage.match(/^([А-Яа-яA-Za-z]+)/);
        if (nameMatch) {
          userProvidedName = nameMatch[1];
        }
      }

      // Smart stage transition logic based on AI analysis
      updatedStage = this.determineNextStage(
        session.conversationStage,
        extractedData,
        leadScore,
        userMessage,
      );

      const response = await this.geminiService.generateSalesResponse(
        userMessage,
        {
          conversationStage: updatedStage,
          userData: updatedUserData,
          previousStage: session.conversationStage,
          conversationHistory,
          userProvidedName: userProvidedName || session.userProvidedName,
        },
        language,
      );

      // Update lead score in database if conversationId exists
      if (session.conversationId && leadScore > 0) {
        await this.conversationService.updateConversationStage(
          session.conversationId,
          updatedStage,
        );
      }

      return {
        message: response,
        updatedSession: {
          language,
          conversationStage: updatedStage,
          userData: updatedUserData,
          extractedContacts: updatedContacts,
          userProvidedName,
        },
        leadScore,
        extractedData,
      };
    } catch (error) {
      this.logger.error('Error processing message:', error);
      const languagePack = getLanguagePack(session.language);
      const errorMessage = languagePack.errorMessage;

      return { message: errorMessage };
    }
  }

  private async analyzeUserMessage(message: string): Promise<{
    businessType?: string;
    challenges?: string;
    budget?: string;
    urgency?: 'low' | 'medium' | 'high';
    hasName?: boolean;
    isPositiveResponse?: boolean;
    gavePermission?: boolean;
    contactInfo?: {
      phone?: string;
      email?: string;
      telegram?: string;
    };
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
          "gavePermission": true/false (ONLY TRUE for explicit permission like 'да, можете', 'конечно, спрашивайте', 'yes, go ahead', 'sure, ask away'),
          "contactInfo": {
            "phone": "extracted phone number if found (e.g., +380977281466)",
            "email": "extracted email if found",
            "telegram": "extracted telegram username if found (e.g., @username)"
          }
        }
        
        BE CONSERVATIVE: When in doubt, return false/null. Don't guess or infer.
        
        Respond ONLY with valid JSON, no other text.
      `;

      const response =
        await this.geminiService.generateResponse(analysisPrompt);
      const cleanResponse = response.replace(/```json|```/g, '').trim();

      const result = JSON.parse(cleanResponse) as {
        businessType?: string;
        challenges?: string;
        budget?: string;
        urgency?: 'low' | 'medium' | 'high';
        hasName?: boolean;
        isPositiveResponse?: boolean;
        gavePermission?: boolean;
        contactInfo?: {
          phone?: string;
          email?: string;
          telegram?: string;
        };
      };
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
    extractedData: {
      businessType?: string;
      challenges?: string;
      budget?: string;
      urgency?: 'low' | 'medium' | 'high';
      hasName?: boolean;
      isPositiveResponse?: boolean;
      gavePermission?: boolean;
      contactInfo?: {
        phone?: string;
        email?: string;
        telegram?: string;
      };
    },
  ): number {
    let score = 0;

    // Message length (more detailed answers = higher interest)
    if (message.length > 50) score += 1;
    if (message.length > 100) score += 1;

    // Business mention
    if (extractedData.businessType) score += 2;

    // Problems mention
    if (extractedData.challenges) score += 2;

    // Budget mention
    if (extractedData.budget) score += 3;

    // Urgency level
    if (extractedData.urgency === 'high') score += 3;
    if (extractedData.urgency === 'medium') score += 2;
    if (extractedData.urgency === 'low') score += 1;

    // Progress through SPIN stages
    const stageScores = {
      greeting: 1,
      name_collection: 1,
      trust_building: 2,
      permission_request: 2,
      situation_discovery: 3,
      problem_identification: 4,
      implication_development: 5,
      need_payoff: 6,
      proposal: 7,
      closing: 8,
      contact_collection: 10,
      conversation_completed: 10,
    };

    score += stageScores[session.conversationStage] || 0;

    // Positive words (interest in solution)
    const positiveWords = [
      'да',
      'интересно',
      'хочу',
      'нужно',
      'подходит',
      'yes',
      'interested',
      'want',
      'need',
      'sounds good',
    ];
    const lowerMessage = message.toLowerCase();
    const positiveCount = positiveWords.filter((word) =>
      lowerMessage.includes(word),
    ).length;
    score += positiveCount;

    return Math.min(score, 10); // Maximum 10
  }

  private determineNextStage(
    currentStage: string,
    extractedData: {
      businessType?: string;
      challenges?: string;
      budget?: string;
      urgency?: 'low' | 'medium' | 'high';
      hasName?: boolean;
      isPositiveResponse?: boolean;
      gavePermission?: boolean;
      contactInfo?: {
        phone?: string;
        email?: string;
        telegram?: string;
      };
    },
    leadScore: number,
    userMessage: string,
  ): string {
    this.logger.log(
      `Stage transition analysis: ${currentStage} -> extractedData: ${JSON.stringify(extractedData)} -> leadScore: ${leadScore}`,
    );

    switch (currentStage) {
      case 'greeting':
        return 'name_collection';

      case 'name_collection': {
        // Transition if message contains a name (any word without special characters)
        const containsName = /^[А-Яа-яA-Za-z\s]{2,20}$/.test(
          userMessage.trim(),
        );
        if (containsName || extractedData.hasName) {
          this.logger.log(
            'Stage transition: name_collection -> trust_building (name detected)',
          );
          return 'trust_building';
        }
        // Stay on name collection
        return 'name_collection';
      }

      case 'trust_building':
        // Go directly to business discovery, skipping permission request
        this.logger.log(
          'Stage transition: trust_building -> situation_discovery (direct to business)',
        );
        return 'situation_discovery';

      case 'permission_request': {
        // Move to business questions if user didn't explicitly refuse
        const userRefused =
          userMessage.toLowerCase().includes('нет') ||
          userMessage.toLowerCase().includes('no') ||
          userMessage.toLowerCase().includes('не хочу') ||
          userMessage.toLowerCase().includes('не надо');

        if (!userRefused) {
          this.logger.log(
            'Stage transition: permission_request -> situation_discovery (no explicit refusal)',
          );
          return 'situation_discovery';
        }
        return 'permission_request';
      }

      case 'situation_discovery':
        // Move if user answered business question (any response except one-word answers)
        if (userMessage.length > 3 || extractedData.businessType) {
          this.logger.log(
            'Stage transition: situation_discovery -> problem_identification (business response received)',
          );
          return 'problem_identification';
        }
        return 'situation_discovery';

      case 'problem_identification':
        // Move if user gave detailed answer about problems
        if (userMessage.length > 10 || extractedData.challenges) {
          this.logger.log(
            'Stage transition: problem_identification -> implication_development (problem response received)',
          );
          return 'implication_development';
        }
        return 'problem_identification';

      case 'implication_development':
        // Move if user understands implications
        if (userMessage.length > 5 || leadScore >= 5) {
          this.logger.log(
            'Stage transition: implication_development -> need_payoff (implications understood)',
          );
          return 'need_payoff';
        }
        return 'implication_development';

      case 'need_payoff':
        // Move to proposal if user shows interest
        if (userMessage.length > 3 || leadScore >= 5) {
          this.logger.log(
            'Stage transition: need_payoff -> proposal (interest shown)',
          );
          return 'proposal';
        }
        return 'need_payoff';

      case 'proposal':
        // Move to closing if user didn't refuse
        if (userMessage.length > 2 || leadScore >= 4) {
          this.logger.log(
            'Stage transition: proposal -> closing (ready to close)',
          );
          return 'closing';
        }
        return 'proposal';

      case 'closing': {
        // Move to contact collection if user agreed
        const userAgreed =
          userMessage.toLowerCase().includes('да') ||
          userMessage.toLowerCase().includes('yes') ||
          userMessage.toLowerCase().includes('согласен') ||
          userMessage.toLowerCase().includes('устраивает') ||
          userMessage.toLowerCase().includes('подходит') ||
          userMessage.toLowerCase().includes('agree') ||
          userMessage.toLowerCase().includes('sure') ||
          userMessage.toLowerCase().includes('ok');

        if (userAgreed) {
          this.logger.log(
            'Stage transition: closing -> contact_collection (deal closed)',
          );
          return 'contact_collection';
        }
        return 'closing';
      }

      case 'contact_collection': {
        // Move to completion if new contacts received or already have saved contacts
        const hasNewContactInfo =
          /(\+?\d{10,15}|[\w.-]+@[\w.-]+\.\w+|@\w+)/i.test(userMessage);
        const hasStoredContacts =
          extractedData.contactInfo &&
          (extractedData.contactInfo.phone ||
            extractedData.contactInfo.email ||
            extractedData.contactInfo.telegram);

        if (hasNewContactInfo || hasStoredContacts) {
          this.logger.log(
            'Stage transition: contact_collection -> conversation_completed (contacts available)',
          );
          return 'conversation_completed';
        }
        return 'contact_collection';
      }

      case 'conversation_completed':
        return 'conversation_completed'; // Conversation ended

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
      const conversation =
        await this.conversationService.getCurrentConversation(conversationId);
      if (!conversation) {
        return {
          totalMessages: 0,
          averageLeadScore: 0,
          stagesReached: [],
          keyInsights: [],
        };
      }

      const userMessages = conversation.messages.filter(
        (m) => m.messageType === 'user',
      );
      const stages = [
        ...new Set(
          conversation.messages.map((m) => m.conversationStage).filter(Boolean),
        ),
      ];

      // Analyze all user messages to get insights
      const insights: string[] = [];
      let totalScore = 0;

      for (const message of userMessages) {
        const extractedData = await this.analyzeUserMessage(message.content);
        if (extractedData.businessType) {
          insights.push(`Business type: ${extractedData.businessType}`);
        }
        if (extractedData.challenges) {
          insights.push(`Challenge: ${extractedData.challenges}`);
        }
        if (extractedData.budget) {
          insights.push(`Budget concern: ${extractedData.budget}`);
        }

        // Approximate lead score calculation for each message
        totalScore += this.calculateLeadScore(
          message.content,
          {} as ConversationSession,
          extractedData,
        );
      }

      return {
        totalMessages: userMessages.length,
        averageLeadScore:
          userMessages.length > 0 ? totalScore / userMessages.length : 0,
        stagesReached: stages,
        keyInsights: [...new Set(insights)], // remove duplicates
      };
    } catch (error) {
      this.logger.error('Error analyzing conversation:', error);
      return {
        totalMessages: 0,
        averageLeadScore: 0,
        stagesReached: [],
        keyInsights: [],
      };
    }
  }
}
