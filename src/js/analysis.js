const engine = new Worker('../engine/stockfish-17.1-lite-single-03e3232.js');

const bestEl = document.querySelector('.best_move');
const evalEl = document.querySelector('.eval');

function setBest(t) {
  if (bestEl) {
    bestEl.textContent = 'Best move: ' + t;
  }
}
function setEval(t) {
  if (evalEl) {
    evalEl.textContent = 'Evaluation: ' + t;
  }
}

function send(s) {
  engine.postMessage(s);
}

function getFEN() {
  if (window.__chess && typeof window.__chess.fen === 'function') {
    return window.__chess.fen();
  }
  return 'startpos';
}

let ready = false;
let analyzing = false;
let rerun = false;
let lastMs = 800;

engine.onmessage = function (e) {
  let line;
  if (typeof e.data === 'string') {
    line = e.data;
  } else if (e.data && typeof e.data.data === 'string') {
    line = e.data.data;
  } else {
    return;
  }

  if (line === 'uciok') {
    send('isready');
    return;
  }

  if (line === 'readyok') {
    if (!ready) {
      ready = true;
      analyze(900);
    }
    return;
  }

  if (line.indexOf('info ') === 0) {
    const mMate = line.match(/\bscore mate (-?\d+)/);
    if (mMate) {
      const nMate = Math.abs(parseInt(mMate[1], 10));
      setEval('mate in ' + nMate);
      return;
    }
    const mCp = line.match(/\bscore cp (-?\d+)/);
    if (mCp) {
      const cp = parseInt(mCp[1], 10);
      const pawns = (cp / 100).toFixed(2);
      if (cp >= 0) {
        setEval('+' + pawns);
      } else {
        setEval(pawns);
      }
      return;
    }
  }

  if (line.indexOf('bestmove') === 0) {
    analyzing = false;

    if (rerun) {
      rerun = false;
      analyze(lastMs);
      return;
    }

    const parts = line.split(' ');
    let best = '';
    if (parts.length > 1) {
      best = parts[1];
    }
    setBest(best);
    return;
  }
};

function init() {
  send('uci');
}

function startSearch(fen, ms) {
  analyzing = true;
  setBest('Analyzing…');
  setEval('');
  if (fen === 'startpos') {
    send('position startpos');
  } else {
    send('position fen ' + fen);
  }
  send('go movetime ' + ms);
}

function analyze(ms) {
  if (!ready) {
    return;
  }
  lastMs = ms || 800; 
  const fen = getFEN();

  if (analyzing) {
    rerun = true;
    send('stop');
    return;
  }

  startSearch(fen, lastMs);
}

window.addEventListener('DOMContentLoaded', function () {
  init();
  window.addEventListener('position-changed', function () {
    analyze(700);
  });
});
