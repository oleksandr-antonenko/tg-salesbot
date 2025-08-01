# Telegram AI Sales ChatBot

A sophisticated Telegram chatbot built with NestJS that demonstrates AI-powered sales conversations using SPIN and AIDA techniques. Created by Alex Antonenko to showcase AI chatbot capabilities for business sales.

## Features

- 🤖 **AI-Powered Conversations**: Uses Google Gemini AI for intelligent responses
- 🎯 **Sales Techniques**: Implements SPIN selling and AIDA framework
- 🌍 **Multi-Language Support**: Supports English, Russian, Ukrainian, and German with automatic menu generation
- 📊 **Conversation Management**: Tracks user data and conversation stages
- 🚀 **Built with NestJS**: Modern, scalable architecture

## About Alex Antonenko

- Professional backend developer and Tech Lead
- Can quickly assemble teams to deliver results  
- Extensive experience in complex Enterprise software and startup MVPs
- Currently developing AI Sales ChatBot as Shopify Plugin
- Entrepreneur and co-founder of multiple online/offline businesses
- MBA background helps understand customer needs and provide valuable solutions

## Setup

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd tg-salesbot
npm install
```

2. **Environment Configuration:**
Create a `.env` file in the root directory:
```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
GEMINI_API_KEY=your_gemini_api_key_here
OWNER_CHAT_ID=your_chat_id_here
PORT=3000
```

3. **Get Required API Keys:**
   - **Telegram Bot Token**: Create a bot via [@BotFather](https://t.me/botfather) on Telegram
   - **Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - **Owner Chat ID**: Your Telegram chat ID for receiving lead notifications

### How to Get Your Telegram Chat ID (OWNER_CHAT_ID)

To receive lead notifications, you need to get your personal Telegram chat ID:

**Method 1: Using Your Bot**
1. Start your bot and send it any message
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Look for `"chat":{"id":123456789}` in the response
4. Use this number as your `OWNER_CHAT_ID`

**Method 2: Using @userinfobot**
1. Start a chat with [@userinfobot](https://t.me/userinfobot)
2. Send any message
3. The bot will reply with your user ID
4. Use this number as your `OWNER_CHAT_ID`

**Method 3: Using API Call**
```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
```
Replace `<YOUR_BOT_TOKEN>` with your actual bot token and look for your chat ID in the response.

4. **Run the application:**
```bash
# Development mode
npm run start:dev

# Production mode  
npm run start:prod
```

## Sales Conversation Flow

The bot follows a structured sales approach:

1. **Situation Discovery** - Understanding the business type and current setup
2. **Problem Identification** - Identifying pain points and challenges
3. **Implication Development** - Exploring consequences of current problems
4. **Need-Payoff** - Presenting benefits of solving the problems
5. **Proposal** - Offering tailored AI chatbot solution
6. **Closing** - Guiding toward Proof of Concept order

## Architecture

```
src/
├── telegram/          # Telegram bot service and handlers
├── gemini/            # Google Gemini AI integration
├── sales/             # Sales conversation logic and SPIN/AIDA
├── localization/      # Multi-language support and language packs
├── config/            # Owner configuration and settings
├── database/          # Database entities and services
└── app.module.ts      # Main application module
```

## Customization

### Owner Configuration

You can customize the bot owner information by editing `/src/config/owner.config.ts`:

```typescript
export const ownerConfig: OwnerConfig = {
  name: 'Your Full Name',
  shortName: 'Your Name',
  telegramHandle: '@your_telegram_handle',
  title: 'Your Professional Title',
  bio: {
    en: 'Your bio in English...',
    ru: 'Ваша биография на русском...',
    uk: 'Ваша біографія українською...',
  },
};
```

This will automatically update:
- Welcome messages in all languages
- AI assistant personality and responses  
- Contact information in conversations
- Lead notifications

### Adding New Languages

To add a new language (e.g., French):

1. **Create language pack**: `/src/localization/languages/fr.ts`
```typescript
import { LanguagePack } from '../types';
import { getOwnerConfig } from '../../config/owner.config';

export function createFrenchPack(): LanguagePack {
  const owner = getOwnerConfig();
  return {
    languageCode: 'fr',
    languageName: 'Français', 
    flagEmoji: '🇫🇷',
    // ... rest of translations
  };
}
```

2. **Add to registry**: `/src/localization/language-registry.ts`
```typescript
import { createFrenchPack } from './languages/fr';

const languageCreators: Record<string, () => LanguagePack> = {
  // existing languages...
  fr: createFrenchPack,
};
```

3. **Update owner bio**: Add French bio to `/src/config/owner.config.ts`
```typescript
bio: {
  // existing languages...
  fr: 'Votre biographie en français...',
}
```

The language will **automatically appear** in the Telegram menu! ✨

## Development

```bash
# Build
npm run build

# Test
npm run test

# Lint
npm run lint
```

## Contact

For AI chatbot development services, contact Alex Antonenko:
- Specializing in Enterprise solutions and startup MVPs
- Quick team assembly for project delivery
- Currently developing Shopify AI Sales ChatBot plugin