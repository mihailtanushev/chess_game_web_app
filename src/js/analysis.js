// ======== Stockfish (WASM) hookup ========

// Path to the engine from /src/html/quick_analysis.html
const STOCKFISH_PATH = '../../engine/stockfish-17.1-lite-single-03e3232.js';

// Create the worker
const engine = new Worker(STOCKFISH_PATH);

// UI elements
const logEl = document.getElementById('sf-log');
const bestEl = document.getElementById('bestmove');
const analyzeBtn = document.getElementById('analyze-btn');

// Small helpers
function log(line) {
  console.log('[SF]', line);
}
function send(cmd) {
  log('> ' + cmd);
  engine.postMessage(cmd);
}

// Receive messages from the engine
engine.onmessage = (e) => {
  const line = typeof e.data === 'string' ? e.data : (e.data?.data ?? '');
  if (!line) return;
  log(line);

  // Parse "bestmove"
  if (line.startsWith('bestmove ')) {
    const best = line.split(' ')[1];
    if (bestEl) bestEl.textContent = `Best move: ${best}`;
  }

  // Optional: show simple eval as it searches
  // Look for: info depth ... score cp X or score mate Y
  if (line.startsWith('info ')) {
    const mMate = line.match(/\bscore mate (-?\d+)/);
    const mCp   = line.match(/\bscore cp (-?\d+)/);
    if (mMate) {
      const mateIn = parseInt(mMate[1], 10);
      bestEl.textContent = `Eval: mate in ${mateIn}`;
    } else if (mCp) {
      const centipawns = parseInt(mCp[1], 10);
      const pawns = (centipawns / 100).toFixed(2);
      bestEl.textContent = `Eval: ${pawns}`;
    }
  }
};

// UCI handshake: tell engine who we are, wait for "uciok", then "isready" → "readyok"
async function initUCI() {
  await new Promise((resolve) => {
    let sawUciOk = false;
    const handler = (e) => {
      const line = typeof e.data === 'string' ? e.data : (e.data?.data ?? '');
      if (!line) return;
      if (line === 'uciok') {
        sawUciOk = true;
        send('isready');
      } else if (sawUciOk && line === 'readyok') {
        engine.removeEventListener('message', handler);
        resolve();
      }
    };
    engine.addEventListener('message', handler);
    send('uci');           // identify as UCI engine
    // (Optional) set some options here, e.g. Threads:
    // send('setoption name Threads value 2');
  });
}

// Build FEN from your DOM board.
// Assumptions:
//  - Each square div has class "square" and contains 0/1 <img class="piece">.
//  - Image file names end with ".../wP.png", ".../bQ.png", etc.
function currentBoardFEN() {
  const rows = document.querySelectorAll('.chessboard .row');
  if (!rows || rows.length !== 8) {
    // Fallback: start position FEN
    return 'rnbrkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBRKBNR w - - 0 1'; // (Your initial DOM is the real start position; this is just a guard.)
  }

  const fenRows = [];
  rows.forEach(row => {
    const squares = row.querySelectorAll('.square');
    let empties = 0;
    let fenRow = '';
    squares.forEach(square => {
      const img = square.querySelector('img.piece');
      if (!img) {
        empties++;
      } else {
        if (empties > 0) {
          fenRow += String(empties);
          empties = 0;
        }
        // Map from filename tail ".../wP.png" or ".../bN.png" → FEN letter
        const m = img.src.match(/\/([wb])([KQRBNP])\.png$/);
        if (m) {
          const color = m[1];     // 'w' or 'b'
          const piece = m[2];     // 'K','Q','R','B','N','P'
          const table = { K:'k', Q:'q', R:'r', B:'b', N:'n', P:'p' };
          let p = table[piece];   // lowercase by default
          if (color === 'w') p = p.toUpperCase();
          fenRow += p;
        } else {
          empties++; // if unexpected, count it as empty
        }
      }
    });
    if (empties > 0) fenRow += String(empties);
    fenRows.push(fenRow);
  });

  const placement = fenRows.join('/');
  // We don’t track side-to-move/castling/ep/half/full accurately yet.
  // Using "w - - 0 1" is okay for analysis.
  return `${placement} w - - 0 1`;
}

// Ask Stockfish to analyze the current board for N milliseconds.
function analyze(ms = 1000) {
  const fen = (window.__chess && typeof window.__chess.fen === 'function')
    ? window.__chess.fen()
    : currentBoardFEN(); // fallback if chess.js isn't loaded
  send(`position fen ${fen}`);
  send(`go movetime ${ms}`);
}

window.addEventListener('position-changed', () => analyze(1000));
// Wire up
window.addEventListener('DOMContentLoaded', async () => {
  log('Starting UCI handshake…');
  await initUCI();
  log('Engine is ready.');
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', () => analyze(1500));
  }
});
