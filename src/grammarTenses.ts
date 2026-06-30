export interface TenseStructure {
  formula: string;
  example: string;
}

export interface TenseData {
  id: string;
  name: string;
  useCase: string;
  timeline: string; // e.g., "Present", "Past", "Future"
  rules: string;
  affirmative: TenseStructure;
  negative: TenseStructure;
  question: TenseStructure;
  commonMistake: string;
  correctVersion: string;
}

export const ENGLISH_TENSES: TenseData[] = [
  {
    id: "simple_present",
    name: "Simple Present",
    timeline: "Present",
    useCase: "Habits, routines, general truths, and permanent situations.",
    rules: "Add '-s' or '-es' to the verb for third-person singular (he, she, it). Use the auxiliary verb 'do' or 'does' for negatives and questions.",
    affirmative: {
      formula: "Subject + Verb(s/es) + Object",
      example: "She teaches English every morning."
    },
    negative: {
      formula: "Subject + do/does + not + Verb (base) + Object",
      example: "She does not (doesn't) teach English every morning."
    },
    question: {
      formula: "Do/Does + Subject + Verb (base) + Object?",
      example: "Does she teach English every morning?"
    },
    commonMistake: "She teach English.",
    correctVersion: "She teaches English."
  },
  {
    id: "present_progressive",
    name: "Present Progressive (Continuous)",
    timeline: "Present",
    useCase: "Actions happening right now, temporary situations, or future plans.",
    rules: "Always use a form of the 'to be' verb (am/is/are) combined with the present participle (verb + -ing).",
    affirmative: {
      formula: "Subject + am/is/are + Verb(-ing) + Object",
      example: "They are practicing conversational tenses right now."
    },
    negative: {
      formula: "Subject + am/is/are + not + Verb(-ing) + Object",
      example: "They are not (aren't) practicing conversational tenses right now."
    },
    question: {
      formula: "Am/Is/Are + Subject + Verb(-ing) + Object?",
      example: "Are they practicing conversational tenses right now?"
    },
    commonMistake: "They practicing English now.",
    correctVersion: "They are practicing English now."
  },
  {
    id: "simple_past",
    name: "Simple Past",
    timeline: "Past",
    useCase: "Completed actions in the past with a specific, known time.",
    rules: "Use past tense verbs (regular with '-ed' ending; irregulars must be memorized). In negatives and questions, use auxiliary 'did' and return the verb to its base form.",
    affirmative: {
      formula: "Subject + Verb(ed/irregular) + Object",
      example: "The class learned about phrasal verbs yesterday."
    },
    negative: {
      formula: "Subject + did + not + Verb (base) + Object",
      example: "The class did not (didn't) learn about phrasal verbs yesterday."
    },
    question: {
      formula: "Did + Subject + Verb (base) + Object?",
      example: "Did the class learn about phrasal verbs yesterday?"
    },
    commonMistake: "She did not went to school.",
    correctVersion: "She did not go to school."
  },
  {
    id: "past_progressive",
    name: "Past Progressive (Continuous)",
    timeline: "Past",
    useCase: "Ongoing past actions that were interrupted, or actions in progress at a specific past moment.",
    rules: "Use 'was' (for singular: I, he, she, it) or 'were' (for plural: you, we, they) followed by the verb + -ing form.",
    affirmative: {
      formula: "Subject + was/were + Verb(-ing) + Object",
      example: "I was explaining the modal verbs when the connection dropped."
    },
    negative: {
      formula: "Subject + was/were + not + Verb(-ing) + Object",
      example: "I was not (wasn't) explaining the modal verbs when the connection dropped."
    },
    question: {
      formula: "Was/Were + Subject + Verb(-ing) + Object?",
      example: "Were you explaining the modal verbs when the connection dropped?"
    },
    commonMistake: "They was playing soccer.",
    correctVersion: "They were playing soccer."
  },
  {
    id: "present_perfect",
    name: "Present Perfect",
    timeline: "Present / Past Connection",
    useCase: "Life experiences, past actions with present consequence, or actions that started in the past and continue today.",
    rules: "Use auxiliary 'have/has' (has for he/she/it) followed by the Past Participle (third form of the verb).",
    affirmative: {
      formula: "Subject + have/has + Verb (past participle) + Object",
      example: "We have visited Playa del Carmen three times."
    },
    negative: {
      formula: "Subject + have/has + not + Verb (past participle) + Object",
      example: "We have not (haven't) visited Playa del Carmen three times."
    },
    question: {
      formula: "Have/Has + Subject + Verb (past participle) + Object?",
      example: "Have you visited Playa del Carmen three times?"
    },
    commonMistake: "I have went to Mexico last year.",
    correctVersion: "I went to Mexico last year. OR: I have been to Mexico."
  },
  {
    id: "past_perfect",
    name: "Past Perfect",
    timeline: "Past",
    useCase: "An action that occurred and was completed before another past action/moment.",
    rules: "Use 'had' for all subjects, followed by the Past Participle of the verb.",
    affirmative: {
      formula: "Subject + had + Verb (past participle) + Object",
      example: "The guest had already checked out when the invoice arrived."
    },
    negative: {
      formula: "Subject + had + not + Verb (past participle) + Object",
      example: "The guest had not (hadn't) checked out when the invoice arrived."
    },
    question: {
      formula: "Had + Subject + Verb (past participle) + Object?",
      example: "Had the guest already checked out when the invoice arrived?"
    },
    commonMistake: "Before I arrived, they already went home.",
    correctVersion: "Before I arrived, they had already gone home."
  },
  {
    id: "simple_future_will",
    name: "Future Simple (Will)",
    timeline: "Future",
    useCase: "Spontaneous decisions, predictions without present evidence, promises, and offers.",
    rules: "Use the modal word 'will' with the base verb. In negative statements, 'will not' contracts to 'won't'.",
    affirmative: {
      formula: "Subject + will + Verb (base) + Object",
      example: "I will make a presentation for tomorrow's class."
    },
    negative: {
      formula: "Subject + will + not + Verb (base) + Object",
      example: "I will not (won't) make a presentation for tomorrow's class."
    },
    question: {
      formula: "Will + Subject + Verb (base) + Object?",
      example: "Will you make a presentation for tomorrow's class?"
    },
    commonMistake: "I will going to call him.",
    correctVersion: "I will call him."
  },
  {
    id: "simple_future_goingto",
    name: "Future Simple (Be Going To)",
    timeline: "Future",
    useCase: "Prior intentions, arrangements, and predictions based on clear current physical evidence.",
    rules: "Use 'am/is/are' + 'going to' followed by the base form of the main verb.",
    affirmative: {
      formula: "Subject + am/is/are + going to + Verb (base) + Object",
      example: "The principal is going to discuss the new curriculum."
    },
    negative: {
      formula: "Subject + am/is/are + not + going to + Verb (base) + Object",
      example: "The principal is not (isn't) going to discuss the new curriculum."
    },
    question: {
      formula: "Am/Is/Are + Subject + going to + Verb (base) + Object?",
      example: "Is the principal going to discuss the new curriculum?"
    },
    commonMistake: "Next year I going to learn German.",
    correctVersion: "Next year I am going to learn German."
  },
  {
    id: "future_progressive",
    name: "Future Progressive (Continuous)",
    timeline: "Future",
    useCase: "Actions that will be in progress at a specific point in the future.",
    rules: "Use 'will be' for all subjects, followed by the present participle (verb + -ing).",
    affirmative: {
      formula: "Subject + will be + Verb(-ing) + Object",
      example: "At 10 PM tonight, we will be flying over Tulum."
    },
    negative: {
      formula: "Subject + will + not + be + Verb(-ing) + Object",
      example: "At 10 PM tonight, we will not (won't) be flying over Tulum."
    },
    question: {
      formula: "Will + Subject + be + Verb(-ing) + Object?",
      example: "Will we be flying over Tulum at 10 PM tonight?"
    },
    commonMistake: "Tomorrow this time I will working.",
    correctVersion: "Tomorrow this time I will be working."
  },
  {
    id: "future_perfect",
    name: "Future Perfect",
    timeline: "Future",
    useCase: "Actions that will have been completed before a certain future limit or action.",
    rules: "Use 'will have' for all subjects, followed by the Past Participle.",
    affirmative: {
      formula: "Subject + will have + Verb (past participle) + Object",
      example: "By next Friday, you will have completed five dialogue levels."
    },
    negative: {
      formula: "Subject + will + not + have + Verb (past participle) + Object",
      example: "By next Friday, you will not (won't) have completed five dialogue levels."
    },
    question: {
      formula: "Will + Subject + have + Verb (past participle) + Object?",
      example: "Will you have completed five dialogue levels by next Friday?"
    },
    commonMistake: "By next month, I will finish my grammar course.",
    correctVersion: "By next month, I will have finished my grammar course."
  }
];
