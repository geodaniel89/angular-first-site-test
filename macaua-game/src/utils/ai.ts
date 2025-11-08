import { Card, GameState, Suit, SUITS, isRed } from '../types/game';
import { getPlayableCards } from './gameLogic';

export const getAIMove = (state: GameState): { card: Card | null; chosenSuit?: Suit } => {
  const topCard = state.discardPile[state.discardPile.length - 1];
  const playableCards = getPlayableCards(state.aiHand, topCard, state.chosenSuit);

  if (playableCards.length === 0) {
    return { card: null };
  }

  // Medium difficulty AI strategy
  let selectedCard: Card;

  // 1. Prioritize special cards (60% chance)
  const specialCards = playableCards.filter(c => ['2', '3', '4', 'A'].includes(c.rank));
  if (specialCards.length > 0 && Math.random() < 0.6) {
    // Prefer 2s and 3s when AI has many cards (to make opponent draw)
    const drawCards = specialCards.filter(c => c.rank === '2' || c.rank === '3');
    if (drawCards.length > 0 && state.aiHand.length > 5) {
      selectedCard = drawCards[Math.floor(Math.random() * drawCards.length)];
    } else {
      selectedCard = specialCards[Math.floor(Math.random() * specialCards.length)];
    }
  } else {
    // 2. Play same rank if available (30% chance)
    const sameRank = playableCards.filter(c => c.rank === topCard.rank);
    if (sameRank.length > 0 && Math.random() < 0.3) {
      selectedCard = sameRank[Math.floor(Math.random() * sameRank.length)];
    } else {
      // 3. Otherwise, play random playable card
      selectedCard = playableCards[Math.floor(Math.random() * playableCards.length)];
    }
  }

  // If Ace was played, choose suit based on AI's hand
  if (selectedCard.rank === 'A') {
    const chosenSuit = chooseSuitForAce(state.aiHand);
    return { card: selectedCard, chosenSuit };
  }

  return { card: selectedCard };
};

const chooseSuitForAce = (hand: Card[]): Suit => {
  // Count cards by color
  const redCount = hand.filter(c => isRed(c.suit)).length;
  const blackCount = hand.length - redCount;

  // Choose color with more cards
  if (redCount > blackCount) {
    // Choose hearts or diamonds randomly
    const redSuits = hand.filter(c => isRed(c.suit));
    const suitCounts = SUITS.filter(s => isRed(s)).map(suit => ({
      suit,
      count: redSuits.filter(c => c.suit === suit).length,
    }));
    return suitCounts.sort((a, b) => b.count - a.count)[0].suit;
  } else {
    // Choose spades or clubs randomly
    const blackSuits = hand.filter(c => !isRed(c.suit));
    const suitCounts = SUITS.filter(s => !isRed(s)).map(suit => ({
      suit,
      count: blackSuits.filter(c => c.suit === suit).length,
    }));
    return suitCounts.sort((a, b) => b.count - a.count)[0].suit;
  }
};
