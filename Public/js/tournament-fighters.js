/**
 * Tournament Fighters - Street Fighter style fighting game with tournament mode
 */
class TournamentFighters {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1000;
        this.canvas.height = 600;
        
        this.fighters = [
            { id: 'ryu', name: 'RYU', emoji: '🥋', speed: 5, power: 8, special: 'Hadouken' },
            { id: 'chun', name: 'CHUN-LI', emoji: '👸', speed: 9, power: 6, special: 'Lightning Kick' },
            { id: 'zangief', name: 'ZANGIEF', emoji: '🐻', speed: 3, power: 10, special: 'Spinning Piledriver' },
            { id: 'guile', name: 'GUILE', emoji: '🪖', speed: 6, power: 7, special: 'Sonic Boom' },
            { id: 'blanka', name: 'BLANKA', emoji: '🟢', speed: 8, power: 7, special: 'Electric Thunder' },
            { id: 'dhalsim', name: 'DHALSIM', emoji: '🧘', speed: 4, power: 6, special: 'Yoga Fire' },
            { id: 'ken', name: 'KEN', emoji: '🔥', speed: 7, power: 8, special: 'Shoryuken' },
            { id: 'sagat', name: 'SAGAT', emoji: '🐯', speed: 5, power: 9, special: 'Tiger Uppercut' }
        ];
        
        this.state = 'menu';
        this.mode = null;
        this.selectedFighters = [null, null];
        this.players = [];
        this.projectiles = [];
        this.particles = [];
        this.keys = {};
        
        this.round = 1;
        this.timer = 99;
        this.wins = [0, 0];
        this.tournamentRound = 0;
        this.tournamentOpponents = [];
        
        this.setupInput();
        this.renderFighterSelect();
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
    
    renderFighterSelect() {
        const container = document.getElementById('fighterSelect');
        container.innerHTML = this.fighters.map((f, i) => `
            <div class="fighter-card" onclick="game.selectFighter(${i})">
                <div style="font-size: 48px;">${f.emoji}</div>
                <div style="margin-top: 10px;">${f.name}</div>
                <div style="font-size: 10px; margin-top: 5px;">
                    SPD:${f.speed} PWR:${f.power}
                </div>
            </div>
        `).join('');
    }
    
    selectFighter(index) {
        if (this.selectedFighters[0] === null) {
            this.selectedFighters[0] = this.fighters[index];
            document.querySelectorAll('.fighter-card')[index].classList.add('selected');
        } else if (this.selectedFighters[1] === null) {
            this.selectedFighters[1] = this.fighters[index];
            document.querySelectorAll('.fighter-card')[index].classList.add('selected');
        }
    }
    
    startTournament() {
        if (!this.selectedFighters[0]) {
            alert('Select your fighter!');
            return;
        }
        
        this.mode = 'tournament';
        this.tournamentRound = 0;
        this.wins = [0, 0];
        
        // Create tournament bracket (7 opponents)
        this.tournamentOpponents = this.fighters
            .filter(f => f.id !== this.selectedFighters[0].id)
            .sort(() => Math.random() - 0.5);
        
        this.selectedFighters[1] = this.tournamentOpponents[0];
        this.startFight();
    }
    
    startVersus() {
        if (!this.selectedFighters[0] || !this.selectedFighters[1]) {
            alert('Both players must select a fighter!');
            return;
        }
        
        this.mode = 'versus';
        this.wins = [0, 0];
        this.startFight();
    }
    
    startFight() {
        this.state = 'fighting';
        document.getElementById('menu').classList.add('hidden');
        
        this.round = 1;
        this.timer = 99;
        
        this.players = [
            {
                ...this.selectedFighters[0],
                x: 200,
                y: 450,
                vx: 0,
                vy: 0,
                width: 50,
                height: 80,
                health: 100,
                maxHealth: 100,
                facingRight: true,
                onGround: true,
                blocking: false,
                attacking: false,
                attackCooldown: 0,
                specialCharge: 0,
                invincible: 0,
                combo: 0,
                controls: {
                    left: 'KeyA',
                    right: 'KeyD',
                    jump: 'KeyW',
                    crouch: 'KeyS',
                    punch: 'KeyJ',
                    kick: 'KeyK',
                    block: 'KeyL',
                    special: 'KeyI'
                }
            },
            {
                ...this.selectedFighters[1],
                x: 750,
                y: 450,
                vx: 0,
                vy: 0,
                width: 50,
                height: 80,
                health: 100,
                maxHealth: 100,
                facingRight: false,
                onGround: true,
                blocking: false,
                attacking: false,
                attackCooldown: 0,
                specialCharge: 0,
                invincible: 0,
                combo: 0,
                controls: this.mode === 'tournament' ? null : {
                    left: 'ArrowLeft',
                    right: 'ArrowRight',
                    jump: 'ArrowUp',
                    crouch: 'ArrowDown',
                    punch: 'Numpad4',
                    kick: 'Numpad5',
                    block: 'Numpad6',
                    special: 'Numpad8'
                }
            }
        ];
        
        this.announceRound();
        this.gameLoop();
    }
    
    announceRound() {
        const display = document.getElementById('roundDisplay');
        display.textContent = `ROUND ${this.round}`;
        display.classList.add('show');
        setTimeout(() => {
            display.classList.remove('show');
        }, 2000);
    }
    
    update() {
        if (this.state !== 'fighting') return;
        
        // Timer
        if (this.timer > 0 && Date.now() % 1000 < 20) {
            this.timer -= 0.016;
            document.getElementById('timer').textContent = Math.ceil(this.timer);
        }
        
        if (this.timer <= 0) {
            this.endRound('time');
        }
        
        // Update players
        this.players.forEach((player, index) => {
            this.updatePlayer(player, index);
        });
        
        // Check collisions
        if (this.players[0].attacking && !this.players[1].blocking && 
            !this.players[1].invincible && this.checkCollision(this.players[0], this.players[1])) {
            this.hitPlayer(1, this.players[0].power);
            this.players[0].combo++;
        }
        
        if (this.players[1].attacking && !this.players[0].blocking && 
            !this.players[0].invincible && this.checkCollision(this.players[1], this.players[0])) {
            this.hitPlayer(0, this.players[1].power);
            this.players[1].combo++;
        }
        
        // Update projectiles
        this.projectiles.forEach(proj => {
            proj.x += proj.vx;
            
            const target = this.players[proj.opponent];
            if (!target.blocking && this.checkCollision(proj, target)) {
                this.hitPlayer(proj.opponent, proj.damage);
                proj.active = false;
            }
        });
        this.projectiles = this.projectiles.filter(p => p.active && p.x > 0 && p.x < this.canvas.width);
        
        // Update particles
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.02;
        });
        this.particles = this.particles.filter(p => p.alpha > 0);
        
        // Check round end
        if (this.players[0].health <= 0) {
            this.endRound(1);
        } else if (this.players[1].health <= 0) {
            this.endRound(0);
        }
        
        this.updateHUD();
    }
    
    updatePlayer(player, index) {
        const opponent = this.players[1 - index];
        
        // AI for tournament mode
        if (this.mode === 'tournament' && index === 1) {
            this.aiControl(player, opponent);
        } else if (player.controls) {
            this.playerControl(player);
        }
        
        // Physics
        if (!player.onGround) {
            player.vy += 0.8;
        }
        
        player.x += player.vx;
        player.y += player.vy;
        
        // Ground collision
        if (player.y >= 450) {
            player.y = 450;
            player.vy = 0;
            player.onGround = true;
        }
        
        // Boundaries
        if (player.x < 0) player.x = 0;
        if (player.x > this.canvas.width - player.width) {
            player.x = this.canvas.width - player.width;
        }
        
        // Face opponent
        player.facingRight = opponent.x > player.x;
        
        // Cooldowns
        if (player.attackCooldown > 0) {
            player.attackCooldown -= 16;
            if (player.attackCooldown <= 0) {
                player.attacking = false;
            }
        }
        
        if (player.invincible > 0) {
            player.invincible -= 16;
        }
        
        player.vx *= 0.8;
    }
    
    playerControl(player) {
        const speed = player.speed;
        
        if (this.keys[player.controls.left]) {
            player.vx = -speed;
        }
        if (this.keys[player.controls.right]) {
            player.vx = speed;
        }
        if (this.keys[player.controls.jump] && player.onGround) {
            player.vy = -15;
            player.onGround = false;
        }
        if (this.keys[player.controls.block]) {
            player.blocking = true;
            player.vx = 0;
        } else {
            player.blocking = false;
        }
        if (this.keys[player.controls.punch] && player.attackCooldown <= 0) {
            this.attack(player, 'punch');
        }
        if (this.keys[player.controls.kick] && player.attackCooldown <= 0) {
            this.attack(player, 'kick');
        }
        if (this.keys[player.controls.special] && player.specialCharge >= 50) {
            this.special(player);
        }
    }
    
    aiControl(player, opponent) {
        const dist = Math.abs(player.x - opponent.x);
        
        // Move towards opponent
        if (dist > 100) {
            player.vx = opponent.x > player.x ? player.speed : -player.speed;
        } else if (dist < 50) {
            player.vx = opponent.x > player.x ? -player.speed : player.speed;
        }
        
        // Attack
        if (dist < 80 && player.attackCooldown <= 0 && Math.random() < 0.05) {
            this.attack(player, Math.random() < 0.5 ? 'punch' : 'kick');
        }
        
        // Special
        if (player.specialCharge >= 50 && dist < 200 && Math.random() < 0.02) {
            this.special(player);
        }
        
        // Jump
        if (Math.random() < 0.01 && player.onGround) {
            player.vy = -15;
            player.onGround = false;
        }
        
        // Block
        player.blocking = opponent.attacking && dist < 100 && Math.random() < 0.3;
    }
    
    attack(player, type) {
        player.attacking = true;
        player.attackCooldown = type === 'punch' ? 300 : 400;
        player.specialCharge = Math.min(player.specialCharge + 5, 100);
        
        this.createParticles(
            player.x + (player.facingRight ? player.width : 0),
            player.y + player.height / 2,
            5,
            '#fff'
        );
    }
    
    special(player) {
        player.specialCharge = 0;
        
        // Create projectile
        this.projectiles.push({
            x: player.x + (player.facingRight ? player.width : 0),
            y: player.y + player.height / 2,
            vx: (player.facingRight ? 1 : -1) * 10,
            width: 30,
            height: 20,
            damage: player.power * 2,
            opponent: this.players.indexOf(player) === 0 ? 1 : 0,
            active: true
        });
        
        this.createParticles(player.x, player.y, 20, '#ff0');
    }
    
    hitPlayer(index, damage) {
        const player = this.players[index];
        player.health -= damage;
        player.invincible = 500;
        player.combo = 0;
        
        this.createParticles(player.x, player.y, 10, '#f00');
        
        // Knockback
        player.vx = (player.facingRight ? 1 : -1) * 5;
    }
    
    endRound(winner) {
        if (winner === 'time') {
            // Winner is player with more health
            winner = this.players[0].health > this.players[1].health ? 0 : 1;
        }
        
        this.wins[winner]++;
        
        if (this.wins[winner] >= 2) {
            // Match won
            if (this.mode === 'tournament') {
                if (winner === 0) {
                    this.tournamentRound++;
                    if (this.tournamentRound >= this.tournamentOpponents.length) {
                        alert('TOURNAMENT CHAMPION! 🏆');
                        location.reload();
                    } else {
                        // Next opponent
                        this.selectedFighters[1] = this.tournamentOpponents[this.tournamentRound];
                        this.wins = [0, 0];
                        this.startFight();
                    }
                } else {
                    alert('TOURNAMENT OVER! Try again!');
                    location.reload();
                }
            } else {
                alert(`PLAYER ${winner + 1} WINS!`);
                location.reload();
            }
        } else {
            // Next round
            this.round++;
            this.timer = 99;
            this.players[0].health = this.players[0].maxHealth;
            this.players[1].health = this.players[1].maxHealth;
            this.players[0].x = 200;
            this.players[1].x = 750;
            this.players[0].y = 450;
            this.players[1].y = 450;
            this.announceRound();
        }
    }
    
    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 4 + 2,
                color,
                alpha: 1
            });
        }
    }
    
    checkCollision(a, b) {
        const aRange = {
            x: a.x + (a.facingRight ? a.width : -30),
            y: a.y,
            width: 30,
            height: a.height
        };
        
        return aRange.x < b.x + b.width &&
               aRange.x + aRange.width > b.x &&
               aRange.y < b.y + b.height &&
               aRange.y + aRange.height > b.y;
    }
    
    draw() {
        // Background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(1, '#4ecdc4');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Floor
        this.ctx.fillStyle = '#8b7355';
        this.ctx.fillRect(0, 530, this.canvas.width, 70);
        
        // Draw projectiles
        this.projectiles.forEach(proj => {
            this.ctx.fillStyle = '#ff0';
            this.ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
        });
        
        // Draw particles
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        this.ctx.globalAlpha = 1;
        
        // Draw players
        this.players.forEach(player => {
            if (player.invincible % 200 > 100) return;
            
            // Shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(player.x + 10, player.y + player.height, player.width - 20, 10);
            
            // Fighter
            this.ctx.font = '60px Arial';
            this.ctx.save();
            this.ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
            if (!player.facingRight) this.ctx.scale(-1, 1);
            this.ctx.fillText(player.emoji, -30, 30);
            this.ctx.restore();
            
            // Blocking effect
            if (player.blocking) {
                this.ctx.strokeStyle = '#0ff';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(player.x, player.y, player.width, player.height);
            }
            
            // Attack effect
            if (player.attacking) {
                this.ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
                const hitbox = {
                    x: player.x + (player.facingRight ? player.width : -30),
                    y: player.y,
                    width: 30,
                    height: player.height
                };
                this.ctx.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
            }
            
            // Special charge
            if (player.specialCharge > 0) {
                const barWidth = 40;
                const barHeight = 5;
                this.ctx.fillStyle = '#333';
                this.ctx.fillRect(player.x + 5, player.y - 15, barWidth, barHeight);
                this.ctx.fillStyle = '#ff0';
                this.ctx.fillRect(
                    player.x + 5,
                    player.y - 15,
                    barWidth * (player.specialCharge / 100),
                    barHeight
                );
            }
        });
    }
    
    updateHUD() {
        document.getElementById('p1Name').textContent = this.players[0].name;
        document.getElementById('p2Name').textContent = this.players[1].name;
        
        const p1HealthPercent = (this.players[0].health / this.players[0].maxHealth) * 100;
        const p2HealthPercent = (this.players[1].health / this.players[1].maxHealth) * 100;
        
        document.getElementById('p1Health').style.width = p1HealthPercent + '%';
        document.getElementById('p2Health').style.width = p2HealthPercent + '%';
        
        document.getElementById('p1Wins').textContent = this.wins[0];
        document.getElementById('p2Wins').textContent = this.wins[1];
    }
    
    gameLoop() {
        if (this.state !== 'fighting') return;
        
        this.update();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.game = null;
window.addEventListener('load', () => {
    window.game = new TournamentFighters();
});
