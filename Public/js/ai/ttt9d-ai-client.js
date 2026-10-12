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
    // Off-main-thread search via Web Worker, with main-thread fallback.
    let worker = null, workerFailed = false, nextId = 1;
    const pending = new Map();
    function workerUrl() {
        const el = root.document && root.document.querySelector('script[src*="ttt9d-ai-client.js"]');
        return el ? el.src.replace(/ttt9d-ai-client\.js(\?.*)?$/, 'ttt9d-worker.js') : 'ttt9d-worker.js';
    }
    function getWorker() {
        if (worker || workerFailed || typeof root.Worker !== 'function') return worker;
        try {
            worker = new root.Worker(workerUrl());
            worker.onmessage = (e) => {
                const p = pending.get(e.data.id); if (!p) return;
                pending.delete(e.data.id);
                e.data.ok ? p.resolve(e.data.result) : p.reject(new Error(e.data.error));
            };
            worker.onerror = (e) => {
                workerFailed = true; worker = null;
                for (const p of pending.values()) p.reject(new Error('worker error: ' + (e.message || 'unknown')));
                pending.clear();
            };
        } catch (e) { workerFailed = true; worker = null; }
        return worker;
    }
    function localMove(state, difficulty, options) {
        const w = getWorker();
        if (!w) return Promise.resolve(root.TTT9DEngine.getMove(state, difficulty, options));
        return new Promise((resolve, reject) => {
            const id = nextId++;
            pending.set(id, { resolve, reject });
            w.postMessage({ id, state, difficulty, options });
        }).catch((e) => {
            console.warn('AI worker failed, using main thread:', e.message);
            return root.TTT9DEngine.getMove(state, difficulty, options);
        });
    }
    async function getAIMove(state, difficulty, opts) {
        opts = opts || {};
        const url = opts.realaiUrl !== undefined ? opts.realaiUrl : realaiUrl();
        if (url) {
            try { return await remoteMove(url, state, difficulty, opts.timeoutMs || 1500); }
            catch (e) { console.warn('RealAI unavailable, using local engine:', e.message); }
        }
        return localMove(state, difficulty, { seed: (Math.random() * 2 ** 31) | 0 });
    }
    root.TTT9DAI = { getAIMove, _usingWorker: () => !!worker };
})(typeof window !== 'undefined' ? window : globalThis);
