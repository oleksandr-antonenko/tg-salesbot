export interface LanguagePack {
  // Meta information
  languageCode: string;
  languageName: string;
  flagEmoji: string;

  // Welcome messages
  languageSelected: string;
  welcomeMessage: string;

  // Error messages
  errorMessage: string;
  sessionError: string;

  // Stage-specific instructions for AI
  stageInstructions: {
    name_collection: string;
    trust_building: string;
    permission_request: string;
    situation_discovery: string;
    problem_identification: string;
    implication_development: string;
    need_payoff: string;
    proposal: string;
    closing: string;
    contact_collection: string;
    conversation_completed: string;
  };

  // AI prompts
  aiInstructions: {
    languageInstruction: string;
    responseLanguageReminder: string;
  };

  // Lead notification
  leadNotification: {
    newLead: string;
    nameAndContact: string;
    businessSector: string;
    summary: string;
    leadScore: string;
    dealClosed: string;
    notSpecified: string;
    client: string;
    bot: string;
    interestedFallback: string;
  };

  // Summary generation
  summaryPrompt: {
    instruction: string;
    focusOn: string;
    mainProblem: string;
    businessSector: string;
    interestLevel: string;
    format: string;
    example: string;
    responseOnly: string;
  };
}
