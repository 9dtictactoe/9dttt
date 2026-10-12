/**
 * AI move provider for 9D Tic-Tac-Toe.
 * Uses the local engine (TTT9DEngine) by default. Optionally calls RealAI when window.REALAI_URL
 * (or localStorage 'realai_url') is set: POST {REALAI_URL}/v1/tools/execute
 *   { "name": "ttt9d_move", "arguments": { "state": {...}, "difficulty": "hard" } }
 * (RealAI's tools/execute envelope) expecting { "tool": "ttt9d_move", "result": { "ok": true, "move": {board, cell}, "eval": n } }.
 * Any error, timeout (default 1500 ms) or illegal move falls back to the local engine.
 */
(function (root) {
    'use strict';
    function realaiUrl() {
        try { return root.REALAI_URL || root.localStorage?.getItem('realai_url') || null; } catch (e) { return root.REALAI_URL || null; }
    }
    async function remoteMove(url, state, difficulty, timeoutMs) {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), timeoutMs);
        try {
            const res = await fetch(url.replace(/\/$/, '') + '/v1/tools/execute', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal,
                body: JSON.stringify({ name: 'ttt9d_move', arguments: { state, difficulty } })
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const body = await res.json();
            const r = body.result || body;
            const legal = root.TTT9DEngine.legalMoves(state);
            if (!r || !r.move || !legal.some(m => m.board === r.move.board && m.cell === r.move.cell)) throw new Error('bad remote move');
            return { move: r.move, eval: typeof r.eval === 'number' ? r.eval : 0, difficulty, source: 'realai', commentary: r.commentary };
        } finally { clearTimeout(t); }
    }
    async function getAIMove(state, difficulty, opts) {
        opts = opts || {};
        const url = opts.realaiUrl !== undefined ? opts.realaiUrl : realaiUrl();
        if (url) {
            try { return await remoteMove(url, state, difficulty, opts.timeoutMs || 1500); }
            catch (e) { console.warn('RealAI unavailable, using local engine:', e.message); }
        }
        return root.TTT9DEngine.getMove(state, difficulty, { seed: (Math.random() * 2 ** 31) | 0 });
    }
    root.TTT9DAI = { getAIMove };
})(typeof window !== 'undefined' ? window : globalThis);
