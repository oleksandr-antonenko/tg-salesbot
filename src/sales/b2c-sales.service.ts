import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';
import { ConversationService } from '../database/conversation.service';
import { ProductService } from '../product/product.service';
import { AiService } from '../ai/ai.service';
import { getLanguagePack } from '../localization/language-registry';
import { getB2CLanguagePack } from '../localization/b2c-language-packs';
import * as langdetect from 'langdetect';

interface B2CConversationSession {
  userId: string;
  userName?: string;
  userProvidedName?: string;
  language: string;
  conversationStage: string;
  conversationId?: number;
  dbUserId?: number;
  userData: {
    preferences?: string;
    budget?: string;
    urgency?: 'low' | 'medium' | 'high';
    previousPurchases?: string[];
    interests?: string[];
    painPoints?: string[];
    lifestyle?: string;
    demographics?: {
      ageRange?: string;
      location?: string;
      occupation?: string;
    };
  };
  userTags: string[];
  recommendedProducts?: any[];
  currentProductFocus?: any;
  purchaseIntent?: 'browsing' | 'considering' | 'ready_to_buy';
}

interface B2CProcessMessageResponse {
  message: string;
  updatedSession?: Partial<B2CConversationSession>;
  engagementScore?: number;
  recommendedProducts?: any[];
  extractedData?: {
    preferences?: string;
    budget?: string;
    urgency?: 'low' | 'medium' | 'high';
    interests?: string[];
    painPoints?: string[];
    purchaseIntent?: 'browsing' | 'considering' | 'ready_to_buy';
  };
  nextAction?: 'show_products' | 'collect_more_info' | 'close_sale' | 'follow_up';
}

@Injectable()
export class B2CSalesService {
  private readonly logger = new Logger(B2CSalesService.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly conversationService: ConversationService,
    private readonly productService: ProductService,
    private readonly aiService: AiService,
  ) {}

  detectLanguage(text: string): Promise<string> {
    try {
      const detected = (langdetect as any).detect(text) as Array<{
        lang: string;
        prob: number;
      }>;
      const detectedLang = detected[0]?.lang || 'en';

      if (detectedLang === 'uk' || detectedLang === 'ukrainian') {
        return Promise.resolve('uk');
      } else if (detectedLang === 'ru' || detectedLang === 'russian') {
        return Promise.resolve('ru');
      } else if (detectedLang === 'de' || detectedLang === 'german') {
        return Promise.resolve('de');
      } else {
        return Promise.resolve('en');
      }
    } catch {
      this.logger.warn('Language detection failed, defaulting to English');
      return Promise.resolve('en');
    }
  }

  generateWelcomeMessage(language: string): Promise<string> {
    const b2cLanguagePack = getB2CLanguagePack(language);
    return Promise.resolve(b2cLanguagePack.b2cWelcomeMessage);
  }

  async processMessage(
    userMessage: string,
    session: B2CConversationSession,
    conversationHistory?: Array<{ role: 'user' | 'bot'; message: string }>,
    shopContext?: any,
  ): Promise<B2CProcessMessageResponse> {
    try {
      const language = session.language;
      this.logger.log(
        `Processing B2C message: "${userMessage}" | Stage: "${session.conversationStage}" | Language: "${language}"`,
      );

      // Analyze message using AI
      const extractedData = await this.analyzeB2CUserMessage(userMessage);
      const engagementScore = this.calculateEngagementScore(
        userMessage,
        session,
        extractedData,
      );

      this.logger.log(
        `B2C AI Analysis: ${JSON.stringify(extractedData)} | Engagement Score: ${engagementScore}`,
      );

      let updatedStage = session.conversationStage;
      const updatedUserData = { ...session.userData };
      let updatedTags = [...session.userTags];

      // Update user data based on AI analysis
      if (extractedData.preferences) {
        updatedUserData.preferences = extractedData.preferences;
        updatedTags.push(`pref:${extractedData.preferences.toLowerCase()}`);
      }
      if (extractedData.budget) {
        updatedUserData.budget = extractedData.budget;
        updatedTags.push(`budget:${extractedData.budget.toLowerCase()}`);
      }
      if (extractedData.urgency) {
        updatedUserData.urgency = extractedData.urgency;
        updatedTags.push(`urgency:${extractedData.urgency}`);
      }
      if (extractedData.interests) {
        updatedUserData.interests = [
          ...(updatedUserData.interests || []),
          ...extractedData.interests,
        ];
        extractedData.interests.forEach(interest => {
          updatedTags.push(`interest:${interest.toLowerCase()}`);
        });
      }
      if (extractedData.painPoints) {
        updatedUserData.painPoints = [
          ...(updatedUserData.painPoints || []),
          ...extractedData.painPoints,
        ];
        extractedData.painPoints.forEach(pain => {
          updatedTags.push(`pain:${pain.toLowerCase()}`);
        });
      }

      // Determine purchase intent and add tags
      if (extractedData.purchaseIntent) {
        updatedTags.push(`intent:${extractedData.purchaseIntent}`);
      }

      // AIDA stage transition logic
      updatedStage = this.determineNextAIDAStage(
        session.conversationStage,
        extractedData,
        engagementScore,
        userMessage,
      );

      // Get product recommendations if in appropriate stage
      let recommendedProducts: any[] = [];
      let currentProductFocus = session.currentProductFocus;

      if (['interest', 'desire', 'action'].includes(updatedStage) && shopContext) {
        recommendedProducts = await this.getProductRecommendations(
          updatedUserData,
          updatedTags,
          shopContext,
        );
        
        if (recommendedProducts.length > 0 && !currentProductFocus) {
          currentProductFocus = recommendedProducts[0]; // Focus on most profitable/relevant
        }
      }

      // Generate AIDA-based response
      const response = await this.generateAIDAResponse(
        userMessage,
        {
          conversationStage: updatedStage,
          userData: updatedUserData,
          previousStage: session.conversationStage,
          conversationHistory,
          userProvidedName: session.userProvidedName,
          recommendedProducts,
          currentProductFocus,
          userTags: updatedTags,
        },
        language,
      );

      // Determine next action
      const nextAction = this.determineNextAction(
        updatedStage,
        engagementScore,
        extractedData.purchaseIntent,
      );

      // Update conversation in database
      if (session.conversationId && engagementScore > 0) {
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
          userTags: updatedTags,
          recommendedProducts,
          currentProductFocus,
          purchaseIntent: extractedData.purchaseIntent,
        },
        engagementScore,
        recommendedProducts,
        extractedData,
        nextAction,
      };
    } catch (error) {
      this.logger.error('Error processing B2C message:', error);
      const b2cLanguagePack = getB2CLanguagePack(session.language);
      const errorMessage = b2cLanguagePack.errorMessage;

      return { message: errorMessage };
    }
  }

  private async analyzeB2CUserMessage(message: string): Promise<{
    preferences?: string;
    budget?: string;
    urgency?: 'low' | 'medium' | 'high';
    interests?: string[];
    painPoints?: string[];
    purchaseIntent?: 'browsing' | 'considering' | 'ready_to_buy';
    hasName?: boolean;
    isPositiveResponse?: boolean;
    emotionalTone?: 'excited' | 'neutral' | 'concerned' | 'frustrated';
  }> {
    try {
      const analysisPrompt = `
        Analyze this B2C customer message for shopping and purchase intent:
        "${message}"
        
        Extract information for B2C sales context. Be conservative but thorough.
        
        Return JSON with extracted data:
        {
          "preferences": "product type/category if mentioned (e.g., 'skincare', 'electronics', 'clothing')",
          "budget": "budget range if mentioned (e.g., 'under $100', 'premium', 'affordable')",
          "urgency": "low/medium/high based on language urgency and timing indicators",
          "interests": ["array", "of", "interests", "mentioned"],
          "painPoints": ["problems", "they", "want", "to", "solve"],
          "purchaseIntent": "browsing/considering/ready_to_buy based on language and questions",
          "hasName": true/false (only if clear name introduction),
          "isPositiveResponse": true/false (for clear positive responses),
          "emotionalTone": "excited/neutral/concerned/frustrated based on language"
        }
        
        Be conservative: When uncertain, return null/false. Focus on explicit mentions.
        
        Respond ONLY with valid JSON, no other text.
      `;

      const response = await this.geminiService.generateResponse(analysisPrompt);
      const cleanResponse = response.replace(/```json|```/g, '').trim();

      const result = JSON.parse(cleanResponse);
      this.logger.log(`B2C AI Analysis result: ${JSON.stringify(result)}`);

      return result;
    } catch (error) {
      this.logger.warn('Failed to analyze B2C user message:', error);
      return {};
    }
  }

  private calculateEngagementScore(
    message: string,
    session: B2CConversationSession,
    extractedData: any,
  ): number {
    let score = 0;

    // Message engagement indicators
    if (message.length > 20) score += 1;
    if (message.length > 50) score += 1;
    if (message.includes('?')) score += 1; // Asking questions shows interest

    // Product interest
    if (extractedData.preferences) score += 2;
    if (extractedData.interests && extractedData.interests.length > 0) score += 2;

    // Purchase intent
    if (extractedData.purchaseIntent === 'ready_to_buy') score += 5;
    if (extractedData.purchaseIntent === 'considering') score += 3;
    if (extractedData.purchaseIntent === 'browsing') score += 1;

    // Budget mention (shows serious consideration)
    if (extractedData.budget) score += 3;

    // Urgency
    if (extractedData.urgency === 'high') score += 3;
    if (extractedData.urgency === 'medium') score += 2;
    if (extractedData.urgency === 'low') score += 1;

    // Emotional engagement
    if (extractedData.emotionalTone === 'excited') score += 2;
    if (extractedData.emotionalTone === 'concerned') score += 1;

    // AIDA stage progression
    const stageScores = {
      greeting: 1,
      attention: 2,
      interest: 4,
      desire: 6,
      action: 8,
      follow_up: 5,
      completed: 10,
    };

    score += stageScores[session.conversationStage] || 0;

    // Positive engagement words
    const positiveWords = [
      'interesting', 'интересно', 'like', 'нравится', 'want', 'хочу',
      'need', 'нужно', 'love', 'обожаю', 'perfect', 'идеально',
      'great', 'отлично', 'amazing', 'потрясающе',
    ];
    const lowerMessage = message.toLowerCase();
    const positiveCount = positiveWords.filter(word =>
      lowerMessage.includes(word),
    ).length;
    score += positiveCount;

    return Math.min(score, 10); // Maximum 10
  }

  private determineNextAIDAStage(
    currentStage: string,
    extractedData: any,
    engagementScore: number,
    userMessage: string,
  ): string {
    this.logger.log(
      `AIDA stage transition: ${currentStage} -> engagement: ${engagementScore} -> data: ${JSON.stringify(extractedData)}`,
    );

    switch (currentStage) {
      case 'greeting':
        return 'attention';

      case 'attention':
        // Move to interest if user shows any engagement or asks questions
        if (userMessage.length > 10 || extractedData.isPositiveResponse || userMessage.includes('?')) {
          return 'interest';
        }
        return 'attention';

      case 'interest':
        // Move to desire if user shows specific preferences or problems
        if (extractedData.preferences || extractedData.painPoints || extractedData.interests) {
          return 'desire';
        }
        if (engagementScore >= 4) {
          return 'desire';
        }
        return 'interest';

      case 'desire':
        // Move to action if user shows purchase intent or budget discussion
        if (extractedData.purchaseIntent === 'ready_to_buy' || extractedData.budget) {
          return 'action';
        }
        if (engagementScore >= 6) {
          return 'action';
        }
        return 'desire';

      case 'action':
        // Check for completion or follow-up needs
        if (extractedData.purchaseIntent === 'ready_to_buy' && engagementScore >= 7) {
          return 'completed';
        }
        if (engagementScore < 4) {
          return 'follow_up';
        }
        return 'action';

      case 'follow_up':
        // Re-engage or complete
        if (engagementScore >= 5) {
          return 'action';
        }
        return 'follow_up';

      case 'completed':
        return 'completed';

      default:
        return 'attention';
    }
  }

  private async getProductRecommendations(
    userData: any,
    userTags: string[],
    shopContext: any,
  ): Promise<any[]> {
    try {
      // Get products from shop
      const products = await this.productService.fetchProducts(shopContext);
      
      if (!products || products.length === 0) {
        return [];
      }

      // Score products based on user data and tags
      const scoredProducts = products.map(product => {
        let score = 0;
        
        // Match user interests with product tags/description
        if (userData.interests) {
          userData.interests.forEach(interest => {
            if (this.productMatchesInterest(product, interest)) {
              score += 3;
            }
          });
        }

        // Match user preferences
        if (userData.preferences && this.productMatchesPreference(product, userData.preferences)) {
          score += 4;
        }

        // Budget compatibility
        if (userData.budget) {
          const budgetScore = this.calculateBudgetScore(product, userData.budget);
          score += budgetScore;
        }

        // Consider profitability (higher priced items get slight boost for profit)
        const price = parseFloat(product.price) || 0;
        if (price > 100) score += 1;
        if (price > 500) score += 1;

        return { ...product, recommendationScore: score };
      });

      // Sort by score and return top 5
      return scoredProducts
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, 5);
    } catch (error) {
      this.logger.error('Error getting product recommendations:', error);
      return [];
    }
  }

  private productMatchesInterest(product: any, interest: string): boolean {
    const searchText = `${product.title} ${product.description} ${product.productType}`.toLowerCase();
    return searchText.includes(interest.toLowerCase());
  }

  private productMatchesPreference(product: any, preference: string): boolean {
    const searchText = `${product.title} ${product.description} ${product.productType}`.toLowerCase();
    return searchText.includes(preference.toLowerCase());
  }

  private calculateBudgetScore(product: any, budget: string): number {
    const price = parseFloat(product.price) || 0;
    const budgetLower = budget.toLowerCase();

    if (budgetLower.includes('premium') || budgetLower.includes('high-end')) {
      return price > 200 ? 2 : 0;
    }
    if (budgetLower.includes('affordable') || budgetLower.includes('budget')) {
      return price < 100 ? 2 : 0;
    }
    if (budgetLower.includes('mid-range') || budgetLower.includes('medium')) {
      return price >= 50 && price <= 200 ? 2 : 0;
    }

    // Extract price ranges from budget string
    const priceMatch = budget.match(/\$?(\d+)/);
    if (priceMatch) {
      const budgetAmount = parseInt(priceMatch[1]);
      if (price <= budgetAmount) return 2;
      if (price <= budgetAmount * 1.2) return 1; // 20% over budget still gets some score
    }

    return 0;
  }

  private async generateAIDAResponse(
    userMessage: string,
    context: {
      conversationStage: string;
      userData: any;
      previousStage?: string;
      conversationHistory?: Array<{ role: 'user' | 'bot'; message: string }>;
      userProvidedName?: string;
      recommendedProducts?: any[];
      currentProductFocus?: any;
      userTags?: string[];
    },
    language: string,
  ): Promise<string> {
    const b2cLanguagePack = getB2CLanguagePack(language);
    const languageReminder = b2cLanguagePack.aiInstructions.responseLanguageReminder;

    // Build conversation history
    let conversationHistoryText = '';
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      conversationHistoryText = '\n\nCONVERSATION HISTORY:\n';
      context.conversationHistory.forEach((msg) => {
        const role = msg.role === 'user' ? 'Customer' : 'Assistant';
        conversationHistoryText += `${role}: ${msg.message}\n`;
      });
      conversationHistoryText += '\n';
    }

    const systemPrompt = this.buildAIDAPrompt(context, language);
    const fullPrompt = `${systemPrompt}${conversationHistoryText}\n${languageReminder}\n\nCustomer message: "${userMessage}"\n\n${languageReminder}\n\nGenerate an AIDA-optimized response:`;

    return this.geminiService.generateResponse(fullPrompt);
  }

  private buildAIDAPrompt(
    context: {
      conversationStage: string;
      userData: any;
      previousStage?: string;
      userProvidedName?: string;
      recommendedProducts?: any[];
      currentProductFocus?: any;
      userTags?: string[];
    },
    language: string,
  ): string {
    const b2cLanguagePack = getB2CLanguagePack(language);
    const languageInstruction = b2cLanguagePack.aiInstructions.languageInstruction;

    const basePrompt = `${languageInstruction}

🛍️ B2C SALES CHATBOT - AIDA METHODOLOGY 🛍️
CURRENT AIDA STAGE: ${context.conversationStage}

You are a B2C sales assistant for a Shopify store. Your goal is to guide customers through the AIDA journey:
- ATTENTION: Grab their attention with compelling hooks
- INTEREST: Build interest by understanding their needs  
- DESIRE: Create desire by showing how products solve their problems
- ACTION: Drive them to purchase

CUSTOMER PROFILE:
- Name: ${context.userProvidedName || 'Customer'}
- Data: ${JSON.stringify(context.userData)}
- Tags: ${context.userTags?.join(', ') || 'none'}
- Current Stage: ${context.conversationStage}

${context.recommendedProducts && context.recommendedProducts.length > 0 ? `
RECOMMENDED PRODUCTS:
${context.recommendedProducts.slice(0, 3).map(p => `- ${p.title}: $${p.price} (Score: ${p.recommendationScore})`).join('\n')}

FOCUS PRODUCT: ${context.currentProductFocus ? `${context.currentProductFocus.title} - $${context.currentProductFocus.price}` : 'None'}
` : ''}

AIDA STAGE INSTRUCTIONS:
${b2cLanguagePack.b2cStageInstructions[context.conversationStage] || b2cLanguagePack.b2cStageInstructions.attention}

B2C SALES RULES:
- Keep responses conversational and friendly
- Ask about needs, preferences, and problems they want to solve
- Show how products improve their life/solve problems
- Create urgency when appropriate (limited time, stock, etc.)
- Use social proof (reviews, popularity, etc.)
- Address objections proactively
- Guide toward purchase with clear CTAs
- Personalize recommendations based on their profile

${languageInstruction}`;

    return basePrompt;
  }


  private determineNextAction(
    stage: string,
    engagementScore: number,
    purchaseIntent?: string,
  ): 'show_products' | 'collect_more_info' | 'close_sale' | 'follow_up' {
    if (purchaseIntent === 'ready_to_buy' || stage === 'action') {
      return 'close_sale';
    }
    
    if (stage === 'desire' || (stage === 'interest' && engagementScore >= 5)) {
      return 'show_products';
    }
    
    if (engagementScore < 3) {
      return 'follow_up';
    }
    
    return 'collect_more_info';
  }

  async getB2CAnalytics(conversationId: number): Promise<{
    totalMessages: number;
    averageEngagementScore: number;
    aidasStagesReached: string[];
    userTags: string[];
    recommendedProducts: any[];
    purchaseIntent: string;
    keyInsights: string[];
  }> {
    try {
      const conversation = await this.conversationService.getCurrentConversation(conversationId);
      if (!conversation) {
        return {
          totalMessages: 0,
          averageEngagementScore: 0,
          aidasStagesReached: [],
          userTags: [],
          recommendedProducts: [],
          purchaseIntent: 'unknown',
          keyInsights: [],
        };
      }

      const userMessages = conversation.messages.filter(m => m.messageType === 'user');
      const stages = [...new Set(conversation.messages.map(m => m.conversationStage).filter(Boolean))];

      const insights: string[] = [];
      let totalScore = 0;
      const allTags: string[] = [];

      for (const message of userMessages) {
        const extractedData = await this.analyzeB2CUserMessage(message.content);
        
        if (extractedData.preferences) {
          insights.push(`Product preference: ${extractedData.preferences}`);
        }
        if (extractedData.interests) {
          insights.push(`Interests: ${extractedData.interests.join(', ')}`);
        }
        if (extractedData.budget) {
          insights.push(`Budget: ${extractedData.budget}`);
        }
        if (extractedData.painPoints) {
          insights.push(`Pain points: ${extractedData.painPoints.join(', ')}`);
        }

        totalScore += this.calculateEngagementScore(message.content, {} as B2CConversationSession, extractedData);
      }

      return {
        totalMessages: userMessages.length,
        averageEngagementScore: userMessages.length > 0 ? totalScore / userMessages.length : 0,
        aidasStagesReached: stages,
        userTags: [...new Set(allTags)],
        recommendedProducts: [],
        purchaseIntent: 'analyzing',
        keyInsights: [...new Set(insights)],
      };
    } catch (error) {
      this.logger.error('Error analyzing B2C conversation:', error);
      return {
        totalMessages: 0,
        averageEngagementScore: 0,
        aidasStagesReached: [],
        userTags: [],
        recommendedProducts: [],
        purchaseIntent: 'unknown',
        keyInsights: [],
      };
    }
  }
}