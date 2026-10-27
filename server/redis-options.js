/**
 * Build node-redis (v4) client options from a REDIS_URL.
 *
 * - redis://  -> plain TCP (local dev, private networks)
 * - rediss:// -> TLS, with SNI servername = URL hostname
 * - REDIS_TLS=true forces TLS even for a redis:// URL
 *
 * Hosts such as Layerbase Cloud route connections by SNI and reject TLS
 * handshakes without a servername ("ERR TLS SNI required").
 * Credentials come only from the URL / environment, never from code.
 */
const { URL } = require('url');

function isTruthy(v) {
    return /^(1|true|yes|on)$/i.test(String(v || '').trim());
}

function buildRedisOptions(redisUrl, env = process.env) {
    if (!redisUrl) return null;
    const u = new URL(redisUrl);
    if (u.protocol !== 'redis:' && u.protocol !== 'rediss:') {
        throw new TypeError(`REDIS_URL must use redis:// or rediss:// (got ${u.protocol})`);
    }
    const useTls = u.protocol === 'rediss:' || isTruthy(env.REDIS_TLS);
    const host = u.hostname;
    const socket = {
        host,
        port: u.port ? Number(u.port) : 6379,
        reconnectStrategy: false
    };
    if (useTls) {
        socket.tls = true;
        socket.servername = env.REDIS_TLS_SERVERNAME || host;
        // Keep certificate verification on unless explicitly disabled.
        if (isTruthy(env.REDIS_TLS_INSECURE)) socket.rejectUnauthorized = false;
    }
    const options = { socket };
    if (u.username) options.username = decodeURIComponent(u.username);
    if (u.password) options.password = decodeURIComponent(u.password);
    if (u.pathname && u.pathname.length > 1) {
        const db = Number(u.pathname.slice(1));
        if (Number.isNaN(db)) throw new TypeError('REDIS_URL database path must be a number');
        options.database = db;
    }
    return options;
}

/** Same as buildRedisOptions but with the password masked, for logging. */
function describeRedisOptions(options) {
    if (!options) return 'none';
    const s = options.socket;
    return `${s.tls ? 'rediss' : 'redis'}://${options.username ? options.username + ':***@' : (options.password ? ':***@' : '')}${s.host}:${s.port}` +
        (s.tls ? ` (TLS, SNI=${s.servername})` : ' (plain TCP)');
}

module.exports = { buildRedisOptions, describeRedisOptions };
