/**
 * Monster Rampage - Inspired by classic Rampage arcade game
 * 3-player destructive fun: George (Dog), Lizzie (Lizard), Ralph (Monkey)
 * Destroy buildings, eat things to grow, avoid hazards!
 */

class MonsterRampageGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1000;
        this.canvas.height = 600;
        
        this.state = 'playing';
        this.players = [];
        this.buildings = [];
        this.projectiles = [];
        this.pickups = [];
        this.particles = [];
        
        this.level = 1;
        this.cityDestruction = 0;
        this.targetDestruction = 100;
        
        this.keys = {};
        this.setupInput();
        this.init();
        this.gameLoop();
    }
    
    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            e.preventDefault();
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    init() {
        // Create 3 player monsters
        this.players = [
            {
                id: 1,
                name: 'GEORGE',
                type: 'dog',
                emoji: '🐶',
                x: 100,
                y: 400,
                vx: 0,
                vy: 0,
                width: 60,
                height: 80,
                health: 100,
                maxHealth: 100,
                size: 1,
                maxSize: 3,
                score: 0,
                color: '#ff6b6b',
                onGround: false,
                climbing: false,
                climbingBuilding: null,
                controls: {
                    left: 'KeyA',
                    right: 'KeyD',
                    up: 'KeyW',
                    down: 'KeyS',
                    action: 'Space'
                }
            },
            {
                id: 2,
                name: 'LIZZIE',
                type: 'lizard',
                emoji: '🦎',
                x: 400,
                y: 400,
                vx: 0,
                vy: 0,
                width: 60,
                height: 80,
                health: 100,
                maxHealth: 100,
                size: 1,
                maxSize: 3,
                score: 0,
                color: '#4ecdc4',
                onGround: false,
                climbing: false,
                climbingBuilding: null,
                controls: {
                    left: 'ArrowLeft',
                    right: 'ArrowRight',
                    up: 'ArrowUp',
                    down: 'ArrowDown',
                    action: 'Enter'
                }
            },
            {
                id: 3,
                name: 'RALPH',
                type: 'monkey',
                emoji: '🐵',
                x: 700,
                y: 400,
                vx: 0,
                vy: 0,
                width: 60,
                height: 80,
                health: 100,
                maxHealth: 100,
                size: 1,
                maxSize: 3,
                score: 0,
                color: '#ffe66d',
                onGround: false,
                climbing: false,
                climbingBuilding: null,
                controls: {
                    left: 'KeyJ',
                    right: 'KeyL',
                    up: 'KeyI',
                    down: 'KeyK',
                    action: 'ShiftLeft'
                }
            }
        ];
        
        this.generateCity();
    }
    
    generateCity() {
        this.buildings = [];
        const buildingTypes = [
            { width: 120, height: 300, floors: 15, color: '#34495e', windows: true },
            { width: 100, height: 250, floors: 12, color: '#2c3e50', windows: true },
            { width: 140, height: 350, floors: 18, color: '#7f8c8d', windows: true },
            { width: 80, height: 200, floors: 10, color: '#95a5a6', windows: true }
        ];
        
        let x = 50;
        for (let i = 0; i < 8; i++) {
            const type = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
            const building = {
                x: x,
                y: this.canvas.height - type.height,
                width: type.width,
                height: type.height,
                floors: type.floors,
                color: type.color,
                health: type.floors * 10,
                maxHealth: type.floors * 10,
                damage: 0,
                destroyed: false,
                windows: this.generateWindows(type.floors, type.width)
            };
            this.buildings.push(building);
            x += type.width + 30;
        }
    }
    
    generateWindows(floors, width) {
        const windows = [];
        const windowsPerFloor = Math.floor(width / 25) - 1;
        const floorHeight = 20;
        
        for (let floor = 0; floor < floors; floor++) {
            for (let w = 0; w < windowsPerFloor; w++) {
                windows.push({
                    x: 10 + w * 25,
                    y: floor * floorHeight + 5,
                    width: 15,
                    height: 12,
                    lit: Math.random() > 0.3,
                    broken: false
                });
            }
        }
        return windows;
    }
    
    update(deltaTime) {
        if (this.state !== 'playing') return;
        
        // Update players
        this.players.forEach(player => {
            if (player.health <= 0) return;
            this.updatePlayer(player, deltaTime);
        });
        
        // Spawn pickups randomly
        if (Math.random() < 0.01) {
            this.spawnPickup();
        }
        
        // Spawn military attacks
        if (Math.random() < 0.02) {
            this.spawnMilitaryAttack();
        }
        
        // Update projectiles
        this.projectiles.forEach(proj => {
            proj.x += proj.vx;
            proj.y += proj.vy;
            proj.life--;
        });
        this.projectiles = this.projectiles.filter(p => p.life > 0 && p.x > 0 && p.x < this.canvas.width);
        
        // Update particles
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life--;
            p.alpha -= 0.02;
        });
        this.particles = this.particles.filter(p => p.life > 0 && p.alpha > 0);
        
        // Check pickups collision
        this.pickups.forEach(pickup => {
            this.players.forEach(player => {
                if (this.checkCollision(player, pickup)) {
                    this.collectPickup(player, pickup);
                }
            });
        });
        this.pickups = this.pickups.filter(p => !p.collected);
        
        // Check projectile collision with players
        this.projectiles.forEach(proj => {
            this.players.forEach(player => {
                if (this.checkCollision(player, proj)) {
                    this.damagePlayer(player, proj.damage);
                    proj.life = 0;
                    this.createExplosion(proj.x, proj.y, 10);
                }
            });
        });
        
        // Check if level complete
        const aliveBuildings = this.buildings.filter(b => !b.destroyed).length;
        this.cityDestruction = ((8 - aliveBuildings) / 8) * 100;
        
        if (this.cityDestruction >= this.targetDestruction) {
            this.nextLevel();
        }
        
        // Check game over
        const alivePlayers = this.players.filter(p => p.health > 0).length;
        if (alivePlayers === 0) {
            this.gameOver();
        }
        
        this.updateHUD();
    }
    
    updatePlayer(player, deltaTime) {
        const speed = 3 * player.size;
        const climbSpeed = 2;
        
        // Horizontal movement
        if (this.keys[player.controls.left]) {
            player.vx = -speed;
        } else if (this.keys[player.controls.right]) {
            player.vx = speed;
        } else {
            player.vx *= 0.8;
        }
        
        // Check if near building
        const nearBuilding = this.buildings.find(b => 
            !b.destroyed &&
            player.x + player.width > b.x && 
            player.x < b.x + b.width
        );
        
        if (nearBuilding && this.keys[player.controls.up]) {
            // Climb building
            player.climbing = true;
            player.climbingBuilding = nearBuilding;
            player.y -= climbSpeed;
            player.vy = 0;
            
            if (player.y < nearBuilding.y) {
                player.y = nearBuilding.y;
            }
        } else if (player.climbing && this.keys[player.controls.down]) {
            player.y += climbSpeed;
            if (player.y + player.height >= this.canvas.height - 100) {
                player.climbing = false;
                player.climbingBuilding = null;
                player.y = this.canvas.height - 100 - player.height;
            }
        } else if (!this.keys[player.controls.up] && !this.keys[player.controls.down]) {
            player.climbing = false;
            player.climbingBuilding = null;
        }
        
        // Attack/Destroy action
        if (this.keys[player.controls.action]) {
            if (nearBuilding) {
                this.damageBuilding(nearBuilding, player);
            }
        }
        
        // Gravity
        if (!player.climbing) {
            player.vy += 0.5;
            player.y += player.vy;
        }
        
        // Ground collision
        const groundY = this.canvas.height - 100 - player.height;
        if (player.y >= groundY) {
            player.y = groundY;
            player.vy = 0;
            player.onGround = true;
        } else {
            player.onGround = false;
        }
        
        // Horizontal movement
        player.x += player.vx;
        
        // Boundaries
        if (player.x < 0) player.x = 0;
        if (player.x + player.width > this.canvas.width) {
            player.x = this.canvas.width - player.width;
        }
        
        // Health regeneration (slow)
        if (player.health < player.maxHealth) {
            player.health += 0.01;
        }
    }
    
    damageBuilding(building, player) {
        if (Math.random() < 0.1) { // Cooldown via randomness
            building.health -= 5 * player.size;
            building.damage++;
            
            // Break some windows
            const unbrokenWindows = building.windows.filter(w => !w.broken);
            if (unbrokenWindows.length > 0) {
                const window = unbrokenWindows[Math.floor(Math.random() * unbrokenWindows.length)];
                window.broken = true;
            }
            
            // Particles
            this.createDebris(
                building.x + building.width / 2,
                building.y + building.height / 2,
                15,
                building.color
            );
            
            player.score += 10;
            
            if (building.health <= 0 && !building.destroyed) {
                building.destroyed = true;
                player.score += 500;
                this.createExplosion(
                    building.x + building.width / 2,
                    building.y + building.height / 2,
                    50
                );
                
                // Spawn food from destroyed building
                for (let i = 0; i < 5; i++) {
                    this.spawnPickup(
                        building.x + Math.random() * building.width,
                        building.y + Math.random() * building.height
                    );
                }
            }
        }
    }
    
    spawnPickup(x, y) {
        const types = [
            { type: 'food', emoji: '🍖', effect: 'health', value: 20, color: '#ff6b6b' },
            { type: 'food', emoji: '🍕', effect: 'health', value: 15, color: '#ffa502' },
            { type: 'food', emoji: '🍔', effect: 'health', value: 25, color: '#ff4757' },
            { type: 'food', emoji: '🌭', effect: 'health', value: 10, color: '#ff6348' },
            { type: 'growth', emoji: '💊', effect: 'size', value: 0.2, color: '#2ed573' },
            { type: 'bomb', emoji: '💣', effect: 'damage', value: 30, color: '#000' },
            { type: 'toxic', emoji: '☢️', effect: 'damage', value: 20, color: '#95e1d3' }
        ];
        
        const pickup = types[Math.floor(Math.random() * types.length)];
        
        this.pickups.push({
            x: x || Math.random() * this.canvas.width,
            y: y || -50,
            width: 30,
            height: 30,
            vy: 2,
            ...pickup,
            collected: false
        });
    }
    
    collectPickup(player, pickup) {
        pickup.collected = true;
        
        switch (pickup.effect) {
            case 'health':
                player.health = Math.min(player.health + pickup.value, player.maxHealth);
                player.score += 50;
                this.createText(pickup.x, pickup.y, '+' + pickup.value + ' HP', '#00ff00');
                break;
            case 'size':
                if (player.size < player.maxSize) {
                    player.size = Math.min(player.size + pickup.value, player.maxSize);
                    player.maxHealth += 20;
                    player.health += 20;
                    player.width += 10;
                    player.height += 15;
                    player.score += 100;
                    this.createText(pickup.x, pickup.y, 'GROW!', '#2ed573');
                }
                break;
            case 'damage':
                player.health -= pickup.value;
                this.createExplosion(pickup.x, pickup.y, 15);
                this.createText(pickup.x, pickup.y, '-' + pickup.value, '#ff0000');
                break;
        }
    }
    
    spawnMilitaryAttack() {
        const side = Math.random() < 0.5 ? 'left' : 'right';
        const targetPlayer = this.players.filter(p => p.health > 0)[
            Math.floor(Math.random() * this.players.filter(p => p.health > 0).length)
        ];
        
        if (!targetPlayer) return;
        
        const projectile = {
            x: side === 'left' ? 0 : this.canvas.width,
            y: Math.random() * this.canvas.height * 0.6,
            width: 20,
            height: 8,
            vx: side === 'left' ? 5 : -5,
            vy: 0,
            damage: 15,
            color: '#ff4757',
            life: 200
        };
        
        this.projectiles.push(projectile);
    }
    
    damagePlayer(player, damage) {
        player.health -= damage;
        if (player.health < 0) player.health = 0;
    }
    
    createDebris(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 2,
                size: Math.random() * 6 + 2,
                color: color,
                life: 60,
                alpha: 1
            });
        }
    }
    
    createExplosion(x, y, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: Math.random() * 8 + 3,
                color: ['#ff4757', '#ffa502', '#ff6348', '#ff7f50'][Math.floor(Math.random() * 4)],
                life: 40,
                alpha: 1
            });
        }
    }
    
    createText(x, y, text, color) {
        this.particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: -2,
            text: text,
            color: color,
            life: 60,
            alpha: 1
        });
    }
    
    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    nextLevel() {
        this.level++;
        this.targetDestruction = 100;
        this.cityDestruction = 0;
        this.generateCity();
        
        // Heal players partially
        this.players.forEach(p => {
            p.health = Math.min(p.health + 50, p.maxHealth);
        });
    }
    
    gameOver() {
        this.state = 'gameover';
        const screen = document.getElementById('gameOverScreen');
        const scores = document.getElementById('finalScores');
        
        const sortedPlayers = [...this.players].sort((a, b) => b.score - a.score);
        
        scores.innerHTML = '<h3>Final Scores:</h3>' + 
            sortedPlayers.map((p, i) => 
                `<div style="margin: 10px 0; font-size: ${i === 0 ? '18px' : '14px'}; color: ${p.color}">
                    ${i + 1}. ${p.emoji} ${p.name}: ${p.score} ${i === 0 ? '👑' : ''}
                </div>`
            ).join('');
        
        screen.classList.add('show');
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#87ceeb';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ground
        this.ctx.fillStyle = '#2d5016';
        this.ctx.fillRect(0, this.canvas.height - 100, this.canvas.width, 100);
        
        // Draw buildings
        this.buildings.forEach(building => {
            if (building.destroyed) return;
            
            // Building body
            this.ctx.fillStyle = building.color;
            this.ctx.fillRect(building.x, building.y, building.width, building.height);
            
            // Damage cracks
            if (building.damage > 10) {
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 2;
                for (let i = 0; i < building.damage / 5; i++) {
                    this.ctx.beginPath();
                    const crackX = building.x + Math.random() * building.width;
                    const crackY = building.y + Math.random() * building.height;
                    this.ctx.moveTo(crackX, crackY);
                    this.ctx.lineTo(crackX + Math.random() * 20 - 10, crackY + Math.random() * 30);
                    this.ctx.stroke();
                }
            }
            
            // Windows
            building.windows.forEach(window => {
                if (window.broken) {
                    this.ctx.fillStyle = '#000';
                } else {
                    this.ctx.fillStyle = window.lit ? '#ffeb3b' : '#2c3e50';
                }
                this.ctx.fillRect(
                    building.x + window.x,
                    building.y + window.y,
                    window.width,
                    window.height
                );
            });
            
            // Health bar
            const healthPercent = building.health / building.maxHealth;
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(building.x, building.y - 10, building.width, 5);
            this.ctx.fillStyle = healthPercent > 0.5 ? '#2ed573' : healthPercent > 0.25 ? '#ffa502' : '#ff4757';
            this.ctx.fillRect(building.x, building.y - 10, building.width * healthPercent, 5);
        });
        
        // Draw pickups
        this.pickups.forEach(pickup => {
            pickup.y += pickup.vy;
            if (pickup.y > this.canvas.height - 120) {
                pickup.y = this.canvas.height - 120;
                pickup.vy = 0;
            }
            
            this.ctx.font = '24px Arial';
            this.ctx.fillText(pickup.emoji, pickup.x, pickup.y);
        });
        
        // Draw projectiles
        this.projectiles.forEach(proj => {
            this.ctx.fillStyle = proj.color;
            this.ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
            // Add trail
            this.ctx.fillStyle = 'rgba(255, 71, 87, 0.3)';
            this.ctx.fillRect(proj.x - proj.vx * 2, proj.y, proj.width, proj.height);
        });
        
        // Draw particles
        this.particles.forEach(p => {
            if (p.text) {
                this.ctx.globalAlpha = p.alpha;
                this.ctx.font = 'bold 16px Arial';
                this.ctx.fillStyle = p.color;
                this.ctx.fillText(p.text, p.x, p.y);
                this.ctx.globalAlpha = 1;
            } else {
                this.ctx.globalAlpha = p.alpha;
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(p.x, p.y, p.size, p.size);
                this.ctx.globalAlpha = 1;
            }
        });
        
        // Draw players
        this.players.forEach(player => {
            if (player.health <= 0) return;
            
            // Shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.ellipse(
                player.x + player.width / 2,
                this.canvas.height - 95,
                player.width / 2,
                10,
                0, 0, Math.PI * 2
            );
            this.ctx.fill();
            
            // Monster
            this.ctx.font = `${player.height}px Arial`;
            this.ctx.fillText(player.emoji, player.x, player.y + player.height);
            
            // Health bar above player
            const barWidth = player.width;
            const barHeight = 8;
            const healthPercent = player.health / player.maxHealth;
            
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(player.x, player.y - 15, barWidth, barHeight);
            this.ctx.fillStyle = healthPercent > 0.5 ? '#2ed573' : healthPercent > 0.25 ? '#ffa502' : '#ff4757';
            this.ctx.fillRect(player.x, player.y - 15, barWidth * healthPercent, barHeight);
            
            // Player name
            this.ctx.font = '12px Arial';
            this.ctx.fillStyle = player.color;
            this.ctx.fillText(player.name, player.x, player.y - 20);
        });
        
        // Draw level info
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillStyle = '#fff';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText(`LEVEL ${this.level}`, 20, 40);
        this.ctx.fillText(`LEVEL ${this.level}`, 20, 40);
        
        this.ctx.font = '16px Arial';
        this.ctx.strokeText(`Destruction: ${Math.floor(this.cityDestruction)}%`, 20, 70);
        this.ctx.fillText(`Destruction: ${Math.floor(this.cityDestruction)}%`, 20, 70);
    }
    
    updateHUD() {
        this.players.forEach((player, index) => {
            const healthBar = document.getElementById(`p${index + 1}-health`);
            const sizeBar = document.getElementById(`p${index + 1}-size`);
            const scoreSpan = document.getElementById(`p${index + 1}-score`);
            
            if (healthBar) {
                const healthPercent = (player.health / player.maxHealth) * 100;
                healthBar.style.width = healthPercent + '%';
            }
            
            if (sizeBar) {
                const sizePercent = (player.size / player.maxSize) * 100;
                sizeBar.style.width = sizePercent + '%';
            }
            
            if (scoreSpan) {
                scoreSpan.textContent = player.score;
            }
        });
    }
    
    gameLoop() {
        const now = performance.now();
        const deltaTime = now - this.lastTime;
        this.lastTime = now;
        
        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game
window.addEventListener('load', () => {
    new MonsterRampageGame();
});
