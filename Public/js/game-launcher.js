/**
 * Game Launcher Module
 * Opens games in a dedicated fullscreen window to prevent keyboard scrolling issues
 * 
 * Features:
 * - Fullscreen overlay for games
 * - Captures all keyboard input to prevent page scroll
 * - Easy exit button to return to library
 * - Preserves game state
 * 
 * Part of the 9DTTT Game Library
 */

(function() {
    'use strict';

    class GameLauncher {
        constructor() {
            this.isOpen = false;
            this.currentGame = null;
            this.iframe = null;
            this.overlay = null;
            
            this._createOverlay();
            this._setupKeyboardCapture();
        }

        /**
         * Create the game overlay container
         */
        _createOverlay() {
            // Create overlay container
            this.overlay = document.createElement('div');
            this.overlay.id = 'game-launcher-overlay';
            this.overlay.className = 'game-launcher-overlay';
            this.overlay.setAttribute('role', 'dialog');
            this.overlay.setAttribute('aria-modal', 'true');
            this.overlay.setAttribute('aria-label', 'Game Window');
            this.overlay.setAttribute('tabindex', '-1');
            this.overlay.innerHTML = `
                <div class="game-launcher-header">
                    <button class="game-launcher-back" id="game-launcher-back" aria-label="Back to Game Library">
                        <span class="back-icon">←</span>
                        <span class="back-text">Back to Library</span>
                    </button>
                    <span class="game-launcher-title" id="game-launcher-title">Loading Game...</span>
                    <button class="game-launcher-fullscreen" id="game-launcher-fullscreen" aria-label="Toggle Fullscreen">
                        <span class="fullscreen-icon">⛶</span>
                    </button>
                </div>
                <div class="game-launcher-content" id="game-launcher-content">
                    <div class="game-launcher-loading" id="game-launcher-loading">
                        <div class="loading-spinner"></div>
                        <p>Loading game...</p>
                    </div>
                    <iframe 
                        id="game-launcher-iframe" 
                        class="game-launcher-iframe"
                        allowfullscreen
                    ></iframe>
                </div>
            `;
            
            document.body.appendChild(this.overlay);
            
            // Get references
            this.iframe = document.getElementById('game-launcher-iframe');
            this.backButton = document.getElementById('game-launcher-back');
            this.titleElement = document.getElementById('game-launcher-title');
            this.fullscreenButton = document.getElementById('game-launcher-fullscreen');
            this.loadingElement = document.getElementById('game-launcher-loading');
            
            // Add event listeners
            this.backButton.addEventListener('click', () => this.close());
            this.fullscreenButton.addEventListener('click', () => this.toggleFullscreen());
            
            // Handle iframe load
            this.iframe.addEventListener('load', () => {
                this.loadingElement.style.display = 'none';
                this.iframe.style.display = 'block';
                this.iframe.focus();
            });
            
            // Add styles
            this._addStyles();
        }

        /**
         * Add CSS styles for the launcher
         */
        _addStyles() {
            const styles = document.createElement('style');
            styles.id = 'game-launcher-styles';
            styles.textContent = `
                .game-launcher-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: #0a0e27;
                    z-index: 10000;
                    display: none;
                    flex-direction: column;
                    overflow: hidden;
                }
                
                .game-launcher-overlay.open {
                    display: flex;
                }
                
                .game-launcher-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px 20px;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border-bottom: 2px solid #4a90e2;
                    min-height: 50px;
                    flex-shrink: 0;
                    position: relative;
                }
                
                .game-launcher-back {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    background: transparent;
                    border: 2px solid #4a90e2;
                    color: #4a90e2;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                    transition: all 0.3s ease;
                }
                
                .game-launcher-back:hover,
                .game-launcher-back:focus {
                    background: #4a90e2;
                    color: #000;
                    transform: scale(1.05);
                    outline: 2px solid #fff;
                    outline-offset: 2px;
                }
                
                .back-icon {
                    font-size: 18px;
                }
                
                .game-launcher-title {
                    color: #fff;
                    font-size: 18px;
                    font-weight: bold;
                    text-align: center;
                    flex: 1;
                }
                
                .game-launcher-fullscreen {
                    padding: 10px 15px;
                    background: transparent;
                    border: 2px solid #4a90e2;
                    color: #4a90e2;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 18px;
                    transition: all 0.3s ease;
                }
                
                .game-launcher-fullscreen:hover,
                .game-launcher-fullscreen:focus {
                    background: #4a90e2;
                    color: #000;
                    outline: 2px solid #fff;
                    outline-offset: 2px;
                }
                
                .game-launcher-content {
                    flex: 1;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #0a0e27;
                }
                
                .game-launcher-iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                    display: none;
                    background: #0a0e27;
                }
                
                .game-launcher-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 20px;
                    color: #fff;
                    font-size: 18px;
                }
                
                .loading-spinner {
                    width: 50px;
                    height: 50px;
                    border: 4px solid #333;
                    border-top: 4px solid #4a90e2;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                /* Hide header in fullscreen mode */
                .game-launcher-overlay:fullscreen .game-launcher-header,
                .game-launcher-overlay:-webkit-full-screen .game-launcher-header {
                    display: none;
                }
                
                .game-launcher-overlay:fullscreen .game-launcher-content,
                .game-launcher-overlay:-webkit-full-screen .game-launcher-content {
                    height: 100vh;
                }
                
                /* Mobile responsive */
                @media (max-width: 600px) {
                    .game-launcher-header {
                        padding: 8px 10px;
                    }
                    
                    .game-launcher-back {
                        padding: 8px 12px;
                        font-size: 12px;
                    }
                    
                    .back-text {
                        display: none;
                    }
                    
                    .game-launcher-title {
                        font-size: 14px;
                    }
                }
                
                /* Keyboard hints */
                .game-launcher-header::after {
                    content: 'Press ESC to exit';
                    position: absolute;
                    bottom: -25px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 12px;
                    color: #666;
                    display: none;
                }
                
                .game-launcher-overlay.open .game-launcher-header::after {
                    display: block;
                }
            `;
            document.head.appendChild(styles);
        }

        /**
         * Setup keyboard capture to prevent page scrolling
         */
        _setupKeyboardCapture() {
            // Capture keyboard events when overlay is open
            document.addEventListener('keydown', (e) => {
                if (!this.isOpen) return;
                
                // ESC to close
                if (e.key === 'Escape') {
                    e.preventDefault();
                    this.close();
                    return;
                }
                
                // F11 to toggle fullscreen (removed 'F' key to avoid game conflicts)
                if (e.key === 'F11') {
                    e.preventDefault();
                    this.toggleFullscreen();
                    return;
                }
                
                // Prevent page scrolling with game keys
                const gameKeys = [
                    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
                    'Space', 'Tab', 'Enter',
                    'KeyW', 'KeyA', 'KeyS', 'KeyD',
                    'KeyJ', 'KeyK', 'KeyL',
                    'KeyZ', 'KeyX', 'KeyC'
                ];
                
                if (gameKeys.includes(e.code)) {
                    // Don't prevent default - let the iframe handle it
                    // But stop propagation to prevent the main page from scrolling
                    e.stopPropagation();
                }
            }, true);
            
            // Also capture at window level
            window.addEventListener('keydown', (e) => {
                if (!this.isOpen) return;
                
                // Prevent scrolling keys from affecting the page
                if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                    if (document.activeElement === document.body || 
                        document.activeElement === this.overlay) {
                        e.preventDefault();
                    }
                }
            }, { passive: false });
        }

        /**
         * Open a game in the launcher
         * @param {string} url - URL of the game page
         * @param {string} title - Title of the game
         */
        open(url, title = 'Game') {
            this.currentGame = { url, title };
            this.isOpen = true;
            
            // Update UI
            this.titleElement.textContent = title;
            this.loadingElement.style.display = 'flex';
            this.iframe.style.display = 'none';
            
            // Load game
            this.iframe.src = url;
            
            // Show overlay
            this.overlay.classList.add('open');
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
            
            // Focus the overlay for keyboard capture
            this.overlay.focus();
            
            // Announce to screen readers
            this._announce(`Opening ${title}`);
        }

        /**
         * Close the launcher and return to library
         */
        close() {
            this.isOpen = false;
            
            // Exit fullscreen if active
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
            
            // Hide overlay
            this.overlay.classList.remove('open');
            
            // Fully stop the game by removing and recreating the iframe
            // This ensures all JavaScript, timers, WebSockets, and resources are cleaned up
            this._destroyAndRecreateIframe();
            
            // Restore body scroll
            document.body.style.overflow = '';
            
            // Return focus to page
            const firstGameCard = document.querySelector('.game-card');
            if (firstGameCard) {
                firstGameCard.focus();
            }
            
            // Announce to screen readers
            this._announce('Returned to game library');
        }

        /**
         * Destroy the iframe and create a fresh one to fully stop all game processes
         */
        _destroyAndRecreateIframe() {
            const container = document.getElementById('game-launcher-content');
            if (!container || !this.iframe) return;
            
            // Remove the old iframe completely
            this.iframe.remove();
            
            // Create a fresh iframe
            const newIframe = document.createElement('iframe');
            newIframe.id = 'game-launcher-iframe';
            newIframe.className = 'game-launcher-iframe';
            // Note: No sandbox attribute - games are trusted same-origin content
            // Sandbox with allow-scripts + allow-same-origin doesn't provide security benefits
            newIframe.setAttribute('allowfullscreen', '');
            
            // Add load handler
            newIframe.addEventListener('load', () => {
                this.loadingElement.style.display = 'none';
                newIframe.style.display = 'block';
                newIframe.focus();
            });
            
            // Insert the new iframe
            container.appendChild(newIframe);
            this.iframe = newIframe;
        }

        /**
         * Toggle fullscreen mode
         */
        toggleFullscreen() {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            } else {
                this.overlay.requestFullscreen().catch(() => {
                    // Fallback for older browsers
                    if (this.overlay.webkitRequestFullscreen) {
                        this.overlay.webkitRequestFullscreen();
                    }
                });
            }
        }

        /**
         * Announce message to screen readers
         */
        _announce(message) {
            const announcement = document.createElement('div');
            announcement.setAttribute('role', 'status');
            announcement.setAttribute('aria-live', 'polite');
            announcement.setAttribute('aria-atomic', 'true');
            announcement.style.cssText = 'position:absolute;left:-9999px;';
            announcement.textContent = message;
            document.body.appendChild(announcement);
            setTimeout(() => announcement.remove(), 1000);
        }
    }

    // Create global instance
    const launcher = new GameLauncher();

    /**
     * Launch a game - can be called from anywhere
     * @param {string} url - Game URL
     * @param {string} title - Game title
     */
    window.launchGame = function(url, title) {
        launcher.open(url, title);
    };

    /**
     * Close the game launcher
     */
    window.closeGame = function() {
        launcher.close();
    };

    // Auto-intercept game links on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function() {
        // Find all game cards and convert them to use the launcher
        const gameCards = document.querySelectorAll('.game-card[href^="games/"]');
        
        gameCards.forEach(card => {
            const href = card.getAttribute('href');
            const title = card.querySelector('.game-title')?.textContent || 'Game';
            
            card.addEventListener('click', function(e) {
                e.preventDefault();
                window.launchGame(href, title);
            });
            
            // Also handle Enter key
            card.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.launchGame(href, title);
                }
            });
        });
    });

    // Export for manual use
    window.GameLauncher = GameLauncher;

})();
