/**
 * API Configuration
 * Automatically detects if running locally or in production
 * and sets the correct backend URL
 */

(function() {
    'use strict';
    
    // Detect environment
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('192.168.');
    
    const isVercel = window.location.hostname.includes('vercel.app');

    // All known production front-end hostnames (Vercel + custom domain)
    // (9dttt.com was previously missing here - only the 'd9ttt.com' typo was listed -
    // so the live site skipped the Vercel proxy and called the backend cross-origin.)
    const PRODUCTION_HOSTS = ['9dttt.vercel.app', '9dttt.com', 'www.9dttt.com', 'd9ttt.com', 'www.d9ttt.com'];
    const isProduction = PRODUCTION_HOSTS.includes(window.location.hostname);

    // Canonical backend URL (Render custom domain). Override with window.NINEDTTT_BACKEND_URL.
    // ninedttt.onrender.com is disabled on Render ("blocked-render-subdomain").
    const BACKEND_URL = (window.NINEDTTT_BACKEND_URL || 'https://api.9dttt.com').replace(/\/$/, '');

    // Accessing the backend directly
    const BACKEND_HOSTS = ['api.9dttt.com', 'www.api.9dttt.com', 'ninedttt.onrender.com'];
    const isRenderDirect = BACKEND_HOSTS.includes(window.location.hostname);

    // Determine which backend to use
    let backendUrl;
    let wsUrl;
    let isProxied = false;

    if (isLocalhost) {
        // Development: Connect directly to local backend
        backendUrl = 'http://localhost:3000';
        wsUrl = 'ws://localhost:3000';
    } else if (isRenderDirect) {
        // Accessed via Render URL directly: connect to backend on same host
        backendUrl = BACKEND_URL;
        wsUrl = BACKEND_URL.replace('https:', 'wss:');
    } else if (isProduction || isVercel) {
        // Production/Vercel: HTTP API calls use relative URLs (proxied by Vercel to Render).
        // Socket.io connects DIRECTLY to the Render backend to avoid Vercel WebSocket
        // proxy limitations (Vercel rewrites do not reliably upgrade WebSocket connections).
        backendUrl = ''; // Empty string = same domain (proxied by Vercel)
        wsUrl = BACKEND_URL; // Socket.io accepts HTTPS URLs and upgrades to WSS internally
        isProxied = true;
    } else {
        // Fallback: Direct connection to production backend
        backendUrl = BACKEND_URL;
        wsUrl = BACKEND_URL.replace('https:', 'wss:');
    }

    // Global API configuration
    window.API_BASE_URL = backendUrl;
    window.API_CONFIG = {
        baseUrl: backendUrl,
        apiUrl: `${backendUrl}/api`,
        wsUrl: wsUrl,
        environment: isLocalhost ? 'development' : 'production',
        isProxied: isProxied
    };
    
    // Silent configuration
    
    // Helper function for API calls
    window.apiCall = async function(endpoint, options = {}) {
        const url = `${window.API_CONFIG.apiUrl}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'include' // Important for cookies/sessions
        };
        
        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    };
    
    // Override fetch URLs if needed
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        // If URL starts with /api or /socket.io, prepend API base URL if in development
        if (typeof url === 'string' && isLocalhost && (url.startsWith('/api') || url.startsWith('/socket.io'))) {
            url = window.API_BASE_URL + url;
        }
        return originalFetch(url, options);
    };
})();
