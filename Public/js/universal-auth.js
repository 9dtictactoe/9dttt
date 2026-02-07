/**
 * Universal Authentication System
 * Uses browser-based OAuth (Google, Microsoft, Apple) + Web3 wallets
 * No Firebase needed - uses IndexedDB for local storage and your backend API
 */

class UniversalAuth {
    constructor() {
        this.user = null;
        this.db = null;
        this.apiEndpoint = 'https://atomicfizzcaps.xyz/api'; // Your tokenization backend
        this.initDB();
        this.checkSession();
    }
    
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('9DTTT_GameDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // User data store
                if (!db.objectStoreNames.contains('users')) {
                    db.createObjectStore('users', { keyPath: 'id' });
                }
                
                // Scores store
                if (!db.objectStoreNames.contains('scores')) {
                    const scoreStore = db.createObjectStore('scores', { keyPath: 'id', autoIncrement: true });
                    scoreStore.createIndex('userId', 'userId', { unique: false });
                    scoreStore.createIndex('game', 'game', { unique: false });
                    scoreStore.createIndex('score', 'score', { unique: false });
                }
                
                // Achievements store
                if (!db.objectStoreNames.contains('achievements')) {
                    db.createObjectStore('achievements', { keyPath: 'id', autoIncrement: true });
                }
                
                // Tokens store (for atomicfizzcaps integration)
                if (!db.objectStoreNames.contains('tokens')) {
                    db.createObjectStore('tokens', { keyPath: 'userId' });
                }
            };
        });
    }
    
    // Browser-based OAuth Login
    async loginWithGoogle() {
        try {
            // Use Google Identity Services (One Tap)
            if (window.google && window.google.accounts) {
                window.google.accounts.id.initialize({
                    client_id: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your actual client ID
                    callback: (response) => this.handleGoogleCallback(response)
                });
                
                window.google.accounts.id.prompt();
            } else {
                // Fallback: Use Credential Management API
                if (window.PasswordCredential) {
                    const credential = await navigator.credentials.get({
                        password: true,
                        federated: {
                            providers: ['https://accounts.google.com']
                        }
                    });
                    
                    if (credential) {
                        await this.processCredential(credential);
                    }
                }
            }
        } catch (error) {
            console.error('Google login error:', error);
            this.showError('Failed to login with Google');
        }
    }
    
    async loginWithApple() {
        try {
            if (window.AppleID) {
                const data = await window.AppleID.auth.signIn();
                await this.handleAppleCallback(data);
            } else {
                alert('Apple Sign In not available. Please use Google or guest mode.');
            }
        } catch (error) {
            console.error('Apple login error:', error);
        }
    }
    
    async loginWithWallet() {
        try {
            // Web3 wallet login (Phantom, MetaMask, etc.)
            if (window.solana && window.solana.isPhantom) {
                const resp = await window.solana.connect();
                const publicKey = resp.publicKey.toString();
                
                await this.createUserFromWallet(publicKey, 'Solana');
            } else if (window.ethereum) {
                const accounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                });
                
                await this.createUserFromWallet(accounts[0], 'Ethereum');
            } else {
                alert('No Web3 wallet detected. Please install Phantom or MetaMask.');
            }
        } catch (error) {
            console.error('Wallet login error:', error);
        }
    }
    
    async loginAsGuest() {
        const guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        this.user = {
            id: guestId,
            name: 'Guest Player',
            email: null,
            avatar: '👤',
            type: 'guest',
            tokens: 0,
            createdAt: Date.now()
        };
        
        await this.saveUser(this.user);
        this.onAuthStateChanged(this.user);
        return this.user;
    }
    
    async handleGoogleCallback(response) {
        // Decode JWT token
        const payload = this.parseJwt(response.credential);
        
        this.user = {
            id: 'google_' + payload.sub,
            name: payload.name,
            email: payload.email,
            avatar: payload.picture,
            type: 'google',
            tokens: 0,
            createdAt: Date.now()
        };
        
        await this.saveUser(this.user);
        await this.syncWithBackend(this.user);
        this.onAuthStateChanged(this.user);
    }
    
    async handleAppleCallback(data) {
        this.user = {
            id: 'apple_' + data.authorization.user,
            name: data.user?.name || 'Apple User',
            email: data.user?.email || null,
            avatar: '🍎',
            type: 'apple',
            tokens: 0,
            createdAt: Date.now()
        };
        
        await this.saveUser(this.user);
        await this.syncWithBackend(this.user);
        this.onAuthStateChanged(this.user);
    }
    
    async createUserFromWallet(address, chain) {
        this.user = {
            id: chain.toLowerCase() + '_' + address,
            name: address.substr(0, 6) + '...' + address.substr(-4),
            email: null,
            avatar: chain === 'Solana' ? '👻' : '🦊',
            walletAddress: address,
            chain: chain,
            type: 'wallet',
            tokens: 0,
            createdAt: Date.now()
        };
        
        await this.saveUser(this.user);
        await this.syncWithBackend(this.user);
        this.onAuthStateChanged(this.user);
    }
    
    parseJwt(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        return JSON.parse(jsonPayload);
    }
    
    async saveUser(user) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            const request = store.put(user);
            
            request.onsuccess = () => {
                localStorage.setItem('9dttt_userId', user.id);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }
    
    async getUser(userId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const request = store.get(userId);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async checkSession() {
        const userId = localStorage.getItem('9dttt_userId');
        if (userId && this.db) {
            this.user = await this.getUser(userId);
            if (this.user) {
                this.onAuthStateChanged(this.user);
            }
        }
    }
    
    async syncWithBackend(user) {
        try {
            // Sync user data with your atomicfizzcaps.xyz backend
            const response = await fetch(`${this.apiEndpoint}/users/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: user.id,
                    name: user.name,
                    email: user.email,
                    walletAddress: user.walletAddress,
                    chain: user.chain,
                    type: user.type
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                // Update user with server data (tokens, achievements, etc.)
                if (data.tokens !== undefined) {
                    user.tokens = data.tokens;
                    await this.saveUser(user);
                }
            }
        } catch (error) {
            console.error('Backend sync error:', error);
            // Continue offline - sync later
        }
    }
    
    async logout() {
        if (this.user) {
            localStorage.removeItem('9dttt_userId');
            this.user = null;
            this.onAuthStateChanged(null);
        }
    }
    
    onAuthStateChanged(user) {
        // Dispatch custom event for UI updates
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { user } 
        }));
    }
    
    isAuthenticated() {
        return this.user !== null;
    }
    
    getUser() {
        return this.user;
    }
    
    showError(message) {
        // You can implement a better error UI
        console.error(message);
        alert(message);
    }
}

// Initialize global auth instance
window.universalAuth = new UniversalAuth();
