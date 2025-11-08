import { Card, SUITS, RANKS, Suit, Rank } from '../types/game';

export const createDeck = (): Card[] => {
  const deck: Card[] = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        suit,
        rank,
        id: `${suit}-${rank}`,
      });
    }
  }

  return shuffleDeck(deck);
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};

export const drawCards = (deck: Card[], count: number): { drawn: Card[], remaining: Card[] } => {
  const drawn = deck.slice(0, count);
  const remaining = deck.slice(count);

  return { drawn, remaining };
};
