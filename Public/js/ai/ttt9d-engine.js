/**
 * 9D (Ultimate) Tic-Tac-Toe AI engine — plain JS, no dependencies, works in browser and Node.
 *
 * API:
 *   TTT9DEngine.getMove(state, difficulty = 'medium', options = {}) -> { move: {board, cell}, eval, difficulty, iterations, source: 'local' }
 *   TTT9DEngine.legalMoves(state) -> [{board, cell}]
 *   TTT9DEngine.applyMove(state, move) -> newState
 *   TTT9DEngine.result(state) -> 'X' | 'O' | 'draw' | null
 *
 * state = {
 *   boards: [[9 x ('X'|'O'|null)] x 9],   // board-major; cell index 0..8 row-major
 *   activeBoard: 0..8 | null,            // null = any open board
 *   currentPlayer: 'X' | 'O'
 * }
 * Rules mirror ultimate-tictactoe.js: a small board is won by 3-in-a-row (worth the number of filled
 * cells in it at that moment), full without a line = draw. The game is won by 3 small-board wins in a
 * row; if every small board is finished without that, higher total points wins (equal = draw).
 * eval is in [-1, 1] from the perspective of state.currentPlayer (1 = winning).
 * Deterministic for a given (state, difficulty, options.seed).
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.TTT9DEngine = api;
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';
    const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    const DIFFICULTY = {
        easy:   { iterations: 150,   blunder: 0.35, tactics: false },
        medium: { iterations: 1200,  blunder: 0.10, tactics: true },
        hard:   { iterations: 5000,  blunder: 0.0,  tactics: true },
        expert: { iterations: 20000, blunder: 0.0,  tactics: true }
    };
    const DEFAULT_TIME_MS = { easy: 100, medium: 250, hard: 600, expert: 1500 };

    function mulberry32(a) {
        return function () {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function lineWinner(c) {
        for (const [a, b, d] of LINES) if (c[a] && c[a] !== 'draw' && c[a] === c[b] && c[a] === c[d]) return c[a];
        return null;
    }

    // Internal compact state: cells Int8Array(81) 0/1/2, meta Int8Array(9) 0 open,1 X,2 O,3 draw
    function fromPublic(s) {
        if (!s || !Array.isArray(s.boards) || s.boards.length !== 9) throw new Error('state.boards must be 9 arrays of 9');
        const cells = new Int8Array(81), meta = new Int8Array(9), pts = [0, 0, 0];
        for (let b = 0; b < 9; b++) {
            const bd = s.boards[b];
            if (!Array.isArray(bd) || bd.length !== 9) throw new Error('state.boards must be 9 arrays of 9');
            for (let i = 0; i < 9; i++) cells[b * 9 + i] = bd[i] === 'X' ? 1 : bd[i] === 'O' ? 2 : 0;
            updateMeta(cells, meta, pts, b);
        }
        const player = s.currentPlayer === 'O' ? 2 : 1;
        let active = (s.activeBoard === null || s.activeBoard === undefined) ? -1 : s.activeBoard | 0;
        if (active >= 0 && meta[active] !== 0) active = -1;
        return { cells, meta, pts, player, active, result: computeResult(meta, pts) };
    }
    function updateMeta(cells, meta, pts, b) {
        const o = b * 9; let filled = 0;
        for (let i = 0; i < 9; i++) if (cells[o + i]) filled++;
        for (const [a, c, d] of LINES) {
            const v = cells[o + a];
            if (v && v === cells[o + c] && v === cells[o + d]) { meta[b] = v; pts[v] += filled; return; }
        }
        meta[b] = filled === 9 ? 3 : 0;
    }
    function computeResult(meta, pts) {
        for (const [a, b, c] of LINES) { const v = meta[a]; if ((v === 1 || v === 2) && v === meta[b] && v === meta[c]) return v; }
        for (let b = 0; b < 9; b++) if (meta[b] === 0) return 0;
        return pts[1] > pts[2] ? 1 : pts[2] > pts[1] ? 2 : 3;
    }
    function clone(s) {
        return { cells: s.cells.slice(), meta: s.meta.slice(), pts: s.pts.slice(), player: s.player, active: s.active, result: s.result };
    }
    function moves(s, out) {
        out.length = 0;
        if (s.result) return out;
        for (let b = 0; b < 9; b++) {
            if (s.meta[b] !== 0 || (s.active >= 0 && s.active !== b)) continue;
            for (let i = 0; i < 9; i++) if (!s.cells[b * 9 + i]) out.push(b * 9 + i);
        }
        return out;
    }
    function play(s, m) { // mutates
        const b = (m / 9) | 0, i = m % 9;
        s.cells[m] = s.player;
        updateMeta(s.cells, s.meta, s.pts, b);
        s.active = s.meta[i] === 0 ? i : -1;
        s.player = 3 - s.player;
        s.result = computeResult(s.meta, s.pts);
    }
    function rollout(s, rng, buf) {
        while (!s.result) {
            moves(s, buf);
            // light heuristic: take an immediate game win if available
            let pick = -1;
            for (let k = 0; k < buf.length && pick < 0; k++) {
                const t = clone(s); play(t, buf[k]); if (t.result === s.player) pick = buf[k];
            }
            play(s, pick >= 0 ? pick : buf[(rng() * buf.length) | 0]);
        }
        return s.result;
    }
    function winningMove(s, player) {
        const ms = moves(s, []);
        for (const m of ms) { const t = clone(s); t.player = player; play(t, m); if (t.result === player) return m; }
        return -1;
    }

    function mcts(root, iterations, deadline, rng) {
        const nodes = [{ parent: -1, move: -1, children: null, untried: moves(root, []).slice(), w: 0, n: 0, mover: 3 - root.player }];
        const buf = []; let it = 0;
        for (; it < iterations; it++) {
            if ((it & 63) === 0 && Date.now() > deadline && it > 0) break;
            let idx = 0; const s = clone(root);
            // selection
            while (nodes[idx].untried.length === 0 && nodes[idx].children && nodes[idx].children.length) {
                const p = nodes[idx]; let best = -1, bv = -Infinity; const ln = Math.log(p.n);
                for (const c of p.children) {
                    const ch = nodes[c]; const v = ch.w / ch.n + 1.2 * Math.sqrt(ln / ch.n);
                    if (v > bv) { bv = v; best = c; }
                }
                idx = best; play(s, nodes[idx].move);
            }
            // expansion
            const node = nodes[idx];
            if (node.untried.length && !s.result) {
                const k = (rng() * node.untried.length) | 0, m = node.untried[k];
                node.untried[k] = node.untried[node.untried.length - 1]; node.untried.pop();
                const mover = s.player; play(s, m);
                nodes.push({ parent: idx, move: m, children: null, untried: moves(s, []).slice(), w: 0, n: 0, mover });
                (node.children || (node.children = [])).push(nodes.length - 1);
                idx = nodes.length - 1;
            }
            const r = rollout(s, rng, buf);
            for (let j = idx; j !== -1; j = nodes[j].parent) {
                const nd = nodes[j]; nd.n++;
                nd.w += r === 3 ? 0.5 : (r === nd.mover ? 1 : 0);
            }
        }
        const kids = (nodes[0].children || []).map(c => nodes[c]).sort((a, b) => b.n - a.n);
        return { ranked: kids, iterations: it };
    }

    function toMove(m) { return { board: (m / 9) | 0, cell: m % 9 }; }

    function getMove(state, difficulty, options) {
        options = options || {};
        const level = DIFFICULTY[difficulty] ? difficulty : 'medium';
        const cfg = DIFFICULTY[level];
        const s = fromPublic(state);
        const legal = moves(s, []).slice();
        if (!legal.length) throw new Error('No legal moves: game is over');
        const rng = mulberry32(options.seed === undefined ? 0x9d77 : options.seed | 0);
        const done = (m, ev, iters) => ({ move: toMove(m), eval: Math.max(-1, Math.min(1, Math.round(ev * 1000) / 1000)), difficulty: level, iterations: iters, source: 'local' });

        if (legal.length === 1) return done(legal[0], 0, 0);
        if (cfg.tactics) {
            const win = winningMove(s, s.player);
            if (win >= 0) return done(win, 1, 0);
        }
        if (cfg.blunder > 0 && rng() < cfg.blunder) {
            return done(legal[(rng() * legal.length) | 0], 0, 0);
        }
        const timeMs = options.timeMs !== undefined ? options.timeMs : DEFAULT_TIME_MS[level];
        const iterations = options.iterations !== undefined ? options.iterations : cfg.iterations;
        const deadline = options.deterministic ? Infinity : Date.now() + timeMs;
        const { ranked, iterations: iters } = mcts(s, iterations, deadline, rng);
        let pick = ranked[0];
        if (cfg.tactics) {
            // avoid handing the opponent an immediate game win when an alternative exists
            const safe = ranked.filter(ch => { const t = clone(s); play(t, ch.move); return winningMove(t, t.player) < 0; });
            if (safe.length) pick = safe[0];
        }
        const ev = pick.n ? (2 * pick.w / pick.n - 1) : 0;
        return done(pick.move, ev, iters);
    }

    function toPublic(s) {
        const boards = []; for (let b = 0; b < 9; b++) { const r = []; for (let i = 0; i < 9; i++) { const v = s.cells[b * 9 + i]; r.push(v === 1 ? 'X' : v === 2 ? 'O' : null); } boards.push(r); }
        return { boards, activeBoard: s.active < 0 ? null : s.active, currentPlayer: s.player === 1 ? 'X' : 'O' };
    }
    function emptyState() { return { boards: Array.from({ length: 9 }, () => Array(9).fill(null)), activeBoard: null, currentPlayer: 'X' }; }
    function legalMoves(state) { return moves(fromPublic(state), []).map(toMove); }
    function applyMove(state, move) {
        const s = fromPublic(state); const m = move.board * 9 + move.cell;
        if (moves(s, []).indexOf(m) < 0) throw new Error('Illegal move');
        play(s, m); return toPublic(s);
    }
    function result(state) { const r = fromPublic(state).result; return r === 1 ? 'X' : r === 2 ? 'O' : r === 3 ? 'draw' : null; }

    return { getMove, legalMoves, applyMove, result, emptyState, DIFFICULTY, _lineWinner: lineWinner };
});
