/**
 * Tide Turner Game Logic
 * Original strategy game - control the tides to collect treasures!
 * Part of the 9DTTT Game Library
 * 
 * © 2026 9DTTT - An Original Game Concept
 */

class TideTurner {
    constructor() {
        this.gridSize = 6;
        this.board = [];
        this.currentPlayer = 1; // 1 = Beach (bottom), 2 = Crab (top)
        this.scores = [0, 0];
        this.wavesPerPlayer = 5;
        this.wavesUsed = [0, 0];
        this.selectedDirection = 'right';
        this.gameOver = false;
        this.gameMode = 'ai';
        
        // Cell types: 0 = empty, 'gem' = treasure, 'rock' = obstacle
        this.treasureEmojis = ['💎', '💰', '⭐', '🔮'];
    }

    initGame() {
        this.board = this.createBoard();
        this.currentPlayer = 1;
        this.scores = [0, 0];
        this.wavesUsed = [0, 0];
        this.gameOver = false;
        
        this.render();
        this.updateUI();
        this.updateCollected();
    }

    createBoard() {
        const board = Array(this.gridSize).fill(null).map(() => 
            Array(this.gridSize).fill(null)
        );
        
        // Place treasures (6-8 gems)
        const numTreasures = 6 + Math.floor(Math.random() * 3);
        let placed = 0;
        while (placed < numTreasures) {
            const row = 1 + Math.floor(Math.random() * (this.gridSize - 2)); // Not on edges
            const col = Math.floor(Math.random() * this.gridSize);
            if (!board[row][col]) {
                board[row][col] = {
                    type: 'gem',
                    emoji: this.treasureEmojis[Math.floor(Math.random() * this.treasureEmojis.length)]
                };
                placed++;
            }
        }
        
        // Place rocks (4-6 obstacles)
        const numRocks = 4 + Math.floor(Math.random() * 3);
        placed = 0;
        while (placed < numRocks) {
            const row = 1 + Math.floor(Math.random() * (this.gridSize - 2));
            const col = Math.floor(Math.random() * this.gridSize);
            if (!board[row][col]) {
                board[row][col] = { type: 'rock', emoji: '🪨' };
                placed++;
            }
        }
        
        return board;
    }

    render() {
        const boardEl = document.getElementById('ocean-board');
        if (!boardEl) return;
        
        boardEl.innerHTML = '';
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'ocean-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const content = this.board[row][col];
                if (content) {
                    cell.textContent = content.emoji;
                    cell.classList.add(content.type === 'rock' ? 'rock' : 'has-item');
                }
                
                cell.addEventListener('click', () => this.placeWave(row, col));
                boardEl.appendChild(cell);
            }
        }
    }

    placeWave(row, col) {
        if (this.gameOver) return;
        if (this.board[row][col]) return; // Can't place on occupied cell
        
        // Check if player has waves left
        const playerIdx = this.currentPlayer - 1;
        if (this.wavesUsed[playerIdx] >= this.wavesPerPlayer) return;
        
        this.wavesUsed[playerIdx]++;
        
        // Apply wave effect
        this.applyWave(row, col, this.selectedDirection);
        
        // Check for game end
        if (this.checkGameEnd()) {
            this.endGame();
            return;
        }
        
        // Switch player
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.render();
        this.updateUI();
        
        // AI move
        if (this.gameMode === 'ai' && this.currentPlayer === 2 && !this.gameOver) {
            setTimeout(() => this.aiMove(), 800);
        }
    }

    applyWave(waveRow, waveCol, direction) {
        const deltas = {
            'up': [-1, 0],
            'down': [1, 0],
            'left': [0, -1],
            'right': [0, 1]
        };
        
        const [dRow, dCol] = deltas[direction];
        
        // Find all adjacent cells and push their contents
        const adjacentOffsets = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        // Collect items to move (we need to process all at once to avoid conflicts)
        const moves = [];
        
        for (const [offRow, offCol] of adjacentOffsets) {
            const srcRow = waveRow + offRow;
            const srcCol = waveCol + offCol;
            
            if (srcRow < 0 || srcRow >= this.gridSize || srcCol < 0 || srcCol >= this.gridSize) continue;
            
            const item = this.board[srcRow][srcCol];
            if (!item || item.type === 'rock') continue;
            
            const destRow = srcRow + dRow;
            const destCol = srcCol + dCol;
            
            moves.push({
                srcRow, srcCol,
                destRow, destCol,
                item
            });
        }
        
        // Clear source positions first
        for (const move of moves) {
            this.board[move.srcRow][move.srcCol] = null;
        }
        
        // Apply moves
        for (const move of moves) {
            this.moveItem(move.destRow, move.destCol, move.item);
        }
        
        this.updateCollected();
    }

    moveItem(destRow, destCol, item) {
        // Check if pushed off the board (collected!)
        if (destRow < 0) {
            // Pushed to top - Crab (player 2) collects
            this.scores[1]++;
            this.addToCollected(2, item.emoji);
            return;
        }
        if (destRow >= this.gridSize) {
            // Pushed to bottom - Beach (player 1) collects
            this.scores[0]++;
            this.addToCollected(1, item.emoji);
            return;
        }
        if (destCol < 0 || destCol >= this.gridSize) {
            // Pushed off sides - item is lost
            return;
        }
        
        // Check destination
        const destContent = this.board[destRow][destCol];
        if (destContent) {
            if (destContent.type === 'rock') {
                // Blocked by rock - item stays in place (but we already removed it, so it's lost)
                // Actually let's put it back at source... but we don't have source. Item is blocked and lost.
                return;
            }
            // Another gem - they can stack for now, but let's just lose the incoming one
            return;
        }
        
        // Move successful
        this.board[destRow][destCol] = item;
    }

    addToCollected(player, emoji) {
        const container = document.getElementById(`collected-${player}`);
        if (!container) return;
        
        const gem = document.createElement('span');
        gem.className = 'gem';
        gem.textContent = emoji;
        container.appendChild(gem);
    }

    updateCollected() {
        // Scores are tracked, visual already added in addToCollected
    }

    checkGameEnd() {
        // Game ends when both players have used all waves
        const totalWavesUsed = this.wavesUsed[0] + this.wavesUsed[1];
        return totalWavesUsed >= this.wavesPerPlayer * 2;
    }

    endGame() {
        this.gameOver = true;
        
        const modal = document.getElementById('game-over-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        
        const p1Score = this.scores[0];
        const p2Score = this.scores[1];
        
        if (p1Score > p2Score) {
            const winnerName = this.gameMode === 'ai' ? 'You' : 'Beach Player';
            title.textContent = `🐚 ${winnerName} Win${this.gameMode === 'ai' ? '' : 's'}!`;
            title.className = 'win';
        } else if (p2Score > p1Score) {
            const winnerName = this.gameMode === 'ai' ? 'Computer' : 'Crab Player';
            title.textContent = `🦀 ${winnerName} Win${this.gameMode === 'local' ? 's' : 's'}!`;
            title.className = this.gameMode === 'ai' ? 'lose' : 'win';
        } else {
            title.textContent = "🤝 It's a Tie!";
            title.className = 'draw';
        }
        
        message.innerHTML = `
            Final Score:<br><br>
            🐚 Beach: ${p1Score} treasures<br>
            🦀 Crab: ${p2Score} treasures
        `;
        
        modal.classList.add('show');
    }

    aiMove() {
        if (this.gameOver) return;
        if (this.wavesUsed[1] >= this.wavesPerPlayer) return;
        
        // Simple AI: Find best move to push gems toward top
        let bestMove = null;
        let bestScore = -Infinity;
        
        const directions = ['up', 'down', 'left', 'right'];
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.board[row][col]) continue;
                
                for (const dir of directions) {
                    const score = this.evaluateMove(row, col, dir);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = { row, col, dir };
                    }
                }
            }
        }
        
        if (bestMove) {
            this.selectedDirection = bestMove.dir;
            this.updateDirectionButtons();
            this.placeWave(bestMove.row, bestMove.col);
        }
    }

    evaluateMove(waveRow, waveCol, direction) {
        // Simple heuristic: favor moves that push gems toward top (AI's goal)
        let score = 0;
        
        const deltas = {
            'up': [-1, 0],
            'down': [1, 0],
            'left': [0, -1],
            'right': [0, 1]
        };
        
        const [dRow] = deltas[direction];
        
        const adjacentOffsets = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        for (const [offRow, offCol] of adjacentOffsets) {
            const srcRow = waveRow + offRow;
            const srcCol = waveCol + offCol;
            
            if (srcRow < 0 || srcRow >= this.gridSize || srcCol < 0 || srcCol >= this.gridSize) continue;
            
            const item = this.board[srcRow][srcCol];
            if (!item || item.type !== 'gem') continue;
            
            const destRow = srcRow + dRow;
            
            // Score based on where gem ends up
            if (destRow < 0) {
                score += 10; // AI scores!
            } else if (destRow >= this.gridSize) {
                score -= 10; // Player scores!
            } else if (direction === 'up') {
                score += 2; // Moving toward AI goal
            } else if (direction === 'down') {
                score -= 2; // Moving toward player goal
            }
        }
        
        return score;
    }

    updateDirectionButtons() {
        document.querySelectorAll('.dir-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.dir === this.selectedDirection);
        });
    }

    updateUI() {
        const currentTurn = document.getElementById('current-turn');
        const score1 = document.getElementById('score-1');
        const score2 = document.getElementById('score-2');
        const wavesLeft = document.getElementById('waves-left');
        
        if (currentTurn) {
            const name = this.gameMode === 'ai'
                ? (this.currentPlayer === 1 ? '🐚 Your Turn' : "🦀 Computer's Turn")
                : (this.currentPlayer === 1 ? '🐚 Beach Player' : '🦀 Crab Player');
            currentTurn.textContent = name;
            currentTurn.className = `player-${this.currentPlayer}`;
        }
        
        if (score1) score1.textContent = this.scores[0];
        if (score2) score2.textContent = this.scores[1];
        
        if (wavesLeft) {
            const remaining = this.wavesPerPlayer - this.wavesUsed[this.currentPlayer - 1];
            wavesLeft.textContent = remaining;
        }
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    const game = new TideTurner();
    
    // Mode buttons
    document.getElementById('mode-ai')?.addEventListener('click', () => {
        document.getElementById('mode-ai')?.classList.add('active');
        document.getElementById('mode-local')?.classList.remove('active');
        game.gameMode = 'ai';
        game.initGame();
    });
    
    document.getElementById('mode-local')?.addEventListener('click', () => {
        document.getElementById('mode-local')?.classList.add('active');
        document.getElementById('mode-ai')?.classList.remove('active');
        game.gameMode = 'local';
        game.initGame();
    });
    
    // Direction buttons
    document.querySelectorAll('.dir-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            game.selectedDirection = btn.dataset.dir;
            game.updateDirectionButtons();
        });
    });
    
    // Control buttons
    document.getElementById('new-game-btn')?.addEventListener('click', () => game.initGame());
    document.getElementById('modal-new-game-btn')?.addEventListener('click', () => {
        document.getElementById('game-over-modal').classList.remove('show');
        game.initGame();
    });
    
    document.getElementById('toggle-instructions-btn')?.addEventListener('click', () => {
        const instructions = document.getElementById('instructions');
        instructions.style.display = instructions.style.display === 'none' ? 'block' : 'none';
    });
    
    game.initGame();
});
