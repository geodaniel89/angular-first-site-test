import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  Modal,
} from 'react-native';
import { createDeck, drawCards } from './src/utils/deck';
import { initializeGame, canPlayCard, hasPlayableCard, checkWinner } from './src/utils/gameLogic';
import { getAIMove } from './src/utils/ai';
import { Card, GameState, Suit, SUITS, isRed } from './src/types/game';

const App = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const deck = createDeck();
    return initializeGame(deck);
  });

  const [showSuitPicker, setShowSuitPicker] = useState(false);
  const [pendingAceCard, setPendingAceCard] = useState<Card | null>(null);
  const [message, setMessage] = useState('Pune o carte! 🎮');
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    // AI's turn
    if (gameState.currentPlayer === 'ai' && !gameState.gameOver) {
      const timer = setTimeout(() => {
        playAITurn();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayer, gameState.gameOver]);

  useEffect(() => {
    // Check for winner
    const winner = checkWinner(gameState);
    if (winner) {
      setGameState(prev => ({ ...prev, gameOver: true, winner }));
      if (winner === 'player') {
        setMessage('🎉 Ai câștigat! Bravo! 🌟');
      } else {
        setMessage('Calculatorul a câștigat! Încearcă din nou! 💪');
      }
    }
  }, [gameState.playerHand.length, gameState.aiHand.length]);

  const playAITurn = () => {
    const topCard = gameState.discardPile[gameState.discardPile.length - 1];

    // Handle 4 (skip turn)
    if (gameState.fourActive) {
      setMessage('Calculatorul stă! 😴');
      setGameState(prev => ({
        ...prev,
        currentPlayer: 'player',
        fourActive: false,
      }));
      return;
    }

    // Handle 2/3 (draw cards)
    if (gameState.drawCounter > 0) {
      const aiCanPlay23 = gameState.aiHand.some(c => c.rank === '2' || c.rank === '3');

      if (aiCanPlay23 && Math.random() < 0.7) {
        // AI plays a 2 or 3
        const card23 = gameState.aiHand.find(c => c.rank === '2' || c.rank === '3')!;
        const newAiHand = gameState.aiHand.filter(c => c.id !== card23.id);
        const newDiscardPile = [...gameState.discardPile, card23];
        const cardsToAdd = card23.rank === '2' ? 2 : 3;

        setMessage(`Calculatorul pune un ${card23.rank}! +${cardsToAdd} cărți pentru tine! 😮`);
        setGameState(prev => ({
          ...prev,
          aiHand: newAiHand,
          discardPile: newDiscardPile,
          drawCounter: prev.drawCounter + cardsToAdd,
          currentPlayer: 'player',
        }));
        return;
      } else {
        // AI draws cards
        const cardsToDraw = gameState.drawCounter;
        const { drawn, remaining } = drawCards(gameState.deck, cardsToDraw);

        setMessage(`Calculatorul trage ${cardsToDraw} cărți! 📇`);
        setGameState(prev => ({
          ...prev,
          aiHand: [...prev.aiHand, ...drawn],
          deck: remaining,
          drawCounter: 0,
          currentPlayer: 'player',
        }));
        return;
      }
    }

    // Normal turn
    if (!hasPlayableCard(gameState.aiHand, topCard, gameState.chosenSuit)) {
      // Draw a card
      if (gameState.deck.length > 0) {
        const { drawn, remaining } = drawCards(gameState.deck, 1);

        setMessage('Calculatorul trage o carte! 🃏');
        setGameState(prev => ({
          ...prev,
          aiHand: [...prev.aiHand, ...drawn],
          deck: remaining,
          currentPlayer: 'player',
        }));
      } else {
        // No cards to draw - skip turn
        setMessage('Calculatorul nu poate juca! ⏭️');
        setGameState(prev => ({
          ...prev,
          currentPlayer: 'player',
        }));
      }
      return;
    }

    // AI plays a card
    const move = getAIMove(gameState);
    if (move.card) {
      playCard(move.card, 'ai', move.chosenSuit);
    }
  };

  const playCard = (card: Card, player: 'player' | 'ai', chosenSuit?: Suit) => {
    const newHand = player === 'player'
      ? gameState.playerHand.filter(c => c.id !== card.id)
      : gameState.aiHand.filter(c => c.id !== card.id);

    const newDiscardPile = [...gameState.discardPile, card];

    let newState: Partial<GameState> = {
      discardPile: newDiscardPile,
      chosenSuit: chosenSuit || null,
    };

    if (player === 'player') {
      newState.playerHand = newHand;
    } else {
      newState.aiHand = newHand;
    }

    // Handle special cards - Romanian rules
    if (card.rank === '2') {
      // 2 = draw 2 cards (or stack)
      newState.drawCounter = (gameState.drawCounter || 0) + 2;
      newState.currentPlayer = player === 'player' ? 'ai' : 'player';
      setMessage(player === 'player' ? 'Ai pus un 2! +2 cărți! 😈' : 'Calculatorul pune un 2! 😮');
    } else if (card.rank === '3') {
      // 3 = draw 3 cards (or stack)
      newState.drawCounter = (gameState.drawCounter || 0) + 3;
      newState.currentPlayer = player === 'player' ? 'ai' : 'player';
      setMessage(player === 'player' ? 'Ai pus un 3! +3 cărți! 😈' : 'Calculatorul pune un 3! 😮');
    } else if (card.rank === '4') {
      // 4 = skip turn
      newState.fourActive = true;
      newState.currentPlayer = player === 'player' ? 'ai' : 'player';
      setMessage(player === 'player' ? 'Ai pus un 4! Calculatorul stă! 😊' : 'Calculatorul pune un 4! Tu stai! 😴');
    } else if (card.rank === 'A') {
      // Ace = change color
      if (player === 'ai' && chosenSuit) {
        setMessage(`Calculatorul schimbă culoarea! ${chosenSuit}`);
      } else if (player === 'player') {
        setMessage(`Ai schimbat culoarea! ${chosenSuit}`);
      }
      newState.currentPlayer = player === 'player' ? 'ai' : 'player';
    } else {
      // Normal card
      newState.currentPlayer = player === 'player' ? 'ai' : 'player';
      setMessage(player === 'player' ? 'Carte pusă! ✅' : 'Calculatorul pune o carte! 🤖');
    }

    setGameState(prev => ({ ...prev, ...newState }));

    // Animate card play
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCardPress = (card: Card) => {
    if (gameState.currentPlayer !== 'player' || gameState.gameOver) return;

    const topCard = gameState.discardPile[gameState.discardPile.length - 1];

    // Handle 4 (skip turn)
    if (gameState.fourActive) {
      setMessage('Trebuie să stai! 😴');
      setGameState(prev => ({
        ...prev,
        currentPlayer: 'ai',
        fourActive: false,
      }));
      return;
    }

    // Handle 2/3 (must play 2/3 or draw)
    if (gameState.drawCounter > 0) {
      if (card.rank === '2' || card.rank === '3') {
        playCard(card, 'player');
      } else {
        setMessage('Trebuie să pui un 2 sau 3 sau să tragi cărți! 🃏');
      }
      return;
    }

    // Check if card can be played
    if (!canPlayCard(card, topCard, gameState.chosenSuit)) {
      setMessage('Nu poți pune această carte! ❌');
      return;
    }

    // If Ace, show suit picker
    if (card.rank === 'A') {
      setPendingAceCard(card);
      setShowSuitPicker(true);
    } else {
      playCard(card, 'player');
    }
  };

  const handleDrawCard = () => {
    if (gameState.currentPlayer !== 'player' || gameState.gameOver) return;

    if (gameState.drawCounter > 0) {
      // Draw cards for 2s/3s
      const cardsToDraw = gameState.drawCounter;
      const { drawn, remaining } = drawCards(gameState.deck, cardsToDraw);

      setMessage(`Ai tras ${cardsToDraw} cărți! 📚`);
      setGameState(prev => ({
        ...prev,
        playerHand: [...prev.playerHand, ...drawn],
        deck: remaining,
        drawCounter: 0,
        currentPlayer: 'ai',
      }));
    } else if (gameState.deck.length > 0) {
      const { drawn, remaining } = drawCards(gameState.deck, 1);

      setMessage('Ai tras o carte! 🃏');
      setGameState(prev => ({
        ...prev,
        playerHand: [...prev.playerHand, ...drawn],
        deck: remaining,
        currentPlayer: 'ai',
      }));
    }
  };

  const handleSuitChoice = (suit: Suit) => {
    if (pendingAceCard) {
      playCard(pendingAceCard, 'player', suit);
      setPendingAceCard(null);
      setShowSuitPicker(false);
    }
  };

  const resetGame = () => {
    const deck = createDeck();
    setGameState(initializeGame(deck));
    setMessage('Joc nou! Spor! 🎮');
    setPendingAceCard(null);
    setShowSuitPicker(false);
  };

  const topCard = gameState.discardPile[gameState.discardPile.length - 1];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6C5CE7" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎮 Macaua Kids 🎮</Text>
        <Text style={styles.message}>{message}</Text>
        {gameState.drawCounter > 0 && (
          <Text style={styles.counterBadge}>📚 +{gameState.drawCounter} cărți!</Text>
        )}
      </View>

      {/* AI Hand (face down) */}
      <View style={styles.aiHandContainer}>
        <Text style={styles.aiLabel}>🤖 Calculator: {gameState.aiHand.length} cărți</Text>
        <View style={styles.aiCards}>
          {gameState.aiHand.slice(0, Math.min(7, gameState.aiHand.length)).map((_, index) => (
            <View key={index} style={[styles.cardBack, { marginLeft: index * -30 }]} />
          ))}
        </View>
      </View>

      {/* Discard Pile */}
      <View style={styles.discardPileContainer}>
        <Animated.View
          style={[
            styles.topCardContainer,
            {
              transform: [{
                scale: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2],
                }),
              }],
            },
          ]}
        >
          <View style={[styles.card, getCardColor(topCard)]}>
            <Text style={styles.cardText}>{topCard.rank}</Text>
            <Text style={styles.cardSuit}>{topCard.suit}</Text>
          </View>
        </Animated.View>

        {gameState.deck.length > 0 && (
          <TouchableOpacity onPress={handleDrawCard} style={styles.deckButton}>
            <View style={styles.cardBack}>
              <Text style={styles.deckText}>📚</Text>
              <Text style={styles.deckCount}>{gameState.deck.length}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Player Hand */}
      <View style={styles.playerHandContainer}>
        <Text style={styles.playerLabel}>👦 Tu: {gameState.playerHand.length} cărți</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.handScroll}>
          <View style={styles.playerCards}>
            {gameState.playerHand.map((card) => (
              <TouchableOpacity
                key={card.id}
                onPress={() => handleCardPress(card)}
                style={styles.cardButton}
              >
                <View style={[styles.card, getCardColor(card)]}>
                  <Text style={styles.cardText}>{card.rank}</Text>
                  <Text style={styles.cardSuit}>{card.suit}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Game Over / Reset */}
      {gameState.gameOver && (
        <View style={styles.gameOverContainer}>
          <TouchableOpacity onPress={resetGame} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>🔄 Joc Nou</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Suit Picker Modal */}
      <Modal visible={showSuitPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.suitPickerContainer}>
            <Text style={styles.suitPickerTitle}>Alege culoarea! 🎨</Text>
            <View style={styles.suitButtons}>
              {SUITS.map((suit) => (
                <TouchableOpacity
                  key={suit}
                  onPress={() => handleSuitChoice(suit)}
                  style={[styles.suitButton, getSuitButtonColor(suit)]}
                >
                  <Text style={styles.suitButtonText}>{suit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getCardColor = (card: Card) => {
  return isRed(card.suit) ? styles.redCard : styles.blackCard;
};

const getSuitButtonColor = (suit: Suit) => {
  return isRed(suit) ? styles.redSuitButton : styles.blackSuitButton;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#A8E6CF',
  },
  header: {
    padding: 20,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  message: {
    fontSize: 18,
    color: '#FFE66D',
    marginTop: 10,
    fontWeight: '600',
  },
  counterBadge: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: 10,
  },
  aiHandContainer: {
    padding: 20,
    alignItems: 'center',
  },
  aiLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 10,
  },
  aiCards: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 30,
  },
  discardPileContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 20,
  },
  topCardContainer: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  deckButton: {
    elevation: 4,
  },
  deckText: {
    fontSize: 40,
  },
  deckCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 5,
  },
  playerHandContainer: {
    flex: 1,
    padding: 20,
  },
  playerLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 10,
  },
  handScroll: {
    flex: 1,
  },
  playerCards: {
    flexDirection: 'row',
    gap: 10,
  },
  cardButton: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  card: {
    width: 80,
    height: 120,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  redCard: {
    backgroundColor: '#FF6B6B',
  },
  blackCard: {
    backgroundColor: '#4A4A4A',
  },
  cardText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardSuit: {
    fontSize: 36,
    marginTop: 5,
  },
  cardBack: {
    width: 80,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#3498DB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  gameOverContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 8,
  },
  resetButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suitPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 10,
  },
  suitPickerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 20,
  },
  suitButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  suitButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  redSuitButton: {
    backgroundColor: '#FF6B6B',
  },
  blackSuitButton: {
    backgroundColor: '#4A4A4A',
  },
  suitButtonText: {
    fontSize: 40,
  },
});

export default App;
