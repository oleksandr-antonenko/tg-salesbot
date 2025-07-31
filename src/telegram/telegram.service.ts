import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context } from 'telegraf';
import { GeminiService } from '../gemini/gemini.service';
import { SalesService } from '../sales/sales.service';

interface BotContext extends Context {
  session?: {
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
  };
}

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf<BotContext>;

  constructor(
    private readonly configService: ConfigService,
    private readonly geminiService: GeminiService,
    private readonly salesService: SalesService,
  ) {}

  async onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.error('TELEGRAM_BOT_TOKEN is required');
      return;
    }

    this.bot = new Telegraf<BotContext>(token);
    this.setupMiddleware();
    this.setupHandlers();

    try {
      await this.bot.launch();
      this.logger.log('Telegram bot started successfully');
    } catch (error) {
      this.logger.error('Failed to start Telegram bot:', error);
    }
  }

  private setupMiddleware() {
    this.bot.use(async (ctx, next) => {
      const userId = ctx.from?.id.toString() || 'unknown';
      const userName = ctx.from?.username || ctx.from?.first_name;

      if (!ctx.session) {
        ctx.session = {
          userId,
          userName,
          language: ctx.from?.language_code || 'en',
          conversationStage: 'greeting',
          userData: {},
        };
      }

      await next();
    });
  }

  private setupHandlers() {
    this.bot.start(async (ctx) => {
      if (!ctx.session) return;
      ctx.session.conversationStage = 'greeting';
      const welcomeMessage = await this.salesService.generateWelcomeMessage(
        ctx.session.language,
      );
      await ctx.reply(welcomeMessage);
    });

    this.bot.on('text', async (ctx) => {
      try {
        if (!ctx.session) return;

        const userMessage = ctx.message.text;
        const language = await this.salesService.detectLanguage(userMessage);
        ctx.session.language = language;

        const response = await this.salesService.processMessage(
          userMessage,
          ctx.session,
        );

        await ctx.reply(response.message);

        if (response.updatedSession) {
          Object.assign(ctx.session, response.updatedSession);
        }
      } catch (error) {
        this.logger.error('Error processing message:', error);
        const errorMessage =
          ctx.session?.language === 'ru'
            ? 'Извините, произошла ошибка. Попробуйте еще раз.'
            : 'Sorry, an error occurred. Please try again.';
        await ctx.reply(errorMessage);
      }
    });

    this.bot.catch((err) => {
      this.logger.error('Bot error:', err);
    });
  }

  async sendMessage(chatId: string, message: string): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(chatId, message);
    } catch (error) {
      this.logger.error('Error sending message:', error);
    }
  }
}
