/**
 * Multiplayer Client
 * Handles real-time multiplayer game connections via Socket.io
 * Supports timed games (5, 10, 15 min) and daily games
 */

class MultiplayerClient {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.currentGame = null;
        this.listeners = new Map();
        this.timeControls = null;
    }

    /**
     * Connect to the server
     */
    connect(token) {
        if (this.socket) {
            this.disconnect();
        }

        // Load Socket.io client if not already loaded
        if (typeof io === 'undefined') {
            console.error('Socket.io client not loaded');
            return false;
        }

        this.socket = io({
            transports: ['websocket', 'polling']
        });

        this.setupEventListeners();
        
        // Authenticate once connected
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.socket.emit('authenticate', token);
            this.emit('connection_status', { connected: true });
        });

        this.socket.on('disconnect', () => {
            this.isConnected = false;
            this.currentGame = null;
            this.emit('connection_status', { connected: false });
        });

        return true;
    }

    /**
     * Disconnect from server
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
        this.currentGame = null;
    }

    /**
     * Setup socket event listeners
     */
    setupEventListeners() {
        // Auth events
        this.socket.on('authenticated', (data) => {
            this.emit('authenticated', data);
        });

        this.socket.on('auth_error', (data) => {
            this.emit('auth_error', data);
        });

        // Matchmaking events
        this.socket.on('matchmaking_queued', (data) => {
            this.emit('matchmaking_queued', data);
        });

        this.socket.on('matchmaking_cancelled', () => {
            this.emit('matchmaking_cancelled');
        });

        this.socket.on('matchmaking_error', (data) => {
            this.emit('matchmaking_error', data);
        });

        // Game events
        this.socket.on('game_start', (game) => {
            this.currentGame = game;
            this.emit('game_start', game);
        });

        this.socket.on('game_update', (game) => {
            this.currentGame = game;
            this.emit('game_update', game);
        });

        this.socket.on('game_ended', (data) => {
            this.currentGame = data.game;
            this.emit('game_ended', data);
        });

        this.socket.on('move_error', (data) => {
            this.emit('move_error', data);
        });

        // Challenge events
        this.socket.on('challenge_sent', (data) => {
            this.emit('challenge_sent', data);
        });

        this.socket.on('challenge_received', (data) => {
            this.emit('challenge_received', data);
        });

        this.socket.on('challenge_declined', (data) => {
            this.emit('challenge_declined', data);
        });

        this.socket.on('challenge_error', (data) => {
            this.emit('challenge_error', data);
        });

        this.socket.on('pending_challenges', (data) => {
            this.emit('pending_challenges', data);
        });

        // Private game events
        this.socket.on('private_game_created', (data) => {
            this.emit('private_game_created', data);
        });

        this.socket.on('join_error', (data) => {
            this.emit('join_error', data);
        });

        // Friend events
        this.socket.on('friend_online', (data) => {
            this.emit('friend_online', data);
        });

        this.socket.on('friend_offline', (data) => {
            this.emit('friend_offline', data);
        });

        // Chat events
        this.socket.on('chat_message', (data) => {
            this.emit('chat_message', data);
        });

        this.socket.on('chat_error', (data) => {
            this.emit('chat_error', data);
        });

        // General errors
        this.socket.on('error', (data) => {
            this.emit('error', data);
        });
    }

    /**
     * Find a match (matchmaking)
     */
    findMatch(gameType = 'ultimate-tictactoe', timeControl = 'rapid-10') {
        if (!this.socket || !this.isConnected) {
            this.emit('error', { error: 'Not connected to server' });
            return;
        }
        this.socket.emit('find_match', { gameType, timeControl });
    }

    /**
     * Cancel matchmaking
     */
    cancelMatchmaking() {
        if (this.socket) {
            this.socket.emit('cancel_matchmaking');
        }
    }

    /**
     * Create a private game
     */
    createPrivateGame(gameType = 'ultimate-tictactoe', timeControl = 'rapid-10') {
        if (this.socket) {
            this.socket.emit('create_private_game', { gameType, timeControl });
        }
    }

    /**
     * Join a private game by code
     */
    joinPrivateGame(gameId) {
        if (this.socket) {
            this.socket.emit('join_private_game', { gameId });
        }
    }

    /**
     * Challenge a specific player
     */
    challengePlayer(targetUsername, gameType = 'ultimate-tictactoe', timeControl = 'rapid-10') {
        if (this.socket) {
            this.socket.emit('challenge_player', { targetUsername, gameType, timeControl });
        }
    }

    /**
     * Accept a challenge
     */
    acceptChallenge(challengeId) {
        if (this.socket) {
            this.socket.emit('accept_challenge', { challengeId });
        }
    }

    /**
     * Decline a challenge
     */
    declineChallenge(challengeId) {
        if (this.socket) {
            this.socket.emit('decline_challenge', { challengeId });
        }
    }

    /**
     * Make a move in the current game
     */
    makeMove(gameId, move) {
        if (this.socket) {
            this.socket.emit('make_move', { gameId, move });
        }
    }

    /**
     * Forfeit the current game
     */
    forfeitGame(gameId) {
        if (this.socket) {
            this.socket.emit('forfeit_game', { gameId });
        }
    }

    /**
     * Send chat message in game
     */
    sendGameChat(gameId, message) {
        if (this.socket) {
            this.socket.emit('game_chat', { gameId, message });
        }
    }

    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    /**
     * Emit event to local listeners
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }

    /**
     * Get current game state
     */
    getGame() {
        return this.currentGame;
    }

    /**
     * Check if in a game
     */
    isInGame() {
        return this.currentGame && this.currentGame.status === 'playing';
    }
}

// Create global multiplayer client instance
window.multiplayerClient = new MultiplayerClient();
