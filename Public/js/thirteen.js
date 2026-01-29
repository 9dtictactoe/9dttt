/**
 * Pusoy Dos (Filipino Thirteen) Card Game Logic
 * Based on Filipino Pusoy Dos rules:
 * - 2 is the highest card
 * - Suit ranking: ♦ (highest) > ♥ > ♠ > ♣ (lowest)
 * - Valid plays: Singles, Pairs, Triples, Straights (5 cards), Flush, Full House, Four of a Kind, Straight Flush
 * - Runs/Straights beat single 2s
 * - A-2 is NOT a valid straight wrap
 * 
 * Part of the 9DTTT Game Library
 */

class PusoyDos {
    constructor() {
        this.playerHands = [[], []];
        this.playArea = [];
        this.selectedCards = [];
        this.currentPlayer = 0;
        this.lastPlayedBy = null;
        this.passCount = 0;
        this.roundNumber = 1;
        this.gameOver = false;
        this.gameMode = 'ai';
        this.lastPlayType = null;
        this.waitingForPlayer = false; // Track if we're waiting for player to confirm
        
        // Filipino Pusoy Dos ranking: 3 lowest, 2 highest
        this.rankOrder = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
        // Suit ranking: Clubs lowest, Diamonds highest
        this.suitOrder = ['♣', '♠', '♥', '♦'];
        
        // Create turn transition overlay for local multiplayer
        this.createTurnOverlay();
    }

    createTurnOverlay() {
        // Create overlay if it doesn't exist
        if (!document.getElementById('turn-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'turn-overlay';
            overlay.className = 'turn-overlay';
            overlay.innerHTML = `
                <div class="turn-overlay-content">
                    <h2 id="turn-overlay-title">Player 2's Turn</h2>
                    <p>Pass the device to the next player</p>
                    <p class="turn-overlay-hint">Cards will be hidden until ready</p>
                    <button id="turn-ready-btn" class="turn-ready-btn">I'm Ready - Show My Cards</button>
                </div>
            `;
            overlay.style.cssText = `
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(10, 14, 39, 0.95);
                z-index: 999;
                align-items: center;
                justify-content: center;
                flex-direction: column;
            `;
            document.body.appendChild(overlay);
            
            // Add styles for overlay content
            const style = document.createElement('style');
            style.textContent = `
                .turn-overlay { display: none; }
                .turn-overlay.show { display: flex !important; }
                .turn-overlay-content {
                    text-align: center;
                    padding: 40px;
                    background: var(--secondary-bg);
                    border-radius: var(--radius-lg);
                    border: 3px solid var(--primary-color);
                    max-width: 400px;
                    margin: 20px;
                }
                .turn-overlay-content h2 {
                    color: var(--accent-color);
                    margin-bottom: 20px;
                    font-size: 1.8rem;
                }
                .turn-overlay-content p {
                    color: var(--text-secondary);
                    margin-bottom: 15px;
                }
                .turn-overlay-hint {
                    font-size: 0.9rem;
                    opacity: 0.7;
                }
                .turn-ready-btn {
                    margin-top: 20px;
                    padding: 15px 30px;
                    font-size: 1.1rem;
                    background: var(--primary-color);
                    border: none;
                    border-radius: var(--radius-md);
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .turn-ready-btn:hover {
                    background: var(--accent-color);
                    transform: scale(1.05);
                }
            `;
            document.head.appendChild(style);
            
            // Handle ready button click
            document.getElementById('turn-ready-btn')?.addEventListener('click', () => {
                this.hideTurnOverlay();
            });
        }
    }

    showTurnOverlay() {
        const overlay = document.getElementById('turn-overlay');
        const title = document.getElementById('turn-overlay-title');
        if (overlay && title) {
            title.textContent = `Player ${this.currentPlayer + 1}'s Turn`;
            overlay.classList.add('show');
            this.waitingForPlayer = true;
        }
    }

    hideTurnOverlay() {
        const overlay = document.getElementById('turn-overlay');
        if (overlay) {
            overlay.classList.remove('show');
            this.waitingForPlayer = false;
            this.render();
            this.updateUI();
        }
    }

    initGame(mode = 'ai') {
        this.gameMode = mode;
        this.playerHands = [[], []];
        this.playArea = [];
        this.selectedCards = [];
        this.lastPlayedBy = null;
        this.passCount = 0;
        this.roundNumber = 1;
        this.gameOver = false;
        this.lastPlayType = null;
        this.waitingForPlayer = false;
        
        this.dealCards();
        this.sortHand(this.playerHands[0]);
        this.sortHand(this.playerHands[1]);
        
        // Player with 3♣ (lowest card) starts
        this.currentPlayer = this.hasCard(this.playerHands[0], '3', '♣') ? 0 : 1;
        
        // In local mode, show turn overlay at game start if player 2 starts
        if (this.gameMode === 'local' && this.currentPlayer === 1) {
            this.showTurnOverlay();
        } else {
            this.render();
            this.updateUI();
        }
        
        if (this.gameMode === 'ai' && this.currentPlayer === 1) {
            setTimeout(() => this.aiPlay(), 1000);
        }
    }

    dealCards() {
        const deck = this.createDeck();
        this.shuffle(deck);
        for (let i = 0; i < 13; i++) {
            this.playerHands[0].push(deck[i]);
            this.playerHands[1].push(deck[i + 13]);
        }
    }

    createDeck() {
        const deck = [];
        for (const suit of this.suitOrder) {
            for (const rank of this.rankOrder) {
                deck.push({ rank, suit });
            }
        }
        return deck;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    sortHand(hand) {
        hand.sort((a, b) => {
            const rankDiff = this.rankOrder.indexOf(a.rank) - this.rankOrder.indexOf(b.rank);
            if (rankDiff !== 0) return rankDiff;
            return this.suitOrder.indexOf(a.suit) - this.suitOrder.indexOf(b.suit);
        });
    }

    hasCard(hand, rank, suit) {
        return hand.some(c => c.rank === rank && c.suit === suit);
    }

    getCardValue(card) {
        return this.rankOrder.indexOf(card.rank) * 4 + this.suitOrder.indexOf(card.suit);
    }

    compareCards(a, b) {
        return this.getCardValue(a) - this.getCardValue(b);
    }

    /**
     * Get the type of play - Pusoy Dos style
     */
    getPlayType(cards) {
        if (cards.length === 0) return null;
        if (cards.length === 1) return 'single';
        if (cards.length === 2 && cards[0].rank === cards[1].rank) return 'pair';
        if (cards.length === 3 && cards[0].rank === cards[1].rank && cards[1].rank === cards[2].rank) {
            return 'triple';
        }
        
        // 5-card combinations
        if (cards.length === 5) {
            const sorted = [...cards].sort((a, b) => this.compareCards(a, b));
            const isFlush = cards.every(c => c.suit === cards[0].suit);
            const isStraight = this.isStraight(sorted);
            
            // Straight Flush (highest 5-card combo)
            if (isFlush && isStraight) return 'straight-flush';
            
            // Four of a Kind
            const rankCounts = this.getRankCounts(cards);
            const counts = Object.values(rankCounts);
            if (counts.includes(4)) return 'four-of-a-kind';
            
            // Full House
            if (counts.includes(3) && counts.includes(2)) return 'full-house';
            
            // Flush
            if (isFlush) return 'flush';
            
            // Straight
            if (isStraight) return 'straight';
        }
        
        return null;
    }

    /**
     * Check if cards form a valid straight
     * Note: A-2 wrap is NOT allowed in Pusoy Dos
     */
    isStraight(sortedCards) {
        if (sortedCards.length !== 5) return false;
        
        for (let i = 1; i < sortedCards.length; i++) {
            const prevIdx = this.rankOrder.indexOf(sortedCards[i-1].rank);
            const currIdx = this.rankOrder.indexOf(sortedCards[i].rank);
            
            // Check for A-2 wrap (not allowed)
            if (sortedCards[i-1].rank === 'A' && sortedCards[i].rank === '2') {
                return false;
            }
            
            if (currIdx !== prevIdx + 1) return false;
        }
        return true;
    }

    getRankCounts(cards) {
        const counts = {};
        cards.forEach(c => {
            counts[c.rank] = (counts[c.rank] || 0) + 1;
        });
        return counts;
    }

    /**
     * Get the ranking of 5-card hands (for comparison)
     */
    getFiveCardRank(type) {
        const ranks = {
            'straight': 1,
            'flush': 2,
            'full-house': 3,
            'four-of-a-kind': 4,
            'straight-flush': 5
        };
        return ranks[type] || 0;
    }

    /**
     * Check if new play beats existing play
     */
    canBeat(newCards, existingCards) {
        if (existingCards.length === 0) return true;
        
        const newType = this.getPlayType(newCards);
        const existingType = this.getPlayType(existingCards);
        
        if (!newType) return false;
        
        // Special rule: Straights/flushes can beat single 2s
        if (existingType === 'single' && existingCards[0].rank === '2') {
            if (newType === 'straight' || newType === 'flush' || 
                newType === 'full-house' || newType === 'four-of-a-kind' || 
                newType === 'straight-flush') {
                return true;
            }
        }
        
        // 5-card hands: Higher type beats lower type
        if (newCards.length === 5 && existingCards.length === 5) {
            const newRank = this.getFiveCardRank(newType);
            const existingRank = this.getFiveCardRank(existingType);
            
            if (newRank > existingRank) return true;
            if (newRank < existingRank) return false;
            
            // Same type - compare highest cards
            return this.compareHighestCards(newCards, existingCards, newType);
        }
        
        // Same type and length required for other plays
        if (newType !== existingType) return false;
        if (newCards.length !== existingCards.length) return false;
        
        // Compare highest cards
        const newSorted = [...newCards].sort((a, b) => this.compareCards(b, a));
        const existingSorted = [...existingCards].sort((a, b) => this.compareCards(b, a));
        
        return this.compareCards(newSorted[0], existingSorted[0]) > 0;
    }

    compareHighestCards(newCards, existingCards, type) {
        const newSorted = [...newCards].sort((a, b) => this.compareCards(b, a));
        const existingSorted = [...existingCards].sort((a, b) => this.compareCards(b, a));
        
        if (type === 'full-house' || type === 'four-of-a-kind') {
            // Compare the trips/quads
            const newCounts = this.getRankCounts(newCards);
            const existingCounts = this.getRankCounts(existingCards);
            
            const targetCount = type === 'four-of-a-kind' ? 4 : 3;
            const newTrip = Object.keys(newCounts).find(r => newCounts[r] === targetCount);
            const existingTrip = Object.keys(existingCounts).find(r => existingCounts[r] === targetCount);
            
            return this.rankOrder.indexOf(newTrip) > this.rankOrder.indexOf(existingTrip);
        }
        
        return this.compareCards(newSorted[0], existingSorted[0]) > 0;
    }

    toggleCard(index) {
        if (this.gameOver) return;
        
        const cardIdx = this.selectedCards.indexOf(index);
        if (cardIdx > -1) {
            this.selectedCards.splice(cardIdx, 1);
        } else {
            this.selectedCards.push(index);
        }
        
        this.render();
        this.updatePlayButton();
    }

    updatePlayButton() {
        const playBtn = document.getElementById('play-btn');
        if (!playBtn) return;
        
        const hand = this.playerHands[this.currentPlayer];
        const selectedCards = this.selectedCards.map(i => hand[i]);
        const playType = this.getPlayType(selectedCards);
        const canPlay = playType && this.canBeat(selectedCards, this.playArea);
        
        playBtn.disabled = !canPlay;
    }

    playCards() {
        if (this.selectedCards.length === 0 || this.gameOver) return;
        
        const hand = this.playerHands[this.currentPlayer];
        const cardsToPlay = this.selectedCards
            .sort((a, b) => b - a)
            .map(i => hand.splice(i, 1)[0]);
        
        this.playArea = cardsToPlay;
        this.lastPlayType = this.getPlayType(cardsToPlay);
        this.lastPlayedBy = this.currentPlayer;
        this.passCount = 0;
        this.selectedCards = [];
        
        if (hand.length === 0) {
            this.endGame(this.currentPlayer);
            return;
        }
        
        this.currentPlayer = 1 - this.currentPlayer;
        
        // In local mode, show turn overlay to hide cards during player switch
        if (this.gameMode === 'local') {
            this.showTurnOverlay();
        } else {
            this.render();
            this.updateUI();
        }
        
        if (this.gameMode === 'ai' && this.currentPlayer === 1) {
            setTimeout(() => this.aiPlay(), 1000);
        }
    }

    pass() {
        if (this.gameOver) return;
        
        this.passCount++;
        this.selectedCards = [];
        
        if (this.passCount >= 1 && this.lastPlayedBy !== null && this.lastPlayedBy !== this.currentPlayer) {
            this.startNewRound(this.lastPlayedBy);
        } else {
            this.currentPlayer = 1 - this.currentPlayer;
            
            // In local mode, show turn overlay to hide cards during player switch
            if (this.gameMode === 'local') {
                this.showTurnOverlay();
            } else {
                this.render();
                this.updateUI();
            }
            
            if (this.gameMode === 'ai' && this.currentPlayer === 1) {
                setTimeout(() => this.aiPlay(), 1000);
            }
        }
    }

    startNewRound(starter) {
        this.playArea = [];
        this.passCount = 0;
        this.roundNumber++;
        this.currentPlayer = starter;
        this.lastPlayedBy = null;
        this.lastPlayType = null;
        
        // In local mode, show turn overlay to hide cards during player switch
        if (this.gameMode === 'local') {
            this.showTurnOverlay();
        } else {
            this.render();
            this.updateUI();
        }
        
        if (this.gameMode === 'ai' && starter === 1) {
            setTimeout(() => this.aiPlay(), 1000);
        }
    }

    aiPlay() {
        if (this.gameOver || this.currentPlayer !== 1) return;
        
        const hand = this.playerHands[1];
        const play = this.findBestPlay(hand, this.playArea);
        
        if (play && play.length > 0) {
            this.selectedCards = play.map(card => 
                hand.findIndex(c => c.rank === card.rank && c.suit === card.suit)
            ).filter(i => i !== -1);
            
            if (this.selectedCards.length > 0) {
                this.playCards();
                return;
            }
        }
        
        this.pass();
    }

    findBestPlay(hand, currentPlay) {
        if (currentPlay.length === 0) {
            // Can play anything - play lowest single
            return hand.length > 0 ? [hand[0]] : null;
        }
        
        const playType = this.getPlayType(currentPlay);
        
        // Try to find beating plays
        if (playType === 'single') {
            // Check if it's a 2 - try to beat with combo
            if (currentPlay[0].rank === '2' && hand.length >= 5) {
                const straight = this.findStraight(hand);
                if (straight) return straight;
            }
            
            for (const card of hand) {
                if (this.canBeat([card], currentPlay)) return [card];
            }
        } else if (playType === 'pair') {
            for (let i = 0; i < hand.length - 1; i++) {
                if (hand[i].rank === hand[i + 1].rank) {
                    const pair = [hand[i], hand[i + 1]];
                    if (this.canBeat(pair, currentPlay)) return pair;
                }
            }
        } else if (playType === 'triple') {
            for (let i = 0; i < hand.length - 2; i++) {
                if (hand[i].rank === hand[i + 1].rank && hand[i + 1].rank === hand[i + 2].rank) {
                    const triple = [hand[i], hand[i + 1], hand[i + 2]];
                    if (this.canBeat(triple, currentPlay)) return triple;
                }
            }
        } else if (currentPlay.length === 5) {
            // Try to find a beating 5-card combo
            const combos = this.findFiveCardCombos(hand);
            for (const combo of combos) {
                if (this.canBeat(combo, currentPlay)) return combo;
            }
        }
        
        return null;
    }

    findStraight(hand) {
        if (hand.length < 5) return null;
        
        for (let i = 0; i <= hand.length - 5; i++) {
            const potential = [];
            let lastRankIdx = -2;
            
            for (const card of hand) {
                const rankIdx = this.rankOrder.indexOf(card.rank);
                if (potential.length === 0 || rankIdx === lastRankIdx + 1) {
                    // Don't allow A-2 wrap
                    if (potential.length > 0) {
                        const lastCard = potential[potential.length - 1];
                        if (lastCard.rank === 'A' && card.rank === '2') continue;
                    }
                    potential.push(card);
                    lastRankIdx = rankIdx;
                    if (potential.length === 5) return potential;
                } else if (rankIdx > lastRankIdx + 1) {
                    potential.length = 0;
                    potential.push(card);
                    lastRankIdx = rankIdx;
                }
            }
        }
        return null;
    }

    findFiveCardCombos(hand) {
        const combos = [];
        
        // Find straights
        const straight = this.findStraight(hand);
        if (straight) combos.push(straight);
        
        return combos;
    }

    endGame(winner) {
        this.gameOver = true;
        
        const modal = document.getElementById('game-over-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        
        const loserCards = this.playerHands[1 - winner].length;
        
        if (this.gameMode === 'ai') {
            if (winner === 0) {
                title.textContent = '🎉 You Win!';
                message.textContent = `Congratulations! You got rid of all your cards! The computer had ${loserCards} cards left.`;
            } else {
                title.textContent = '😔 You Lose!';
                message.textContent = `The computer got rid of all their cards first. You had ${loserCards} cards left.`;
            }
        } else {
            title.textContent = `🎉 Player ${winner + 1} Wins!`;
            message.textContent = `Player ${winner + 1} got rid of all their cards! Player ${(1 - winner) + 1} had ${loserCards} cards left.`;
        }
        
        modal.classList.add('show');
    }

    render() {
        this.renderOpponentHand();
        this.renderPlayArea();
        this.renderPlayerHand();
    }

    renderOpponentHand() {
        const container = document.getElementById('opponent-hand');
        const label = document.querySelector('.opponent-label');
        if (!container) return;
        
        const opponentIdx = this.gameMode === 'ai' ? 1 : (1 - this.currentPlayer);
        const opponentHand = this.playerHands[opponentIdx];
        
        container.innerHTML = '';
        
        for (let i = 0; i < opponentHand.length; i++) {
            const card = document.createElement('div');
            card.className = 'opponent-card';
            container.appendChild(card);
        }
        
        if (label) {
            const name = this.gameMode === 'ai' ? 'Computer' : `Player ${(1 - this.currentPlayer) + 1} (waiting)`;
            label.innerHTML = `${name} (<span id="opponent-cards">${opponentHand.length}</span> cards)`;
        }
    }

    renderPlayArea() {
        const container = document.getElementById('played-cards');
        const typeLabel = document.getElementById('play-type');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.playArea.length === 0) {
            container.innerHTML = '<span style="color: rgba(255,255,255,0.3);">No cards played</span>';
            if (typeLabel) typeLabel.textContent = '';
            return;
        }
        
        for (const card of this.playArea) {
            container.appendChild(this.createCardElement(card, false));
        }
        
        if (typeLabel && this.lastPlayType) {
            const typeNames = {
                'single': 'Single',
                'pair': 'Pair',
                'triple': 'Triple',
                'straight': 'Straight',
                'flush': 'Flush',
                'full-house': 'Full House',
                'four-of-a-kind': 'Four of a Kind',
                'straight-flush': 'Straight Flush'
            };
            typeLabel.textContent = typeNames[this.lastPlayType] || '';
        }
    }

    renderPlayerHand() {
        const container = document.getElementById('player-hand');
        const label = document.querySelector('.player-label');
        if (!container) return;
        
        const hand = this.playerHands[this.currentPlayer];
        container.innerHTML = '';
        
        hand.forEach((card, index) => {
            const cardEl = this.createCardElement(card, true, index);
            if (this.selectedCards.includes(index)) {
                cardEl.classList.add('selected');
            }
            container.appendChild(cardEl);
        });
        
        if (label) {
            label.textContent = this.gameMode === 'local' ? `Player ${this.currentPlayer + 1}'s Hand` : 'Your Hand';
        }
    }

    createCardElement(card, interactive, index) {
        const cardEl = document.createElement('div');
        const isRed = card.suit === '♥' || card.suit === '♦';
        cardEl.className = `card ${isRed ? 'red' : 'black'}`;
        
        if (interactive) {
            cardEl.tabIndex = 0;
            cardEl.setAttribute('role', 'button');
            cardEl.setAttribute('aria-label', `${card.rank} of ${this.getSuitName(card.suit)}`);
            cardEl.addEventListener('click', () => this.toggleCard(index));
            cardEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleCard(index);
                }
            });
        }
        
        cardEl.innerHTML = `<span class="rank">${card.rank}</span><span class="suit">${card.suit}</span>`;
        return cardEl;
    }

    getSuitName(suit) {
        return { '♠': 'Spades', '♣': 'Clubs', '♦': 'Diamonds', '♥': 'Hearts' }[suit] || suit;
    }

    updateUI() {
        const currentTurn = document.getElementById('current-turn');
        const cardsLeft = document.getElementById('cards-left');
        const roundNumber = document.getElementById('round-number');
        const passBtn = document.getElementById('pass-btn');
        
        if (currentTurn) {
            currentTurn.textContent = this.gameMode === 'local' 
                ? `Player ${this.currentPlayer + 1}'s Turn` 
                : (this.currentPlayer === 0 ? 'Your Turn' : "Computer's Turn");
        }
        if (cardsLeft) cardsLeft.textContent = this.playerHands[this.currentPlayer].length;
        if (roundNumber) roundNumber.textContent = this.roundNumber;
        
        const canInteract = !this.gameOver && (this.gameMode === 'local' || this.currentPlayer === 0);
        if (passBtn) passBtn.disabled = !canInteract;
        
        this.updatePlayButton();
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    const game = new PusoyDos();
    
    document.getElementById('mode-ai')?.addEventListener('click', () => {
        document.getElementById('mode-ai')?.classList.add('active');
        document.getElementById('mode-local')?.classList.remove('active');
        game.gameMode = 'ai';
        game.initGame('ai');
    });
    
    document.getElementById('mode-local')?.addEventListener('click', () => {
        document.getElementById('mode-local')?.classList.add('active');
        document.getElementById('mode-ai')?.classList.remove('active');
        game.gameMode = 'local';
        game.initGame('local');
    });
    
    document.getElementById('play-btn')?.addEventListener('click', () => game.playCards());
    document.getElementById('pass-btn')?.addEventListener('click', () => game.pass());
    document.getElementById('new-game-btn')?.addEventListener('click', () => game.initGame(game.gameMode));
    document.getElementById('modal-new-game-btn')?.addEventListener('click', () => {
        document.getElementById('game-over-modal').classList.remove('show');
        game.initGame(game.gameMode);
    });
    
    document.getElementById('toggle-instructions-btn')?.addEventListener('click', () => {
        const instructions = document.getElementById('instructions');
        instructions.style.display = instructions.style.display === 'none' ? 'block' : 'none';
    });
    
    game.initGame('ai');
});
