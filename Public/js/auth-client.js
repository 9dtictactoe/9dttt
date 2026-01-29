/**
 * Authentication Client
 * Handles user registration, login, and profile management
 */

class AuthClient {
    constructor() {
        this.user = null;
        this.token = localStorage.getItem('auth_token');
        this.listeners = new Set();
    }

    /**
     * Initialize auth client - verify existing token
     */
    async init() {
        if (this.token) {
            const result = await this.verifyToken();
            if (result.valid) {
                this.user = result.user;
                this.notifyListeners();
                return true;
            } else {
                this.logout();
            }
        }
        return false;
    }

    /**
     * Register a new user
     */
    async register(username, email, password, storeBrowserCredential = true) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const result = await response.json();
            
            if (result.success) {
                this.token = result.token;
                this.user = result.user;
                localStorage.setItem('auth_token', this.token);
                localStorage.setItem('auth_method', 'email');
                this.notifyListeners();
                
                // Store credential in browser for easy re-login
                if (storeBrowserCredential && window.browserAuth) {
                    window.browserAuth.storeCredential(
                        email,
                        password,
                        result.user.displayName || username
                    );
                }
            }
            return result;
        } catch (error) {
            return { success: false, error: 'Network error. Please try again.' };
        }
    }

    /**
     * Login user
     */
    async login(usernameOrEmail, password, storeBrowserCredential = true) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usernameOrEmail, password })
            });
            const result = await response.json();
            
            if (result.success) {
                this.token = result.token;
                this.user = result.user;
                localStorage.setItem('auth_token', this.token);
                localStorage.setItem('auth_method', 'email');
                this.notifyListeners();
                
                // Store credential in browser for easy re-login
                if (storeBrowserCredential && window.browserAuth && result.user.email) {
                    window.browserAuth.storeCredential(
                        result.user.email,
                        password,
                        result.user.displayName || result.user.username
                    );
                }
            }
            return result;
        } catch (error) {
            return { success: false, error: 'Network error. Please try again.' };
        }
    }

    /**
     * Verify token
     */
    async verifyToken() {
        try {
            const response = await fetch('/api/auth/verify', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            return await response.json();
        } catch (error) {
            return { valid: false };
        }
    }

    /**
     * Logout user
     */
    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_method');
        
        // Also sign out from Firebase if available
        if (typeof window.firebaseSignOut === 'function') {
            window.firebaseSignOut();
        }
        
        // Prevent silent auto sign-in after logout
        if (window.browserAuth && typeof window.browserAuth.preventSilentAccess === 'function') {
            window.browserAuth.preventSilentAccess();
        }
        
        this.notifyListeners();
    }

    /**
     * Get user profile
     */
    async getProfile(username) {
        try {
            const response = await fetch(`/api/profile/${username}`);
            return await response.json();
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(updates) {
        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(updates)
            });
            const result = await response.json();
            if (result.success) {
                this.user = result.user;
                this.notifyListeners();
            }
            return result;
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    }

    /**
     * Get leaderboard
     */
    async getLeaderboard(limit = 10) {
        try {
            const response = await fetch(`/api/leaderboard?limit=${limit}`);
            return await response.json();
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    }

    /**
     * Follow a user
     */
    async followUser(username) {
        try {
            const response = await fetch(`/api/follow/${username}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            return await response.json();
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    }

    /**
     * Unfollow a user
     */
    async unfollowUser(username) {
        try {
            const response = await fetch(`/api/follow/${username}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            return await response.json();
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    }

    /**
     * Get following list (friends)
     */
    async getFollowing() {
        try {
            const response = await fetch('/api/following', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            return await response.json();
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    }

    /**
     * Get followers list
     */
    async getFollowers() {
        try {
            const response = await fetch('/api/followers', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            return await response.json();
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    }

    /**
     * Search users
     */
    async searchUsers(query) {
        try {
            const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            return await response.json();
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    }

    /**
     * Get time controls
     */
    async getTimeControls() {
        try {
            const response = await fetch('/api/games/time-controls');
            return await response.json();
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    }

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return !!this.user;
    }

    /**
     * Add auth state listener
     */
    addListener(callback) {
        this.listeners.add(callback);
    }

    /**
     * Remove auth state listener
     */
    removeListener(callback) {
        this.listeners.delete(callback);
    }

    /**
     * Notify all listeners of auth state change
     */
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.user));
    }
}

// Create global auth client instance
window.authClient = new AuthClient();
