/**
 * Advanced Gamepad Configuration System
 * Button remapping, sensitivity control, presets for different game genres
 */

class GamepadConfigurator {
    constructor() {
        this.profiles = new Map();
        this.activeProfile = 'default';
        this.remappings = new Map(); // playerIndex -> { button: newButton }
        this.sensitivity = new Map(); // playerIndex -> { axis: sensitivity }
        this.vibrationEnabled = new Map(); // playerIndex -> boolean
        this.genrePresets = this.createGenrePresets();
        this.customProfiles = this.loadCustomProfiles();
        
        this.createConfigUI();
    }
    
    createGenrePresets() {
        return {
            'fighting': {
                name: 'Fighting Games',
                description: 'Optimized for Street Fighter style games',
                buttonMap: {
                    'x': 'light-punch',
                    'y': 'heavy-punch',
                    'a': 'light-kick',
                    'b': 'heavy-kick',
                    'lb': 'throw',
                    'rb': 'special',
                    'lt': 'taunt',
                    'rt': 'super'
                },
                deadzone: 0.2,
                vibrationStrength: 0.7
            },
            'beat-em-up': {
                name: 'Beat-Em-Ups',
                description: 'For side-scrolling brawlers',
                buttonMap: {
                    'x': 'light-attack',
                    'y': 'heavy-attack',
                    'a': 'jump',
                    'b': 'special',
                    'lb': 'grab',
                    'rb': 'weapon-pickup',
                    'lt': 'dodge',
                    'rt': 'super-move'
                },
                deadzone: 0.15,
                vibrationStrength: 0.8
            },
            'shooter': {
                name: 'Run & Gun',
                description: 'For Contra-style shooters',
                buttonMap: {
                    'a': 'jump',
                    'x': 'shoot',
                    'y': 'grenade',
                    'b': 'switch-weapon',
                    'lb': 'strafe-left',
                    'rb': 'strafe-right',
                    'lt': 'aim',
                    'rt': 'rapid-fire'
                },
                deadzone: 0.1,
                vibrationStrength: 0.5
            },
            'platformer': {
                name: 'Platformers',
                description: 'For Mega Man style games',
                buttonMap: {
                    'a': 'jump',
                    'b': 'shoot',
                    'x': 'slide',
                    'y': 'special-weapon',
                    'lb': 'prev-weapon',
                    'rb': 'next-weapon',
                    'lt': 'charge',
                    'rt': 'dash'
                },
                deadzone: 0.12,
                vibrationStrength: 0.6
            },
            'puzzle': {
                name: 'Puzzle Games',
                description: 'For strategy and puzzle games',
                buttonMap: {
                    'a': 'select',
                    'b': 'cancel',
                    'x': 'rotate-left',
                    'y': 'rotate-right',
                    'lb': 'undo',
                    'rb': 'hint',
                    'lt': 'pause',
                    'rt': 'fast-forward'
                },
                deadzone: 0.25,
                vibrationStrength: 0.3
            },
            'racing': {
                name: 'Racing Games',
                description: 'For arcade racing',
                buttonMap: {
                    'a': 'accelerate',
                    'b': 'brake',
                    'x': 'drift',
                    'y': 'boost',
                    'lb': 'look-back',
                    'rb': 'item',
                    'lt': 'brake-analog',
                    'rt': 'accelerate-analog'
                },
                deadzone: 0.08,
                vibrationStrength: 0.9,
                useAnalogTriggers: true
            }
        };
    }
    
    loadCustomProfiles() {
        const saved = localStorage.getItem('gamepadProfiles');
        return saved ? JSON.parse(saved) : {};
    }
    
    saveCustomProfiles() {
        localStorage.setItem('gamepadProfiles', JSON.stringify(this.customProfiles));
    }
    
    applyPreset(playerIndex, presetName) {
        const preset = this.genrePresets[presetName];
        if (!preset) return false;
        
        this.remappings.set(playerIndex, preset.buttonMap);
        this.setDeadzone(playerIndex, preset.deadzone);
        this.setVibration(playerIndex, true, preset.vibrationStrength);
        
        return true;
    }
    
    remapButton(playerIndex, originalButton, newButton) {
        if (!this.remappings.has(playerIndex)) {
            this.remappings.set(playerIndex, {});
        }
        
        const mapping = this.remappings.get(playerIndex);
        mapping[originalButton] = newButton;
        
        return true;
    }
    
    getMappedButton(playerIndex, button) {
        const mapping = this.remappings.get(playerIndex);
        if (mapping && mapping[button]) {
            return mapping[button];
        }
        return button; // Return original if no mapping
    }
    
    setDeadzone(playerIndex, value) {
        if (!this.sensitivity.has(playerIndex)) {
            this.sensitivity.set(playerIndex, {});
        }
        
        const sens = this.sensitivity.get(playerIndex);
        sens.deadzone = Math.max(0, Math.min(1, value));
        
        // Update gamepad manager deadzone
        if (window.gamepadManager) {
            window.gamepadManager.deadzone = sens.deadzone;
        }
    }
    
    setSensitivity(playerIndex, axis, value) {
        if (!this.sensitivity.has(playerIndex)) {
            this.sensitivity.set(playerIndex, {});
        }
        
        const sens = this.sensitivity.get(playerIndex);
        sens[axis] = Math.max(0.1, Math.min(3, value));
    }
    
    getAdjustedAxisValue(playerIndex, axis, rawValue) {
        const sens = this.sensitivity.get(playerIndex);
        if (sens && sens[axis]) {
            return rawValue * sens[axis];
        }
        return rawValue;
    }
    
    setVibration(playerIndex, enabled, strength = 0.5) {
        this.vibrationEnabled.set(playerIndex, {
            enabled: enabled,
            strength: Math.max(0, Math.min(1, strength))
        });
    }
    
    vibratePattern(playerIndex, pattern) {
        const config = this.vibrationEnabled.get(playerIndex);
        if (!config || !config.enabled) return;
        
        const patterns = {
            'hit': { duration: 100, weak: 0.3, strong: 0.7 },
            'damage': { duration: 200, weak: 0.5, strong: 1.0 },
            'shoot': { duration: 50, weak: 0.2, strong: 0.4 },
            'explosion': { duration: 300, weak: 0.8, strong: 1.0 },
            'combo': { duration: 150, weak: 0.4, strong: 0.6 },
            'powerup': { duration: 250, weak: 0.6, strong: 0.8 }
        };
        
        const p = patterns[pattern] || patterns['hit'];
        const strength = config.strength;
        
        if (window.gamepadManager) {
            window.gamepadManager.vibrate(
                playerIndex, 
                p.duration, 
                p.weak * strength, 
                p.strong * strength
            );
        }
    }
    
    createConfigUI() {
        const modal = document.createElement('div');
        modal.id = 'gamepadConfig';
        modal.className = 'gamepad-config-modal';
        modal.style.display = 'none';
        
        modal.innerHTML = `
            <style>
                .gamepad-config-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.95);
                    z-index: 10002;
                    overflow-y: auto;
                }
                
                .gamepad-config-container {
                    max-width: 900px;
                    margin: 40px auto;
                    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                    border-radius: 20px;
                    padding: 40px;
                    color: #fff;
                }
                
                .config-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                }
                
                .config-tabs {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 30px;
                    border-bottom: 2px solid rgba(255,255,255,0.1);
                }
                
                .config-tab {
                    padding: 12px 24px;
                    background: none;
                    border: none;
                    color: rgba(255,255,255,0.6);
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                    transition: all 0.3s;
                    border-bottom: 3px solid transparent;
                }
                
                .config-tab.active {
                    color: #fff;
                    border-bottom-color: #3498db;
                }
                
                .preset-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin: 20px 0;
                }
                
                .preset-card {
                    background: rgba(255,255,255,0.05);
                    padding: 20px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s;
                    border: 2px solid transparent;
                }
                
                .preset-card:hover {
                    background: rgba(255,255,255,0.1);
                    border-color: #3498db;
                    transform: translateY(-2px);
                }
                
                .preset-card.active {
                    border-color: #2ecc71;
                    background: rgba(46, 204, 113, 0.1);
                }
                
                .slider-control {
                    margin: 20px 0;
                }
                
                .slider-control label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: bold;
                }
                
                .slider-control input[type="range"] {
                    width: 100%;
                    height: 6px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 3px;
                    outline: none;
                    -webkit-appearance: none;
                }
                
                .slider-control input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 20px;
                    height: 20px;
                    background: #3498db;
                    border-radius: 50%;
                    cursor: pointer;
                }
                
                .button-remap-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                }
                
                .remap-button {
                    background: rgba(255,255,255,0.05);
                    padding: 15px;
                    border-radius: 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .test-area {
                    background: rgba(0,0,0,0.3);
                    padding: 30px;
                    border-radius: 12px;
                    text-align: center;
                    margin: 20px 0;
                }
                
                .test-button {
                    display: inline-block;
                    width: 60px;
                    height: 60px;
                    margin: 10px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 50%;
                    line-height: 60px;
                    font-size: 24px;
                    transition: all 0.1s;
                }
                
                .test-button.pressed {
                    background: #3498db;
                    transform: scale(0.9);
                }
            </style>
            
            <div class="gamepad-config-container">
                <div class="config-header">
                    <h2>🎮 Gamepad Configuration</h2>
                    <button onclick="window.gamepadConfig.hide()" style="background: rgba(255,255,255,0.1); border: none; color: #fff; padding: 10px 20px; border-radius: 8px; cursor: pointer;">
                        Close
                    </button>
                </div>
                
                <div class="config-tabs">
                    <button class="config-tab active" onclick="window.gamepadConfig.showTab('presets')">Presets</button>
                    <button class="config-tab" onclick="window.gamepadConfig.showTab('remap')">Button Mapping</button>
                    <button class="config-tab" onclick="window.gamepadConfig.showTab('sensitivity')">Sensitivity</button>
                    <button class="config-tab" onclick="window.gamepadConfig.showTab('test')">Test</button>
                </div>
                
                <div id="configContent"></div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.modal = modal;
    }
    
    show() {
        this.modal.style.display = 'block';
        this.showTab('presets');
    }
    
    hide() {
        this.modal.style.display = 'none';
    }
    
    showTab(tabName) {
        // Update active tab
        const tabs = this.modal.querySelectorAll('.config-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.textContent.toLowerCase().includes(tabName));
        });
        
        const content = this.modal.querySelector('#configContent');
        
        switch(tabName) {
            case 'presets':
                content.innerHTML = this.getPresetsHTML();
                break;
            case 'remap':
                content.innerHTML = this.getRemapHTML();
                break;
            case 'sensitivity':
                content.innerHTML = this.getSensitivityHTML();
                break;
            case 'test':
                content.innerHTML = this.getTestHTML();
                this.startTest();
                break;
        }
    }
    
    getPresetsHTML() {
        let html = '<h3>Genre Presets</h3><p>Choose a preset optimized for different game types:</p><div class="preset-grid">';
        
        for (const [key, preset] of Object.entries(this.genrePresets)) {
            html += `
                <div class="preset-card" onclick="window.gamepadConfig.applyPreset(0, '${key}')">
                    <h4>${preset.name}</h4>
                    <p style="font-size: 14px; opacity: 0.8;">${preset.description}</p>
                    <button style="margin-top: 10px; padding: 8px 16px; background: #3498db; border: none; color: #fff; border-radius: 6px; cursor: pointer;">
                        Apply
                    </button>
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }
    
    getRemapHTML() {
        return `
            <h3>Button Remapping</h3>
            <p>Click a button to remap it:</p>
            <div class="button-remap-grid">
                ${['a', 'b', 'x', 'y', 'lb', 'rb', 'lt', 'rt'].map(btn => `
                    <div class="remap-button">
                        <span>${btn.toUpperCase()}</span>
                        <button onclick="window.gamepadConfig.startRemapping('${btn}')" style="padding: 5px 12px; background: #3498db; border: none; color: #fff; border-radius: 4px; cursor: pointer;">
                            Remap
                        </button>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top: 20px;">
                <button onclick="window.gamepadConfig.resetRemapping()" style="padding: 10px 20px; background: #e74c3c; border: none; color: #fff; border-radius: 8px; cursor: pointer;">
                    Reset to Default
                </button>
            </div>
        `;
    }
    
    getSensitivityHTML() {
        return `
            <h3>Sensitivity & Vibration</h3>
            
            <div class="slider-control">
                <label>Deadzone: <span id="deadzoneValue">0.15</span></label>
                <input type="range" min="0" max="50" value="15" 
                       oninput="window.gamepadConfig.updateDeadzone(this.value)" />
                <small>How much you need to move the stick before it registers</small>
            </div>
            
            <div class="slider-control">
                <label>Stick Sensitivity: <span id="sensitivityValue">1.0</span></label>
                <input type="range" min="10" max="300" value="100" 
                       oninput="window.gamepadConfig.updateSensitivity(this.value)" />
                <small>How responsive the analog sticks are</small>
            </div>
            
            <div class="slider-control">
                <label>Vibration Strength: <span id="vibrationValue">0.5</span></label>
                <input type="range" min="0" max="100" value="50" 
                       oninput="window.gamepadConfig.updateVibration(this.value)" />
                <button onclick="window.gamepadConfig.testVibration()" style="margin-left: 10px; padding: 5px 15px; background: #3498db; border: none; color: #fff; border-radius: 4px; cursor: pointer;">
                    Test
                </button>
            </div>
        `;
    }
    
    getTestHTML() {
        return `
            <h3>Controller Test</h3>
            <div class="test-area">
                <p>Press buttons on your controller to test:</p>
                <div>
                    <span class="test-button" id="test-a">A</span>
                    <span class="test-button" id="test-b">B</span>
                    <span class="test-button" id="test-x">X</span>
                    <span class="test-button" id="test-y">Y</span>
                </div>
                <div>
                    <span class="test-button" id="test-lb">LB</span>
                    <span class="test-button" id="test-rb">RB</span>
                    <span class="test-button" id="test-lt">LT</span>
                    <span class="test-button" id="test-rt">RT</span>
                </div>
                <div>
                    <span class="test-button" id="test-up">↑</span>
                    <span class="test-button" id="test-down">↓</span>
                    <span class="test-button" id="test-left">←</span>
                    <span class="test-button" id="test-right">→</span>
                </div>
                <div style="margin-top: 20px;">
                    <p>Left Stick: <span id="leftStick">0, 0</span></p>
                    <p>Right Stick: <span id="rightStick">0, 0</span></p>
                </div>
            </div>
        `;
    }
    
    startTest() {
        if (this.testInterval) clearInterval(this.testInterval);
        
        this.testInterval = setInterval(() => {
            const state = window.gamepadManager?.getState(0);
            if (!state) return;
            
            // Update button states
            for (const [btn, pressed] of Object.entries(state.buttons)) {
                const el = document.getElementById(`test-${btn}`);
                if (el) {
                    el.classList.toggle('pressed', pressed);
                }
            }
            
            // Update stick values
            const leftStick = document.getElementById('leftStick');
            const rightStick = document.getElementById('rightStick');
            
            if (leftStick) {
                leftStick.textContent = `${state.axes.leftX?.toFixed(2) || 0}, ${state.axes.leftY?.toFixed(2) || 0}`;
            }
            if (rightStick) {
                rightStick.textContent = `${state.axes.rightX?.toFixed(2) || 0}, ${state.axes.rightY?.toFixed(2) || 0}`;
            }
        }, 50);
    }
    
    updateDeadzone(value) {
        const deadzone = value / 100;
        document.getElementById('deadzoneValue').textContent = deadzone.toFixed(2);
        this.setDeadzone(0, deadzone);
    }
    
    updateSensitivity(value) {
        const sensitivity = value / 100;
        document.getElementById('sensitivityValue').textContent = sensitivity.toFixed(1);
        this.setSensitivity(0, 'left', sensitivity);
        this.setSensitivity(0, 'right', sensitivity);
    }
    
    updateVibration(value) {
        const strength = value / 100;
        document.getElementById('vibrationValue').textContent = strength.toFixed(1);
        this.setVibration(0, true, strength);
    }
    
    testVibration() {
        this.vibratePattern(0, 'explosion');
    }
    
    startRemapping(button) {
        alert(`Press a button to remap ${button.toUpperCase()} (not implemented in demo)`);
    }
    
    resetRemapping() {
        this.remappings.clear();
        alert('Button mappings reset to default!');
    }
}

// Initialize global configurator
window.gamepadConfig = new GamepadConfigurator();

// Add keyboard shortcut to open config
document.addEventListener('keydown', (e) => {
    if (e.key === 'G' && e.shiftKey) {
        window.gamepadConfig.show();
    }
});
