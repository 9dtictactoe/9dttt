/* Web Worker: runs TTT9DEngine.getMove off the main thread. */
/* global importScripts, TTT9DEngine */
importScripts('ttt9d-engine.js');
self.onmessage = function (e) {
    const { id, state, difficulty, options } = e.data || {};
    try {
        self.postMessage({ id, ok: true, result: TTT9DEngine.getMove(state, difficulty, options) });
    } catch (err) {
        self.postMessage({ id, ok: false, error: String((err && err.message) || err) });
    }
};
