
export interface WordDetails {
  word: string;
  pronunciationNotation: string;
  ipa: string;
  meaning: string;
  partsOfSpeech: string;
  examples: string[];
  rulesApplied?: string[];
}

export interface SearchHistoryItem {
  word: string;
  timestamp: number;
}
