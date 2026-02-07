/**
 * Firebase Client Initialization
 * Loads Firebase config from server and initializes the SDK
 * Automatically detects existing Firebase auth sessions (Google/Apple)
 */

(async function() {
    try {
        // Check if Firebase SDK is loaded
        if (typeof firebase === 'undefined') {
            console.log('Firebase SDK not loaded');
            return;
        }

        // Fetch Firebase status/config from server
        const response = await fetch('/api/auth/firebase/status');
        const data = await response.json();
        
        if (!data.available || !data.config) {
            console.log('Firebase social login not configured - using email/password auth only');
            return;
        }

        // Initialize Firebase with server-provided config
        firebase.initializeApp(data.config);
        console.log('✅ Firebase client initialized');
        
        // Store providers for UI
        window.firebaseProviders = data.providers;
        
        // Flag to prevent logout loops
        let isLoggingOut = false;
        
        // Listen for auth state changes to detect existing sessions
        // This picks up users already logged into Google/Apple in their browser
        firebase.auth().onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                // User is signed in with Firebase (Google/Apple)
                console.log('🔍 Detected existing Firebase session:', firebaseUser.email);
                
                // Check if we already have a valid app token
                const existingToken = localStorage.getItem('auth_token');
                if (existingToken) {
                    // Already have a token, check if authClient is ready
                    if (window.authClient && window.authClient.user) {
                        console.log('✅ User already authenticated in app');
                        return;
                    }
                    // Token exists but authClient not ready - wait for it to initialize
                    // The authClient.init() will handle verification
                    return;
                }
                
                try {
                    // Get Firebase ID token and verify with our server
                    const idToken = await firebaseUser.getIdToken();
                    
                    const verifyResponse = await fetch('/api/auth/firebase/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ idToken })
                    });
                    
                    const result = await verifyResponse.json();
                    
                    if (result.success) {
                        // Store token and auth method
                        localStorage.setItem('auth_token', result.token);
                        localStorage.setItem('auth_method', 'firebase');
                        
                        // Update unified auth (preferred) or fall back to authClient
                        if (window.unifiedAuth) {
                            window.unifiedAuth.user = result.user;
                            window.unifiedAuth.token = result.token;
                            window.unifiedAuth.notifyListeners();
                        } else if (window.authClient) {
                            // Legacy support
                            window.authClient.token = result.token;
                            window.authClient.user = result.user;
                            if (window.authClient.notifyListeners) {
                                window.authClient.notifyListeners();
                            }
                        }
                        
                        const provider = firebaseUser.providerData[0]?.providerId || 'unknown';
                        const providerName = provider === 'google.com' ? 'Google' : 
                                           provider === 'apple.com' ? 'Apple' : provider;
                        
                        console.log(`✅ Auto-signed in via ${providerName}: ${result.user.username}`);
                        
                        // Dispatch event for UI updates
                        window.dispatchEvent(new CustomEvent('firebase-auto-login', { 
                            detail: { 
                                user: result.user, 
                                provider: providerName,
                                isNewUser: result.isNewUser 
                            } 
                        }));
                    } else {
                        console.log('Firebase auto-login failed:', result.error);
                        // Sign out from Firebase if backend verification failed
                        await firebase.auth().signOut();
                    }
                } catch (error) {
                    console.log('Auto-login verification failed:', error.message);
                }
            }
            // Note: We don't handle the signed-out case here to avoid logout loops
            // The app's logout function handles Firebase sign-out
        });
        
        // Store auth method when logging in via Firebase
        window.firebaseSignIn = async function(provider) {
            try {
                let authProvider;
                if (provider === 'google') {
                    authProvider = new firebase.auth.GoogleAuthProvider();
                } else if (provider === 'apple') {
                    authProvider = new firebase.auth.OAuthProvider('apple.com');
                    authProvider.addScope('email');
                    authProvider.addScope('name');
                } else {
                    throw new Error('Unknown provider: ' + provider);
                }
                
                const result = await firebase.auth().signInWithPopup(authProvider);
                localStorage.setItem('auth_method', 'firebase');
                return result;
            } catch (error) {
                console.error('Firebase sign-in error:', error);
                throw error;
            }
        };
        
        // Sign out from Firebase
        window.firebaseSignOut = async function() {
            if (isLoggingOut) return; // Prevent re-entry
            isLoggingOut = true;
            try {
                await firebase.auth().signOut();
                localStorage.removeItem('auth_method');
            } catch (error) {
                console.error('Firebase sign-out error:', error);
            } finally {
                isLoggingOut = false;
            }
        };
        
    } catch (error) {
        console.log('Firebase initialization skipped:', error.message);
    }
})();
