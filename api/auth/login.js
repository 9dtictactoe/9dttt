/**
 * Authentication API - Login
 * Vercel Serverless Function
 */

// Simple in-memory user store (use MongoDB in production)
const users = new Map();

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { username, password, guestMode } = req.body;
        
        // Guest mode
        if (guestMode) {
            const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const guestUser = {
                id: guestId,
                username: 'Guest Player',
                type: 'guest',
                createdAt: new Date().toISOString()
            };
            
            return res.status(200).json({
                success: true,
                user: guestUser,
                token: guestId
            });
        }
        
        // Regular login
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        
        // Check if user exists
        let user = users.get(username);
        
        if (!user) {
            // Auto-register new user
            user = {
                id: `user_${Date.now()}`,
                username,
                password, // In production, hash this!
                type: 'registered',
                createdAt: new Date().toISOString()
            };
            users.set(username, user);
        } else {
            // Verify password (in production, use bcrypt)
            if (user.password !== password) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
        }
        
        // Generate token (in production, use JWT)
        const token = `${user.id}_${Date.now()}`;
        
        // Remove password from response
        const { password: _, ...userResponse } = user;
        
        return res.status(200).json({
            success: true,
            user: userResponse,
            token
        });
        
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
