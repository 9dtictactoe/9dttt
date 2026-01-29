/**
 * Crystal Connect Game Logic
 * Match-3 puzzle game with chain reactions
 * Part of the 9DTTT Game Library
 */

class CrystalConnect {
    constructor() {
        this.CRYSTALS = [
            { name: 'ruby', emoji: '💎', color: '#e74c3c' },
            { name: 'sapphire', emoji: '🔷', color: '#3498db' },
            { name: 'emerald', emoji: '💚', color: '#2ecc71' },
            { name: 'topaz', emoji: '🔶', color: '#f39c12' },
            { name: 'amethyst', emoji: '💜', color: '#9b59b6' },
            { name: 'diamond', emoji: '💠', color: '#ecf0f1' }
        ];
        
        this.gridSize = 8;
        this.board = [];
        this.selectedCell = null;
        this.score = 0;
        this.level = 1;
        this.movesLeft = 30;
        this.targetScore = 1000;
        this.combo = 0;
        this.isAnimating = false;
        this.gameOver = false;
        
        // Power-ups
        this.bombCount = 0;
        this.shuffleCount = 0;
    }

    /**
     * Initialize the game
     */
    initGame() {
        this.board = [];
        this.selectedCell = null;
        this.score = 0;
        this.level = 1;
        this.movesLeft = 30;
        this.targetScore = 1000;
        this.combo = 0;
        this.isAnimating = false;
        this.gameOver = false;
        this.bombCount = 0;
        this.shuffleCount = 0;
        
        this.generateBoard();
        this.renderBoard();
        this.updateUI();
    }

    /**
     * Generate initial board
     */
    generateBoard() {
        this.board = [];
        
        for (let row = 0; row < this.gridSize; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                let crystal;
                do {
                    crystal = this.getRandomCrystal();
                } while (this.wouldCreateMatch(row, col, crystal));
                
                this.board[row][col] = {
                    type: crystal,
                    special: null
                };
            }
        }
    }

    /**
     * Get random crystal
     */
    getRandomCrystal() {
        return this.CRYSTALS[Math.floor(Math.random() * this.CRYSTALS.length)];
    }

    /**
     * Check if placing a crystal would create a match
     */
    wouldCreateMatch(row, col, crystal) {
        // Check horizontal
        if (col >= 2) {
            if (this.board[row][col - 1]?.type?.name === crystal.name &&
                this.board[row][col - 2]?.type?.name === crystal.name) {
                return true;
            }
        }
        
        // Check vertical
        if (row >= 2) {
            if (this.board[row - 1]?.[col]?.type?.name === crystal.name &&
                this.board[row - 2]?.[col]?.type?.name === crystal.name) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Render the board
     */
    renderBoard() {
        const boardEl = document.getElementById('crystal-board');
        if (!boardEl) return;
        
        boardEl.innerHTML = '';
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'crystal-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const crystal = this.board[row][col];
                if (crystal && crystal.type) {
                    cell.textContent = crystal.type.emoji;
                    cell.dataset.crystal = crystal.type.name;
                    
                    if (crystal.special === '4') {
                        cell.classList.add('special-4');
                    } else if (crystal.special === '5') {
                        cell.classList.add('special-5');
                    }
                }
                
                if (this.selectedCell && 
                    this.selectedCell.row === row && 
                    this.selectedCell.col === col) {
                    cell.classList.add('selected');
                }
                
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                cell.setAttribute('tabindex', '0');
                cell.addEventListener('keydown', (e) => this.handleCellKeydown(e, row, col));
                
                boardEl.appendChild(cell);
            }
        }
    }

    /**
     * Handle cell click
     */
    handleCellClick(row, col) {
        if (this.isAnimating || this.gameOver) return;
        
        if (!this.selectedCell) {
            // Select cell
            this.selectedCell = { row, col };
            this.renderBoard();
        } else {
            // Try to swap
            const isAdjacent = this.isAdjacent(this.selectedCell, { row, col });
            
            if (isAdjacent) {
                this.trySwap(this.selectedCell.row, this.selectedCell.col, row, col);
            } else {
                // Select new cell
                this.selectedCell = { row, col };
                this.renderBoard();
            }
        }
    }

    /**
     * Handle keyboard navigation
     */
    handleCellKeydown(e, row, col) {
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                if (row > 0) this.focusCell(row - 1, col);
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (row < this.gridSize - 1) this.focusCell(row + 1, col);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (col > 0) this.focusCell(row, col - 1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (col < this.gridSize - 1) this.focusCell(row, col + 1);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.handleCellClick(row, col);
                break;
        }
    }

    /**
     * Focus a specific cell
     */
    focusCell(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) cell.focus();
    }

    /**
     * Check if two cells are adjacent
     */
    isAdjacent(cell1, cell2) {
        const rowDiff = Math.abs(cell1.row - cell2.row);
        const colDiff = Math.abs(cell1.col - cell2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    /**
     * Try to swap two cells
     */
    async trySwap(row1, col1, row2, col2) {
        this.isAnimating = true;
        
        // Swap
        const temp = this.board[row1][col1];
        this.board[row1][col1] = this.board[row2][col2];
        this.board[row2][col2] = temp;
        
        this.renderBoard();
        
        // Check for matches
        const matches = this.findMatches();
        
        if (matches.length > 0) {
            this.movesLeft--;
            this.combo = 0;
            await this.processMatches();
        } else {
            // Swap back
            const temp = this.board[row1][col1];
            this.board[row1][col1] = this.board[row2][col2];
            this.board[row2][col2] = temp;
            this.renderBoard();
        }
        
        this.selectedCell = null;
        this.isAnimating = false;
        this.renderBoard();
        this.updateUI();
        
        // Check game state
        this.checkGameState();
    }

    /**
     * Find all matches on the board
     */
    findMatches() {
        const matches = [];
        
        // Check horizontal matches
        for (let row = 0; row < this.gridSize; row++) {
            let matchStart = 0;
            for (let col = 1; col <= this.gridSize; col++) {
                const current = this.board[row][col]?.type?.name;
                const prev = this.board[row][col - 1]?.type?.name;
                
                if (col === this.gridSize || current !== prev) {
                    const matchLength = col - matchStart;
                    if (matchLength >= 3 && prev) {
                        for (let i = matchStart; i < col; i++) {
                            if (!matches.some(m => m.row === row && m.col === i)) {
                                matches.push({ row, col: i, length: matchLength });
                            }
                        }
                    }
                    matchStart = col;
                }
            }
        }
        
        // Check vertical matches
        for (let col = 0; col < this.gridSize; col++) {
            let matchStart = 0;
            for (let row = 1; row <= this.gridSize; row++) {
                const current = this.board[row]?.[col]?.type?.name;
                const prev = this.board[row - 1]?.[col]?.type?.name;
                
                if (row === this.gridSize || current !== prev) {
                    const matchLength = row - matchStart;
                    if (matchLength >= 3 && prev) {
                        for (let i = matchStart; i < row; i++) {
                            if (!matches.some(m => m.row === i && m.col === col)) {
                                matches.push({ row: i, col, length: matchLength });
                            }
                        }
                    }
                    matchStart = row;
                }
            }
        }
        
        return matches;
    }

    /**
     * Process matches and handle cascades
     */
    async processMatches() {
        let matches = this.findMatches();
        
        while (matches.length > 0) {
            this.combo++;
            
            // Calculate score
            const baseScore = matches.length * 10;
            const comboBonus = Math.pow(this.combo, 2) * 5;
            const scoreGain = baseScore + comboBonus;
            this.score += scoreGain;
            
            // Show combo popup
            if (this.combo > 1) {
                this.showComboPopup();
            }
            
            // Award power-ups for big matches
            const maxLength = Math.max(...matches.map(m => m.length || 3));
            if (maxLength >= 5) {
                this.shuffleCount++;
            } else if (maxLength >= 4) {
                this.bombCount++;
            }
            
            // Remove matched crystals
            for (const match of matches) {
                this.board[match.row][match.col] = null;
            }
            
            this.renderBoard();
            await this.delay(200);
            
            // Drop crystals
            await this.dropCrystals();
            
            // Fill empty spaces
            await this.fillEmptySpaces();
            
            // Check for new matches
            matches = this.findMatches();
        }
        
        this.updateUI();
    }

    /**
     * Drop crystals to fill gaps
     */
    async dropCrystals() {
        let dropped = false;
        
        for (let col = 0; col < this.gridSize; col++) {
            for (let row = this.gridSize - 1; row >= 0; row--) {
                if (!this.board[row][col]) {
                    // Find crystal above
                    for (let above = row - 1; above >= 0; above--) {
                        if (this.board[above][col]) {
                            this.board[row][col] = this.board[above][col];
                            this.board[above][col] = null;
                            dropped = true;
                            break;
                        }
                    }
                }
            }
        }
        
        if (dropped) {
            this.renderBoard();
            await this.delay(150);
        }
    }

    /**
     * Fill empty spaces with new crystals
     */
    async fillEmptySpaces() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (!this.board[row][col]) {
                    this.board[row][col] = {
                        type: this.getRandomCrystal(),
                        special: null
                    };
                }
            }
        }
        
        this.renderBoard();
        await this.delay(150);
    }

    /**
     * Show combo popup
     */
    showComboPopup() {
        const popup = document.createElement('div');
        popup.className = 'combo-popup';
        popup.textContent = `${this.combo}x COMBO!`;
        document.body.appendChild(popup);
        
        setTimeout(() => popup.remove(), 800);
    }

    /**
     * Use bomb power-up
     */
    async useBomb() {
        if (this.bombCount <= 0 || this.isAnimating || this.gameOver) return;
        
        this.bombCount--;
        this.isAnimating = true;
        
        // Remove random 3x3 area
        const centerRow = Math.floor(Math.random() * (this.gridSize - 2)) + 1;
        const centerCol = Math.floor(Math.random() * (this.gridSize - 2)) + 1;
        
        for (let r = centerRow - 1; r <= centerRow + 1; r++) {
            for (let c = centerCol - 1; c <= centerCol + 1; c++) {
                this.board[r][c] = null;
                this.score += 5;
            }
        }
        
        this.renderBoard();
        await this.delay(300);
        
        await this.dropCrystals();
        await this.fillEmptySpaces();
        await this.processMatches();
        
        this.isAnimating = false;
        this.updateUI();
    }

    /**
     * Shuffle the board
     */
    async useShuffle() {
        if (this.shuffleCount <= 0 || this.isAnimating || this.gameOver) return;
        
        this.shuffleCount--;
        this.isAnimating = true;
        
        // Collect all crystals
        const crystals = [];
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.board[row][col]) {
                    crystals.push(this.board[row][col]);
                }
            }
        }
        
        // Shuffle
        for (let i = crystals.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [crystals[i], crystals[j]] = [crystals[j], crystals[i]];
        }
        
        // Put back
        let index = 0;
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.board[row][col] = crystals[index++];
            }
        }
        
        this.renderBoard();
        await this.delay(300);
        
        await this.processMatches();
        
        this.isAnimating = false;
        this.updateUI();
    }

    /**
     * Show hint
     */
    showHint() {
        if (this.isAnimating || this.gameOver) return;
        
        // Find a valid move
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                // Try swapping with right neighbor
                if (col < this.gridSize - 1) {
                    // Temporarily swap
                    const temp = this.board[row][col];
                    this.board[row][col] = this.board[row][col + 1];
                    this.board[row][col + 1] = temp;
                    
                    if (this.findMatches().length > 0) {
                        // Swap back and highlight
                        this.board[row][col + 1] = this.board[row][col];
                        this.board[row][col] = temp;
                        
                        this.highlightHint(row, col, row, col + 1);
                        return;
                    }
                    
                    // Swap back
                    this.board[row][col + 1] = this.board[row][col];
                    this.board[row][col] = temp;
                }
                
                // Try swapping with bottom neighbor
                if (row < this.gridSize - 1) {
                    const temp = this.board[row][col];
                    this.board[row][col] = this.board[row + 1][col];
                    this.board[row + 1][col] = temp;
                    
                    if (this.findMatches().length > 0) {
                        this.board[row + 1][col] = this.board[row][col];
                        this.board[row][col] = temp;
                        
                        this.highlightHint(row, col, row + 1, col);
                        return;
                    }
                    
                    this.board[row + 1][col] = this.board[row][col];
                    this.board[row][col] = temp;
                }
            }
        }
    }

    /**
     * Highlight hint cells
     */
    highlightHint(row1, col1, row2, col2) {
        const cells = document.querySelectorAll('.crystal-cell');
        cells.forEach(cell => {
            const r = parseInt(cell.dataset.row);
            const c = parseInt(cell.dataset.col);
            if ((r === row1 && c === col1) || (r === row2 && c === col2)) {
                cell.classList.add('hint');
                setTimeout(() => cell.classList.remove('hint'), 2000);
            }
        });
    }

    /**
     * Check game state
     */
    checkGameState() {
        // Check win condition
        if (this.score >= this.targetScore) {
            this.levelComplete();
            return;
        }
        
        // Check lose condition
        if (this.movesLeft <= 0) {
            this.gameOver = true;
            this.showGameOverModal();
        }
    }

    /**
     * Level complete
     */
    levelComplete() {
        const modal = document.getElementById('level-modal');
        const message = document.getElementById('level-modal-message');
        
        message.innerHTML = `
            Score: ${this.score}<br>
            Target: ${this.targetScore}<br>
            Moves remaining: ${this.movesLeft}<br>
            Bonus: +${this.movesLeft * 50} points!
        `;
        
        this.score += this.movesLeft * 50;
        
        modal.classList.add('show');
    }

    /**
     * Start next level
     */
    nextLevel() {
        this.level++;
        this.movesLeft = 30;
        this.targetScore = 1000 + (this.level - 1) * 500;
        this.combo = 0;
        
        this.generateBoard();
        this.renderBoard();
        this.updateUI();
        
        document.getElementById('level-modal').classList.remove('show');
    }

    /**
     * Show game over modal
     */
    showGameOverModal() {
        const modal = document.getElementById('game-over-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        
        title.textContent = 'Game Over!';
        message.innerHTML = `
            Final Score: ${this.score}<br>
            Level Reached: ${this.level}<br>
            Target was: ${this.targetScore}
        `;
        
        modal.classList.add('show');
    }

    /**
     * Update UI
     */
    updateUI() {
        document.getElementById('current-score').textContent = this.score;
        document.getElementById('current-level').textContent = this.level;
        document.getElementById('combo-count').textContent = `x${Math.max(1, this.combo)}`;
        
        const movesEl = document.getElementById('moves-left');
        movesEl.textContent = this.movesLeft;
        movesEl.classList.toggle('low', this.movesLeft <= 5);
        
        document.getElementById('target-score').textContent = this.targetScore;
        
        // Progress bar
        const progress = Math.min(100, (this.score / this.targetScore) * 100);
        document.getElementById('progress-fill').style.width = `${progress}%`;
        
        // Power-ups
        const bombBtn = document.getElementById('power-bomb');
        const shuffleBtn = document.getElementById('power-shuffle');
        
        if (bombBtn) {
            bombBtn.disabled = this.bombCount <= 0;
            bombBtn.textContent = `💣 Bomb (${this.bombCount})`;
            bombBtn.classList.toggle('ready', this.bombCount > 0);
        }
        
        if (shuffleBtn) {
            shuffleBtn.disabled = this.shuffleCount <= 0;
            shuffleBtn.textContent = `🔀 Shuffle (${this.shuffleCount})`;
            shuffleBtn.classList.toggle('ready', this.shuffleCount > 0);
        }
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const game = new CrystalConnect();
    
    // Setup control buttons
    document.getElementById('new-game-btn')?.addEventListener('click', () => game.initGame());
    document.getElementById('modal-new-game-btn')?.addEventListener('click', () => {
        document.getElementById('game-over-modal').classList.remove('show');
        game.initGame();
    });
    document.getElementById('next-level-btn')?.addEventListener('click', () => game.nextLevel());
    
    // Power-ups
    document.getElementById('power-bomb')?.addEventListener('click', () => game.useBomb());
    document.getElementById('power-shuffle')?.addEventListener('click', () => game.useShuffle());
    document.getElementById('power-hint')?.addEventListener('click', () => game.showHint());
    
    // Instructions toggle
    document.getElementById('toggle-instructions-btn')?.addEventListener('click', () => {
        const instructions = document.getElementById('instructions');
        instructions.style.display = instructions.style.display === 'none' ? 'block' : 'none';
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'h') {
            game.showHint();
        }
    });
    
    // Start the game
    game.initGame();
});
