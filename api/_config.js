/**
 * API Configuration
 * Shared utilities for all API endpoints
 */

// CORS configuration
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

// Rate limiting (simple in-memory, use Redis in production)
const rateLimitMap = new Map();

function checkRateLimit(identifier, maxRequests = 100, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!rateLimitMap.has(identifier)) {
        rateLimitMap.set(identifier, []);
    }
    
    const requests = rateLimitMap.get(identifier);
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (recentRequests.length >= maxRequests) {
        return false;
    }
    
    recentRequests.push(now);
    rateLimitMap.set(identifier, recentRequests);
    return true;
}

// Clean up old rate limit entries
setInterval(() => {
    const now = Date.now();
    const windowMs = 60000;
    
    for (const [identifier, requests] of rateLimitMap.entries()) {
        const recentRequests = requests.filter(timestamp => timestamp > now - windowMs);
        if (recentRequests.length === 0) {
            rateLimitMap.delete(identifier);
        } else {
            rateLimitMap.set(identifier, recentRequests);
        }
    }
}, 60000);

// Error response helper
function errorResponse(statusCode, message) {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify({
            error: message,
            timestamp: new Date().toISOString()
        })
    };
}

// Success response helper
function successResponse(data, statusCode = 200) {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify({
            ...data,
            timestamp: new Date().toISOString()
        })
    };
}

// Validate required fields
function validateFields(body, requiredFields) {
    const missing = requiredFields.filter(field => !body[field]);
    if (missing.length > 0) {
        return `Missing required fields: ${missing.join(', ')}`;
    }
    return null;
}

module.exports = {
    CORS_HEADERS,
    checkRateLimit,
    errorResponse,
    successResponse,
    validateFields
};
