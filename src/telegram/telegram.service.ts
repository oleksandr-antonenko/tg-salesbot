import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context } from 'telegraf';
import * as session from 'telegraf-session-local';
import { GeminiService } from '../gemini/gemini.service';
import { SalesService } from '../sales/sales.service';
import { ConversationService } from '../database/conversation.service';
import {
  getLanguagePack,
  getAvailableLanguages,
  generateWelcomeText,
} from '../localization/language-registry';

interface BotContext extends Context {
  session?: {
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
      // First try to stop previous webhook/polling
      await this.bot.telegram.deleteWebhook();

      await this.bot.launch();
      this.logger.log('Telegram bot started successfully');

      // Graceful shutdown
      process.once('SIGINT', () => this.bot.stop('SIGINT'));
      process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    } catch (error) {
      if (
        (error as { response?: { error_code?: number } })?.response
          ?.error_code === 409
      ) {
        this.logger.error(
          'Bot conflict detected. Another instance might be running. Waiting and retrying...',
        );
        // Wait 5 seconds and try again
        setTimeout(() => {
          void (async () => {
            try {
              await this.bot.launch();
              this.logger.log('Telegram bot started successfully after retry');
            } catch (retryError) {
              this.logger.error('Failed to start bot after retry:', retryError);
            }
          })();
        }, 5000);
      } else {
        this.logger.error('Failed to start Telegram bot:', error);
      }
    }
  }

  private setupMiddleware() {
    // Use persistent local session storage
    this.bot.use(
      new session({
        database: 'sessions.json',
        property: 'session',
        storage: session.storageFileAsync,
        getSessionKey: (ctx): string => {
          return ctx.from && ctx.chat
            ? `${ctx.from.id}:${ctx.chat.id}`
            : 'unknown';
        },
        format: {
          serialize: (obj) => JSON.stringify(obj, null, 2),
          deserialize: (str) => JSON.parse(str) as unknown,
        },
      }),
    );

    this.bot.use(async (ctx, next) => {
      try {
        const telegramId = ctx.from?.id.toString() || 'unknown';
        const userName = ctx.from?.username || ctx.from?.first_name;
        const firstName = ctx.from?.first_name;
        const lastName = ctx.from?.last_name;

        if (!ctx.session || !ctx.session.dbUserId) {
          // Find or create user in database
          const user = await this.conversationService.findOrCreateUser(
            telegramId,
            {
              username: userName,
              firstName,
              lastName,
              language: ctx.from?.language_code || 'en',
            },
          );

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
        // ALWAYS create new session on /start
        const telegramId = ctx.from?.id.toString() || 'unknown';
        const userName = ctx.from?.username || ctx.from?.first_name;
        const firstName = ctx.from?.first_name;
        const lastName = ctx.from?.last_name;

        // Find or create user in database
        const user = await this.conversationService.findOrCreateUser(
          telegramId,
          {
            username: userName,
            firstName,
            lastName,
            language: ctx.from?.language_code || 'en',
          },
        );

        // Completely clear and recreate session
        ctx.session = {
          userId: telegramId,
          userName,
          language: 'en', // Always start with language selection
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

        // Create new conversation in database
        const conversation = await this.conversationService.startConversation(
          user.id,
        );
        ctx.session.conversationId = conversation.id;

        // Clear all user data in database
        await this.conversationService.clearUserData(user.id);

        // Generate welcome text for all available languages
        const welcomeText = generateWelcomeText();

        // Generate dynamic language buttons
        const availableLanguages = getAvailableLanguages();
        const languageButtons = availableLanguages.map((lang) => ({
          text: `${lang.flagEmoji} ${lang.languageName}`,
          callback_data: `lang_${lang.languageCode}`,
        }));

        // Arrange buttons in rows (max 2 per row for better mobile display)
        const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];
        for (let i = 0; i < languageButtons.length; i += 2) {
          keyboard.push(languageButtons.slice(i, i + 2));
        }

        await ctx.reply(welcomeText, {
          reply_markup: {
            inline_keyboard: keyboard,
          },
        });

        // Log start of new session
        await this.conversationService.logMessage(
          conversation.id,
          'bot',
          welcomeText,
          'language_selection',
        );

        this.logger.log(`New session started for user: ${telegramId}`);
      } catch (error) {
        this.logger.error('Error starting new session:', error);
        const languagePack = getLanguagePack('en');
        await ctx.reply(languagePack.sessionError);
      }
    });

    this.bot.action(/^lang_(.+)$/, async (ctx) => {
      if (!ctx.session) return;

      const selectedLanguage = ctx.match[1];
      ctx.session.language = selectedLanguage;
      ctx.session.conversationStage = 'name_collection';

      // Update language and stage in database
      if (ctx.session.dbUserId) {
        await this.conversationService.updateUserData(ctx.session.dbUserId, {
          language: selectedLanguage,
          conversationStage: 'name_collection',
        });
      }

      await ctx.answerCbQuery();
      const languagePack = getLanguagePack(selectedLanguage);
      const confirmText = languagePack.languageSelected;
      await ctx.editMessageText(confirmText);

      const welcomeMessage =
        await this.salesService.generateWelcomeMessage(selectedLanguage);
      await ctx.reply(welcomeMessage);

      // Log language selection and welcome message
      if (ctx.session.conversationId) {
        await this.conversationService.logMessage(
          ctx.session.conversationId,
          'user',
          `Selected language: ${selectedLanguage}`,
          'language_selection',
        );

        await this.conversationService.logMessage(
          ctx.session.conversationId,
          'bot',
          welcomeMessage,
          'name_collection',
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
        this.logger.log(
          `Processing message: "${userMessage}" in language: "${ctx.session.language}"`,
        );

        // Log user message
        await this.conversationService.logMessage(
          ctx.session.conversationId,
          'user',
          userMessage,
          ctx.session.conversationStage,
        );

        // Get conversation history for context (last 10 messages)
        let conversationHistory: Array<{
          role: 'user' | 'bot';
          message: string;
        }> = [];
        if (ctx.session.dbUserId) {
          const conversation =
            await this.conversationService.getCurrentConversation(
              ctx.session.dbUserId,
            );
          conversationHistory =
            conversation?.messages
              ?.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
              ?.slice(-10) // Last 10 messages
              ?.map((msg) => ({
                role: msg.messageType as 'user' | 'bot',
                message: msg.content,
              })) || [];
        }

        const response = await this.salesService.processMessage(
          userMessage,
          ctx.session,
          conversationHistory,
        );

        await ctx.reply(response.message);

        // Log bot response with lead score
        await this.conversationService.logMessage(
          ctx.session.conversationId,
          'bot',
          response.message,
          response.updatedSession?.conversationStage ||
            ctx.session.conversationStage,
          'gemini-2.0-flash',
          {
            userData: ctx.session.userData,
            leadScore: response.leadScore,
            extractedData: response.extractedData,
          },
        );

        if (response.updatedSession) {
          Object.assign(ctx.session, response.updatedSession);

          // Update user data in database
          if (ctx.session.dbUserId) {
            await this.conversationService.updateUserData(
              ctx.session.dbUserId,
              {
                businessType: ctx.session.userData.businessType,
                currentChallenges: ctx.session.userData.currentChallenges,
                budget: ctx.session.userData.budget,
                timeline: ctx.session.userData.timeline,
                contactInfo: ctx.session.userData.contactInfo,
                conversationStage: ctx.session.conversationStage,
              },
            );
          }

          // Update conversation stage
          await this.conversationService.updateConversationStage(
            ctx.session.conversationId,
            ctx.session.conversationStage,
          );

          // If reached conversation_completed stage - mark as completed lead
          if (ctx.session.conversationStage === 'conversation_completed') {
            await this.conversationService.completeConversation(
              ctx.session.conversationId,
              true, // leadGenerated
              10, // maximum score for completed deal
            );

            // Send lead notification to Alex
            await this.sendLeadNotification(ctx.session, conversationHistory);

            this.logger.log(
              `CONVERSATION COMPLETED! Contact info collected. User: ${ctx.session.userId}`,
            );
          }
          // If reached contact_collection stage - mark as quality lead
          else if (ctx.session.conversationStage === 'contact_collection') {
            await this.conversationService.completeConversation(
              ctx.session.conversationId,
              true, // leadGenerated
              response.leadScore || 9, // high score for agreement
            );

            this.logger.log(
              `DEAL CLOSED! Lead ready for handoff. User: ${ctx.session.userId}, Score: ${response.leadScore || 9}`,
            );
          }
          // If reached closing stage and lead score is high - mark as lead
          else if (
            ctx.session.conversationStage === 'closing' &&
            response.leadScore &&
            response.leadScore >= 7
          ) {
            await this.conversationService.completeConversation(
              ctx.session.conversationId,
              true, // leadGenerated
              response.leadScore,
            );

            this.logger.log(
              `High-quality lead generated! Score: ${response.leadScore}, User: ${ctx.session.userId}`,
            );
          }
        }
      } catch (error) {
        this.logger.error('Error processing message:', error);
        const languagePack = getLanguagePack(ctx.session?.language || 'en');
        const errorMessage = languagePack.errorMessage;
        await ctx.reply(errorMessage);

        // Log error
        if (ctx.session?.conversationId) {
          await this.conversationService.logMessage(
            ctx.session.conversationId,
            'bot',
            errorMessage,
            ctx.session.conversationStage,
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

  private async sendLeadNotification(
    session: {
      userId: string;
      userName?: string;
      userProvidedName?: string;
      conversationId?: number;
      userData?: {
        businessType?: string;
      };
      extractedContacts?: {
        phone?: string;
        email?: string;
        telegram?: string;
      };
    },
    conversationHistory: Array<{
      role: 'user' | 'bot';
      message: string;
    }>,
  ): Promise<void> {
    try {
      // Get fresh conversation history from database to ensure we have all messages
      let fullConversationHistory = conversationHistory;
      if (session.conversationId) {
        const conversation = await this.conversationService.getConversationById(
          session.conversationId,
        );
        if (conversation?.messages) {
          fullConversationHistory = conversation.messages
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            .map((msg) => ({
              role: msg.messageType as 'user' | 'bot',
              message: msg.content,
            }));
          this.logger.log(
            `Got ${fullConversationHistory.length} messages from DB for lead notification`,
          );
        }
      }

      // Extract information from session and conversation history
      const telegramUsername = session.userName || 'Unknown';
      const providedName = session.userProvidedName;
      const businessType =
        session.userData?.businessType ||
        this.extractBusinessFromHistory(fullConversationHistory);
      const contactInfo =
        this.formatExtractedContacts(session.extractedContacts) ||
        this.extractContactFromHistory(fullConversationHistory);
      const summary = await this.generateShortSummary(
        fullConversationHistory,
        session.conversationId,
      );

      // Format names
      let nameSection = '';
      if (providedName && providedName !== telegramUsername) {
        nameSection = `${providedName} (@${telegramUsername})`;
      } else {
        nameSection = telegramUsername;
      }

      // Use Russian for lead notifications (Alex is Russian-speaking)
      const languagePack = getLanguagePack('ru');
      const leadMessage = `${languagePack.leadNotification.newLead}

1. ${languagePack.leadNotification.nameAndContact}
   ${nameSection}
   ${contactInfo}

2. ${languagePack.leadNotification.businessSector}
   ${businessType}

3. ${languagePack.leadNotification.summary}
   ${summary}

${languagePack.leadNotification.leadScore} 10/10 (${languagePack.leadNotification.dealClosed})`;

      // Send to Alex - use his chat ID from configuration
      const alexChatId = this.configService.get<string>(
        'OWNER_CHAT_ID',
      ) as string; // Your chat ID
      await this.bot.telegram.sendMessage(alexChatId, leadMessage);

      this.logger.log(
        `Lead notification sent to Alex for user: ${session.userId}`,
      );
    } catch (error) {
      this.logger.error('Error sending lead notification:', error);
    }
  }

  private extractBusinessFromHistory(
    history: Array<{ role: 'user' | 'bot'; message: string }>,
  ): string {
    // Look for user's response to business question
    for (let i = 0; i < history.length - 1; i++) {
      const botMessage = history[i];
      const userMessage = history[i + 1];

      if (
        botMessage.role === 'bot' &&
        (botMessage.message.includes('бизнесом занимаетесь') ||
          botMessage.message.includes('business are you in')) &&
        userMessage.role === 'user'
      ) {
        return userMessage.message;
      }
    }
    const languagePack = getLanguagePack('ru'); // Alex gets notifications in Russian
    return languagePack.leadNotification.notSpecified;
  }

  private formatExtractedContacts(contacts?: {
    phone?: string;
    email?: string;
    telegram?: string;
  }): string | null {
    if (!contacts) return null;

    const contactList: string[] = [];
    if (contacts.phone) contactList.push(`📞 ${contacts.phone}`);
    if (contacts.email) contactList.push(`📧 ${contacts.email}`);
    if (contacts.telegram) contactList.push(`💬 ${contacts.telegram}`);

    return contactList.length > 0 ? contactList.join('\n   ') : null;
  }

  private extractContactFromHistory(
    history: Array<{ role: 'user' | 'bot'; message: string }>,
  ): string {
    // Look for all user responses with contact information
    const contacts: string[] = [];

    for (let i = 0; i < history.length; i++) {
      const message = history[i];
      if (message.role === 'user') {
        // More flexible regular expressions
        const phoneMatch = message.message.match(
          /(\+?\d{1,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}|\+?\d{10,15})/,
        );
        const emailMatch = message.message.match(/[\w.-]+@[\w.-]+\.\w+/);
        const telegramMatch = message.message.match(/@\w+/);

        if (phoneMatch) {
          contacts.push(`📞 ${phoneMatch[0]}`);
        }
        if (emailMatch) {
          contacts.push(`📧 ${emailMatch[0]}`);
        }
        if (telegramMatch) {
          contacts.push(`💬 ${telegramMatch[0]}`);
        }
      }
    }

    const languagePack = getLanguagePack('ru'); // Alex gets notifications in Russian
    return contacts.length > 0
      ? contacts.join('\n   ')
      : languagePack.leadNotification.notSpecified;
  }

  private async generateShortSummary(
    history: Array<{ role: 'user' | 'bot'; message: string }>,
    conversationId?: number,
  ): Promise<string> {
    try {
      // If history is empty or insufficient, try to get from database
      let conversationHistory = history;
      if ((!history || history.length < 3) && conversationId) {
        this.logger.log(
          `Getting full conversation history from DB for conversation ${conversationId}`,
        );
        const conversation =
          await this.conversationService.getConversationById(conversationId);
        if (conversation?.messages) {
          conversationHistory = conversation.messages
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            .map((msg) => ({
              role: msg.messageType as 'user' | 'bot',
              message: msg.content,
            }));
        }
      }

      this.logger.log(
        `Generating summary with ${conversationHistory.length} messages`,
      );

      // Create brief conversation history for AI
      const conversationText = conversationHistory
        .map((msg) => {
          const languagePack = getLanguagePack('ru'); // Summary in Russian for Alex
          const roleLabel =
            msg.role === 'user'
              ? languagePack.leadNotification.client
              : languagePack.leadNotification.bot;
          return `${roleLabel}: ${msg.message}`;
        })
        .join('\n');

      if (!conversationText.trim()) {
        this.logger.warn('No conversation text available for summary');
        const languagePack = getLanguagePack('ru');
        return languagePack.leadNotification.interestedFallback;
      }

      const languagePack = getLanguagePack('ru'); // Summary in Russian for Alex
      const summaryPrompt = `
        ${languagePack.summaryPrompt.instruction}
        
        Разговор:
        ${conversationText}
        
        ${languagePack.summaryPrompt.focusOn}
        ${languagePack.summaryPrompt.mainProblem}
        ${languagePack.summaryPrompt.businessSector}
        ${languagePack.summaryPrompt.interestLevel}
        
        ${languagePack.summaryPrompt.format}
        ${languagePack.summaryPrompt.example}
        
        ${languagePack.summaryPrompt.responseOnly}
      `;

      const summary = await this.geminiService.generateResponse(summaryPrompt);
      return summary.trim().substring(0, 120); // Limit length
    } catch (error) {
      this.logger.error('Failed to generate AI summary:', error);
      const languagePack = getLanguagePack('ru');
      return languagePack.leadNotification.interestedFallback;
    }
  }

  onModuleDestroy() {
    if (this.bot) {
      try {
        this.bot.stop();
        this.logger.log('Telegram bot stopped gracefully');
      } catch (error) {
        this.logger.error('Error stopping Telegram bot:', error);
      }
    }
  }
}
