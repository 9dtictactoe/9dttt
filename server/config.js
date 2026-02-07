/**
 * Server Configuration
 * Environment-based configuration for the 9DTTT Game Platform
 */

module.exports = {
    // Server
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    BASE_URL: process.env.BASE_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000',
    
    // Maintenance Mode (default: false - set to 'true' in env to enable)
    MAINTENANCE_MODE: process.env.MAINTENANCE_MODE === 'true',
    
    // JWT Authentication
    JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    
    // Redis Configuration
    REDIS_URL: process.env.REDIS_URL || process.env.REDIS_INTERNAL_URL || null,
    
    // Render Keep-Alive (set this to your Render external URL)
    RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL || null,
    
    // Game Settings
    MATCHMAKING_TIMEOUT: 30000, // 30 seconds to find a match
    TURN_TIMEOUT: 60000, // 60 seconds per turn
    
    // Rate Limiting
    MAX_MESSAGES_PER_MINUTE: 30,
    MAX_LOGIN_ATTEMPTS: 5,
    LOGIN_LOCKOUT_TIME: 15 * 60 * 1000, // 15 minutes
};
