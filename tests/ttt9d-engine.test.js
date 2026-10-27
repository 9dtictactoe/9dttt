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

// ---- Next-board rule regression tests (human move -> AI must answer on the required board) ----
test('after human plays center of center on an empty board, every level answers on the center board', () => {
    const s = E.applyMove(E.emptyState(), { board: 4, cell: 4 });
    assert.strictEqual(s.activeBoard, 4);
    assert.strictEqual(s.currentPlayer, 'O');
    for (const d of ['easy', 'medium', 'hard', 'expert']) {
        for (let seed = 0; seed < 25; seed++) {
            const r = E.getMove(s, d, { seed, timeMs: 15 });
            assert.strictEqual(r.move.board, 4, `${d} seed ${seed} played board ${r.move.board}`);
        }
    }
});

test('every human cell sends the AI to the matching board (cell index == board index)', () => {
    for (let cell = 0; cell < 9; cell++) {
        const humanBoard = (cell + 1) % 9; // any board, just not always the target
        const s = E.applyMove(E.emptyState(), { board: humanBoard, cell });
        for (const d of ['easy', 'hard']) {
            const r = E.getMove(s, d, { seed: cell, timeMs: 15 });
            assert.strictEqual(r.move.board, cell, `cell ${cell} -> board ${r.move.board} (${d})`);
        }
    }
});

test('sent to a won board -> AI may play anywhere open (and never on the won board)', () => {
    // X wins the center board with its center cell, which sends O to that (now won) board.
    let s = E.emptyState();
    s.boards[4] = ['X', null, null, null, null, null, null, null, 'X'];
    s.boards[0] = ['O', null, null, null, null, null, null, null, null];
    s.boards[8] = ['O', null, null, null, null, null, null, null, null];
    s.currentPlayer = 'X'; s.activeBoard = 4;
    s = E.applyMove(s, { board: 4, cell: 4 });
    assert.strictEqual(s.activeBoard, null, 'won target board frees the next move');
    const legal = E.legalMoves(s);
    assert.ok(legal.every(m => m.board !== 4));
    assert.ok(new Set(legal.map(m => m.board)).size === 8);
    for (let seed = 0; seed < 10; seed++) assert.notStrictEqual(E.getMove(s, 'hard', { seed, timeMs: 15 }).move.board, 4);
});

test('sent to a full (drawn) board -> free move', () => {
    const s = E.emptyState();
    s.boards[2] = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X']; // drawn, no line
    s.boards[5] = ['O', null, null, null, null, null, null, null, null];
    s.currentPlayer = 'O'; s.activeBoard = 2;
    assert.ok(new Set(E.legalMoves(s).map(m => m.board)).size === 8);
});

test('random games: every AI reply obeys the board the previous move points to', () => {
    for (let g = 0; g < 20; g++) {
        let s = E.emptyState(); let r = g * 7919 + 1;
        const rnd = () => ((r = (r * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
        while (!E.result(s)) {
            const ms = E.legalMoves(s); const human = ms[(rnd() * ms.length) | 0];
            s = E.applyMove(s, human);
            if (E.result(s)) break;
            const target = human.cell;
            const targetOpen = !E._lineWinner(s.boards[target]) && s.boards[target].some(c => !c);
            const ai = E.getMove(s, ['easy', 'medium', 'hard'][g % 3], { seed: g, timeMs: 10 }).move;
            if (targetOpen) assert.strictEqual(ai.board, target, `game ${g}: sent to ${target}, AI played ${ai.board}`);
            else assert.ok(!E._lineWinner(s.boards[ai.board]) && s.boards[ai.board][ai.cell] === null);
            s = E.applyMove(s, ai);
        }
    }
});
