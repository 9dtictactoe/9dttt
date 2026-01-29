/**
 * Keep-Alive Module
 * Prevents Render free tier from sleeping by self-pinging
 * Also provides health check endpoints
 */

const https = require('https');
const http = require('http');

class KeepAlive {
    constructor() {
        this.interval = null;
        this.pingUrl = null;
        this.stats = {
            pings: 0,
            lastPing: null,
            lastStatus: null,
            uptime: Date.now()
        };
    }

    /**
     * Start the keep-alive service
     * @param {string} url - The URL to ping (your Render app URL)
     * @param {number} intervalMs - Ping interval in milliseconds (default: 14 minutes)
     */
    start(url, intervalMs = 14 * 60 * 1000) {
        if (!url) {
            console.log('⏰ Keep-alive: No URL provided, skipping (set RENDER_EXTERNAL_URL)');
            return;
        }

        this.pingUrl = url;
        
        // Initial ping after 1 minute
        setTimeout(() => this.ping(), 60 * 1000);
        
        // Regular pings
        this.interval = setInterval(() => this.ping(), intervalMs);
        
        console.log(`⏰ Keep-alive: Will ping ${url} every ${Math.round(intervalMs / 60000)} minutes`);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            console.log('⏰ Keep-alive: Stopped');
        }
    }

    ping() {
        if (!this.pingUrl) return;

        const url = `${this.pingUrl}/api/health`;
        const protocol = url.startsWith('https') ? https : http;

        const req = protocol.get(url, (res) => {
            this.stats.pings++;
            this.stats.lastPing = new Date().toISOString();
            this.stats.lastStatus = res.statusCode;

            // Consume response data to free up memory
            res.resume();

            if (res.statusCode === 200) {
                console.log(`💓 Keep-alive ping #${this.stats.pings}: OK`);
            } else {
                console.log(`⚠️ Keep-alive ping #${this.stats.pings}: Status ${res.statusCode}`);
            }
        });

        req.on('error', (err) => {
            this.stats.lastPing = new Date().toISOString();
            this.stats.lastStatus = 'error';
            console.log(`❌ Keep-alive ping failed: ${err.message}`);
        });

        // Set timeout
        req.setTimeout(10000, () => {
            req.destroy();
            console.log('⚠️ Keep-alive ping timed out');
        });
    }

    getStats() {
        return {
            ...this.stats,
            uptimeSeconds: Math.floor((Date.now() - this.stats.uptime) / 1000),
            isActive: this.interval !== null
        };
    }

    /**
     * Express routes for health checks
     */
    routes(app) {
        // Simple health check
        app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: Math.floor((Date.now() - this.stats.uptime) / 1000)
            });
        });

        // Detailed health check (for monitoring)
        app.get('/api/health/detailed', (req, res) => {
            const memUsage = process.memoryUsage();
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: Math.floor((Date.now() - this.stats.uptime) / 1000),
                keepAlive: this.getStats(),
                memory: {
                    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
                    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
                    rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB'
                },
                node: process.version
            });
        });

        // Ping endpoint (for external monitoring services)
        app.get('/ping', (req, res) => {
            res.send('pong');
        });
    }
}

module.exports = new KeepAlive();
