import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { getLanguagePack } from '../localization/language-registry';
import { getOwnerConfig } from '../config/owner.config';

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
    const languagePack = getLanguagePack(language);
    const languageReminder =
      languagePack.aiInstructions.responseLanguageReminder;

    // Add conversation history for context
    let conversationHistoryText = '';
    if (
      conversationContext.conversationHistory &&
      conversationContext.conversationHistory.length > 0
    ) {
      conversationHistoryText = '\n\nCONVERSATION HISTORY:\n';
      conversationContext.conversationHistory.forEach((msg) => {
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
    const languagePack = getLanguagePack(language);
    const languageInstruction = languagePack.aiInstructions.languageInstruction;
    const owner = getOwnerConfig();

    const basePrompt = `${languageInstruction}

🔥 STAGE OVERRIDE ALERT 🔥
CURRENT STAGE: ${context.conversationStage}
You MUST follow ONLY the instructions for this stage. Ignore everything else.

You are an AI sales chatbot representing ${owner.name}, a ${owner.title} specializing in AI chatbot development for businesses.

ABOUT ${owner.name.toUpperCase()}:
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
    const languagePack = getLanguagePack(language);
    return (
      languagePack.stageInstructions[
        stage as keyof typeof languagePack.stageInstructions
      ] || languagePack.stageInstructions.name_collection
    );
  }
}
