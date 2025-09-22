import { Chess } from 'https://cdn.jsdelivr.net/npm/chess.js@1.0.0/+esm';
import { joinRoom, onOpponentMove, sendMove } from './multiplayer.js';

const game = new Chess();
window.__chess = game;

const IMG_BASE = '../img/chesspieces/wikipedia';

const PIECE_TO_FILE = {
  'p':'bP.png','r':'bR.png','n':'bN.png','b':'bB.png','q':'bQ.png','k':'bK.png',
  'P':'wP.png','R':'wR.png','N':'wN.png','B':'wB.png','Q':'wQ.png','K':'wK.png',
};


function render(fen){
    const position = fen.split(' ')[0];
    const ranks = position.split('/');
    const squares = document.querySelectorAll('.square');
    for(let i = 0; i < 64; i++){
        squares[i].innerHTML = '';
    }

    for(let i = 0; i < 8; i++){
        let rank = ranks[i];
        let empties = 0;
        
        for(let j = 0; j < rank.length; j++){
            if(rank[j] >= '1' && rank[j] <= '8'){
                empties += parseInt(rank[j], 10);
                continue;
            }

            if(empties > 7){
                continue;
            }
            
             let file_name = PIECE_TO_FILE[rank[j]];
             const square_index = i * 8 + empties;
             empties++;
             
             let img = document.createElement('img');
             img.className = 'piece';
             img.src = IMG_BASE + '/' + file_name;
             img.draggable = true;
             squares[square_index].appendChild(img);
        }
    }
}

render(game.fen());
window.__render = render;

const urlRoom = new URLSearchParams(location.search).get('room');
if (urlRoom) {
  joinRoom(urlRoom);
} else {
  const code = prompt('Enter room code for 1v1 (e.g., ABC123):');
  if (code) joinRoom(code.trim());
}

onOpponentMove((moveObj, fen) => {
  try {
    if (fen) {
      game.load(fen);
      render(fen);
      return;
    }
    if (moveObj) {
      game.move(moveObj);
      render(game.fen());
    }
  } catch (e) {
    console.warn('Move failed:', e);
  }
});


function is_piece(target){
    return target.classList.contains('piece');
}

let from = null;
let to = null;
const pieces = document.querySelectorAll('.piece');

document.addEventListener('dragstart', (e) =>{
    const target = e.target;
    if (!is_piece(target)){
        return;
    }

    const square = target.closest('.square');
    from = square.id;
});

document.addEventListener('dragend', () =>{
    from = null;
    to = null;
})

const squares = document.querySelectorAll('.square');

for(let i = 0; i < 64; i++){
    const square = squares[i];

    square.addEventListener('dragover',(e) =>{
        e.preventDefault();
    });

    square.addEventListener('drop', (e) =>{
        e.preventDefault();

        const to = square.id;

        if(!from || !to){
            return;
        }

        const move = game.move({from: from, to: to, promotion: 'q'});

        if(move){
            render(game.fen());
            sendMove({ from: from, to: to, promotion: 'q' }, game.fen());

            window.dispatchEvent(new CustomEvent('position-changed', {
                detail: {fen: game.fen(), lastMove:{from: from, to: to, promotion: 'q'}}
            }));
        }
        from = null;
    });
}

const chessboard = document.querySelector('.chessboard');
const player_white = document.querySelector('.player-white');
const player_black = document.querySelector('.player-black');
const flip_btn = document.querySelector('.flip-board');

flip_btn.addEventListener('click', () => {
     chessboard.classList.toggle('flipped');
     player_white.classList.toggle('flipped_player_white');
     player_black.classList.toggle('flipped_player_black');
});