import { describe, expect, it } from "vitest";
import { createBoard, countLiveCells, getCell, randomBoard, setCell, step } from "./life";

describe("step", () => {
  it("keeps a 2x2 block stable (still life)", () => {
    const board = createBoard(6, 6);
    setCell(board, 2, 2, true);
    setCell(board, 3, 2, true);
    setCell(board, 2, 3, true);
    setCell(board, 3, 3, true);

    const next = step(board);

    expect(countLiveCells(next)).toBe(4);
    expect(getCell(next, 2, 2)).toBe(1);
    expect(getCell(next, 3, 2)).toBe(1);
    expect(getCell(next, 2, 3)).toBe(1);
    expect(getCell(next, 3, 3)).toBe(1);
  });

  it("oscillates a blinker with period 2", () => {
    const board = createBoard(5, 5);
    setCell(board, 1, 2, true);
    setCell(board, 2, 2, true);
    setCell(board, 3, 2, true);

    const gen1 = step(board);
    expect(countLiveCells(gen1)).toBe(3);
    expect(getCell(gen1, 2, 1)).toBe(1);
    expect(getCell(gen1, 2, 2)).toBe(1);
    expect(getCell(gen1, 2, 3)).toBe(1);

    const gen2 = step(gen1);
    expect(countLiveCells(gen2)).toBe(3);
    expect(getCell(gen2, 1, 2)).toBe(1);
    expect(getCell(gen2, 2, 2)).toBe(1);
    expect(getCell(gen2, 3, 2)).toBe(1);
  });

  it("kills a lone live cell from underpopulation", () => {
    const board = createBoard(4, 4);
    setCell(board, 1, 1, true);

    const next = step(board);

    expect(countLiveCells(next)).toBe(0);
  });

  it("revives a dead cell with exactly three live neighbors", () => {
    const board = createBoard(4, 4);
    setCell(board, 0, 0, true);
    setCell(board, 1, 0, true);
    setCell(board, 0, 1, true);

    const next = step(board);

    expect(getCell(next, 1, 1)).toBe(1);
  });

  it("translates a glider diagonally by (1,1) after 4 generations", () => {
    let board = createBoard(20, 20);
    setCell(board, 1, 0, true);
    setCell(board, 2, 1, true);
    setCell(board, 0, 2, true);
    setCell(board, 1, 2, true);
    setCell(board, 2, 2, true);

    for (let i = 0; i < 4; i++) board = step(board);

    expect(countLiveCells(board)).toBe(5);
    expect(getCell(board, 2, 1)).toBe(1);
    expect(getCell(board, 3, 2)).toBe(1);
    expect(getCell(board, 1, 3)).toBe(1);
    expect(getCell(board, 2, 3)).toBe(1);
    expect(getCell(board, 3, 3)).toBe(1);
  });
});

describe("randomBoard", () => {
  it("uses the injected rand function to decide liveness", () => {
    let calls = 0;
    const rand = () => (calls++ % 2 === 0 ? 0 : 1);

    const board = randomBoard(2, 2, 0.5, rand);

    expect(countLiveCells(board)).toBe(2);
  });
});
