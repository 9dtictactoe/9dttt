/**
 * Authentication UI Component
 * Beautiful login modal with multiple authentication options
 */

class AuthUI {
    constructor() {
        this.createModal();
        this.setupEventListeners();
    }
    
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'authModal';
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <style>
                .auth-modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.95);
                    z-index: 10001;
                    backdrop-filter: blur(10px);
                    animation: fadeIn 0.3s ease-out;
                }
                
                .auth-container {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 450px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    animation: slideUp 0.4s ease-out;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideUp {
                    from {
                        transform: translate(-50%, -45%);
                        opacity: 0;
                    }
                    to {
                        transform: translate(-50%, -50%);
                        opacity: 1;
                    }
                }
                
                .auth-header {
                    text-align: center;
                    color: #fff;
                    margin-bottom: 30px;
                }
                
                .auth-header h2 {
                    margin: 0 0 10px 0;
                    font-size: 32px;
                }
                
                .auth-header p {
                    margin: 0;
                    opacity: 0.9;
                }
                
                .auth-methods {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                
                .auth-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 15px 20px;
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .auth-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
                }
                
                .auth-button-google {
                    background: #fff;
                    color: #333;
                }
                
                .auth-button-apple {
                    background: #000;
                    color: #fff;
                }
                
                .auth-button-wallet {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: #fff;
                }
                
                .auth-button-guest {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                }
                
                .auth-divider {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 20px 0;
                    color: #fff;
                    opacity: 0.7;
                }
                
                .auth-divider::before,
                .auth-divider::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: rgba(255, 255, 255, 0.3);
                }
                
                .user-profile {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 15px 20px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    color: #fff;
                }
                
                .user-avatar {
                    font-size: 48px;
                }
                
                .user-info {
                    flex: 1;
                }
                
                .user-name {
                    font-size: 20px;
                    font-weight: bold;
                    margin: 0 0 5px 0;
                }
                
                .user-tokens {
                    font-size: 16px;
                    opacity: 0.9;
                }
                
                .user-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-top: 20px;
                }
                
                .close-button {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: #fff;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    font-size: 24px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .close-button:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: rotate(90deg);
                }
                
                .auth-icon {
                    font-size: 24px;
                }
            </style>
            
            <div class="auth-container">
                <button class="close-button" onclick="window.authUI.hide()">×</button>
                <div id="authContent"></div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.modal = modal;
    }
    
    setupEventListeners() {
        window.addEventListener('authStateChanged', (e) => {
            this.updateUI(e.detail.user);
        });
    }
    
    show() {
        const user = window.universalAuth?.getUser();
        this.updateUI(user);
        this.modal.style.display = 'block';
    }
    
    hide() {
        this.modal.style.display = 'none';
    }
    
    updateUI(user) {
        const content = this.modal.querySelector('#authContent');
        
        if (user) {
            content.innerHTML = this.getUserProfileHTML(user);
        } else {
            content.innerHTML = this.getLoginHTML();
        }
    }
    
    getLoginHTML() {
        return `
            <div class="auth-header">
                <h2>🎮 Welcome!</h2>
                <p>Sign in to save your progress and earn tokens</p>
            </div>
            
            <div class="auth-methods">
                <button class="auth-button auth-button-google" onclick="window.authUI.loginWithGoogle()">
                    <span class="auth-icon">G</span>
                    <span>Continue with Google</span>
                </button>
                
                <button class="auth-button auth-button-apple" onclick="window.authUI.loginWithApple()">
                    <span class="auth-icon">🍎</span>
                    <span>Continue with Apple</span>
                </button>
                
                <div class="auth-divider">or</div>
                
                <button class="auth-button auth-button-wallet" onclick="window.authUI.loginWithWallet()">
                    <span class="auth-icon">👻</span>
                    <span>Connect Web3 Wallet</span>
                </button>
                
                <div class="auth-divider">or</div>
                
                <button class="auth-button auth-button-guest" onclick="window.authUI.loginAsGuest()">
                    <span class="auth-icon">👤</span>
                    <span>Continue as Guest</span>
                </button>
            </div>
        `;
    }
    
    getUserProfileHTML(user) {
        return `
            <div class="auth-header">
                <h2>👋 Hello, ${user.name}!</h2>
            </div>
            
            <div class="user-profile">
                <div class="user-avatar">${user.avatar}</div>
                <div class="user-info">
                    <h3 class="user-name">${user.name}</h3>
                    <div class="user-tokens">🪙 ${user.tokens || 0} Tokens</div>
                    ${user.email ? `<div style="font-size: 12px; opacity: 0.7;">${user.email}</div>` : ''}
                </div>
            </div>
            
            <div class="user-actions">
                <button class="auth-button auth-button-google" onclick="window.leaderboardUI.show('stats')">
                    📊 View My Stats
                </button>
                <button class="auth-button auth-button-wallet" onclick="window.authUI.openWallet()">
                    💰 Manage Tokens
                </button>
                <button class="auth-button auth-button-guest" onclick="window.authUI.logout()">
                    🚪 Sign Out
                </button>
            </div>
        `;
    }
    
    async loginWithGoogle() {
        try {
            await window.universalAuth.loginWithGoogle();
            this.hide();
        } catch (error) {
            alert('Google login failed. Please try again.');
        }
    }
    
    async loginWithApple() {
        try {
            await window.universalAuth.loginWithApple();
            this.hide();
        } catch (error) {
            alert('Apple login failed. Please try again.');
        }
    }
    
    async loginWithWallet() {
        try {
            await window.universalAuth.loginWithWallet();
            this.hide();
        } catch (error) {
            alert('Wallet connection failed. Please install Phantom or MetaMask.');
        }
    }
    
    async loginAsGuest() {
        try {
            await window.universalAuth.loginAsGuest();
            this.hide();
        } catch (error) {
            alert('Guest login failed. Please try again.');
        }
    }
    
    async logout() {
        if (confirm('Are you sure you want to sign out?')) {
            await window.universalAuth.logout();
            this.hide();
        }
    }
    
    openWallet() {
        window.open('https://atomicfizzcaps.xyz/wallet', '_blank');
    }
}

// Initialize auth UI
window.authUI = new AuthUI();

// Create floating user badge
function createUserBadge() {
    const badge = document.createElement('div');
    badge.id = 'userBadge';
    badge.style.cssText = `
        position: fixed;
        top: 70px;
        right: 10px;
        z-index: 9999;
        cursor: pointer;
        transition: all 0.3s ease;
    `;
    
    badge.onclick = () => window.authUI.show();
    document.body.appendChild(badge);
    
    // Update badge on auth change
    window.addEventListener('authStateChanged', (e) => {
        updateUserBadge(e.detail.user);
    });
    
    // Initial update
    updateUserBadge(window.universalAuth?.getUser());
}

function updateUserBadge(user) {
    const badge = document.getElementById('userBadge');
    if (!badge) return;
    
    if (user) {
        badge.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 10px 20px;
                border-radius: 25px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                display: flex;
                align-items: center;
                gap: 10px;
                color: #fff;
            ">
                <span style="font-size: 20px;">${user.avatar}</span>
                <div>
                    <div style="font-weight: bold; font-size: 14px;">${user.name}</div>
                    <div style="font-size: 11px; opacity: 0.9;">🪙 ${user.tokens || 0}</div>
                </div>
            </div>
        `;
    } else {
        badge.innerHTML = `
            <button style="
                background: rgba(102, 126, 234, 0.2);
                backdrop-filter: blur(10px);
                border: 2px solid #667eea;
                color: #667eea;
                padding: 10px 20px;
                border-radius: 25px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
            " onmouseover="this.style.background='rgba(102, 126, 234, 0.3)'" 
               onmouseout="this.style.background='rgba(102, 126, 234, 0.2)'">
                🔑 Sign In
            </button>
        `;
    }
}

// Auto-create user badge on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createUserBadge);
} else {
    createUserBadge();
}

// Keyboard shortcut to open auth
document.addEventListener('keydown', (e) => {
    if (e.key === 'A' && e.shiftKey) {
        window.authUI.show();
    }
});
