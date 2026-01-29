/**
 * Memory Game Logic
 * Match pairs of cards to win
 * Part of the 9DTTT Game Library
 */

class MemoryGame {
    constructor() {
        this.gridSize = 4; // 4x4 grid = 16 cards = 8 pairs
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.totalPairs = 0;
        this.moves = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.isLocked = false;
        this.gameStarted = false;
        
        // Card symbols (emojis)
        this.symbols = [
            '🌟', '🎈', '🎨', '🎭', '🎪', '🎯', '🎲', '🎸',
            '🌈', '🌸', '🍀', '🍎', '🍕', '🎂', '🎁', '🎄',
            '🐱', '🐶', '🦋', '🦄', '🌙', '⭐', '💎', '🔮'
        ];
    }

    /**
     * Initialize the game
     */
    initGame() {
        this.stopTimer();
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.timer = 0;
        this.isLocked = false;
        this.gameStarted = false;
        
        // Calculate pairs based on grid size
        // Size 2 = 2x4 grid (8 cards, 4 pairs)
        // Size 4 = 4x4 grid (16 cards, 8 pairs)
        // Size 6 = 6x6 grid (36 cards, 18 pairs)
        if (this.gridSize === 2) {
            this.totalPairs = 4; // 2x4 = 8 cards
            this.gridCols = 4;
            this.gridRows = 2;
        } else {
            this.totalPairs = (this.gridSize * this.gridSize) / 2;
            this.gridCols = this.gridSize;
            this.gridRows = this.gridSize;
        }
        
        this.generateCards();
        this.renderGrid();
        this.updateUI();
    }

    /**
     * Generate shuffled card pairs
     */
    generateCards() {
        const numPairs = this.totalPairs;
        const selectedSymbols = this.shuffle([...this.symbols]).slice(0, numPairs);
        
        // Create pairs
        const cardPairs = [];
        selectedSymbols.forEach((symbol, index) => {
            cardPairs.push({ id: index * 2, symbol, matched: false });
            cardPairs.push({ id: index * 2 + 1, symbol, matched: false });
        });
        
        // Shuffle cards
        this.cards = this.shuffle(cardPairs);
    }

    /**
     * Shuffle array using Fisher-Yates algorithm
     */
    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    /**
     * Render the card grid
     */
    renderGrid() {
        const grid = document.getElementById('memory-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        grid.className = `memory-grid grid-${this.gridSize}`;
        
        this.cards.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'memory-card';
            cardEl.dataset.index = index;
            cardEl.tabIndex = 0;
            cardEl.setAttribute('role', 'button');
            cardEl.setAttribute('aria-label', `Card ${index + 1}, face down`);
            
            cardEl.innerHTML = `
                <div class="card-inner">
                    <div class="card-front"></div>
                    <div class="card-back">${card.symbol}</div>
                </div>
            `;
            
            cardEl.addEventListener('click', () => this.flipCard(index));
            cardEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.flipCard(index);
                }
            });
            
            grid.appendChild(cardEl);
        });
    }

    /**
     * Flip a card
     */
    flipCard(index) {
        if (this.isLocked) return;
        if (this.flippedCards.length >= 2) return;
        if (this.cards[index].matched) return;
        if (this.flippedCards.some(c => c.index === index)) return;
        
        // Start timer on first flip
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.startTimer();
        }
        
        const card = this.cards[index];
        const cardEl = document.querySelector(`[data-index="${index}"]`);
        
        cardEl.classList.add('flipped');
        cardEl.setAttribute('aria-label', `Card ${index + 1}, showing ${card.symbol}`);
        
        this.flippedCards.push({ index, card });
        
        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateUI();
            this.checkMatch();
        }
    }

    /**
     * Check if two flipped cards match
     */
    checkMatch() {
        const [first, second] = this.flippedCards;
        
        if (first.card.symbol === second.card.symbol) {
            // Match found!
            this.matchedPairs++;
            first.card.matched = true;
            second.card.matched = true;
            
            const card1El = document.querySelector(`[data-index="${first.index}"]`);
            const card2El = document.querySelector(`[data-index="${second.index}"]`);
            
            card1El.classList.add('matched');
            card2El.classList.add('matched');
            
            this.flippedCards = [];
            this.updateUI();
            
            // Check for win
            if (this.matchedPairs === this.totalPairs) {
                this.gameWon();
            }
        } else {
            // No match - flip back after delay
            this.isLocked = true;
            setTimeout(() => {
                const card1El = document.querySelector(`[data-index="${first.index}"]`);
                const card2El = document.querySelector(`[data-index="${second.index}"]`);
                
                if (card1El) {
                    card1El.classList.remove('flipped');
                    card1El.setAttribute('aria-label', `Card ${first.index + 1}, face down`);
                }
                if (card2El) {
                    card2El.classList.remove('flipped');
                    card2El.setAttribute('aria-label', `Card ${second.index + 1}, face down`);
                }
                
                this.flippedCards = [];
                this.isLocked = false;
            }, 1000);
        }
    }

    /**
     * Handle game won
     */
    gameWon() {
        this.stopTimer();
        
        const modal = document.getElementById('game-over-modal');
        const message = document.getElementById('modal-message');
        
        let rating = '';
        const perfectMoves = this.totalPairs;
        if (this.moves <= perfectMoves + 2) {
            rating = '⭐⭐⭐ Perfect!';
        } else if (this.moves <= perfectMoves * 2) {
            rating = '⭐⭐ Great!';
        } else {
            rating = '⭐ Good!';
        }
        
        message.innerHTML = `
            You found all ${this.totalPairs} pairs!<br><br>
            Moves: ${this.moves}<br>
            Time: ${this.timer} seconds<br><br>
            ${rating}
        `;
        
        modal.classList.add('show');
    }

    /**
     * Start the timer
     */
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimerDisplay();
        }, 1000);
    }

    /**
     * Stop the timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * Update timer display
     */
    updateTimerDisplay() {
        const timerEl = document.getElementById('timer');
        if (timerEl) {
            timerEl.textContent = this.timer;
        }
    }

    /**
     * Update UI elements
     */
    updateUI() {
        document.getElementById('move-count').textContent = this.moves;
        document.getElementById('match-count').textContent = this.matchedPairs;
        document.getElementById('total-pairs').textContent = this.totalPairs;
        this.updateTimerDisplay();
    }

    /**
     * Set grid size
     */
    setGridSize(size) {
        this.gridSize = size;
        this.initGame();
    }
    
    /**
     * Setup gamepad controls for card selection
     */
    setupGamepadControls() {
        if (!window.gamepadManager) return;
        
        this.selectedCardIndex = 0;
        this.highlightCard(this.selectedCardIndex);
        
        window.gamepadManager.on('buttondown', (data) => this.handleGamepadInput(data));
    }
    
    handleGamepadInput(data) {
        const { button, playerIndex } = data;
        
        // Only respond to player 1 gamepad
        if (playerIndex !== 0) return;
        
        // Determine grid dimensions
        const cols = this.gridCols;
        const rows = this.gridRows;
        const totalCards = this.cards.length;
        
        // Calculate current row/col for boundary checking
        const currentRow = Math.floor(this.selectedCardIndex / cols);
        const currentCol = this.selectedCardIndex % cols;
        
        switch (button) {
            case 'up':
                if (currentRow > 0) {
                    this.selectedCardIndex = this.selectedCardIndex - cols;
                }
                this.highlightCard(this.selectedCardIndex);
                window.gamepadManager.vibrate(0, 20, 0.1, 0);
                break;
            case 'down':
                if (currentRow < rows - 1 && this.selectedCardIndex + cols < totalCards) {
                    this.selectedCardIndex = this.selectedCardIndex + cols;
                }
                this.highlightCard(this.selectedCardIndex);
                window.gamepadManager.vibrate(0, 20, 0.1, 0);
                break;
            case 'left':
                // Only move left if not at left edge of current row
                if (currentCol > 0) {
                    this.selectedCardIndex--;
                }
                this.highlightCard(this.selectedCardIndex);
                window.gamepadManager.vibrate(0, 20, 0.1, 0);
                break;
            case 'right':
                // Only move right if not at right edge of current row
                if (currentCol < cols - 1 && this.selectedCardIndex + 1 < totalCards) {
                    this.selectedCardIndex++;
                }
                this.highlightCard(this.selectedCardIndex);
                window.gamepadManager.vibrate(0, 20, 0.1, 0);
                break;
            case 'a': // Flip card
                this.flipCard(this.selectedCardIndex);
                window.gamepadManager.vibrate(0, 50, 0.3, 0.1);
                break;
            case 'y': // New game
                this.initGame();
                this.selectedCardIndex = 0;
                this.highlightCard(this.selectedCardIndex);
                break;
            case 'lb': // Previous difficulty
                this.cycleDifficulty(-1);
                break;
            case 'rb': // Next difficulty
                this.cycleDifficulty(1);
                break;
        }
    }
    
    highlightCard(index) {
        // Remove previous highlight
        document.querySelectorAll('.memory-card').forEach(card => card.classList.remove('gamepad-selected'));
        
        // Add highlight to selected card
        const card = document.querySelector(`.memory-card[data-index="${index}"]`);
        if (card) {
            card.classList.add('gamepad-selected');
            card.focus();
        }
    }
    
    cycleDifficulty(direction) {
        const difficulties = [2, 4, 6];
        const currentIndex = difficulties.indexOf(this.gridSize);
        let newIndex = currentIndex + direction;
        
        if (newIndex < 0) newIndex = difficulties.length - 1;
        if (newIndex >= difficulties.length) newIndex = 0;
        
        // Update UI
        document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
        const newBtn = document.querySelector(`.difficulty-btn[data-size="${difficulties[newIndex]}"]`);
        if (newBtn) {
            newBtn.classList.add('active');
        }
        
        this.setGridSize(difficulties[newIndex]);
        this.selectedCardIndex = 0;
        this.highlightCard(this.selectedCardIndex);
        window.gamepadManager.vibrate(0, 30, 0.15, 0);
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const game = new MemoryGame();
    
    // Setup difficulty buttons
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            game.setGridSize(parseInt(btn.dataset.size));
        });
    });
    
    // Setup control buttons
    document.getElementById('new-game-btn')?.addEventListener('click', () => game.initGame());
    document.getElementById('modal-new-game-btn')?.addEventListener('click', () => {
        document.getElementById('game-over-modal').classList.remove('show');
        game.initGame();
    });
    
    // Instructions toggle
    document.getElementById('toggle-instructions-btn')?.addEventListener('click', () => {
        const instructions = document.getElementById('instructions');
        instructions.style.display = instructions.style.display === 'none' ? 'block' : 'none';
    });
    
    // Start the game
    game.initGame();
    game.setupGamepadControls();
});
