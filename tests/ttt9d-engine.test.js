const test = require('node:test');
const assert = require('node:assert');
const E = require('../Public/js/ai/ttt9d-engine.js');

function randomState(seed, plies) {
    let s = E.emptyState(); let r = seed;
    const rnd = () => ((r = (r * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (let k = 0; k < plies && !E.result(s); k++) { const ms = E.legalMoves(s); s = E.applyMove(s, ms[(rnd() * ms.length) | 0]); }
    return s;
}
const isLegal = (s, m) => E.legalMoves(s).some(x => x.board === m.board && x.cell === m.cell);

test('returns legal moves on many random positions, all difficulties', () => {
    for (let i = 0; i < 40; i++) {
        const s = randomState(i + 1, i % 30);
        if (E.result(s)) continue;
        for (const d of ['easy', 'medium', 'hard', 'expert']) {
            const r = E.getMove(s, d, { seed: i, timeMs: 30 });
            assert.ok(isLegal(s, r.move), `${d} illegal at ${i}`);
            assert.ok(r.eval >= -1 && r.eval <= 1);
        }
    }
});

test('respects activeBoard', () => {
    let s = E.applyMove(E.emptyState(), { board: 4, cell: 2 });
    assert.strictEqual(s.activeBoard, 2);
    for (let i = 0; i < 10; i++) assert.strictEqual(E.getMove(s, 'easy', { seed: i }).move.board, 2);
});

test('hard/expert never miss a win-in-1 (constructed + random positions)', () => {
    // X owns boards 0 and 1, board 2 has X at 0,1 ; X to move on board 2 -> cell 2 wins the game
    const s = E.emptyState();
    s.boards[0] = ['X','X','X',null,'O',null,'O',null,null];
    s.boards[1] = ['X','X','X','O',null,'O',null,null,null];
    s.boards[2] = ['X','X',null,'O','O',null,null,null,null];
    s.activeBoard = 2; s.currentPlayer = 'X';
    for (const d of ['hard', 'expert', 'medium']) {
        for (let seed = 0; seed < 20; seed++) {
            const r = E.getMove(s, d, { seed, timeMs: 20 });
            assert.deepStrictEqual(r.move, { board: 2, cell: 2 }, d);
            assert.strictEqual(r.eval, 1);
        }
    }
    let checked = 0;
    for (let i = 0; i < 400 && checked < 25; i++) {
        const st = randomState(1000 + i, 20 + (i % 40));
        if (E.result(st)) continue;
        const winners = E.legalMoves(st).filter(m => E.result(E.applyMove(st, m)) === st.currentPlayer);
        if (!winners.length) continue;
        checked++;
        const r = E.getMove(st, 'hard', { seed: i, timeMs: 20 });
        assert.ok(winners.some(w => w.board === r.move.board && w.cell === r.move.cell), 'missed win at ' + i);
    }
    assert.ok(checked > 5, 'found enough win-in-1 positions: ' + checked);
});

test('deterministic for same seed with fixed iterations', () => {
    const s = randomState(7, 10);
    const a = E.getMove(s, 'hard', { seed: 3, deterministic: true, iterations: 800 });
    const b = E.getMove(s, 'hard', { seed: 3, deterministic: true, iterations: 800 });
    assert.deepStrictEqual(a, b);
});

test('speed: default budgets stay within time caps', () => {
    const s = E.emptyState();
    for (const [d, cap] of [['easy', 300], ['medium', 600], ['hard', 1200], ['expert', 2500]]) {
        const t = Date.now(); E.getMove(s, d, { seed: 1 }); const dt = Date.now() - t;
        assert.ok(dt < cap, `${d} took ${dt}ms`);
    }
});

test('expert beats easy most of the time', () => {
    let wins = 0, losses = 0;
    for (let g = 0; g < 6; g++) {
        let s = E.emptyState(); const expertIs = g % 2 ? 'O' : 'X';
        while (!E.result(s)) {
            const d = s.currentPlayer === expertIs ? 'hard' : 'easy';
            s = E.applyMove(s, E.getMove(s, d, { seed: g * 100 + s.boards.flat().filter(Boolean).length, timeMs: 60 }).move);
        }
        const r = E.result(s); if (r === expertIs) wins++; else if (r !== 'draw') losses++;
    }
    assert.ok(wins > losses, `wins ${wins} losses ${losses}`);
});
