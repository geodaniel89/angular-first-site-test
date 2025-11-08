export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export interface GameState {
  playerHand: Card[];
  aiHand: Card[];
  deck: Card[];
  discardPile: Card[];
  currentPlayer: 'player' | 'ai';
  sevenCounter: number; // Counts stacked 7s
  eightActive: boolean; // If 8 was played
  gameOver: boolean;
  winner: 'player' | 'ai' | null;
  chosenSuit: Suit | null; // For Ace card
}

export const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const isRed = (suit: Suit): boolean => suit === '♥' || suit === '♦';
export const isBlack = (suit: Suit): boolean => suit === '♠' || suit === '♣';
