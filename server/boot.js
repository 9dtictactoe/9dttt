/**
 * Boot Sequence - 9DTTT Game Platform
 * ASCII art startup animation with tic-tac-toe theme
 */

const config = require('./config');

// Colors for terminal
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    white: '\x1b[37m',
};

const c = colors;

// ASCII Art Logo
const logo = `
${c.cyan}${c.bright}
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║     ██████╗ ██████╗ ████████╗████████╗████████╗               ║
    ║    ██╔═══██╗██╔══██╗╚══██╔══╝╚══██╔══╝╚══██╔══╝               ║
    ║    ╚██████╔╝██║  ██║   ██║      ██║      ██║                  ║
    ║     ╚═══██║ ██║  ██║   ██║      ██║      ██║                  ║
    ║    ██████╔╝ ██████╔╝   ██║      ██║      ██║                  ║
    ║    ╚═════╝  ╚═════╝    ╚═╝      ╚═╝      ╚═╝                  ║
    ║                                                               ║
    ║           ${c.yellow}G A M E   P L A T F O R M${c.cyan}                          ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
${c.reset}`;

// Tic-tac-toe board frames for animation
const boardFrames = [
    // Frame 1 - Empty board
    `
       ${c.dim}┌───┬───┬───┐
       │   │   │   │
       ├───┼───┼───┤
       │   │   │   │
       ├───┼───┼───┤
       │   │   │   │
       └───┴───┴───┘${c.reset}`,
    
    // Frame 2 - X in center
    `
       ${c.dim}┌───┬───┬───┐
       │   │   │   │
       ├───┼───┼───┤
       │   │${c.blue} X ${c.dim}│   │
       ├───┼───┼───┤
       │   │   │   │
       └───┴───┴───┘${c.reset}`,
    
    // Frame 3 - O top left
    `
       ${c.dim}┌───┬───┬───┐
       │${c.red} O ${c.dim}│   │   │
       ├───┼───┼───┤
       │   │${c.blue} X ${c.dim}│   │
       ├───┼───┼───┤
       │   │   │   │
       └───┴───┴───┘${c.reset}`,
    
    // Frame 4 - X bottom right
    `
       ${c.dim}┌───┬───┬───┐
       │${c.red} O ${c.dim}│   │   │
       ├───┼───┼───┤
       │   │${c.blue} X ${c.dim}│   │
       ├───┼───┼───┤
       │   │   │${c.blue} X ${c.dim}│
       └───┴───┴───┘${c.reset}`,
    
    // Frame 5 - O top right
    `
       ${c.dim}┌───┬───┬───┐
       │${c.red} O ${c.dim}│   │${c.red} O ${c.dim}│
       ├───┼───┼───┤
       │   │${c.blue} X ${c.dim}│   │
       ├───┼───┼───┤
       │   │   │${c.blue} X ${c.dim}│
       └───┴───┴───┘${c.reset}`,
    
    // Frame 6 - X top middle (winning move!)
    `
       ${c.dim}┌───┬───┬───┐
       │${c.red} O ${c.dim}│${c.green}${c.bright} X ${c.dim}│${c.red} O ${c.dim}│
       ├───┼───┼───┤
       │   │${c.green}${c.bright} X ${c.dim}│   │
       ├───┼───┼───┤
       │   │   │${c.green}${c.bright} X ${c.dim}│
       └───┴───┴───┘${c.reset}`,
];

// Loading bar characters
const loadingChars = ['░', '▒', '▓', '█'];

// Boot messages
const bootMessages = [
    { text: 'Initializing game engine', icon: '🎮' },
    { text: 'Loading multiplayer systems', icon: '📡' },
    { text: 'Connecting storage layer', icon: '💾' },
    { text: 'Setting up security protocols', icon: '🔒' },
    { text: 'Enabling moderation tools', icon: '🛡️' },
    { text: 'Preparing chat systems', icon: '💬' },
    { text: 'Loading leaderboards', icon: '🏆' },
    { text: 'Starting keep-alive service', icon: '💓' },
];

// Utility to sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Clear line and move cursor
const clearLine = () => process.stdout.write('\r\x1b[K');
const moveCursor = (lines) => process.stdout.write(`\x1b[${lines}A`);

class Boot {
    constructor() {
        this.startTime = Date.now();
    }

    // Print the logo
    printLogo() {
        console.clear();
        console.log(logo);
    }

    // Animate the tic-tac-toe board
    async animateBoard() {
        const baseY = 14; // Lines from top where board starts
        
        for (let i = 0; i < boardFrames.length; i++) {
            console.log(boardFrames[i]);
            await sleep(300);
            
            if (i < boardFrames.length - 1) {
                // Move cursor up to overwrite board
                moveCursor(8);
            }
        }
        
        // Show "X WINS!" message
        console.log(`\n       ${c.green}${c.bright}    ✨ X WINS! ✨${c.reset}\n`);
        await sleep(500);
    }

    // Show loading progress
    async showLoading() {
        console.log(`${c.cyan}${c.bright}  ══════════════════════════════════════════════════${c.reset}\n`);
        
        for (let i = 0; i < bootMessages.length; i++) {
            const msg = bootMessages[i];
            
            // Show loading animation
            for (let j = 0; j <= 10; j++) {
                const progress = Math.floor((j / 10) * 20);
                const bar = '█'.repeat(progress) + '░'.repeat(20 - progress);
                const percentage = (j * 10).toString().padStart(3);
                
                clearLine();
                process.stdout.write(`  ${msg.icon} ${c.white}${msg.text}${c.reset} [${c.cyan}${bar}${c.reset}] ${percentage}%`);
                
                await sleep(30);
            }
            
            // Complete
            clearLine();
            console.log(`  ${msg.icon} ${c.white}${msg.text}${c.reset} [${c.green}████████████████████${c.reset}] ${c.green}✓${c.reset}`);
            
            await sleep(100);
        }
        
        console.log(`\n${c.cyan}${c.bright}  ══════════════════════════════════════════════════${c.reset}\n`);
    }

    // Show server info box
    showServerInfo() {
        const storageType = config.REDIS_URL ? 'Redis' : 'In-Memory';
        const keepAlive = config.RENDER_EXTERNAL_URL ? 'Active' : 'Disabled';
        
        console.log(`${c.green}${c.bright}`);
        console.log(`  ┌─────────────────────────────────────────────────┐`);
        console.log(`  │           ${c.white}SERVER READY${c.green}                           │`);
        console.log(`  ├─────────────────────────────────────────────────┤`);
        console.log(`  │                                                 │`);
        console.log(`  │  ${c.cyan}🌐 URL:${c.white}        http://localhost:${String(config.PORT).padEnd(14)}${c.green}│`);
        console.log(`  │  ${c.cyan}💾 Storage:${c.white}    ${storageType.padEnd(24)}${c.green}│`);
        console.log(`  │  ${c.cyan}💓 Keep-Alive:${c.white} ${keepAlive.padEnd(24)}${c.green}│`);
        console.log(`  │  ${c.cyan}🔒 Security:${c.white}   Enabled${' '.repeat(17)}${c.green}│`);
        console.log(`  │                                                 │`);
        
        if (config.MAINTENANCE_MODE) {
            console.log(`  │  ${c.yellow}⚠️  MAINTENANCE MODE ENABLED${c.green}                    │`);
            console.log(`  │                                                 │`);
        }
        
        console.log(`  └─────────────────────────────────────────────────┘`);
        console.log(`${c.reset}`);
        
        const bootTime = ((Date.now() - this.startTime) / 1000).toFixed(2);
        console.log(`  ${c.dim}Boot completed in ${bootTime}s${c.reset}\n`);
    }

    // Quick boot (no animation)
    quickBoot() {
        console.log(`
${c.cyan}${c.bright}
  ╔═══════════════════════════════════════╗
  ║         9DTTT GAME PLATFORM           ║
  ╠═══════════════════════════════════════╣
  ║  🎮 Server: http://localhost:${String(config.PORT).padEnd(8)}║
  ║  💾 Storage: ${(config.REDIS_URL ? 'Redis' : 'In-Memory').padEnd(22)}║
  ║  🔒 Security: Enabled                 ║
  ${config.MAINTENANCE_MODE ? '║  ⚠️  MAINTENANCE MODE                  ║\n  ' : ''}╚═══════════════════════════════════════╝
${c.reset}`);
    }

    // Full boot sequence
    async fullBoot() {
        try {
            this.printLogo();
            await sleep(500);
            await this.animateBoard();
            await this.showLoading();
            this.showServerInfo();
        } catch (error) {
            // Fallback to quick boot if animation fails
            this.quickBoot();
        }
    }

    // Run boot based on environment
    async run() {
        // Skip animation in production or if NO_ANIMATION env is set
        if (config.NODE_ENV === 'production' || process.env.NO_ANIMATION === 'true') {
            this.quickBoot();
        } else {
            await this.fullBoot();
        }
    }
}

module.exports = new Boot();
