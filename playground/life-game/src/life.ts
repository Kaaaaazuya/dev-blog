export interface Board {
  readonly width: number;
  readonly height: number;
  readonly cells: Uint8Array;
}

export function createBoard(width: number, height: number): Board {
  return { width, height, cells: new Uint8Array(width * height) };
}

function cellIndex(board: Board, x: number, y: number): number {
  const wrappedX = ((x % board.width) + board.width) % board.width;
  const wrappedY = ((y % board.height) + board.height) % board.height;
  return wrappedY * board.width + wrappedX;
}

export function getCell(board: Board, x: number, y: number): number {
  return board.cells[cellIndex(board, x, y)];
}

export function setCell(board: Board, x: number, y: number, alive: boolean): void {
  board.cells[cellIndex(board, x, y)] = alive ? 1 : 0;
}

function countLiveNeighbors(board: Board, x: number, y: number): number {
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      count += getCell(board, x + dx, y + dy);
    }
  }
  return count;
}

export function step(board: Board): Board {
  const next = new Uint8Array(board.cells.length);
  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      const alive = getCell(board, x, y) === 1;
      const neighbors = countLiveNeighbors(board, x, y);
      const willLive = alive ? neighbors === 2 || neighbors === 3 : neighbors === 3;
      next[y * board.width + x] = willLive ? 1 : 0;
    }
  }
  return { width: board.width, height: board.height, cells: next };
}

export function randomBoard(
  width: number,
  height: number,
  density = 0.3,
  rand: () => number = Math.random,
): Board {
  const board = createBoard(width, height);
  for (let i = 0; i < board.cells.length; i++) {
    board.cells[i] = rand() < density ? 1 : 0;
  }
  return board;
}

export function countLiveCells(board: Board): number {
  let count = 0;
  for (const cell of board.cells) count += cell;
  return count;
}
