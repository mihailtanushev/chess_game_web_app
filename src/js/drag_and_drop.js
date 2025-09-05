let dragged_piece = null;

const pieces = document.querySelectorAll('.piece');
pieces.forEach(piece =>{
    piece.draggable = true;
    piece.addEventListener('dragstart', () =>{
        dragged_piece = piece;
        piece.classList.add('dragged_piece');
    });
    piece.addEventListener('dragend', () =>{
        piece.classList.remove('dragged_piece')
    });
});


const squares = document.querySelectorAll('.square');
squares.forEach(square =>{
    square.addEventListener('dragover', e =>{
        e.preventDefault();
    });
   /* square.addEventListener('contextmenu', e => {
        e.preventDefault();
        square.classList.add('right_click');
    }) */
});

squares.forEach(square => {
    square.addEventListener('drop', e =>{
        e.preventDefault();
        if(dragged_piece){
            const existing_piece = square.querySelector('.piece');
            if(existing_piece && existing_piece !== dragged_piece){
                existing_piece.remove();
            }
            square.appendChild(dragged_piece);
            dragged_piece = null;
        };
    });
});

new Worker('../../engine/stockfish-17.1-lite-single-03e3232.js');