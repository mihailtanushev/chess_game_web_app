// Use ESM build of chess.js from a CDN
import { Chess } from 'https://cdn.jsdelivr.net/npm/chess.js@1.0.0/+esm';

// Single game instance; expose it so analysis.js can read its FEN
const game = new Chess();
window.__chess = game; // (read-only use in analysis.js)

// Image base relative to quick_analysis.html
const IMG_BASE = '../../img/chesspieces/wikipedia';

// Map FEN characters to your image filenames
const PIECE_TO_FILE = {
  'p': 'bP.png', 'r': 'bR.png', 'n': 'bN.png', 'b': 'bB.png', 'q': 'bQ.png', 'k': 'bK.png',
  'P': 'wP.png', 'R': 'wR.png', 'N': 'wN.png', 'B': 'wB.png', 'Q': 'wQ.png', 'K': 'wK.png',
};

// Render the entire board from a FEN (safe for castling, captures, promotion, en-passant)
function render(fen) {
  const placement = fen.split(' ')[0];      // 'rnbqkbnr/pppppppp/8/...'
  const ranks = placement.split('/');       // rank8 -> rank1
  // clear all squares
  document.querySelectorAll('.square').forEach(sq => (sq.innerHTML = ''));

  const files = ['a','b','c','d','e','f','g','h'];
  for (let r = 0; r < 8; r++) {
    let fileIdx = 0;
    for (const ch of ranks[r]) {
      if (/\d/.test(ch)) {                  // number = that many empty squares
        fileIdx += parseInt(ch, 10);
        continue;
      }
      // place the piece
      const file = files[fileIdx++];
      const rank = 8 - r;                   // FEN rank 8..1
      const id = `${file}${rank}`;          // e.g., 'e2'
      const sq = document.getElementById(id);
      if (!sq) continue;

      const img = document.createElement('img');
      img.className = 'piece';
      img.src = `${IMG_BASE}/${PIECE_TO_FILE[ch]}`;
      img.draggable = true;                 // enable drag
      sq.appendChild(img);
    }
  }
}

// Initial draw
render(game.fen());

// Drag & drop (legal-move checked by chess.js)
let dragFrom = null;

// Start dragging: remember the source square (like 'e2')
document.addEventListener('dragstart', (e) => {
  const piece = e.target.closest('img.piece');
  if (!piece) return;
  const sq = piece.closest('.square');
  if (!sq) return;

  dragFrom = sq.id;
  e.dataTransfer.setData('text/plain', dragFrom); // backup
});

// Allow dropping on board squares
document.querySelectorAll('.square').forEach((sq) => {
  sq.addEventListener('dragover', (e) => e.preventDefault());

  sq.addEventListener('drop', (e) => {
    e.preventDefault();
    const from = dragFrom || e.dataTransfer.getData('text/plain');
    const to = sq.id;

    // Try to make the move; chess.js enforces ALL rules.
    // Autopromote to queen for now (simple demo).
    const move = game.move({ from, to, promotion: 'q' });

    if (move) {
      // Legal move → re-render from true game state
      render(game.fen());

      // Tell the rest of the app (analysis.js) that the position changed
      window.dispatchEvent(new CustomEvent('position-changed', { detail: { fen: game.fen() } }));
    } else {
      // Illegal → do nothing (the old position remains shown)
      // Optional: add a quick visual shake here
    }
    dragFrom = null;
  });
});
