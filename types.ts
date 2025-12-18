export interface WheelItem {
  id: string;
  label: string;
  color: string;
}

export interface SpinResult {
  winner: WheelItem;
}

export enum GameState {
  IDLE,
  SPINNING,
  CELEBRATING
}