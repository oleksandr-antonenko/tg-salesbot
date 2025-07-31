# Telegram AI Sales ChatBot

A sophisticated Telegram chatbot built with NestJS that demonstrates AI-powered sales conversations using SPIN and AIDA techniques. Created by Alex Antonenko to showcase AI chatbot capabilities for business sales.

## Features

- 🤖 **AI-Powered Conversations**: Uses Google Gemini AI for intelligent responses
- 🎯 **Sales Techniques**: Implements SPIN selling and AIDA framework
- 🌍 **Multi-Language Support**: Automatically detects and responds in user's language
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
PORT=3000
```

3. **Get Required API Keys:**
   - **Telegram Bot Token**: Create a bot via [@BotFather](https://t.me/botfather) on Telegram
   - **Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

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
└── app.module.ts      # Main application module
```

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