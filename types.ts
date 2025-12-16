export interface WheelItem {
  id: string;
  label: string;
  color: string;
}

export interface SpinResult {
  winner: WheelItem;
  aiMessage?: string;
}

export enum GameState {
  IDLE,
  SPINNING,
  CELEBRATING
}