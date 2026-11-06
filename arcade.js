const chessBoard = document.querySelector('#chess-board');
const chessStatus = document.querySelector('#chess-status');
const puzzles = [
  { pieces: { f6: 'K', g6: 'Q', h8: 'k' }, from: 'g6', mates: ['g7'] },
  { pieces: { f7: 'K', b2: 'R', g6: 'P', h8: 'k' }, from: 'b2', mates: ['b8', 'h2'] },
];
const pieces = { K: ['♔', 'White king'], Q: ['♕', 'White queen'], R: ['♖', 'White rook'],
  P: ['♙', 'White pawn'], k: ['♚', 'Black king'] };
const squares = new Map();
let puzzleIndex = 0;
let selected = '';
let position = {};
let solved = false;

function drawChess() {
  for (const [name, square] of squares) {
    const piece = pieces[position[name]];
    square.textContent = piece?.[0] ?? '';
    square.setAttribute('aria-label', piece ? name + ', ' + piece[1] : name + ', empty');
    square.setAttribute('aria-pressed', String(name === selected));
  }
}

function resetChess() {
  position = { ...puzzles[puzzleIndex].pieces };
  selected = '';
  solved = false;
  chessStatus.textContent = 'Puzzle ' + (puzzleIndex + 1) + ' of ' + puzzles.length + ' · White to move.';
  drawChess();
}

function chooseSquare(name) {
  if (solved) return;
  const piece = position[name];
  if (piece && piece === piece.toUpperCase()) {
    selected = selected === name ? '' : name;
    chessStatus.textContent = selected ? pieces[piece][1] + ' selected. Choose a destination.' : 'Select a White piece.';
  } else if (selected) {
    const puzzle = puzzles[puzzleIndex];
    if (selected === puzzle.from && puzzle.mates.includes(name)) {
      position[name] = position[selected];
      delete position[selected];
      solved = true;
      chessStatus.textContent = 'Checkmate! Try the next puzzle.';
    } else {
      chessStatus.textContent = 'That move does not solve the puzzle. Try another square.';
    }
    selected = '';
  } else {
    chessStatus.textContent = 'Select a White piece first.';
  }
  drawChess();
}

for (let rank = 8; rank >= 1; rank -= 1) {
  for (const [index, file] of [...'abcdefgh'].entries()) {
    const name = file + rank;
    const square = document.createElement('button');
    square.type = 'button';
    square.classList.toggle('dark', (rank + index) % 2 === 1);
    square.addEventListener('click', () => chooseSquare(name));
    squares.set(name, square);
    chessBoard.append(square);
  }
}
document.querySelector('#chess-next').addEventListener('click', () => {
  puzzleIndex = (puzzleIndex + 1) % puzzles.length;
  resetChess();
});
document.querySelector('#chess-reset').addEventListener('click', resetChess);
resetChess();

const snakeBoard = document.querySelector('#snake-board');
const context = snakeBoard.getContext('2d');
const snakeStart = document.querySelector('#snake-start');
const snakePause = document.querySelector('#snake-pause');
const snakeStatus = document.querySelector('#snake-status');
const snakeScore = document.querySelector('#snake-score');
const controls = [...document.querySelectorAll('[data-direction]')];
const directions = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] };
const keys = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right',
  w:'up', s:'down', a:'left', d:'right' };
const gridSize = 16;
const cell = snakeBoard.width / gridSize;
let snake = [];
let packetPosition = null;
let snakeDirection = directions.right;
let nextDirection = snakeDirection;
let timer = null;
let active = false;
let score = 0;

function same(first, second) {
  return first[0] === second[0] && first[1] === second[1];
}

function drawSnake() {
  context.fillStyle = '#191321';
  context.fillRect(0, 0, snakeBoard.width, snakeBoard.height);
  context.strokeStyle = '#30243b';
  context.beginPath();
  for (let i = 1; i < gridSize; i += 1) {
    const line = i * cell + .5;
    context.moveTo(line, 0); context.lineTo(line, snakeBoard.height);
    context.moveTo(0, line); context.lineTo(snakeBoard.width, line);
  }
  context.stroke();
  if (packetPosition) {
    context.fillStyle = '#ffb385';
    context.fillRect(packetPosition[0] * cell + 4, packetPosition[1] * cell + 4, cell - 8, cell - 8);
  }
  for (const [index, point] of snake.entries()) {
    context.fillStyle = index === 0 ? '#f1cdff' : '#8ad9c7';
    context.fillRect(point[0] * cell + 1, point[1] * cell + 1, cell - 2, cell - 2);
  }
}

function spawnPacket() {
  const empty = [];
  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const point = [x, y];
      if (!snake.some(part => same(part, point))) empty.push(point);
    }
  }
  return empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
}

function stopSnake() {
  clearInterval(timer);
  timer = null;
}

function finishSnake(message) {
  stopSnake();
  active = false;
  snakePause.disabled = true;
  snakeStatus.textContent = message + ' Score: ' + score + '.';
}

function tick() {
  snakeDirection = nextDirection;
  const head = [snake[0][0] + snakeDirection[0], snake[0][1] + snakeDirection[1]];
  const eats = same(head, packetPosition);
  const body = eats ? snake : snake.slice(0, -1);
  if (head.some(value => value < 0 || value >= gridSize) || body.some(part => same(part, head))) {
    finishSnake('Game over.');
    return;
  }
  snake.unshift(head);
  if (eats) {
    score += 1;
    snakeScore.textContent = score;
    packetPosition = spawnPacket();
    if (!packetPosition) finishSnake('You cleared the board!');
  } else {
    snake.pop();
  }
  drawSnake();
}

function steer(name) {
  const candidate = directions[name];
  if (timer !== null && candidate[0] * snakeDirection[0] + candidate[1] * snakeDirection[1] === 0) {
    nextDirection = candidate;
  }
}

if (context) {
  drawSnake();
  snakeStart.addEventListener('click', () => {
    stopSnake();
    snake = [[5,8],[4,8],[3,8]];
    snakeDirection = directions.right;
    nextDirection = snakeDirection;
    packetPosition = spawnPacket();
    score = 0;
    active = true;
    snakeScore.textContent = score;
    snakeStatus.textContent = 'Playing. Collect the orange packets.';
    snakePause.disabled = false;
    snakePause.textContent = 'Pause';
    snakeStart.textContent = 'Restart';
    drawSnake();
    snakeBoard.focus({ preventScroll: true });
    timer = setInterval(tick, 155);
  });

  function pauseSnake() {
    stopSnake();
    snakePause.textContent = 'Resume';
    snakeStatus.textContent = 'Paused.';
  }

  snakePause.addEventListener('click', () => {
    if (!active) return;
    if (timer !== null) {
      pauseSnake();
    } else {
      timer = setInterval(tick, 155);
      snakePause.textContent = 'Pause';
      snakeStatus.textContent = 'Playing. Collect the orange packets.';
      snakeBoard.focus({ preventScroll: true });
    }
  });
  snakeBoard.addEventListener('keydown', event => {
    const name = keys[event.key] ?? keys[event.key.toLowerCase()];
    if (!name || !active) return;
    event.preventDefault();
    steer(name);
  });
  for (const button of controls) {
    button.addEventListener('click', () => steer(button.dataset.direction));
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && timer !== null) pauseSnake();
  });
} else {
  snakeStart.disabled = true;
  snakeStatus.textContent = 'This browser does not support the Snake board.';
}
