/**
 * Browser-Native Authentication Client
 * Uses the Credential Management API for seamless sign-in
 * 
 * This allows users to sign in using credentials stored in their browser
 * (Chrome, Edge, Safari, Firefox) without requiring external services.
 * 
 * The Credential Management API enables:
 * - One-tap sign-in for returning users
 * - Automatic credential storage after successful login
 * - Integration with browser's password manager
 */

(function() {
    'use strict';

    // Check if Credential Management API is supported
    const isCredentialApiSupported = window.PasswordCredential !== undefined;
    
    // Store configuration
    let browserAuthConfig = null;
    let isInitialized = false;
    
    /**
     * Initialize browser authentication
     */
    async function init() {
        if (isInitialized) return;
        
        try {
            // Fetch server configuration
            const response = await fetch('/api/auth/browser/status');
            const data = await response.json();
            
            if (!data.success || !data.available) {
                console.log('Browser auth not available on server');
                return;
            }
            
            browserAuthConfig = data.config;
            isInitialized = true;
            
            console.log('✅ Browser Credential API initialized');
            
            // Attempt silent/automatic sign-in for returning users
            // Only if user is not already logged in
            const existingToken = localStorage.getItem('auth_token');
            if (!existingToken && browserAuthConfig.features.autoSignIn) {
                await attemptAutoSignIn();
            }
            
        } catch (error) {
            console.log('Browser auth initialization skipped:', error.message);
        }
    }
    
    /**
     * Check if browser credential API is supported
     */
    function isSupported() {
        return isCredentialApiSupported;
    }
    
    /**
     * Check if browser auth is available (supported + configured)
     */
    function isAvailable() {
        return isCredentialApiSupported && isInitialized && browserAuthConfig?.enabled;
    }
    
    /**
     * Attempt automatic sign-in using stored credentials
     * Uses 'silent' mediation - won't show UI unless credentials are available
     */
    async function attemptAutoSignIn() {
        if (!isAvailable()) return null;
        
        try {
            // Request stored credentials with silent mediation
            const credential = await navigator.credentials.get({
                password: true,
                mediation: 'silent'
            });
            
            if (credential && credential.type === 'password') {
                console.log('🔐 Found stored browser credential, attempting auto sign-in...');
                return await signInWithCredential(credential);
            }
            
            return null;
        } catch (error) {
            console.log('Auto sign-in not available:', error.message);
            return null;
        }
    }
    
    /**
     * Show browser's credential picker for manual sign-in
     * Uses 'optional' mediation - shows account chooser if multiple accounts
     */
    async function requestCredential() {
        if (!isAvailable()) {
            return { success: false, error: 'Browser credentials not supported' };
        }
        
        try {
            const credential = await navigator.credentials.get({
                password: true,
                mediation: 'optional'
            });
            
            if (credential && credential.type === 'password') {
                return await signInWithCredential(credential);
            }
            
            return { success: false, error: 'No credential selected' };
        } catch (error) {
            console.error('Credential request failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Sign in using a browser credential
     */
    async function signInWithCredential(credential) {
        try {
            const response = await fetch('/api/auth/browser/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: credential.type,
                    id: credential.id,
                    password: credential.password,
                    name: credential.name
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Store the token
                localStorage.setItem('auth_token', result.token);
                localStorage.setItem('auth_method', 'browser_credential');
                
                // Update auth client if available
                if (window.authClient) {
                    window.authClient.token = result.token;
                    window.authClient.user = result.user;
                    window.authClient.notifyListeners();
                }
                
                console.log(`✅ Signed in via browser credential: ${result.user.username}`);
                
                // Dispatch event for UI updates
                window.dispatchEvent(new CustomEvent('browser-credential-login', {
                    detail: { user: result.user }
                }));
            }
            
            return result;
        } catch (error) {
            console.error('Browser credential sign-in failed:', error);
            return { success: false, error: 'Authentication failed' };
        }
    }
    
    /**
     * Store credentials in the browser after successful login
     * Call this after a successful email/password login
     */
    async function storeCredential(email, password, displayName, iconURL) {
        if (!isCredentialApiSupported) {
            console.log('Credential storage not supported in this browser');
            return false;
        }
        
        try {
            const credential = new PasswordCredential({
                id: email,
                password: password,
                name: displayName || email,
                iconURL: iconURL || undefined
            });
            
            await navigator.credentials.store(credential);
            console.log('✅ Credential stored in browser');
            return true;
        } catch (error) {
            console.error('Failed to store credential:', error);
            return false;
        }
    }
    
    /**
     * Prevent automatic sign-in (call after logout)
     */
    async function preventSilentAccess() {
        if (!isCredentialApiSupported) return;
        
        try {
            await navigator.credentials.preventSilentAccess();
            console.log('Silent access prevented for future sessions');
        } catch (error) {
            console.log('Could not prevent silent access:', error.message);
        }
    }
    
    /**
     * Register and optionally store credential
     */
    async function register(username, email, password, shouldStoreCredential = true) {
        try {
            const response = await fetch('/api/auth/browser/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    storeBrowserCredential: shouldStoreCredential
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Store token
                localStorage.setItem('auth_token', result.token);
                localStorage.setItem('auth_method', 'browser_credential');
                
                // Update auth client
                if (window.authClient) {
                    window.authClient.token = result.token;
                    window.authClient.user = result.user;
                    window.authClient.notifyListeners();
                }
                
                // Store credential in browser if supported and requested
                if (shouldStoreCredential && result.credentialData) {
                    await storeCredential(
                        result.credentialData.id,
                        result.credentialData.password,
                        result.credentialData.name,
                        result.credentialData.iconURL
                    );
                }
                
                // Dispatch event for UI updates
                window.dispatchEvent(new CustomEvent('browser-credential-register', {
                    detail: { user: result.user }
                }));
            }
            
            return result;
        } catch (error) {
            console.error('Registration failed:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    }
    
    // Expose the browser auth API globally
    window.browserAuth = {
        init,
        isSupported,
        isAvailable,
        requestCredential,
        storeCredential,
        preventSilentAccess,
        register,
        attemptAutoSignIn
    };
    
    // Initialize on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already loaded
        init();
    }
    
})();
