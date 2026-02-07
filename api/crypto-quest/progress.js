/**
 * Crypto Quest Progress API
 * Save and retrieve player progress
 */

// In-memory store (use MongoDB in production)
const progressStore = new Map();

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const { method } = req;
    const { userId } = req.query;
    
    try {
        if (method === 'GET') {
            // Get progress
            if (!userId) {
                return res.status(400).json({ error: 'userId required' });
            }
            
            const progress = progressStore.get(userId) || {
                userId,
                coins: 0,
                knowledge: 0,
                achievements: [],
                completedLevels: [],
                createdAt: new Date().toISOString(),
                lastPlayed: new Date().toISOString()
            };
            
            return res.status(200).json(progress);
        }
        
        if (method === 'POST' || method === 'PUT') {
            // Save progress
            const body = req.body;
            
            if (!body.userId) {
                return res.status(400).json({ error: 'userId required' });
            }
            
            const progress = {
                ...body,
                lastPlayed: new Date().toISOString()
            };
            
            // If new user, set createdAt
            if (!progressStore.has(body.userId)) {
                progress.createdAt = new Date().toISOString();
            }
            
            progressStore.set(body.userId, progress);
            
            return res.status(200).json({
                success: true,
                progress
            });
        }
        
        return res.status(405).json({ error: 'Method not allowed' });
        
    } catch (error) {
        console.error('Progress API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
