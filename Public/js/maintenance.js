/**
 * Classic Tic-Tac-Toe Game
 * For the 9DTTT Maintenance Page
 */

class TicTacToe {
    constructor() {
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.vsAI = false;
        this.scores = { X: 0, O: 0, draw: 0 };
        this.aiTimeoutId = null;
        
        this.winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]              // Diagonals
        ];
        
        this.init();
    }
    
    init() {
        this.cells = document.querySelectorAll('.ttt-cell');
        this.statusDisplay = document.getElementById('current-player');
        this.resetBtn = document.getElementById('reset-btn');
        this.aiToggle = document.getElementById('ai-toggle');
        this.scoreX = document.getElementById('score-x');
        this.scoreO = document.getElementById('score-o');
        this.scoreDraw = document.getElementById('score-draw');
        
        this.cells.forEach(cell => {
            cell.addEventListener('click', () => this.handleCellClick(cell));
        });
        
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.aiToggle.addEventListener('click', () => this.toggleAI());
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        this.updateStatus();
    }
    
    handleCellClick(cell) {
        const index = parseInt(cell.dataset.index);
        
        if (this.board[index] || !this.gameActive) return;
        
        this.makeMove(index);
        
        if (this.vsAI && this.gameActive && this.currentPlayer === 'O') {
            setTimeout(() => this.aiMove(), 500);
        }
    }
    
    makeMove(index) {
        this.board[index] = this.currentPlayer;
        const cell = this.cells[index];
        
        cell.textContent = this.currentPlayer;
        cell.classList.add(this.currentPlayer.toLowerCase(), 'taken');
        cell.setAttribute('aria-label', `Cell ${index + 1}, ${this.currentPlayer}`);
        
        const winner = this.checkWinner();
        
        if (winner) {
            this.handleWin(winner);
        } else if (this.board.every(cell => cell)) {
            this.handleDraw();
        } else {
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            this.updateStatus();
        }
    }
    
    checkWinner() {
        for (const pattern of this.winPatterns) {
            const [a, b, c] = pattern;
            if (this.board[a] && 
                this.board[a] === this.board[b] && 
                this.board[a] === this.board[c]) {
                return { winner: this.board[a], pattern };
            }
        }
        return null;
    }
    
    handleWin(result) {
        this.gameActive = false;
        this.scores[result.winner]++;
        this.updateScoreboard();
        
        // Highlight winning cells
        result.pattern.forEach(index => {
            this.cells[index].classList.add('winning');
        });
        
        const statusEl = this.statusDisplay.parentElement;
        statusEl.classList.add(`winner-${result.winner.toLowerCase()}`);
        
        if (this.vsAI && result.winner === 'O') {
            this.statusDisplay.textContent = '🤖 AI Wins!';
        } else if (this.vsAI && result.winner === 'X') {
            this.statusDisplay.textContent = '🎉 You Win!';
        } else {
            this.statusDisplay.textContent = `🎉 Player ${result.winner} Wins!`;
        }
        
        this.announceResult(`Player ${result.winner} wins!`);
    }
    
    handleDraw() {
        this.gameActive = false;
        this.scores.draw++;
        this.updateScoreboard();
        
        const statusEl = this.statusDisplay.parentElement;
        statusEl.classList.add('draw');
        this.statusDisplay.textContent = "🤝 It's a Draw!";
        
        this.announceResult("It's a draw!");
    }
    
    updateStatus() {
        if (this.vsAI && this.currentPlayer === 'O') {
            this.statusDisplay.textContent = '🤖 AI is thinking...';
        } else if (this.vsAI) {
            this.statusDisplay.textContent = "Your turn (X)";
        } else {
            this.statusDisplay.textContent = `Player ${this.currentPlayer}'s turn`;
        }
    }
    
    updateScoreboard() {
        this.scoreX.textContent = this.scores.X;
        this.scoreO.textContent = this.scores.O;
        this.scoreDraw.textContent = this.scores.draw;
    }
    
    resetGame() {
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.gameActive = true;
        
        this.cells.forEach((cell, index) => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'taken', 'winning');
            cell.setAttribute('aria-label', `Cell ${index + 1}, empty`);
        });
        
        const statusEl = this.statusDisplay.parentElement;
        statusEl.classList.remove('winner-x', 'winner-o', 'draw');
        
        this.updateStatus();
        this.cells[0].focus();
    }
    
    toggleAI() {
        this.vsAI = !this.vsAI;
        this.aiToggle.classList.toggle('active', this.vsAI);
        this.aiToggle.textContent = this.vsAI ? '👤 Play vs Human' : '🤖 Play vs AI';
        this.resetGame();
    }
    
    aiMove() {
        if (!this.gameActive) return;
        
        // Try to win
        const winMove = this.findBestMove('O');
        if (winMove !== -1) {
            this.makeMove(winMove);
            return;
        }
        
        // Block player from winning
        const blockMove = this.findBestMove('X');
        if (blockMove !== -1) {
            this.makeMove(blockMove);
            return;
        }
        
        // Take center if available
        if (!this.board[4]) {
            this.makeMove(4);
            return;
        }
        
        // Take a corner
        const corners = [0, 2, 6, 8].filter(i => !this.board[i]);
        if (corners.length > 0) {
            this.makeMove(corners[Math.floor(Math.random() * corners.length)]);
            return;
        }
        
        // Take any available space
        const available = this.board.map((cell, i) => cell ? -1 : i).filter(i => i !== -1);
        if (available.length > 0) {
            this.makeMove(available[Math.floor(Math.random() * available.length)]);
        }
    }
    
    findBestMove(player) {
        for (const pattern of this.winPatterns) {
            const cells = pattern.map(i => this.board[i]);
            const playerCount = cells.filter(c => c === player).length;
            const emptyCount = cells.filter(c => c === null).length;
            
            if (playerCount === 2 && emptyCount === 1) {
                return pattern.find(i => !this.board[i]);
            }
        }
        return -1;
    }
    
    handleKeyboard(e) {
        const focused = document.activeElement;
        if (!focused.classList.contains('ttt-cell')) return;
        
        const index = parseInt(focused.dataset.index);
        let newIndex = index;
        
        switch (e.key) {
            case 'ArrowRight':
                newIndex = index % 3 < 2 ? index + 1 : index;
                break;
            case 'ArrowLeft':
                newIndex = index % 3 > 0 ? index - 1 : index;
                break;
            case 'ArrowDown':
                newIndex = index < 6 ? index + 3 : index;
                break;
            case 'ArrowUp':
                newIndex = index > 2 ? index - 3 : index;
                break;
            case 'Enter':
            case ' ':
                this.handleCellClick(focused);
                e.preventDefault();
                return;
            default:
                return;
        }
        
        if (newIndex !== index) {
            this.cells[newIndex].focus();
            e.preventDefault();
        }
    }
    
    announceResult(message) {
        // For screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});
