import { Card, GameState, isRed, isBlack, Suit } from '../types/game';

export const canPlayCard = (card: Card, topCard: Card, chosenSuit: Suit | null): boolean => {
  // If Ace was played and suit was chosen
  if (chosenSuit) {
    return card.suit === chosenSuit || card.rank === 'A';
  }

  // Same rank always works
  if (card.rank === topCard.rank) {
    return true;
  }

  // Same color (Romanian rules - simplified for kids)
  if ((isRed(card.suit) && isRed(topCard.suit)) ||
      (isBlack(card.suit) && isBlack(topCard.suit))) {
    return true;
  }

  // Ace can be played on anything
  if (card.rank === 'A') {
    return true;
  }

  return false;
};

export const getPlayableCards = (hand: Card[], topCard: Card, chosenSuit: Suit | null): Card[] => {
  return hand.filter(card => canPlayCard(card, topCard, chosenSuit));
};

export const hasPlayableCard = (hand: Card[], topCard: Card, chosenSuit: Suit | null): boolean => {
  return getPlayableCards(hand, topCard, chosenSuit).length > 0;
};

export const initializeGame = (deck: Card[]): GameState => {
  // Deal 7 cards to each player
  const playerHand = deck.slice(0, 7);
  const aiHand = deck.slice(7, 14);
  const remaining = deck.slice(14);

  // First card on discard pile (not special)
  let firstCardIndex = 0;
  while (['2', '3', '4', 'A'].includes(remaining[firstCardIndex].rank)) {
    firstCardIndex++;
  }

  const discardPile = [remaining[firstCardIndex]];
  const deckRemaining = [
    ...remaining.slice(0, firstCardIndex),
    ...remaining.slice(firstCardIndex + 1),
  ];

  return {
    playerHand,
    aiHand,
    deck: deckRemaining,
    discardPile,
    currentPlayer: 'player',
    drawCounter: 0,
    fourActive: false,
    gameOver: false,
    winner: null,
    chosenSuit: null,
  };
};

export const checkWinner = (state: GameState): 'player' | 'ai' | null => {
  if (state.playerHand.length === 0) return 'player';
  if (state.aiHand.length === 0) return 'ai';
  return null;
};
