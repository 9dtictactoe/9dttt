/**
 * Browser-Native Authentication Module
 * Uses the Credential Management API for seamless sign-in
 * 
 * This allows users to sign in using credentials stored in their browser
 * (Chrome, Edge, Safari, Firefox) without requiring external services like Firebase.
 * 
 * Benefits:
 * - No external dependencies or API keys needed
 * - Works with browser's built-in password manager
 * - Supports auto sign-in for returning users
 * - FREE - no user limits
 */

const { v4: uuidv4 } = require('uuid');
const config = require('./config');
const storage = require('./storage');
const auth = require('./auth');

class BrowserAuth {
    constructor() {
        this.isEnabled = true;
    }

    /**
     * Check if browser auth is available
     */
    isAvailable() {
        return this.isEnabled;
    }

    /**
     * Get browser auth configuration for the client
     * The client needs to know which features are supported
     */
    getClientConfig() {
        return {
            enabled: this.isEnabled,
            features: {
                passwordCredential: true,  // Standard username/password storage
                autoSignIn: true,          // Auto sign-in for returning users
                federated: false           // We're not using federated identity
            },
            // Mediation modes the client can use
            mediation: ['optional', 'silent', 'required']
        };
    }

    /**
     * Verify stored credentials and log in the user
     * Called when browser provides stored credentials via Credential Management API
     */
    async verifyStoredCredential(credentialData) {
        if (!this.isEnabled) {
            return { success: false, error: 'Browser authentication not enabled' };
        }

        try {
            const { type, id, password, name } = credentialData;

            // For PasswordCredential type
            if (type === 'password') {
                // The 'id' field contains username or email
                // The 'password' field contains the password
                const loginResult = await auth.login(id, password);
                
                if (loginResult.success) {
                    // Add browser auth metadata
                    loginResult.authMethod = 'browser_credential';
                    loginResult.credentialType = 'password';
                }
                
                return loginResult;
            }

            return { success: false, error: 'Unsupported credential type' };
        } catch (error) {
            console.error('Browser credential verification error:', error.message);
            return { success: false, error: 'Authentication failed' };
        }
    }

    /**
     * Register a new user and provide data for browser credential storage
     * The client will use this to create a PasswordCredential object
     */
    async registerWithBrowserCredential(userData) {
        if (!this.isEnabled) {
            return { success: false, error: 'Browser authentication not enabled' };
        }

        try {
            const { username, email, password, storeBrowserCredential } = userData;

            // Use the existing auth.register method
            const result = await auth.register(username, email, password);

            if (result.success && storeBrowserCredential) {
                // Provide credential data for browser storage
                // The client will create a PasswordCredential with this
                result.credentialData = {
                    type: 'password',
                    id: email, // Use email as the credential ID for consistency
                    password: password,
                    name: username,
                    iconURL: null // Can be set to user avatar later
                };
            }

            return result;
        } catch (error) {
            console.error('Browser auth registration error:', error.message);
            return { success: false, error: 'Registration failed' };
        }
    }

    /**
     * Create credential data for an existing session
     * Used when user logs in via email/password and wants to store in browser
     */
    createCredentialData(user, password) {
        return {
            type: 'password',
            id: user.email,
            password: password,
            name: user.displayName || user.username,
            iconURL: user.profile?.avatar?.url || null
        };
    }

    /**
     * Log successful browser credential usage for analytics
     */
    async logCredentialUsage(username, credentialType) {
        try {
            const user = await storage.getUser(username);
            if (user) {
                if (!user.browserAuth) {
                    user.browserAuth = {};
                }
                user.browserAuth.lastUsed = new Date().toISOString();
                user.browserAuth.credentialType = credentialType;
                user.browserAuth.usageCount = (user.browserAuth.usageCount || 0) + 1;
                await storage.setUser(username, user);
            }
        } catch (error) {
            // Non-critical, just log
            console.error('Failed to log credential usage:', error.message);
        }
    }
}

module.exports = new BrowserAuth();
