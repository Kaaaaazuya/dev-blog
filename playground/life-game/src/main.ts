import {
  type Board,
  countLiveCells,
  createBoard,
  getCell,
  randomBoard,
  setCell,
  step,
} from "./life";

const GRID_SIZE = 40;
const DENSITY = 0.25;

const canvas = document.querySelector<HTMLCanvasElement>("#board")!;
const ctx = canvas.getContext("2d")!;
const cellSize = canvas.width / GRID_SIZE;

const toggleButton = document.querySelector<HTMLButtonElement>("#toggle")!;
const stepButton = document.querySelector<HTMLButtonElement>("#step")!;
const randomButton = document.querySelector<HTMLButtonElement>("#random")!;
const clearButton = document.querySelector<HTMLButtonElement>("#clear")!;
const speedInput = document.querySelector<HTMLInputElement>("#speed")!;
const generationLabel = document.querySelector<HTMLSpanElement>("#gen")!;

let board: Board = randomBoard(GRID_SIZE, GRID_SIZE, DENSITY);
let generation = 0;
let running = false;
let lastTick = 0;

function draw(): void {
  ctx.fillStyle = "#0b0f14";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#4ade80";
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (getCell(board, x, y) === 1) {
        ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 1, cellSize - 1);
      }
    }
  }
}

function updateGenerationLabel(): void {
  generationLabel.textContent = `世代: ${generation} / 生存: ${countLiveCells(board)}`;
}

function advance(): void {
  board = step(board);
  generation += 1;
  updateGenerationLabel();
  draw();
}

function loop(timestamp: number): void {
  if (!running) return;
  const interval = 1000 / Number(speedInput.value);
  if (timestamp - lastTick >= interval) {
    advance();
    lastTick = timestamp;
  }
  requestAnimationFrame(loop);
}

toggleButton.addEventListener("click", () => {
  running = !running;
  toggleButton.textContent = running ? "⏸ 停止" : "▶ 再生";
  if (running) requestAnimationFrame(loop);
});

stepButton.addEventListener("click", () => advance());

randomButton.addEventListener("click", () => {
  board = randomBoard(GRID_SIZE, GRID_SIZE, DENSITY);
  generation = 0;
  updateGenerationLabel();
  draw();
});

clearButton.addEventListener("click", () => {
  board = createBoard(GRID_SIZE, GRID_SIZE);
  generation = 0;
  updateGenerationLabel();
  draw();
});

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(((event.clientX - rect.left) / rect.width) * GRID_SIZE);
  const y = Math.floor(((event.clientY - rect.top) / rect.height) * GRID_SIZE);
  setCell(board, x, y, getCell(board, x, y) === 0);
  draw();
});

updateGenerationLabel();
draw();
