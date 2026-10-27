// Headless check (Playwright): play center-of-center vs each AI level and inject an illegal AI move.
// Usage: serve Public/ (e.g. python3 -m http.server 8766 -d Public) then BASE=http://localhost:8766 node tests/e2e/ttt9d-next-board.e2e.js
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); const errs=[], warns=[]; p.on('pageerror', e=>errs.push(e.message)); p.on('console', m=>{ if(m.type()==='warning') warns.push(m.text().slice(0,100)); });
 await p.addInitScript(() => localStorage.setItem('tutorial_ultimate-tictactoe-intro_completed','true'));
 await p.goto((process.env.BASE || 'http://localhost:8766') + '/games/ultimate-tictactoe.html'); await p.waitForTimeout(1500);
 const out = {};
 for (const d of ['easy','hard','expert']) {
   await p.selectOption('#ai-mode-select', d);
   await p.click('.cell[data-board="4"][data-cell="4"]', { force: true });
   await p.waitForFunction(() => currentGame.currentPlayer === 'X' && !currentGame.aiThinking, null, {timeout: 10000});
   out['center_'+d] = await p.evaluate(() => { const o=[]; currentGame.boards.forEach((bd,b)=>bd.cells.forEach((c,i)=>{ if(c==='O') o.push([b,i]); })); return { aiMoves: o, activeNow: currentGame.activeBoard, lastMoveEl: document.querySelector('.cell.last-move')?.dataset.board, worker: TTT9DAI._usingWorker() }; });
 }
 // illegal AI result injection
 await p.selectOption('#ai-mode-select', 'hard');
 await p.evaluate(() => { window.__orig = TTT9DAI.getAIMove; TTT9DAI.getAIMove = async () => ({ move: { board: 6, cell: 0 }, eval: 0, source: 'fake' }); });
 await p.click('.cell[data-board="4"][data-cell="4"]', { force: true });
 await p.waitForFunction(() => currentGame.currentPlayer === 'X' && !currentGame.aiThinking, null, {timeout: 10000});
 out.injectedIllegal = await p.evaluate(() => { const o=[]; currentGame.boards.forEach((bd,b)=>bd.cells.forEach((c,i)=>{ if(c==='O') o.push([b,i]); })); return o; });
 console.log(JSON.stringify(out), JSON.stringify({warns, errs})); await b.close(); })();
