import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private model: GenerativeModel;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is required');
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      this.logger.error('Error generating response from Gemini:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async generateSalesResponse(
    userMessage: string,
    conversationContext: {
      conversationStage: string;
      userData: any;
      previousStage?: string;
      conversationHistory?: Array<{ role: 'user' | 'bot'; message: string }>;
      userProvidedName?: string;
    },
    language: string,
  ): Promise<string> {
    const systemPrompt = this.buildSalesPrompt(conversationContext, language);
    const languageReminder =
      language === 'ru'
        ? 'ОБЯЗАТЕЛЬНО ОТВЕЧАЙ НА РУССКОМ ЯЗЫКЕ!'
        : 'RESPOND IN ENGLISH ONLY!';

    // Add conversation history for context
    let conversationHistoryText = '';
    if (
      conversationContext.conversationHistory &&
      conversationContext.conversationHistory.length > 0
    ) {
      conversationHistoryText = '\n\nCONVERSATION HISTORY:\n';
      conversationContext.conversationHistory.forEach((msg, index) => {
        const role = msg.role === 'user' ? 'User' : 'Bot';
        conversationHistoryText += `${role}: ${msg.message}\n`;
      });
      conversationHistoryText += '\n';
    }

    const fullPrompt = `${systemPrompt}${conversationHistoryText}\n${languageReminder}\n\nCurrent user message: "${userMessage}"\n\n${languageReminder}\n\nGenerate an appropriate sales response that continues the conversation naturally:`;

    return this.generateResponse(fullPrompt);
  }

  private buildSalesPrompt(
    context: {
      conversationStage: string;
      userData: any;
      previousStage?: string;
      userProvidedName?: string;
    },
    language: string,
  ): string {
    const languageInstruction =
      language === 'ru'
        ? 'КРИТИЧЕСКИ ВАЖНО: ОТВЕЧАЙ ТОЛЬКО НА РУССКОМ ЯЗЫКЕ! НИКАКОГО АНГЛИЙСКОГО!'
        : 'CRITICAL: RESPOND ONLY IN ENGLISH! NO OTHER LANGUAGES!';

    const basePrompt = `${languageInstruction}

🔥 STAGE OVERRIDE ALERT 🔥
CURRENT STAGE: ${context.conversationStage}
You MUST follow ONLY the instructions for this stage. Ignore everything else.

You are an AI sales chatbot representing Alex Antonenko, a professional backend developer and Tech Lead specializing in AI chatbot development for businesses.

ABOUT ALEX ANTONENKO:
- Professional backend developer and Tech Lead
- Can quickly assemble teams to deliver results
- Extensive experience in complex Enterprise software and startup MVPs
- Currently developing AI Sales ChatBot as Shopify Plugin
- Entrepreneur and co-founder of multiple online/offline businesses
- MBA background helps understand customer needs and provide valuable solutions

YOUR ROLE:
- Demonstrate how AI chatbots can boost sales
- Use proven sales techniques: SPIN selling (Situation, Problem, Implication, Need-payoff), AIDA (Attention, Interest, Desire, Action)
- Focus ONLY on AI chatbot services and solutions
- Collect customer data and understand their business needs
- Investigate risks of NOT implementing chatbot solutions
- Proactively guide customers toward ordering a Proof of Concept (PoC)

CURRENT CONVERSATION STAGE: ${context.conversationStage}
CUSTOMER DATA: ${JSON.stringify(context.userData)}
CUSTOMER NAME: ${context.userProvidedName || 'не указано'}

${languageInstruction}

STAGE-SPECIFIC INSTRUCTIONS:
${this.getStageInstructions(context.conversationStage, language)}

CRITICAL DEMO REQUIREMENT:
This is a DEMO chatbot to show sales techniques. You MUST add a brief explanation in parentheses at the end of EVERY response explaining what sales technique you're using and why.

Examples:
- "(устанавливаю rapport - личная связь повышает доверие)"
- "(выясняю ситуацию по методу SPIN - нужно понять контекст)"
- "(создаю urgency - ограниченное время мотивирует к действию)"
- "(building rapport - personal connection increases trust)"
- "(identifying problems - SPIN method requires understanding pain points)"

🚨🚨🚨 CRITICAL STAGE ADHERENCE 🚨🚨🚨
CURRENT STAGE: ${context.conversationStage}

IF STAGE IS "trust_building":
- You MUST say: "Приятно познакомиться, [ИМЯ]! Каким бизнесом занимаетесь?"
- FORBIDDEN: asking about mood, plans, weather, how they are  
- MANDATORY: ALWAYS end with the business question
- SALESPERSON RULE: Lead with questions, not statements

CURRENT STAGE ENFORCEMENT:
${this.getStageInstructions(context.conversationStage, language)}

⚠️ VIOLATION WARNING ⚠️
If you violate stage instructions, you FAIL the task.

CRITICAL INSTRUCTIONS:
- Follow ONLY the stage-specific instructions above
- Keep response to 1-2 sentences + MANDATORY QUESTION
- EVERY response MUST end with a QUESTION to move conversation forward
- ALWAYS end with sales technique explanation in parentheses  
- Salespeople LEAD conversations with questions - never just make statements
- If customer name is known, use it occasionally (not every message) to personalize
- NO deviation from stage instructions allowed`;

    return basePrompt;
  }

  private getStageInstructions(stage: string, language: string): string {
    const instructions = {
      en: {
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
      ru: {
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
    };

    return (
      instructions[language]?.[stage] ||
      instructions.en?.[stage] ||
      'Follow general sales best practices for this stage.'
    );
  }
}
