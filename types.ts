
export interface OracleResponse {
  title: string;
  poem: string[];
  interpretation: string;
  advice: string;
  talismanChar: string;
}

export enum AppState {
  IDLE = 'IDLE',
  CONSULTING = 'CONSULTING',
  REVEALED = 'REVEALED',
  ERROR = 'ERROR'
}
