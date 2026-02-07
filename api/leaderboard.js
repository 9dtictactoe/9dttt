/**
 * Leaderboard API
 * Vercel Serverless Function
 */

// In-memory store (use Redis/MongoDB in production)
let leaderboardData = {
    global: [],
    byGame: {}
};

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const { method } = req;
    const { game, limit = 100 } = req.query;
    
    try {
        if (method === 'GET') {
            // Get leaderboard
            if (game) {
                const gameScores = leaderboardData.byGame[game] || [];
                return res.status(200).json({
                    game,
                    scores: gameScores.slice(0, parseInt(limit))
                });
            }
            
            // Global leaderboard
            return res.status(200).json({
                global: leaderboardData.global.slice(0, parseInt(limit))
            });
        }
        
        if (method === 'POST') {
            // Submit score
            const { gameId, userId, username, score, metadata } = req.body;
            
            if (!gameId || !userId || !score) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            const entry = {
                userId,
                username: username || 'Anonymous',
                score: parseInt(score),
                gameId,
                metadata: metadata || {},
                timestamp: new Date().toISOString()
            };
            
            // Add to game leaderboard
            if (!leaderboardData.byGame[gameId]) {
                leaderboardData.byGame[gameId] = [];
            }
            
            leaderboardData.byGame[gameId].push(entry);
            leaderboardData.byGame[gameId].sort((a, b) => b.score - a.score);
            leaderboardData.byGame[gameId] = leaderboardData.byGame[gameId].slice(0, 1000);
            
            // Add to global leaderboard
            leaderboardData.global.push(entry);
            leaderboardData.global.sort((a, b) => b.score - a.score);
            leaderboardData.global = leaderboardData.global.slice(0, 1000);
            
            return res.status(201).json({
                success: true,
                rank: leaderboardData.byGame[gameId].findIndex(e => e.userId === userId && e.timestamp === entry.timestamp) + 1,
                entry
            });
        }
        
        return res.status(405).json({ error: 'Method not allowed' });
        
    } catch (error) {
        console.error('Leaderboard API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
