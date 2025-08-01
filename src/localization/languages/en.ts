import { LanguagePack } from '../types';
import { getOwnerConfig } from '../../config/owner.config';

export function createEnglishPack(): LanguagePack {
  const owner = getOwnerConfig();

  return {
    languageCode: 'en',
    languageName: 'English',
    flagEmoji: '🇺🇸',

    languageSelected: 'Language selected!',
    welcomeMessage: `🤖 Hi! I'm ${owner.shortName}'s AI assistant, here to show you how AI chatbots can revolutionize business sales!

${owner.bio.en}

Before we dive in, I'd love to get to know you better. What's your name? 😊`,

    errorMessage: 'Sorry, an error occurred. Please try again.',
    sessionError:
      'Sorry, there was an error starting a new session. Please try again.',

    stageInstructions: {
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
      contact_collection: `FINAL STAGE: If contacts not collected yet - ask for them. If contacts received - say 'Thank you! ${owner.name} will contact you soon. You can also reach him directly: ${owner.telegramHandle}' and END conversation.`,
      conversation_completed: `CONVERSATION ENDED: Thank them for their time, confirm ${owner.name} will contact them, give ${owner.telegramHandle} contact. NO MORE questions. Just politely end.`,
    },

    aiInstructions: {
      languageInstruction:
        'CRITICAL: RESPOND ONLY IN ENGLISH! NO OTHER LANGUAGES!',
      responseLanguageReminder: 'RESPOND IN ENGLISH ONLY!',
    },

    leadNotification: {
      newLead: '🎯 NEW LEAD!',
      nameAndContact: '**Name and Contact:**',
      businessSector: '**Business Sector:**',
      summary: '**Summary:**',
      leadScore: '📊 Lead Score:',
      dealClosed: 'Deal Closed',
      notSpecified: 'Not specified',
      client: 'Client',
      bot: 'Bot',
      interestedFallback: 'Interested in AI chatbot for business',
    },

    summaryPrompt: {
      instruction:
        'Analyze the conversation with a potential client and create a brief summary (maximum 100 characters) in English.',
      focusOn: 'Focus on:',
      mainProblem: '1. Main problem/need of the client',
      businessSector: '2. Their business sector',
      interestLevel: '3. Level of interest',
      format: 'Format: "Business sector - main problem/need"',
      example: 'Example: "Beauty salon - can\'t handle leads fast enough"',
      responseOnly: 'Respond only with the summary, no additional text.',
    },
  };
}
