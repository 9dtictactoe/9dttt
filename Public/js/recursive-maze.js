/**
 * Recursive Maze Game Logic
 * Navigate through mazes within mazes
 * Part of the 9DTTT Game Library
 */

class RecursiveMaze {
    constructor() {
        this.gridSize = 9;
        this.mazeStack = []; // Stack of mazes for recursion
        this.currentMaze = null;
        this.player = { x: 1, y: 1 };
        this.exit = { x: 7, y: 7 };
        this.portals = [];
        this.moveCount = 0;
        this.timer = 60;
        this.timerInterval = null;
        this.gameOver = false;
        this.maxDepth = 3;
    }

    /**
     * Initialize the game
     */
    initGame() {
        this.stopTimer();
        this.mazeStack = [];
        this.currentMaze = this.generateMaze();
        this.mazeStack.push({
            maze: this.currentMaze,
            player: { x: 1, y: 1 },
            name: 'Level 1'
        });
        
        this.player = { x: 1, y: 1 };
        this.moveCount = 0;
        this.timer = 60;
        this.gameOver = false;
        
        this.renderMaze();
        this.renderBreadcrumb();
        this.updateUI();
        this.startTimer();
    }

    /**
     * Generate a maze using recursive backtracking
     */
    generateMaze() {
        const maze = Array(this.gridSize).fill(null).map(() => 
            Array(this.gridSize).fill(1) // 1 = wall
        );
        
        // Simple maze generation using recursive backtracking
        const carve = (x, y) => {
            maze[y][x] = 0; // 0 = path
            
            const directions = this.shuffle([
                { dx: 0, dy: -2 }, // up
                { dx: 2, dy: 0 },  // right
                { dx: 0, dy: 2 },  // down
                { dx: -2, dy: 0 }  // left
            ]);
            
            for (const { dx, dy } of directions) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx > 0 && nx < this.gridSize - 1 && 
                    ny > 0 && ny < this.gridSize - 1 && 
                    maze[ny][nx] === 1) {
                    maze[y + dy/2][x + dx/2] = 0; // Carve through wall
                    carve(nx, ny);
                }
            }
        };
        
        carve(1, 1);
        
        // Ensure start and exit are accessible
        maze[1][1] = 0;
        maze[this.gridSize - 2][this.gridSize - 2] = 0;
        
        // Ensure there's a valid path from start to exit using BFS
        if (!this.hasPath(maze, 1, 1, this.gridSize - 2, this.gridSize - 2)) {
            this.carvePath(maze, 1, 1, this.gridSize - 2, this.gridSize - 2);
        }
        
        // Add portals if not at max depth
        this.portals = [];
        if (this.mazeStack.length < this.maxDepth) {
            const numPortals = Math.min(2, this.maxDepth - this.mazeStack.length);
            for (let i = 0; i < numPortals; i++) {
                let px, py;
                do {
                    px = Math.floor(Math.random() * (this.gridSize - 2)) + 1;
                    py = Math.floor(Math.random() * (this.gridSize - 2)) + 1;
                } while (maze[py][px] === 1 || 
                         (px === 1 && py === 1) || 
                         (px === this.gridSize - 2 && py === this.gridSize - 2) ||
                         this.portals.some(p => p.x === px && p.y === py));
                
                this.portals.push({ x: px, y: py });
            }
        }
        
        // Set exit position
        this.exit = { x: this.gridSize - 2, y: this.gridSize - 2 };
        
        return maze;
    }

    /**
     * Check if there's a path between two points using BFS
     */
    hasPath(maze, startX, startY, endX, endY) {
        const visited = Array(this.gridSize).fill(null).map(() => 
            Array(this.gridSize).fill(false)
        );
        const queue = [{ x: startX, y: startY }];
        visited[startY][startX] = true;
        
        const directions = [
            { dx: 0, dy: -1 }, // up
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: 1 },  // down
            { dx: -1, dy: 0 }  // left
        ];
        
        while (queue.length > 0) {
            const { x, y } = queue.shift();
            
            if (x === endX && y === endY) {
                return true;
            }
            
            for (const { dx, dy } of directions) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < this.gridSize && 
                    ny >= 0 && ny < this.gridSize && 
                    !visited[ny][nx] && maze[ny][nx] === 0) {
                    visited[ny][nx] = true;
                    queue.push({ x: nx, y: ny });
                }
            }
        }
        
        return false;
    }

    /**
     * Carve a path from start to end point
     */
    carvePath(maze, startX, startY, endX, endY) {
        let x = startX;
        let y = startY;
        
        // Carve a path by moving toward the exit
        while (x !== endX || y !== endY) {
            maze[y][x] = 0;
            
            // Decide whether to move horizontally or vertically
            if (x !== endX && y !== endY) {
                // Randomly choose direction when both options available
                if (Math.random() < 0.5) {
                    x += (endX > x) ? 1 : -1;
                } else {
                    y += (endY > y) ? 1 : -1;
                }
            } else if (x !== endX) {
                x += (endX > x) ? 1 : -1;
            } else {
                y += (endY > y) ? 1 : -1;
            }
        }
        maze[endY][endX] = 0;
    }

    /**
     * Shuffle array
     */
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Render the maze
     */
    renderMaze() {
        const gridEl = document.getElementById('maze-grid');
        const miniGridEl = document.getElementById('mini-grid');
        if (!gridEl) return;
        
        gridEl.innerHTML = '';
        if (miniGridEl) miniGridEl.innerHTML = '';
        
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'maze-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                const isWall = this.currentMaze[y][x] === 1;
                const isPlayer = this.player.x === x && this.player.y === y;
                const isExit = this.exit.x === x && this.exit.y === y;
                const isPortal = this.portals.some(p => p.x === x && p.y === y);
                
                if (isWall) {
                    cell.classList.add('wall');
                } else {
                    cell.classList.add('path');
                }
                
                if (isPlayer) {
                    cell.classList.add('player');
                    cell.textContent = '🏃';
                } else if (isExit) {
                    cell.classList.add('exit');
                    cell.textContent = '🏆';
                } else if (isPortal) {
                    cell.classList.add('portal');
                    cell.textContent = '🚪';
                }
                
                gridEl.appendChild(cell);
                
                // Mini map
                if (miniGridEl) {
                    const miniCell = document.createElement('div');
                    miniCell.className = 'mini-cell';
                    if (isWall) miniCell.classList.add('wall');
                    else miniCell.classList.add('path');
                    if (isPlayer) miniCell.classList.add('player');
                    if (isExit) miniCell.classList.add('exit');
                    if (isPortal) miniCell.classList.add('portal');
                    miniGridEl.appendChild(miniCell);
                }
            }
        }
    }

    /**
     * Render breadcrumb trail
     */
    renderBreadcrumb() {
        const breadcrumb = document.getElementById('breadcrumb');
        if (!breadcrumb) return;
        
        breadcrumb.innerHTML = '';
        this.mazeStack.forEach((level, index) => {
            const crumb = document.createElement('span');
            crumb.className = 'crumb';
            crumb.textContent = level.name;
            if (index === this.mazeStack.length - 1) {
                crumb.classList.add('active');
            }
            breadcrumb.appendChild(crumb);
        });
    }

    /**
     * Move the player
     */
    move(dx, dy) {
        if (this.gameOver) return;
        
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        // Check bounds
        if (newX < 0 || newX >= this.gridSize || newY < 0 || newY >= this.gridSize) {
            return;
        }
        
        // Check for wall
        if (this.currentMaze[newY][newX] === 1) {
            return;
        }
        
        // Move player
        this.player.x = newX;
        this.player.y = newY;
        this.moveCount++;
        
        // Check for portal
        const portal = this.portals.find(p => p.x === newX && p.y === newY);
        if (portal) {
            this.enterPortal();
        }
        
        // Check for exit
        if (newX === this.exit.x && newY === this.exit.y) {
            this.reachExit();
        }
        
        this.renderMaze();
        this.updateUI();
    }

    /**
     * Enter a portal (go deeper into maze)
     */
    enterPortal() {
        // Save current state
        this.mazeStack[this.mazeStack.length - 1].player = { ...this.player };
        
        // Generate new maze
        const newMaze = this.generateMaze();
        this.currentMaze = newMaze;
        this.player = { x: 1, y: 1 };
        
        this.mazeStack.push({
            maze: newMaze,
            player: { x: 1, y: 1 },
            name: `Level ${this.mazeStack.length + 1}`
        });
        
        // Add bonus time
        this.timer += 15;
        
        this.renderMaze();
        this.renderBreadcrumb();
        this.updateUI();
    }

    /**
     * Go back one level
     */
    goBack() {
        if (this.mazeStack.length <= 1 || this.gameOver) return;
        
        this.mazeStack.pop();
        const prevLevel = this.mazeStack[this.mazeStack.length - 1];
        this.currentMaze = prevLevel.maze;
        this.player = { ...prevLevel.player };
        
        // Regenerate portals for this level
        this.portals = [];
        if (this.mazeStack.length < this.maxDepth) {
            const numPortals = Math.min(2, this.maxDepth - this.mazeStack.length);
            for (let i = 0; i < numPortals; i++) {
                let px, py;
                do {
                    px = Math.floor(Math.random() * (this.gridSize - 2)) + 1;
                    py = Math.floor(Math.random() * (this.gridSize - 2)) + 1;
                } while (this.currentMaze[py][px] === 1 || 
                         (px === 1 && py === 1) || 
                         (px === this.gridSize - 2 && py === this.gridSize - 2) ||
                         this.portals.some(p => p.x === px && p.y === py));
                
                this.portals.push({ x: px, y: py });
            }
        }
        
        this.renderMaze();
        this.renderBreadcrumb();
        this.updateUI();
    }

    /**
     * Reach the exit
     */
    reachExit() {
        if (this.mazeStack.length === 1) {
            // Won the game!
            this.gameOver = true;
            this.stopTimer();
            this.showWinModal();
        } else {
            // Go back up one level
            this.goBack();
            this.timer += 10; // Bonus time for completing a level
        }
    }

    /**
     * Show win modal
     */
    showWinModal() {
        const modal = document.getElementById('game-over-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        
        title.textContent = '🎉 You Escaped!';
        message.innerHTML = `
            Congratulations! You navigated through all the mazes!<br><br>
            Moves: ${this.moveCount}<br>
            Time remaining: ${this.timer}s<br>
            Max depth reached: ${this.maxDepth}
        `;
        
        modal.classList.add('show');
    }

    /**
     * Show game over (time ran out)
     */
    showGameOverModal() {
        const modal = document.getElementById('game-over-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        
        title.textContent = "⏰ Time's Up!";
        message.textContent = `You ran out of time! Moves: ${this.moveCount}, Depth reached: ${this.mazeStack.length}. Try again?`;
        
        modal.classList.add('show');
    }

    /**
     * Start the timer
     */
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer--;
            this.updateTimerDisplay();
            
            if (this.timer <= 0) {
                this.gameOver = true;
                this.stopTimer();
                this.showGameOverModal();
            }
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
            timerEl.className = '';
            if (this.timer <= 10) {
                timerEl.classList.add('danger');
            } else if (this.timer <= 20) {
                timerEl.classList.add('warning');
            }
        }
    }

    /**
     * Update UI
     */
    updateUI() {
        document.getElementById('maze-depth').textContent = this.mazeStack.length;
        document.getElementById('move-count').textContent = this.moveCount;
        this.updateTimerDisplay();
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const game = new RecursiveMaze();
    
    // Setup direction buttons
    document.getElementById('up-btn')?.addEventListener('click', () => game.move(0, -1));
    document.getElementById('down-btn')?.addEventListener('click', () => game.move(0, 1));
    document.getElementById('left-btn')?.addEventListener('click', () => game.move(-1, 0));
    document.getElementById('right-btn')?.addEventListener('click', () => game.move(1, 0));
    
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
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                e.preventDefault();
                game.move(0, -1);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                game.move(0, 1);
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                game.move(-1, 0);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                game.move(1, 0);
                break;
            case 'Escape':
                e.preventDefault();
                game.goBack();
                break;
            case 'r':
            case 'R':
                e.preventDefault();
                game.initGame();
                break;
        }
    });
    
    // Start the game
    game.initGame();
});
