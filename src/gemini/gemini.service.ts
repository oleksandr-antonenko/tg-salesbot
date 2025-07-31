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
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
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
    const fullPrompt = `${systemPrompt}\n\nUser message: "${userMessage}"\n\nGenerate an appropriate sales response:`;

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
    const basePrompt = `You are an AI sales chatbot representing Alex Antonenko, a professional backend developer and Tech Lead specializing in AI chatbot development for businesses.

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

CONVERSATION STAGE: ${context.conversationStage}
CUSTOMER DATA: ${JSON.stringify(context.userData)}
LANGUAGE: ${language}

INSTRUCTIONS:
- Respond ONLY in ${language === 'ru' ? 'Russian' : 'English'}
- Ask qualifying questions to understand business needs
- Highlight pain points and lost opportunities without chatbots  
- Present solutions that match their specific situation
- Create urgency and guide toward PoC order
- Be professional but engaging
- Keep responses concise (2-3 sentences max)`;

    return basePrompt;
  }
}
