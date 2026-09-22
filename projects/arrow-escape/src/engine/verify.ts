// Headless Engine Verification Suite
import { BoardModel, DEFAULT_LEVELS } from './BoardModel';
import { ArrowModel } from './ArrowModel';
import { OccupancyMap } from './OccupancyMap';
import { GameEngine } from './GameEngine';
import { getDirectionDelta, getDirectionAngle, isWithinBounds } from './Direction';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- Testing Direction Utilities ---');
assert(getDirectionDelta('right').dCol === 1 && getDirectionDelta('right').dRow === 0, 'Right delta');
assert(getDirectionDelta('up').dRow === -1 && getDirectionDelta('up').dCol === 0, 'Up delta');
assert(getDirectionAngle('right') === 0, 'Right angle 0');
assert(getDirectionAngle('up') === -90, 'Up angle -90');
assert(isWithinBounds({ row: 0, col: 0 }, 3, 3), 'Within bounds');
assert(!isWithinBounds({ row: 3, col: 0 }, 3, 3), 'Out of bounds');

console.log('--- Testing BoardModel & ArrowModel ---');
const board = new BoardModel(3, 3);
assert(board.totalCells === 9, 'Board cell count');
const arrow = new ArrowModel('a1', { row: 1, col: 0 }, 'left');
assert(arrow.isIdle, 'Arrow is idle');
const escapingArrow = arrow.withState('escaping');
assert(escapingArrow.isEscaping, 'Arrow is escaping');

console.log('--- Testing OccupancyMap & Raycasting ---');
const arrow1 = new ArrowModel('1', { row: 1, col: 0 }, 'left');
const arrow2 = new ArrowModel('2', { row: 1, col: 1 }, 'left');
const map = new OccupancyMap([arrow1, arrow2]);
assert(map.has(1, 0), 'Occupancy has (1,0)');
assert(map.has(1, 1), 'Occupancy has (1,1)');
assert(!map.has(0, 0), 'Occupancy does not have (0,0)');

// Arrow 1 points left towards border -> can escape!
const trace1 = map.traceEscape(arrow1, board);
assert(trace1.canEscape === true, 'Arrow 1 can escape left');

// Arrow 2 points left towards Arrow 1 -> blocked!
const trace2 = map.traceEscape(arrow2, board);
assert(trace2.canEscape === false, 'Arrow 2 is blocked');
assert(trace2.blocker?.id === '1', 'Blocked by arrow 1');

console.log('--- Testing GameEngine State Transitions ---');
const initial = GameEngine.createInitialState(DEFAULT_LEVELS[0]);
assert(initial.status === 'playing', 'Game status playing');
assert(initial.movesCount === 0, 'Moves count 0');

// Tap arrow 1-1 (row 1, col 0, points left) -> success!
const { nextState: s1, result: r1 } = GameEngine.executeTap(initial, '1-1');
assert(r1.success === true, 'Tap 1-1 succeeds');
assert(s1.movesCount === 1, 'Moves count incremented to 1');

// Finalize escape of 1-1
const s2 = GameEngine.finalizeEscape(s1, '1-1');

// Now 1-2 (row 1, col 1, points left) is unblocked!
const { nextState: s3, result: r2 } = GameEngine.executeTap(s2, '1-2');
assert(r2.success === true, 'Tap 1-2 succeeds after 1-1 escaped');

const s4 = GameEngine.finalizeEscape(s3, '1-2');

// Finally tap 1-3
const { nextState: s5, result: r3 } = GameEngine.executeTap(s4, '1-3');
assert(r3.success === true, 'Tap 1-3 succeeds');
const s6 = GameEngine.finalizeEscape(s5, '1-3');
assert(s6.status === 'won', 'Game won when all arrows escaped');

console.log('All engine unit verification assertions passed successfully!');
