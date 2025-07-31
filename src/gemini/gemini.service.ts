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
    },
    language: string,
  ): Promise<string> {
    const systemPrompt = this.buildSalesPrompt(conversationContext, language);
    const languageReminder = language === 'ru' 
      ? 'ОБЯЗАТЕЛЬНО ОТВЕЧАЙ НА РУССКОМ ЯЗЫКЕ!' 
      : 'RESPOND IN ENGLISH ONLY!';
    
    const fullPrompt = `${systemPrompt}\n\n${languageReminder}\n\nUser message: "${userMessage}"\n\n${languageReminder}\n\nGenerate an appropriate sales response:`;

    return this.generateResponse(fullPrompt);
  }

  private buildSalesPrompt(
    context: {
      conversationStage: string;
      userData: any;
      previousStage?: string;
    },
    language: string,
  ): string {
    const languageInstruction = language === 'ru' 
      ? 'КРИТИЧЕСКИ ВАЖНО: ОТВЕЧАЙ ТОЛЬКО НА РУССКОМ ЯЗЫКЕ! НИКАКОГО АНГЛИЙСКОГО!' 
      : 'CRITICAL: RESPOND ONLY IN ENGLISH! NO OTHER LANGUAGES!';
    
    const basePrompt = `${languageInstruction}

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

CRITICAL: Stay STRICTLY within the current conversation stage. Do NOT jump ahead to other stages.

INSTRUCTIONS:
- Follow ONLY the stage-specific instructions above
- Be professional but engaging
- Keep main response concise (2-3 sentences max)
- ALWAYS end with sales technique explanation in parentheses`;

    return basePrompt;
  }

  private getStageInstructions(stage: string, language: string): string {
    const instructions = {
      en: {
        name_collection: "Ask for their name warmly. Do NOT ask about business yet. Focus only on getting their name and building initial rapport.",
        trust_building: "Use their name, show genuine interest in them as a person. Build trust and comfort. Do NOT ask business questions yet.",
        permission_request: "Politely ask permission to ask a few questions about their business. Be respectful and wait for their consent.",
        situation_discovery: "Now you can ask about their business type, size, current processes. Use SPIN methodology - understand their SITUATION.",
        problem_identification: "Focus on finding their PROBLEMS and pain points. What challenges do they face?",
        implication_development: "Explore IMPLICATIONS of their problems. What happens if they don't solve these issues?",
        need_payoff: "Present the NEED-PAYOFF. How would solving their problems benefit them?",
        proposal: "Present your AI chatbot solution. Use AIDA - get attention, build interest, create desire.",
        closing: "Create urgency and guide toward action. Limited time offers, immediate benefits."
      },
      ru: {
        name_collection: "Спросите имя тепло и дружелюбно. НЕ спрашивайте о бизнесе пока. Сосредоточьтесь только на получении имени и установлении контакта.",
        trust_building: "Используйте их имя, проявите искренний интерес к ним как к личности. Создайте доверие и комфорт. НЕ задавайте вопросы о бизнесе пока.",
        permission_request: "Вежливо попросите разрешение задать несколько вопросов о их бизнесе. Будьте уважительны и дождитесь их согласия.",
        situation_discovery: "Теперь можете спрашивать о типе бизнеса, размере, текущих процессах. Используйте SPIN - поймите их СИТУАЦИЮ.",
        problem_identification: "Сосредоточьтесь на поиске их ПРОБЛЕМ и болевых точек. С какими вызовами они сталкиваются?",
        implication_development: "Изучите ПОСЛЕДСТВИЯ их проблем. Что случится, если они не решат эти вопросы?",
        need_payoff: "Представьте ВЫГОДУ. Как решение их проблем принесет им пользу?",
        proposal: "Представьте ваше решение ИИ-чатбота. Используйте AIDA - привлеките внимание, вызовите интерес, создайте желание.",
        closing: "Создайте срочность и направьте к действию. Ограниченные предложения, немедленные выгоды."
      }
    };

    return instructions[language]?.[stage] || instructions.en?.[stage] || "Follow general sales best practices for this stage.";
  }
}
