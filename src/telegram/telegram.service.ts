import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context } from 'telegraf';
import * as session from 'telegraf-session-local';
import { GeminiService } from '../gemini/gemini.service';
import { SalesService } from '../sales/sales.service';
import { ConversationService } from '../database/conversation.service';

interface BotContext extends Context {
  session?: {
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
  };
}

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf<BotContext>;

  constructor(
    private readonly configService: ConfigService,
    private readonly geminiService: GeminiService,
    private readonly salesService: SalesService,
    private readonly conversationService: ConversationService,
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
      // Сначала пытаемся остановить предыдущие webhook/polling
      await this.bot.telegram.deleteWebhook();
      
      await this.bot.launch();
      this.logger.log('Telegram bot started successfully');
      
      // Graceful shutdown
      process.once('SIGINT', () => this.bot.stop('SIGINT'));
      process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
      
    } catch (error) {
      if (error.response?.error_code === 409) {
        this.logger.error('Bot conflict detected. Another instance might be running. Waiting and retrying...');
        // Ждем 5 секунд и пытаемся снова
        setTimeout(async () => {
          try {
            await this.bot.launch();
            this.logger.log('Telegram bot started successfully after retry');
          } catch (retryError) {
            this.logger.error('Failed to start bot after retry:', retryError);
          }
        }, 5000);
      } else {
        this.logger.error('Failed to start Telegram bot:', error);
      }
    }
  }

  private setupMiddleware() {
    // Use persistent local session storage
    this.bot.use(new session({
      database: 'sessions.json',
      property: 'session',
      storage: session.storageFileAsync,
      getSessionKey: (ctx) => {
        return ctx.from && ctx.chat ? `${ctx.from.id}:${ctx.chat.id}` : 'unknown';
      },
      format: {
        serialize: (obj) => JSON.stringify(obj, null, 2),
        deserialize: (str) => JSON.parse(str),
      },
    }));

    this.bot.use(async (ctx, next) => {
      try {
        const telegramId = ctx.from?.id.toString() || 'unknown';
        const userName = ctx.from?.username || ctx.from?.first_name;
        const firstName = ctx.from?.first_name;
        const lastName = ctx.from?.last_name;

        if (!ctx.session || !ctx.session.dbUserId) {
          // Находим или создаем пользователя в базе данных
          const user = await this.conversationService.findOrCreateUser(telegramId, {
            username: userName,
            firstName,
            lastName,
            language: ctx.from?.language_code || 'en',
          });

          ctx.session = {
            userId: telegramId,
            userName,
            language: user.language,
            conversationStage: user.conversationStage,
            dbUserId: user.id,
            userData: {
              businessType: user.businessType || undefined,
              currentChallenges: user.currentChallenges || undefined,
              budget: user.budget || undefined,
              timeline: user.timeline || undefined,
              contactInfo: user.contactInfo || undefined,
            },
          };
        }

        await next();
      } catch (error) {
        this.logger.error('Error in middleware:', error);
        await next();
      }
    });
  }

  private setupHandlers() {
    this.bot.start(async (ctx) => {
      try {
        // ВСЕГДА создаем новую сессию при /start
        const telegramId = ctx.from?.id.toString() || 'unknown';
        const userName = ctx.from?.username || ctx.from?.first_name;
        const firstName = ctx.from?.first_name;
        const lastName = ctx.from?.last_name;

        // Находим или создаем пользователя в базе данных
        const user = await this.conversationService.findOrCreateUser(telegramId, {
          username: userName,
          firstName,
          lastName,
          language: ctx.from?.language_code || 'en',
        });

        // Полностью очищаем и пересоздаем сессию
        ctx.session = {
          userId: telegramId,
          userName,
          language: 'en', // Всегда начинаем с выбора языка
          conversationStage: 'language_selection',
          dbUserId: user.id,
          userData: {
            businessType: undefined,
            currentChallenges: undefined,
            budget: undefined,
            timeline: undefined,
            contactInfo: undefined,
          },
        };

        // Создаем новый разговор в базе данных
        const conversation = await this.conversationService.startConversation(user.id);
        ctx.session.conversationId = conversation.id;
        
        // Очищаем все данные пользователя в базе данных
        await this.conversationService.clearUserData(user.id);
        
        const welcomeText = 'Welcome! Please choose your preferred language:\nДобро пожаловать! Выберите предпочитаемый язык:';
        
        await ctx.reply(welcomeText, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🇺🇸 English', callback_data: 'lang_en' },
                { text: '🇷🇺 Русский', callback_data: 'lang_ru' }
              ]
            ]
          }
        });

        // Логируем начало новой сессии
        await this.conversationService.logMessage(
          conversation.id,
          'bot',
          welcomeText,
          'language_selection'
        );

        this.logger.log(`New session started for user: ${telegramId}`);
      } catch (error) {
        this.logger.error('Error starting new session:', error);
        await ctx.reply('Sorry, there was an error starting a new session. Please try again.');
      }
    });

    this.bot.action(/^lang_(.+)$/, async (ctx) => {
      if (!ctx.session) return;
      
      const selectedLanguage = ctx.match[1];
      ctx.session.language = selectedLanguage;
      ctx.session.conversationStage = 'name_collection';
      
      // Обновляем язык и стадию в базе данных
      if (ctx.session.dbUserId) {
        await this.conversationService.updateUserData(ctx.session.dbUserId, {
          language: selectedLanguage,
          conversationStage: 'name_collection'
        });
      }
      
      await ctx.answerCbQuery();
      const confirmText = 'Language selected! / Язык выбран!';
      await ctx.editMessageText(confirmText);
      
      const welcomeMessage = await this.salesService.generateWelcomeMessage(selectedLanguage);
      await ctx.reply(welcomeMessage);

      // Логируем выбор языка и приветственное сообщение
      if (ctx.session.conversationId) {
        await this.conversationService.logMessage(
          ctx.session.conversationId,
          'user',
          `Selected language: ${selectedLanguage}`,
          'language_selection'
        );
        
        await this.conversationService.logMessage(
          ctx.session.conversationId,
          'bot',
          welcomeMessage,
          'name_collection'
        );
      }
    });

    this.bot.on('text', async (ctx) => {
      try {
        if (!ctx.session || !ctx.session.conversationId) return;
        
        // Skip processing if still in language selection stage
        if (ctx.session.conversationStage === 'language_selection') {
          return;
        }

        const userMessage = ctx.message.text;
        this.logger.log(`Processing message: "${userMessage}" in language: "${ctx.session.language}"`);
        
        // Логируем сообщение пользователя
        await this.conversationService.logMessage(
          ctx.session.conversationId,
          'user',
          userMessage,
          ctx.session.conversationStage
        );
        
        // Получаем историю разговора для контекста (последние 10 сообщений)
        let conversationHistory: Array<{role: 'user' | 'bot', message: string}> = [];
        if (ctx.session.dbUserId) {
          const conversation = await this.conversationService.getCurrentConversation(ctx.session.dbUserId);
          conversationHistory = conversation?.messages
            ?.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            ?.slice(-10) // Последние 10 сообщений
            ?.map(msg => ({
              role: msg.messageType as 'user' | 'bot',
              message: msg.content
            })) || [];
        }
        
        const response = await this.salesService.processMessage(
          userMessage,
          ctx.session,
          conversationHistory,
        );

        await ctx.reply(response.message);

        // Логируем ответ бота с lead score
        await this.conversationService.logMessage(
          ctx.session.conversationId,
          'bot',
          response.message,
          response.updatedSession?.conversationStage || ctx.session.conversationStage,
          'gemini-2.0-flash',
          { 
            userData: ctx.session.userData,
            leadScore: response.leadScore,
            extractedData: response.extractedData
          }
        );

        if (response.updatedSession) {
          Object.assign(ctx.session, response.updatedSession);
          
          // Обновляем данные пользователя в базе данных
          if (ctx.session.dbUserId) {
            await this.conversationService.updateUserData(ctx.session.dbUserId, {
              businessType: ctx.session.userData.businessType,
              currentChallenges: ctx.session.userData.currentChallenges,
              budget: ctx.session.userData.budget,
              timeline: ctx.session.userData.timeline,
              contactInfo: ctx.session.userData.contactInfo,
              conversationStage: ctx.session.conversationStage,
            });
          }

          // Обновляем стадию разговора
          await this.conversationService.updateConversationStage(
            ctx.session.conversationId,
            ctx.session.conversationStage
          );

          // Если достигли стадии conversation_completed - помечаем как завершенный лид
          if (ctx.session.conversationStage === 'conversation_completed') {
            await this.conversationService.completeConversation(
              ctx.session.conversationId,
              true, // leadGenerated
              10 // максимальный score за завершенную сделку
            );
            
            // Отправляем уведомление Алексу о новом лиде
            await this.sendLeadNotification(ctx.session, conversationHistory);
            
            this.logger.log(`CONVERSATION COMPLETED! Contact info collected. User: ${ctx.session.userId}`);
          }
          // Если достигли стадии contact_collection - помечаем как качественный лид
          else if (ctx.session.conversationStage === 'contact_collection') {
            await this.conversationService.completeConversation(
              ctx.session.conversationId,
              true, // leadGenerated
              response.leadScore || 9 // высокий score за согласие
            );
            
            this.logger.log(`DEAL CLOSED! Lead ready for handoff. User: ${ctx.session.userId}, Score: ${response.leadScore || 9}`);
          }
          // Если достигли стадии closing и lead score высокий - помечаем как лид
          else if (ctx.session.conversationStage === 'closing' && response.leadScore && response.leadScore >= 7) {
            await this.conversationService.completeConversation(
              ctx.session.conversationId,
              true, // leadGenerated
              response.leadScore
            );
            
            this.logger.log(`High-quality lead generated! Score: ${response.leadScore}, User: ${ctx.session.userId}`);
          }
        }
      } catch (error) {
        this.logger.error('Error processing message:', error);
        const errorMessage =
          ctx.session?.language === 'ru'
            ? 'Извините, произошла ошибка. Попробуйте еще раз.'
            : 'Sorry, an error occurred. Please try again.';
        await ctx.reply(errorMessage);

        // Логируем ошибку
        if (ctx.session?.conversationId) {
          await this.conversationService.logMessage(
            ctx.session.conversationId,
            'bot',
            errorMessage,
            ctx.session.conversationStage
          );
        }
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

  private async sendLeadNotification(session: any, conversationHistory: Array<{role: 'user' | 'bot', message: string}>): Promise<void> {
    try {
      // Извлекаем информацию из истории разговора
      const userName = session.userName || 'Неизвестно';
      const businessType = session.userData?.businessType || this.extractBusinessFromHistory(conversationHistory);
      const contactInfo = this.extractContactFromHistory(conversationHistory);
      const summary = this.generateShortSummary(conversationHistory);

      const leadMessage = `🎯 НОВЫЙ ЛИД!

1. **Имя и контакт:**
   ${userName}
   ${contactInfo}

2. **Сфера бизнеса:**
   ${businessType}

3. **Резюме:**
   ${summary}

📊 Lead Score: 10/10 (Сделка закрыта)`;

      // Отправляем Алексу - используем его chat ID из конфигурации
      const alexChatId = this.configService.get<string>('ALEX_CHAT_ID') ; // Ваш chat ID
      await this.bot.telegram.sendMessage(alexChatId, leadMessage);
      
      this.logger.log(`Lead notification sent to Alex for user: ${session.userId}`);
    } catch (error) {
      this.logger.error('Error sending lead notification:', error);
    }
  }

  private extractBusinessFromHistory(history: Array<{role: 'user' | 'bot', message: string}>): string {
    // Ищем ответ пользователя на вопрос о бизнесе
    for (let i = 0; i < history.length - 1; i++) {
      const botMessage = history[i];
      const userMessage = history[i + 1];
      
      if (botMessage.role === 'bot' && 
          (botMessage.message.includes('бизнесом занимаетесь') || 
           botMessage.message.includes('business are you in')) &&
          userMessage.role === 'user') {
        return userMessage.message;
      }
    }
    return 'Не указано';
  }

  private extractContactFromHistory(history: Array<{role: 'user' | 'bot', message: string}>): string {
    // Ищем последний ответ пользователя с контактной информацией
    for (let i = history.length - 1; i >= 0; i--) {
      const message = history[i];
      if (message.role === 'user') {
        // Проверяем на телефон, email или telegram
        const phoneMatch = message.message.match(/\+?\d{10,15}/);
        const emailMatch = message.message.match(/[\w\.-]+@[\w\.-]+\.\w+/);
        const telegramMatch = message.message.match(/@\w+/);
        
        if (phoneMatch || emailMatch || telegramMatch) {
          return message.message;
        }
      }
    }
    return 'Не указано';
  }

  private generateShortSummary(history: Array<{role: 'user' | 'bot', message: string}>): string {
    // Находим основную проблему клиента
    let problems: string[] = [];
    
    for (let i = 0; i < history.length - 1; i++) {
      const botMessage = history[i];
      const userMessage = history[i + 1];
      
      if (botMessage.role === 'bot' && userMessage.role === 'user' &&
          (botMessage.message.includes('проблем') || 
           botMessage.message.includes('вызов') ||
           botMessage.message.includes('challenge') ||
           botMessage.message.includes('problem'))) {
        problems.push(userMessage.message);
      }
    }
    
    if (problems.length > 0) {
      return `Основная проблема: ${problems[0].substring(0, 100)}...`;
    }
    
    return 'Заинтересован в AI чат-боте для бизнеса';
  }

  async onModuleDestroy() {
    if (this.bot) {
      try {
        await this.bot.stop();
        this.logger.log('Telegram bot stopped gracefully');
      } catch (error) {
        this.logger.error('Error stopping Telegram bot:', error);
      }
    }
  }
}
