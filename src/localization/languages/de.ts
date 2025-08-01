import { LanguagePack } from '../types';
import { getOwnerConfig } from '../../config/owner.config';

export function createGermanPack(): LanguagePack {
  const owner = getOwnerConfig();

  return {
    languageCode: 'de',
    languageName: 'Deutsch',
    flagEmoji: '🇩🇪',

    languageSelected: 'Sprache ausgewählt!',
    welcomeMessage: `🤖 Hallo! Ich bin ${owner.shortName}s KI-Assistent und zeige Ihnen, wie KI-Chatbots den Geschäftsverkauf revolutionieren können!

${owner.name} ist ein erfahrener Tech Lead und Unternehmer, der unzähligen Unternehmen geholfen hat, ihre Einnahmen mit intelligenten Chatbot-Lösungen zu steigern.

Bevor wir loslegen, möchte ich Sie gerne kennenlernen. Wie heißen Sie? 😊`,

    errorMessage:
      'Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
    sessionError:
      'Entschuldigung, beim Starten einer neuen Sitzung ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',

    stageInstructions: {
      name_collection:
        'Fragen Sie NUR warmherzig nach dem Namen. ABSOLUT KEINE Erwähnung von Geschäft, KI, Chatbots oder Verkauf. Erfahren Sie einfach den Namen und seien Sie freundlich.',
      trust_building:
        "OBLIGATORISCH: Sagen Sie 'Freut mich, Sie kennenzulernen, [NAME]! In welchem Geschäftsbereich sind Sie tätig?' WICHTIG: Beenden Sie IMMER mit einer GESCHÄFTSFRAGE. Verkäufer FÜHREN Gespräche mit Fragen.",
      permission_request:
        'Bitten Sie NUR um Erlaubnis, über ihr Geschäft zu sprechen. Seien Sie höflich und respektvoll. Stellen Sie noch KEINE echten Geschäftsfragen.',
      situation_discovery:
        'JETZT können Sie nach ihrem Geschäftstyp und aktuellen Prozessen fragen. Verwenden Sie SPIN-Methodik - verstehen Sie ihre SITUATION.',
      problem_identification:
        'Konzentrieren Sie sich darauf, ihre PROBLEME und Schmerzpunkte zu finden. Mit welchen Herausforderungen haben sie zu kämpfen?',
      implication_development:
        'Erforschen Sie die AUSWIRKUNGEN ihrer Probleme. Was passiert, wenn sie diese Probleme nicht lösen?',
      need_payoff:
        'Präsentieren Sie den NUTZEN. Wie würde die Lösung ihrer Probleme ihnen helfen?',
      proposal:
        'Präsentieren Sie Ihre KI-Chatbot-Lösung. Verwenden Sie AIDA - Aufmerksamkeit erregen, Interesse wecken, Verlangen schaffen.',
      closing:
        'Schaffen Sie Dringlichkeit und führen Sie zur Handlung. Zeitlich begrenzte Angebote, sofortige Vorteile.',
      contact_collection: `FINALE STUFE: Falls Kontakte noch nicht gesammelt - fragen Sie danach. Falls Kontakte erhalten - sagen Sie 'Vielen Dank! ${owner.name} wird sich bald bei Ihnen melden. Sie können ihn auch direkt erreichen: ${owner.telegramHandle}' und BEENDEN Sie das Gespräch.`,
      conversation_completed: `GESPRÄCH BEENDET: Bedanken Sie sich für ihre Zeit, bestätigen Sie dass ${owner.name} sie kontaktieren wird, geben Sie ${owner.telegramHandle} Kontakt. KEINE weiteren Fragen. Beenden Sie höflich.`,
    },

    aiInstructions: {
      languageInstruction:
        'KRITISCH: ANTWORTEN SIE NUR AUF DEUTSCH! KEINE ANDEREN SPRACHEN!',
      responseLanguageReminder: 'ANTWORTEN SIE NUR AUF DEUTSCH!',
    },

    leadNotification: {
      newLead: '🎯 NEUER LEAD!',
      nameAndContact: '**Name und Kontakt:**',
      businessSector: '**Geschäftsbereich:**',
      summary: '**Zusammenfassung:**',
      leadScore: '📊 Lead Score:',
      dealClosed: 'Geschäft abgeschlossen',
      notSpecified: 'Nicht angegeben',
      client: 'Kunde',
      bot: 'Bot',
      interestedFallback: 'Interessiert an KI-Chatbot für Geschäft',
    },

    summaryPrompt: {
      instruction:
        'Analysieren Sie das Gespräch mit einem potenziellen Kunden und erstellen Sie eine kurze Zusammenfassung (maximal 100 Zeichen) auf Deutsch.',
      focusOn: 'Konzentrieren Sie sich auf:',
      mainProblem: '1. Hauptproblem/Bedürfnis des Kunden',
      businessSector: '2. Ihr Geschäftsbereich',
      interestLevel: '3. Interesse-Level',
      format: 'Format: "Geschäftsbereich - Hauptproblem/Bedürfnis"',
      example:
        'Beispiel: "Friseursalon - kann Leads nicht schnell genug bearbeiten"',
      responseOnly:
        'Antworten Sie nur mit der Zusammenfassung, kein zusätzlicher Text.',
    },
  };
}
