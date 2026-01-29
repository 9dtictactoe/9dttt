/**
 * Farkle Game Logic
 * Classic dice game with 1000-to-start rule
 * Part of the 9DTTT Game Library
 */

class Farkle {
    constructor() {
        this.DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        this.WINNING_SCORE = 10000;
        this.START_THRESHOLD = 1000; // Must score this in one turn to "get on the board"
        
        // Game state
        this.currentPlayer = 1;
        this.scores = { 1: 0, 2: 0 };
        this.hasStarted = { 1: false, 2: false }; // Track if player has reached 1000 threshold
        this.turnScore = 0;
        this.rollScore = 0;
        
        // Dice state
        this.diceValues = [1, 1, 1, 1, 1, 1];
        this.diceHeld = [false, false, false, false, false, false]; // Currently selected for scoring
        this.diceUsed = [false, false, false, false, false, false]; // Already scored this turn
        
        this.hasRolled = false;
        this.isRolling = false;
        this.gameOver = false;
        this.finalRound = false;
        this.finalRoundStarter = null;
    }

    /**
     * Initialize the game
     */
    initGame() {
        this.currentPlayer = 1;
        this.scores = { 1: 0, 2: 0 };
        this.hasStarted = { 1: false, 2: false };
        this.turnScore = 0;
        this.rollScore = 0;
        this.diceValues = [1, 1, 1, 1, 1, 1];
        this.diceHeld = [false, false, false, false, false, false];
        this.diceUsed = [false, false, false, false, false, false];
        this.hasRolled = false;
        this.isRolling = false;
        this.gameOver = false;
        this.finalRound = false;
        this.finalRoundStarter = null;
        
        this.renderDice();
        this.updateUI();
        this.hideAlert();
    }

    /**
     * Roll the dice
     */
    rollDice() {
        if (this.isRolling || this.gameOver) return;
        
        // If dice are selected, we need to confirm the selection first
        if (this.hasRolled && this.diceHeld.some(h => h)) {
            this.confirmSelection();
        }
        
        // Check if we have dice to roll
        const availableDice = this.diceUsed.filter(u => !u).length;
        if (availableDice === 0) {
            // Hot dice! Reset all dice
            this.diceUsed = [false, false, false, false, false, false];
            this.showHotDice();
        }
        
        this.isRolling = true;
        this.hideAlert();
        
        const rollBtn = document.getElementById('roll-btn');
        if (rollBtn) rollBtn.disabled = true;
        
        // Animate dice
        const diceToRoll = [];
        for (let i = 0; i < 6; i++) {
            if (!this.diceUsed[i]) {
                diceToRoll.push(i);
                const diceEl = document.getElementById(`dice-${i}`);
                if (diceEl) diceEl.classList.add('rolling');
            }
        }
        
        // Roll animation
        let rollCount = 0;
        const rollInterval = setInterval(() => {
            for (const i of diceToRoll) {
                this.diceValues[i] = Math.floor(Math.random() * 6) + 1;
            }
            this.renderDice();
            rollCount++;
            
            if (rollCount >= 10) {
                clearInterval(rollInterval);
                document.querySelectorAll('.farkle-dice').forEach(d => d.classList.remove('rolling'));
                this.isRolling = false;
                this.hasRolled = true;
                this.diceHeld = [false, false, false, false, false, false];
                
                // Check for farkle
                if (this.checkFarkle()) {
                    this.handleFarkle();
                } else {
                    if (rollBtn) rollBtn.disabled = false;
                    this.highlightScoringDice();
                }
                
                this.updateUI();
            }
        }, 50);
    }

    /**
     * Check if the roll is a farkle (no scoring dice)
     */
    checkFarkle() {
        const availableDice = [];
        for (let i = 0; i < 6; i++) {
            if (!this.diceUsed[i]) {
                availableDice.push(this.diceValues[i]);
            }
        }
        
        return this.calculateBestScore(availableDice) === 0;
    }

    /**
     * Handle a farkle
     */
    handleFarkle() {
        this.showFarkle();
        this.turnScore = 0;
        this.rollScore = 0;
        
        // Wait then end turn
        setTimeout(() => {
            this.endTurn();
        }, 2000);
    }

    /**
     * Toggle dice selection
     */
    toggleDice(index) {
        if (this.isRolling || !this.hasRolled || this.diceUsed[index] || this.gameOver) return;
        
        this.diceHeld[index] = !this.diceHeld[index];
        
        // Calculate score for selected dice
        this.calculateSelectionScore();
        
        this.renderDice();
        this.updateUI();
    }

    /**
     * Calculate score for currently selected dice
     */
    calculateSelectionScore() {
        const selectedValues = [];
        for (let i = 0; i < 6; i++) {
            if (this.diceHeld[i] && !this.diceUsed[i]) {
                selectedValues.push(this.diceValues[i]);
            }
        }
        
        this.rollScore = this.calculateScore(selectedValues);
    }

    /**
     * Calculate score for a set of dice values
     */
    calculateScore(values) {
        if (values.length === 0) return 0;
        
        const counts = [0, 0, 0, 0, 0, 0, 0]; // Index 1-6 for dice values
        values.forEach(v => counts[v]++);
        
        let score = 0;
        let usedDice = 0;
        
        // Check for 1-2-3-4-5-6 straight (1500 points)
        if (values.length === 6 && counts[1] === 1 && counts[2] === 1 && 
            counts[3] === 1 && counts[4] === 1 && counts[5] === 1 && counts[6] === 1) {
            return 1500;
        }
        
        // Check for three pairs (1500 points)
        if (values.length === 6) {
            const pairs = counts.filter(c => c === 2).length;
            if (pairs === 3) {
                return 1500;
            }
        }
        
        // Check for two triplets (2500 points)
        if (values.length === 6) {
            const triplets = counts.filter(c => c === 3).length;
            if (triplets === 2) {
                return 2500;
            }
        }
        
        // Check for six of a kind
        for (let i = 1; i <= 6; i++) {
            if (counts[i] === 6) {
                const baseScore = i === 1 ? 1000 : i * 100;
                return baseScore * 4;
            }
        }
        
        // Check for five of a kind
        for (let i = 1; i <= 6; i++) {
            if (counts[i] === 5) {
                const baseScore = i === 1 ? 1000 : i * 100;
                score += baseScore * 3;
                counts[i] -= 5;
                usedDice += 5;
            }
        }
        
        // Check for four of a kind
        for (let i = 1; i <= 6; i++) {
            if (counts[i] === 4) {
                const baseScore = i === 1 ? 1000 : i * 100;
                score += baseScore * 2;
                counts[i] -= 4;
                usedDice += 4;
            }
        }
        
        // Check for three of a kind
        for (let i = 1; i <= 6; i++) {
            if (counts[i] >= 3) {
                const baseScore = i === 1 ? 1000 : i * 100;
                score += baseScore;
                counts[i] -= 3;
                usedDice += 3;
            }
        }
        
        // Count remaining 1s (100 each)
        score += counts[1] * 100;
        usedDice += counts[1];
        
        // Count remaining 5s (50 each)
        score += counts[5] * 50;
        usedDice += counts[5];
        
        // If not all dice scored, check if selection is valid
        const remainingNonScoring = counts[2] + counts[3] + counts[4] + counts[6];
        if (remainingNonScoring > 0) {
            // Invalid selection - includes non-scoring dice
            return 0;
        }
        
        return score;
    }

    /**
     * Calculate best possible score from a set of dice (for farkle check)
     */
    calculateBestScore(values) {
        if (values.length === 0) return 0;
        
        const counts = [0, 0, 0, 0, 0, 0, 0];
        values.forEach(v => counts[v]++);
        
        let score = 0;
        
        // Check special combinations first
        if (values.length === 6) {
            if (counts[1] === 1 && counts[2] === 1 && counts[3] === 1 && 
                counts[4] === 1 && counts[5] === 1 && counts[6] === 1) {
                return 1500;
            }
            
            const pairs = counts.filter(c => c === 2).length;
            if (pairs === 3) return 1500;
            
            const triplets = counts.filter(c => c === 3).length;
            if (triplets === 2) return 2500;
        }
        
        // Check for multiples
        for (let i = 1; i <= 6; i++) {
            if (counts[i] >= 6) {
                const baseScore = i === 1 ? 1000 : i * 100;
                score += baseScore * 4;
                counts[i] -= 6;
            } else if (counts[i] >= 5) {
                const baseScore = i === 1 ? 1000 : i * 100;
                score += baseScore * 3;
                counts[i] -= 5;
            } else if (counts[i] >= 4) {
                const baseScore = i === 1 ? 1000 : i * 100;
                score += baseScore * 2;
                counts[i] -= 4;
            } else if (counts[i] >= 3) {
                const baseScore = i === 1 ? 1000 : i * 100;
                score += baseScore;
                counts[i] -= 3;
            }
        }
        
        // Remaining 1s and 5s
        score += counts[1] * 100;
        score += counts[5] * 50;
        
        return score;
    }

    /**
     * Confirm dice selection and add to turn score
     */
    confirmSelection() {
        if (this.rollScore === 0) return;
        
        // Mark selected dice as used
        for (let i = 0; i < 6; i++) {
            if (this.diceHeld[i]) {
                this.diceUsed[i] = true;
            }
        }
        
        this.turnScore += this.rollScore;
        this.rollScore = 0;
        this.diceHeld = [false, false, false, false, false, false];
        
        // Check for hot dice
        const unusedCount = this.diceUsed.filter(u => !u).length;
        if (unusedCount === 0) {
            // All dice scored - hot dice!
            this.diceUsed = [false, false, false, false, false, false];
        }
        
        this.renderDice();
        this.updateUI();
    }

    /**
     * Bank points and end turn
     */
    bankPoints() {
        if (this.gameOver) return;
        
        // Must have rolled and selected scoring dice
        if (!this.hasRolled) return;
        
        // Confirm any selected dice first
        if (this.diceHeld.some(h => h) && this.rollScore > 0) {
            this.confirmSelection();
        }
        
        if (this.turnScore === 0) return;
        
        const player = this.currentPlayer;
        
        // Check 1000-to-start rule
        if (!this.hasStarted[player]) {
            if (this.turnScore >= this.START_THRESHOLD) {
                this.hasStarted[player] = true;
                this.scores[player] += this.turnScore;
                this.showNotification(`Player ${player} is on the board with ${this.turnScore} points!`, 'success');
            } else {
                this.showNotification(`Need ${this.START_THRESHOLD} to start! You only had ${this.turnScore}.`, 'error');
                // Points are lost
            }
        } else {
            this.scores[player] += this.turnScore;
        }
        
        // Check for win condition
        if (this.scores[player] >= this.WINNING_SCORE && !this.finalRound) {
            this.finalRound = true;
            this.finalRoundStarter = player;
            this.showNotification(`Player ${player} reached ${this.WINNING_SCORE}! Other player gets one more turn!`, 'info');
        }
        
        this.endTurn();
    }

    /**
     * End the current turn
     */
    endTurn() {
        // Check if game is over (final round completed)
        if (this.finalRound && this.currentPlayer !== this.finalRoundStarter) {
            this.endGame();
            return;
        }
        
        // Switch player
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        
        // Check if game is over (came back to final round starter)
        if (this.finalRound && this.currentPlayer === this.finalRoundStarter) {
            this.endGame();
            return;
        }
        
        // Reset turn state
        this.turnScore = 0;
        this.rollScore = 0;
        this.diceHeld = [false, false, false, false, false, false];
        this.diceUsed = [false, false, false, false, false, false];
        this.hasRolled = false;
        
        this.hideAlert();
        this.renderDice();
        this.updateUI();
    }

    /**
     * End the game
     */
    endGame() {
        this.gameOver = true;
        
        const modal = document.getElementById('game-over-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        
        let winner;
        if (this.scores[1] > this.scores[2]) {
            winner = 1;
        } else if (this.scores[2] > this.scores[1]) {
            winner = 2;
        } else {
            winner = 0; // Tie
        }
        
        if (winner === 0) {
            title.textContent = "🤝 It's a Tie!";
        } else {
            title.textContent = `🎉 Player ${winner} Wins!`;
        }
        
        message.innerHTML = `
            <strong>Final Scores:</strong><br>
            Player 1: ${this.scores[1].toLocaleString()} points<br>
            Player 2: ${this.scores[2].toLocaleString()} points
        `;
        
        modal.classList.add('show');
    }

    /**
     * Highlight scoring dice after a roll
     */
    highlightScoringDice() {
        for (let i = 0; i < 6; i++) {
            if (this.diceUsed[i]) continue;
            
            const value = this.diceValues[i];
            const diceEl = document.getElementById(`dice-${i}`);
            if (!diceEl) continue;
            
            // Check if this die can score
            const canScore = value === 1 || value === 5 || this.isPartOfSet(i);
            
            if (canScore) {
                diceEl.classList.add('scoring');
            } else {
                diceEl.classList.add('non-scoring');
            }
        }
        
        // Remove highlights after a moment
        setTimeout(() => {
            document.querySelectorAll('.farkle-dice').forEach(d => {
                d.classList.remove('scoring', 'non-scoring');
            });
        }, 1000);
    }

    /**
     * Check if a die is part of a scoring set (three or more of a kind)
     */
    isPartOfSet(index) {
        const value = this.diceValues[index];
        let count = 0;
        
        for (let i = 0; i < 6; i++) {
            if (!this.diceUsed[i] && this.diceValues[i] === value) {
                count++;
            }
        }
        
        return count >= 3;
    }

    /**
     * Render dice
     */
    renderDice() {
        for (let i = 0; i < 6; i++) {
            const diceEl = document.getElementById(`dice-${i}`);
            if (!diceEl) continue;
            
            const faceEl = diceEl.querySelector('.dice-face');
            faceEl.textContent = this.DICE_FACES[this.diceValues[i] - 1];
            
            diceEl.classList.remove('selected', 'held', 'used');
            
            if (this.diceUsed[i]) {
                diceEl.classList.add('used');
            } else if (this.diceHeld[i]) {
                diceEl.classList.add('selected');
            }
        }
    }

    /**
     * Update UI
     */
    updateUI() {
        // Current player
        const turnEl = document.getElementById('turn-indicator');
        if (turnEl) {
            turnEl.innerHTML = `Current Player: <span class="player-${this.currentPlayer}">Player ${this.currentPlayer}</span>`;
        }
        
        // Scores
        for (let p = 1; p <= 2; p++) {
            const scoreEl = document.getElementById(`score-${p}`);
            if (scoreEl) scoreEl.textContent = this.scores[p].toLocaleString();
            
            const onboardEl = document.getElementById(`onboard-${p}`);
            if (onboardEl) {
                onboardEl.textContent = this.hasStarted[p] ? '' : '(not on board)';
            }
        }
        
        // 1000-to-start status
        for (let p = 1; p <= 2; p++) {
            const indicator = document.getElementById(`p${p}-start`);
            const statusIcon = document.getElementById(`p${p}-status`);
            const statusText = indicator?.querySelector('.status-text');
            
            if (this.hasStarted[p]) {
                indicator?.classList.add('achieved');
                if (statusIcon) statusIcon.textContent = '✅';
                if (statusText) statusText.textContent = 'On board!';
            } else {
                indicator?.classList.remove('achieved');
                if (statusIcon) statusIcon.textContent = '❌';
                if (statusText) statusText.textContent = 'Need 1000';
            }
        }
        
        // Turn and roll scores
        document.getElementById('turn-score').textContent = this.turnScore.toLocaleString();
        document.getElementById('roll-score').textContent = this.rollScore.toLocaleString();
        
        // Selection info
        const infoEl = document.getElementById('selection-info');
        if (infoEl) {
            if (!this.hasRolled) {
                infoEl.textContent = 'Roll the dice to start your turn!';
            } else if (this.rollScore > 0) {
                infoEl.textContent = `Selected dice worth ${this.rollScore} points. Roll again or bank your turn!`;
            } else if (this.diceHeld.some(h => h)) {
                infoEl.textContent = 'Invalid selection - only scoring combinations count!';
            } else {
                infoEl.textContent = 'Select scoring dice to keep, then roll again or bank your points!';
            }
        }
        
        // Buttons
        const rollBtn = document.getElementById('roll-btn');
        const bankBtn = document.getElementById('bank-btn');
        
        if (rollBtn) {
            rollBtn.disabled = this.isRolling || this.gameOver;
            if (!this.hasRolled) {
                rollBtn.textContent = '🎲 Roll Dice';
            } else {
                const remaining = 6 - this.diceUsed.filter(u => u).length - this.diceHeld.filter(h => h).length;
                rollBtn.textContent = `🎲 Roll (${remaining} dice)`;
            }
        }
        
        if (bankBtn) {
            const canBank = this.hasRolled && (this.turnScore > 0 || this.rollScore > 0);
            bankBtn.disabled = !canBank || this.gameOver;
            
            const totalToBank = this.turnScore + this.rollScore;
            if (totalToBank > 0) {
                bankBtn.textContent = `💰 Bank ${totalToBank.toLocaleString()}`;
            } else {
                bankBtn.textContent = '💰 Bank Points';
            }
        }
    }

    /**
     * Show farkle alert
     */
    showFarkle() {
        const alert = document.getElementById('farkle-alert');
        if (alert) {
            alert.style.display = 'block';
        }
    }

    /**
     * Hide all alerts
     */
    hideAlert() {
        const alert = document.getElementById('farkle-alert');
        if (alert) {
            alert.style.display = 'none';
        }
    }

    /**
     * Show hot dice notification
     */
    showHotDice() {
        this.showNotification('🔥 HOT DICE! All dice scored - roll all 6 again!', 'success');
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        let notification = document.querySelector('.game-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'game-notification';
            document.body.appendChild(notification);
        }
        
        notification.textContent = message;
        notification.className = `game-notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const game = new Farkle();
    
    // Setup dice click handlers
    for (let i = 0; i < 6; i++) {
        document.getElementById(`dice-${i}`)?.addEventListener('click', () => game.toggleDice(i));
    }
    
    // Setup buttons
    document.getElementById('roll-btn')?.addEventListener('click', () => game.rollDice());
    document.getElementById('bank-btn')?.addEventListener('click', () => game.bankPoints());
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
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'r') {
            game.rollDice();
        } else if (e.key.toLowerCase() === 'b') {
            game.bankPoints();
        } else if (e.key >= '1' && e.key <= '6') {
            game.toggleDice(parseInt(e.key) - 1);
        }
    });
    
    // Start the game
    game.initGame();
});
