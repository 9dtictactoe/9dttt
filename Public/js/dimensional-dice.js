/**
 * Dimensional Dice Game Logic
 * Strategic dice game across multiple dimensions
 * Part of the 9DTTT Game Library
 */

class DimensionalDice {
    constructor() {
        this.DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        this.currentPlayer = 1;
        this.scores = { 1: 0, 2: 0 };
        this.dimensionScores = {
            1: { 1: 0, 2: 0, 3: 0 },
            2: { 1: 0, 2: 0, 3: 0 }
        };
        this.diceValues = [1, 1, 1];
        this.heldDice = [false, false, false];
        this.rollsLeft = 3;
        this.currentRound = 1;
        this.totalRounds = 5;
        this.selectedDimension = 1;
        this.gameOver = false;
        this.isRolling = false;
        
        // Dimension grids (3x3 each, for each player)
        this.grids = {
            1: { 1: Array(9).fill(null), 2: Array(9).fill(null), 3: Array(9).fill(null) },
            2: { 1: Array(9).fill(null), 2: Array(9).fill(null), 3: Array(9).fill(null) }
        };
    }

    /**
     * Initialize the game
     */
    initGame() {
        this.currentPlayer = 1;
        this.scores = { 1: 0, 2: 0 };
        this.dimensionScores = {
            1: { 1: 0, 2: 0, 3: 0 },
            2: { 1: 0, 2: 0, 3: 0 }
        };
        this.diceValues = [1, 1, 1];
        this.heldDice = [false, false, false];
        this.rollsLeft = 3;
        this.currentRound = 1;
        this.selectedDimension = 1;
        this.gameOver = false;
        this.isRolling = false;
        
        this.grids = {
            1: { 1: Array(9).fill(null), 2: Array(9).fill(null), 3: Array(9).fill(null) },
            2: { 1: Array(9).fill(null), 2: Array(9).fill(null), 3: Array(9).fill(null) }
        };
        
        this.renderAll();
        this.updateUI();
    }

    /**
     * Roll the dice
     */
    rollDice() {
        if (this.rollsLeft <= 0 || this.isRolling || this.gameOver) return;
        
        this.isRolling = true;
        const rollBtn = document.getElementById('roll-btn');
        if (rollBtn) rollBtn.disabled = true;
        
        // Animate dice
        const diceElements = document.querySelectorAll('.dice');
        diceElements.forEach((dice, i) => {
            if (!this.heldDice[i]) {
                dice.classList.add('rolling');
            }
        });
        
        // Roll animation
        let rollCount = 0;
        const rollInterval = setInterval(() => {
            for (let i = 0; i < 3; i++) {
                if (!this.heldDice[i]) {
                    this.diceValues[i] = Math.floor(Math.random() * 6) + 1;
                }
            }
            this.renderDice();
            rollCount++;
            
            if (rollCount >= 10) {
                clearInterval(rollInterval);
                diceElements.forEach(dice => dice.classList.remove('rolling'));
                this.rollsLeft--;
                this.isRolling = false;
                if (rollBtn) rollBtn.disabled = false;
                this.updateUI();
            }
        }, 50);
    }

    /**
     * Toggle holding a die
     */
    toggleHold(diceIndex) {
        if (this.rollsLeft >= 3 || this.gameOver) return; // Can't hold before first roll
        this.heldDice[diceIndex] = !this.heldDice[diceIndex];
        this.renderDice();
    }

    /**
     * Calculate roll total
     */
    getRollTotal() {
        return this.diceValues.reduce((sum, val) => sum + val, 0);
    }

    /**
     * Calculate bonus for a dimension
     */
    calculateBonus(dimension) {
        const values = [...this.diceValues].sort((a, b) => a - b);
        let bonus = 0;
        
        switch (dimension) {
            case 1: // Bonus for runs (consecutive numbers)
                const isRun = (values[1] === values[0] + 1 && values[2] === values[1] + 1);
                if (isRun) bonus = 10;
                break;
                
            case 2: // Bonus for pairs and triples
                if (values[0] === values[1] && values[1] === values[2]) {
                    bonus = 15; // Triple
                } else if (values[0] === values[1] || values[1] === values[2]) {
                    bonus = 5; // Pair
                }
                break;
                
            case 3: // Bonus for high rolls
                const total = this.getRollTotal();
                if (total >= 15) bonus = total - 10;
                break;
        }
        
        return bonus;
    }

    /**
     * Place dice in a dimension
     */
    placeDice(dimension) {
        if (this.rollsLeft >= 3 || this.gameOver) return; // Must roll first
        
        const grid = this.grids[this.currentPlayer][dimension];
        const emptyIndex = grid.findIndex(cell => cell === null);
        
        if (emptyIndex === -1) {
            this.showNotification('This dimension is full!', 'error');
            return;
        }
        
        // Place the dice values
        const total = this.getRollTotal();
        const bonus = this.calculateBonus(dimension);
        const score = total + bonus;
        
        grid[emptyIndex] = {
            values: [...this.diceValues],
            total: total,
            bonus: bonus,
            score: score
        };
        
        // Update scores
        this.dimensionScores[this.currentPlayer][dimension] += score;
        this.scores[this.currentPlayer] += score;
        
        // Reset for next turn
        this.heldDice = [false, false, false];
        this.rollsLeft = 3;
        
        // Check if round is complete
        this.checkRoundComplete();
        
        this.renderAll();
        this.updateUI();
    }

    /**
     * Check if round is complete
     */
    checkRoundComplete() {
        // Switch player
        if (this.currentPlayer === 1) {
            this.currentPlayer = 2;
        } else {
            this.currentPlayer = 1;
            this.currentRound++;
            
            if (this.currentRound > this.totalRounds) {
                this.endGame();
            }
        }
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
            winner = 'Player 1';
            title.textContent = '🎉 Player 1 Wins!';
        } else if (this.scores[2] > this.scores[1]) {
            winner = 'Player 2';
            title.textContent = '🎉 Player 2 Wins!';
        } else {
            winner = 'Tie';
            title.textContent = "🤝 It's a Tie!";
        }
        
        message.innerHTML = `
            <strong>Final Scores:</strong><br>
            Player 1: ${this.scores[1]} points<br>
            Player 2: ${this.scores[2]} points<br><br>
            <strong>Dimension Breakdown:</strong><br>
            P1 - 🔴 ${this.dimensionScores[1][1]} | 🔵 ${this.dimensionScores[1][2]} | 🟢 ${this.dimensionScores[1][3]}<br>
            P2 - 🔴 ${this.dimensionScores[2][1]} | 🔵 ${this.dimensionScores[2][2]} | 🟢 ${this.dimensionScores[2][3]}
        `;
        
        modal.classList.add('show');
    }

    /**
     * Render dice
     */
    renderDice() {
        for (let i = 0; i < 3; i++) {
            const diceEl = document.getElementById(`dice-${i + 1}`);
            if (diceEl) {
                const faceEl = diceEl.querySelector('.dice-face');
                faceEl.textContent = this.DICE_FACES[this.diceValues[i] - 1];
                diceEl.classList.toggle('held', this.heldDice[i]);
            }
        }
        
        const totalEl = document.getElementById('roll-total');
        if (totalEl) totalEl.textContent = this.getRollTotal();
    }

    /**
     * Render dimension grids
     */
    renderGrids() {
        for (let dim = 1; dim <= 3; dim++) {
            const boardEl = document.getElementById(`dim-board-${dim}`);
            if (!boardEl) continue;
            
            const gridEl = boardEl.querySelector('.dim-grid');
            gridEl.innerHTML = '';
            
            for (let i = 0; i < 9; i++) {
                const cell = document.createElement('div');
                cell.className = 'dim-cell';
                
                // Check both players' grids
                const p1Cell = this.grids[1][dim][i];
                const p2Cell = this.grids[2][dim][i];
                
                if (p1Cell) {
                    cell.classList.add('filled', 'p1');
                    cell.textContent = p1Cell.score;
                    cell.title = `Values: ${p1Cell.values.join('+')} = ${p1Cell.total}${p1Cell.bonus ? ` + ${p1Cell.bonus} bonus` : ''}`;
                } else if (p2Cell) {
                    cell.classList.add('filled', 'p2');
                    cell.textContent = p2Cell.score;
                    cell.title = `Values: ${p2Cell.values.join('+')} = ${p2Cell.total}${p2Cell.bonus ? ` + ${p2Cell.bonus} bonus` : ''}`;
                }
                
                gridEl.appendChild(cell);
            }
            
            // Update dimension score
            const scoreEl = document.getElementById(`dim-${dim}-score`);
            if (scoreEl) {
                scoreEl.textContent = this.dimensionScores[1][dim] + this.dimensionScores[2][dim];
            }
            
            // Highlight selected dimension
            boardEl.classList.toggle('selected', this.selectedDimension === dim);
        }
    }

    /**
     * Render all elements
     */
    renderAll() {
        this.renderDice();
        this.renderGrids();
    }

    /**
     * Update UI elements
     */
    updateUI() {
        // Current player
        const turnEl = document.getElementById('turn-indicator');
        if (turnEl) {
            turnEl.innerHTML = `Current Player: <span class="player-${this.currentPlayer}">Player ${this.currentPlayer}</span>`;
        }
        
        // Scores
        document.getElementById('score-1').textContent = this.scores[1];
        document.getElementById('score-2').textContent = this.scores[2];
        
        // Round
        document.getElementById('current-round').textContent = Math.min(this.currentRound, this.totalRounds);
        document.getElementById('total-rounds').textContent = this.totalRounds;
        
        // Roll button
        const rollBtn = document.getElementById('roll-btn');
        if (rollBtn) {
            rollBtn.textContent = this.rollsLeft === 3 ? '🎲 Roll Dice' : `🎲 Roll (${this.rollsLeft} left)`;
            rollBtn.disabled = this.rollsLeft <= 0 || this.gameOver;
        }
        
        // Dimension buttons
        document.querySelectorAll('.dim-btn').forEach(btn => {
            const dim = parseInt(btn.dataset.dim);
            btn.classList.toggle('active', this.selectedDimension === dim);
        });
    }

    /**
     * Select a dimension
     */
    selectDimension(dim) {
        this.selectedDimension = dim;
        this.renderGrids();
        this.updateUI();
        
        // Place dice if we've rolled
        if (this.rollsLeft < 3) {
            this.placeDice(dim);
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create notification element
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
        }, 2000);
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const game = new DimensionalDice();
    
    // Setup dice click handlers
    for (let i = 1; i <= 3; i++) {
        document.getElementById(`dice-${i}`)?.addEventListener('click', () => game.toggleHold(i - 1));
    }
    
    // Setup roll button
    document.getElementById('roll-btn')?.addEventListener('click', () => game.rollDice());
    
    // Setup dimension buttons
    document.querySelectorAll('.dim-btn').forEach(btn => {
        btn.addEventListener('click', () => game.selectDimension(parseInt(btn.dataset.dim)));
    });
    
    // Setup dimension board clicks
    for (let dim = 1; dim <= 3; dim++) {
        document.getElementById(`dim-board-${dim}`)?.addEventListener('click', () => {
            game.selectDimension(dim);
        });
    }
    
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
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'r') {
            game.rollDice();
        } else if (e.key >= '1' && e.key <= '3') {
            game.selectDimension(parseInt(e.key));
        }
    });
    
    // Start the game
    game.initGame();
});
