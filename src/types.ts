export type GameType = 'clicker' | 'catcher' | 'memory';

export interface ThemeConfig {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

export interface GameParameters {
  speed: number; // 1 (slow) to 10 (fast)
  difficulty: number; // 1 (easy) to 10 (hard)
}

export interface GameConfig {
  gameType: GameType;
  title: string;
  description: string;
  instructions: string;
  theme: ThemeConfig;
  assets: string[]; // Emojis or short words to be used as game entities
  parameters: GameParameters;
}

export type AppState = 'MOOD_SELECTION' | 'GENERATING' | 'PLAYING' | 'GAME_OVER';

export interface MoodPreset {
  label: string;
  emoji: string;
  color: string;
}