/**
 * Accessibility Manager
 * Easy-to-find accessibility callback for accessible gaming
 * Part of the 9DTTT Game Library
 * 
 * Based on Game Accessibility Guidelines (gameaccessibilityguidelines.com)
 * Covers: Motor, Cognitive, Vision, Hearing, Speech, and General accessibility
 * 
 * Features:
 * - Floating accessibility button (always visible)
 * - Keyboard shortcut: Alt+A to open/close panel
 * - Gamepad shortcut: Y + LB (hold Y, press LB) to open/close
 * - Comprehensive toggle options organized by category
 */

class AccessibilityManager {
    constructor() {
        this.isOpen = false;
        this.settings = this.loadSettings();
        this.gamepadYPressed = {};  // Track per gamepad
        this.boundClickHandler = null;
        this.boundEscapeHandler = null;
        
        this.init();
    }

    /**
     * Load saved accessibility settings from localStorage
     * Settings organized by Game Accessibility Guidelines categories
     */
    loadSettings() {
        const defaults = {
            // Vision (Basic & Intermediate)
            highContrast: false,
            largeText: false,
            dyslexiaFont: false,
            hideBackground: false,
            
            // Motor (Basic & Intermediate)
            reducedMotion: false,
            disableHaptics: false,
            largeTargets: false,
            
            // Cognitive (Basic & Intermediate)
            simplifiedUI: false,
            highlightInteractive: false,
            
            // Hearing (Basic & Intermediate)
            visualCues: false,
            monoAudio: false,
            
            // General
            enhancedFocus: false,
            screenReaderAnnouncements: true
        };

        try {
            const saved = localStorage.getItem('a11y-settings');
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        } catch {
            return defaults;
        }
    }

    /**
     * Save accessibility settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('a11y-settings', JSON.stringify(this.settings));
        } catch {
            // localStorage might not be available
        }
    }

    /**
     * Initialize the accessibility manager
     */
    init() {
        this.createAccessibilityButton();
        this.createAccessibilityPanel();
        this.setupKeyboardShortcut();
        this.setupGamepadShortcut();
        this.applySettings();
        
        // Delay initial announcement to allow screen readers to finish page load
        setTimeout(() => {
            this.announce('Accessibility options available. Press Alt plus A or use the accessibility button to open settings.');
        }, 2000);
    }

    /**
     * Create the floating accessibility button
     */
    createAccessibilityButton() {
        const button = document.createElement('button');
        button.className = 'accessibility-btn';
        button.id = 'accessibility-btn';
        button.setAttribute('aria-label', 'Open accessibility options (Alt+A)');
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-controls', 'accessibility-panel');
        button.setAttribute('title', 'Accessibility Options (Alt+A)');
        button.innerHTML = '♿';
        
        button.addEventListener('click', () => this.togglePanel());
        
        document.body.appendChild(button);
        this.button = button;
    }

    /**
     * Create the accessibility options panel
     * Organized by Game Accessibility Guidelines categories
     */
    createAccessibilityPanel() {
        const panel = document.createElement('div');
        panel.className = 'accessibility-panel';
        panel.id = 'accessibility-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Accessibility Options');
        panel.setAttribute('aria-modal', 'true');

        panel.innerHTML = `
            <h2>♿ Accessibility Options</h2>
            
            <!-- VISION Category -->
            <div class="a11y-category">
                <h3 class="a11y-category-title">👁️ Vision</h3>
                
                <div class="accessibility-option">
                    <label for="a11y-high-contrast">
                        <span class="option-name">High Contrast</span>
                        <span class="option-desc">Increase color contrast for better visibility</span>
                    </label>
                    <div class="toggle-switch">
                        <input type="checkbox" id="a11y-high-contrast" aria-describedby="desc-high-contrast" ${this.settings.highContrast ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </div>
                </div>

                <div class="accessibility-option">
                    <label for="a11y-large-text">
                        <span class="option-name">Large Text</span>
                        <span class="option-desc">Increase text size throughout the site</span>
                    </label>
                    <div class="toggle-switch">
                        <input type="checkbox" id="a11y-large-text" ${this.settings.largeText ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </div>
                </div>

                <div class="accessibility-option">
                    <label for="a11y-dyslexia-font">
                        <span class="option-name">Dyslexia-Friendly Font</span>
                        <span class="option-desc">Use a font designed for easier reading</span>
                    </label>
                    <div class="toggle-switch">
                        <input type="checkbox" id="a11y-dyslexia-font" ${this.settings.dyslexiaFont ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </div>
                </div>

                <div class="accessibility-option">
                    <label for="a11y-hide-background">
                        <span class="option-name">Hide Background Movement</span>
                        <span class="option-desc">Remove distracting background animations</span>
                    </label>
                    <div class="toggle-switch">
                        <input type="checkbox" id="a11y-hide-background" ${this.settings.hideBackground ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </div>
                </div>
            </div>

            <!-- MOTOR Category -->
            <div class="a11y-category">
                <h3 class="a11y-category-title">🎮 Motor / Control</h3>
                
                <div class="accessibility-option">
                    <label for="a11y-reduced-motion">
                        <span class="option-name">Reduced Motion</span>
                        <span class="option-desc">Minimize animations and transitions</span>
                    </label>
                    <div class="toggle-switch">
                        <input type="checkbox" id="a11y-reduced-motion" ${this.settings.reducedMotion ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </div>
                </div>

                <div class="accessibility-option">
                    <label for="a11y-disable-haptics">
                        <span class="option-name">Disable Haptics</span>
                        <span class="option-desc">Turn off controller vibration feedback</span>
                    </label>
                    <div class="toggle-switch">
                        <input type="checkbox" id="a11y-disable-haptics" ${this.settings.disableHaptics ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </div>
                </div>

                <div class="accessibility-option">
                    <label for="a11y-large-targets">
                        <span class="option-name">Large Touch Targets</span>
                        <span class="option-desc">Make interactive elements larger and well-spaced</span>
                    </label>
                    <div class="toggle-switch">
                        <input type="checkbox" id="a11y-large-targets" ${this.settings.largeTargets ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </div>
                </div>
            </div>

            <!-- COGNITIVE Category -->
            <div class="a11y-category">
                <h3 class="a11y-category-title">🧠 Cognitive</h3>
                
                <div class="accessibility-option">
                    <label for="a11y-simplified-ui">
                        <span class="option-name">Simplified Interface</span>
                        <span class="option-desc">Reduce visual clutter and complexity</span>
                    </label>
                    <div class="toggle-switch">
                        <input type="checkbox" id="a11y-simplified-ui" ${this.settings.simplifiedUI ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </div>
                </div>

                <div class="accessibility-option">
                    <label for="a11y-highlight-interactive">
                        <span class="option-name">Highlight Interactive Elements</span>
                        <span class="option-desc">Make clickable items more obvious</span>
                    </label>
                    <div class="toggle-switch">
                        <input type="checkbox" id="a11y-highlight-interactive" ${this.settings.highlightInteractive ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </div>
                </div>
            </div>

            <!-- HEARING Category -->
            <div class="a11y-category">
                <h3 class="a11y-category-title">👂 Hearing</h3>
                
                <div class="accessibility-option">
                    <label for="a11y-visual-cues">
                        <span class="option-name">Visual Sound Cues</span>
                        <span class="option-desc">Show visual indicators for audio events</span>
                    </label>
                    <div class="toggle-switch">
                        <input type="checkbox" id="a11y-visual-cues" ${this.settings.visualCues ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </div>
                </div>

                <div class="accessibility-option">
                    <label for="a11y-mono-audio">
                        <span class="option-name">Mono Audio</span>
                        <span class="option-desc">Combine stereo channels for single-ear listening</span>
                    </label>
                    <div class="toggle-switch">
                        <input type="checkbox" id="a11y-mono-audio" ${this.settings.monoAudio ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </div>
                </div>
            </div>

            <!-- GENERAL Category -->
            <div class="a11y-category">
                <h3 class="a11y-category-title">⚙️ General</h3>
                
                <div class="accessibility-option">
                    <label for="a11y-enhanced-focus">
                        <span class="option-name">Enhanced Focus Indicators</span>
                        <span class="option-desc">Make keyboard focus more visible</span>
                    </label>
                    <div class="toggle-switch">
                        <input type="checkbox" id="a11y-enhanced-focus" ${this.settings.enhancedFocus ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </div>
                </div>

                <div class="accessibility-option">
                    <label for="a11y-announcements">
                        <span class="option-name">Screen Reader Announcements</span>
                        <span class="option-desc">Enable live announcements for game events</span>
                    </label>
                    <div class="toggle-switch">
                        <input type="checkbox" id="a11y-announcements" ${this.settings.screenReaderAnnouncements ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </div>
                </div>
            </div>

            <div class="accessibility-shortcuts">
                <h3>🎮 Quick Access Shortcuts</h3>
                <ul class="shortcut-list">
                    <li>
                        <span>Keyboard</span>
                        <span class="shortcut-key">Alt + A</span>
                    </li>
                    <li>
                        <span>Gamepad</span>
                        <span class="shortcut-key">Hold Y + LB</span>
                    </li>
                    <li>
                        <span>Skip to content</span>
                        <span class="shortcut-key">Tab (first)</span>
                    </li>
                </ul>
                <p class="a11y-guidelines-note">
                    Based on <a href="https://gameaccessibilityguidelines.com" target="_blank" rel="noopener">Game Accessibility Guidelines</a>
                </p>
            </div>
        `;

        // Add event listeners for all toggles
        this.setupToggleListeners(panel);

        // Setup click outside and escape handlers (only once)
        this.setupPanelEventHandlers(panel);

        document.body.appendChild(panel);
        this.panel = panel;
    }

    /**
     * Setup toggle event listeners
     */
    setupToggleListeners(panel) {
        const toggles = [
            { id: 'a11y-high-contrast', setting: 'highContrast', message: 'High contrast' },
            { id: 'a11y-large-text', setting: 'largeText', message: 'Large text' },
            { id: 'a11y-dyslexia-font', setting: 'dyslexiaFont', message: 'Dyslexia-friendly font' },
            { id: 'a11y-hide-background', setting: 'hideBackground', message: 'Background movement hidden' },
            { id: 'a11y-reduced-motion', setting: 'reducedMotion', message: 'Reduced motion' },
            { id: 'a11y-disable-haptics', setting: 'disableHaptics', message: 'Haptics disabled' },
            { id: 'a11y-large-targets', setting: 'largeTargets', message: 'Large touch targets' },
            { id: 'a11y-simplified-ui', setting: 'simplifiedUI', message: 'Simplified interface' },
            { id: 'a11y-highlight-interactive', setting: 'highlightInteractive', message: 'Interactive elements highlighted' },
            { id: 'a11y-visual-cues', setting: 'visualCues', message: 'Visual sound cues' },
            { id: 'a11y-mono-audio', setting: 'monoAudio', message: 'Mono audio' },
            { id: 'a11y-enhanced-focus', setting: 'enhancedFocus', message: 'Enhanced focus indicators' },
            { id: 'a11y-announcements', setting: 'screenReaderAnnouncements', message: 'Screen reader announcements' }
        ];

        toggles.forEach(toggle => {
            const element = panel.querySelector(`#${toggle.id}`);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.settings[toggle.setting] = e.target.checked;
                    this.applySettings();
                    this.announce(e.target.checked ? `${toggle.message} enabled` : `${toggle.message} disabled`);
                });
            }
        });
    }

    /**
     * Setup panel event handlers (click outside, escape key)
     */
    setupPanelEventHandlers(panel) {
        // Remove existing handlers if they exist
        if (this.boundClickHandler) {
            document.removeEventListener('click', this.boundClickHandler);
        }
        if (this.boundEscapeHandler) {
            document.removeEventListener('keydown', this.boundEscapeHandler);
        }

        // Create and store bound handlers
        this.boundClickHandler = (e) => {
            if (this.isOpen && !panel.contains(e.target) && e.target !== this.button) {
                this.closePanel();
            }
        };

        this.boundEscapeHandler = (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closePanel();
                this.button.focus();
            }
        };

        document.addEventListener('click', this.boundClickHandler);
        document.addEventListener('keydown', this.boundEscapeHandler);
    }

    /**
     * Setup keyboard shortcut (Alt+A)
     */
    setupKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            // Alt+A to toggle accessibility panel
            if (e.altKey && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                this.togglePanel();
            }
        });
    }

    /**
     * Setup gamepad shortcut (Y + LB)
     */
    setupGamepadShortcut() {
        if (!window.gamepadManager) {
            // Retry after a short delay in case gamepadManager loads later
            setTimeout(() => {
                if (window.gamepadManager) {
                    this.attachGamepadListeners();
                }
            }, 1000);
            return;
        }
        
        this.attachGamepadListeners();
    }

    /**
     * Attach gamepad event listeners
     */
    attachGamepadListeners() {
        // Track Y button state per gamepad
        window.gamepadManager.on('buttondown', (data) => {
            const playerIndex = data.playerIndex;
            
            if (data.button === 'y') {
                this.gamepadYPressed[playerIndex] = true;
            }
            
            // Y + LB combination to toggle accessibility (must be same gamepad)
            if (data.button === 'lb' && this.gamepadYPressed[playerIndex]) {
                this.togglePanel();
                // Check if haptics are disabled before vibrating
                if (!this.settings.disableHaptics && window.gamepadManager.vibrate) {
                    try {
                        window.gamepadManager.vibrate(playerIndex, 100, 0.5, 0.2);
                    } catch {
                        // Vibration not supported, ignore
                    }
                }
            }
        });

        window.gamepadManager.on('buttonup', (data) => {
            if (data.button === 'y') {
                this.gamepadYPressed[data.playerIndex] = false;
            }
        });
    }

    /**
     * Toggle the accessibility panel
     */
    togglePanel() {
        if (this.isOpen) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }

    /**
     * Open the accessibility panel
     */
    openPanel() {
        this.panel.classList.add('open');
        this.button.setAttribute('aria-expanded', 'true');
        this.isOpen = true;
        
        // Focus the first toggle for keyboard users
        const firstToggle = this.panel.querySelector('input[type="checkbox"]');
        if (firstToggle) {
            firstToggle.focus();
        }
        
        this.announce('Accessibility panel opened');
    }

    /**
     * Close the accessibility panel
     */
    closePanel() {
        this.panel.classList.remove('open');
        this.button.setAttribute('aria-expanded', 'false');
        this.isOpen = false;
        this.announce('Accessibility panel closed');
    }

    /**
     * Apply all accessibility settings
     * Based on Game Accessibility Guidelines categories
     */
    applySettings() {
        const body = document.body;
        
        // Vision settings
        body.classList.toggle('high-contrast-mode', this.settings.highContrast);
        body.classList.toggle('large-text-mode', this.settings.largeText);
        body.classList.toggle('dyslexia-font-mode', this.settings.dyslexiaFont);
        body.classList.toggle('hide-background-mode', this.settings.hideBackground);
        
        // Motor settings
        body.classList.toggle('reduced-motion-mode', this.settings.reducedMotion);
        body.classList.toggle('large-targets-mode', this.settings.largeTargets);
        
        // Cognitive settings
        body.classList.toggle('simplified-ui-mode', this.settings.simplifiedUI);
        body.classList.toggle('highlight-interactive-mode', this.settings.highlightInteractive);
        
        // Hearing settings
        body.classList.toggle('visual-cues-mode', this.settings.visualCues);
        body.classList.toggle('mono-audio-mode', this.settings.monoAudio);
        
        // General settings
        body.classList.toggle('enhanced-focus-mode', this.settings.enhancedFocus);
        
        this.saveSettings();
    }

    /**
     * Announce a message to screen readers
     */
    announce(message) {
        if (!this.settings.screenReaderAnnouncements) return;
        
        // Create or reuse the announcer element
        let announcer = document.getElementById('a11y-announcer');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'a11y-announcer';
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.className = 'sr-only';
            document.body.appendChild(announcer);
        }
        
        // Clear and set message with sufficient delay for screen readers
        announcer.textContent = '';
        setTimeout(() => {
            announcer.textContent = message;
        }, 150);
    }

    /**
     * Get current setting value
     */
    getSetting(key) {
        return this.settings[key];
    }

    /**
     * Set a specific setting
     */
    setSetting(key, value) {
        if (key in this.settings) {
            this.settings[key] = value;
            this.applySettings();
            
            // Update checkbox if exists
            const checkbox = document.getElementById(`a11y-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
            if (checkbox) {
                checkbox.checked = value;
            }
        }
    }
}

// Initialize accessibility manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.accessibilityManager = new AccessibilityManager();
    });
} else {
    window.accessibilityManager = new AccessibilityManager();
}
