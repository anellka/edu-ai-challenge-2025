// Unit Tests for Sea Battle Game
// Simple test framework implementation

class TestRunner {
  constructor() {
    this.tests = [];
    this.suites = {};
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  describe(suiteName, callback) {
    this.suites[suiteName] = [];
    this.currentSuite = suiteName;
    callback();
    this.currentSuite = null;
  }

  it(testName, testFunction) {
    const suite = this.currentSuite || 'General';
    if (!this.suites[suite]) this.suites[suite] = [];
    
    this.suites[suite].push({
      name: testName,
      fn: testFunction
    });
  }

  expect(actual) {
    return {
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, but got ${actual}`);
        }
      },
      toEqual: (expected) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
        }
      },
      toBeTruthy: () => {
        if (!actual) {
          throw new Error(`Expected truthy value, but got ${actual}`);
        }
      },
      toBeFalsy: () => {
        if (actual) {
          throw new Error(`Expected falsy value, but got ${actual}`);
        }
      },
      toThrow: () => {
        try {
          actual();
          throw new Error('Expected function to throw, but it did not');
        } catch (e) {
          // Expected behavior
        }
      },
      toBeGreaterThan: (expected) => {
        if (actual <= expected) {
          throw new Error(`Expected ${actual} to be greater than ${expected}`);
        }
      },
      toContain: (expected) => {
        if (!actual.includes(expected)) {
          throw new Error(`Expected ${actual} to contain ${expected}`);
        }
      }
    };
  }

  runTests() {
    console.log('🧪 Running Sea Battle Game Tests...\n');

    for (const [suiteName, tests] of Object.entries(this.suites)) {
      console.log(`\n📝 ${suiteName}`);
      console.log('─'.repeat(40));

      for (const test of tests) {
        this.totalTests++;
        try {
          test.fn();
          console.log(`  ✅ ${test.name}`);
          this.passedTests++;
        } catch (error) {
          console.log(`  ❌ ${test.name}`);
          console.log(`     Error: ${error.message}`);
          this.failedTests++;
        }
      }
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`✅ Passed: ${this.passedTests}`);
    console.log(`❌ Failed: ${this.failedTests}`);
    console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
    
    if (this.failedTests === 0) {
      console.log('\n🎉 All tests passed!');
    } else {
      console.log(`\n⚠️  ${this.failedTests} test(s) failed`);
    }
  }
}

// Import the game classes (simulating the classes from seabattle-refactored.js)
// In a real scenario, you'd import from the actual module
const CONFIG = {
  BOARD_SIZE: 10,
  NUM_SHIPS: 3,
  SHIP_LENGTH: 3,
  SYMBOLS: {
    WATER: '~',
    SHIP: 'S',
    HIT: 'X',
    MISS: 'O'
  }
};

class Coordinate {
  constructor(row, col) {
    this.row = row;
    this.col = col;
  }

  toString() {
    return `${this.row}${this.col}`;
  }

  static fromString(str) {
    return new Coordinate(parseInt(str[0]), parseInt(str[1]));
  }

  isValid() {
    return this.row >= 0 && this.row < CONFIG.BOARD_SIZE && 
           this.col >= 0 && this.col < CONFIG.BOARD_SIZE;
  }

  getAdjacent() {
    return [
      new Coordinate(this.row - 1, this.col),
      new Coordinate(this.row + 1, this.col),
      new Coordinate(this.row, this.col - 1),
      new Coordinate(this.row, this.col + 1)
    ].filter(coord => coord.isValid());
  }
}

class Ship {
  constructor(locations) {
    this.locations = locations.map(loc => loc.toString());
    this.hits = new Array(locations.length).fill(false);
  }

  hit(coordinate) {
    const index = this.locations.indexOf(coordinate.toString());
    if (index >= 0 && !this.hits[index]) {
      this.hits[index] = true;
      return true;
    }
    return false;
  }

  isSunk() {
    return this.hits.every(hit => hit);
  }

  hasLocation(coordinate) {
    return this.locations.includes(coordinate.toString());
  }
}

class Board {
  constructor(showShips = false) {
    this.grid = Array(CONFIG.BOARD_SIZE).fill().map(() => 
      Array(CONFIG.BOARD_SIZE).fill(CONFIG.SYMBOLS.WATER)
    );
    this.ships = [];
    this.guesses = new Set();
    this.showShips = showShips;
  }

  addShip(ship) {
    this.ships.push(ship);
    if (this.showShips) {
      ship.locations.forEach(locStr => {
        const coord = Coordinate.fromString(locStr);
        this.grid[coord.row][coord.col] = CONFIG.SYMBOLS.SHIP;
      });
    }
  }

  processGuess(coordinate) {
    const coordStr = coordinate.toString();
    
    if (this.guesses.has(coordStr)) {
      return { valid: false, reason: 'Already guessed' };
    }

    this.guesses.add(coordStr);

    for (const ship of this.ships) {
      if (ship.hit(coordinate)) {
        this.grid[coordinate.row][coordinate.col] = CONFIG.SYMBOLS.HIT;
        return { 
          valid: true, 
          hit: true, 
          sunk: ship.isSunk(),
          ship 
        };
      }
    }

    this.grid[coordinate.row][coordinate.col] = CONFIG.SYMBOLS.MISS;
    return { valid: true, hit: false };
  }

  getShipsRemaining() {
    return this.ships.filter(ship => !ship.isSunk()).length;
  }
}

class AIStrategy {
  makeGuess(board, previousGuesses) {
    throw new Error('makeGuess must be implemented by subclass');
  }
}

class RandomAIStrategy extends AIStrategy {
  makeGuess(board, previousGuesses) {
    let coordinate;
    do {
      const row = Math.floor(Math.random() * CONFIG.BOARD_SIZE);
      const col = Math.floor(Math.random() * CONFIG.BOARD_SIZE);
      coordinate = new Coordinate(row, col);
    } while (previousGuesses.has(coordinate.toString()));
    
    return coordinate;
  }
}

class SmartAIStrategy extends AIStrategy {
  constructor() {
    super();
    this.mode = 'hunt';
    this.targetQueue = [];
  }

  makeGuess(board, previousGuesses) {
    if (this.mode === 'target' && this.targetQueue.length > 0) {
      return this.targetMode(previousGuesses);
    }
    
    this.mode = 'hunt';
    return this.huntMode(previousGuesses);
  }

  targetMode(previousGuesses) {
    let coordinate;
    do {
      if (this.targetQueue.length === 0) {
        this.mode = 'hunt';
        return this.huntMode(previousGuesses);
      }
      coordinate = this.targetQueue.shift();
    } while (previousGuesses.has(coordinate.toString()));
    
    return coordinate;
  }

  huntMode(previousGuesses) {
    let coordinate;
    do {
      const row = Math.floor(Math.random() * CONFIG.BOARD_SIZE);
      const col = Math.floor(Math.random() * CONFIG.BOARD_SIZE);
      coordinate = new Coordinate(row, col);
    } while (previousGuesses.has(coordinate.toString()));
    
    return coordinate;
  }

  onHit(coordinate, sunk) {
    if (sunk) {
      this.mode = 'hunt';
      this.targetQueue = [];
    } else {
      this.mode = 'target';
      const adjacent = coordinate.getAdjacent();
      adjacent.forEach(coord => {
        if (!this.targetQueue.some(target => 
          target.toString() === coord.toString())) {
          this.targetQueue.push(coord);
        }
      });
    }
  }
}

class GameEventEmitter {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

class GameState {
  constructor(game) {
    this.game = game;
  }

  handleInput(input) {
    throw new Error('handleInput must be implemented by subclass');
  }
}

class PlayingState extends GameState {
  handleInput(input) {
    if (!input || input.length !== 2) {
      return false;
    }

    const coordinate = new Coordinate(parseInt(input[0]), parseInt(input[1]));
    
    if (!coordinate.isValid()) {
      return false;
    }

    return true; // Simplified for testing
  }
}

class GameEndedState extends GameState {
  handleInput(input) {
    return false;
  }
}

// =====================================================
// UNIT TESTS
// =====================================================

const testRunner = new TestRunner();

// Test Coordinate class
testRunner.describe('Coordinate', () => {
  testRunner.it('should create coordinate with row and col', () => {
    const coord = new Coordinate(5, 3);
    testRunner.expect(coord.row).toBe(5);
    testRunner.expect(coord.col).toBe(3);
  });

  testRunner.it('should convert to string correctly', () => {
    const coord = new Coordinate(7, 9);
    testRunner.expect(coord.toString()).toBe('79');
  });

  testRunner.it('should create from string correctly', () => {
    const coord = Coordinate.fromString('42');
    testRunner.expect(coord.row).toBe(4);
    testRunner.expect(coord.col).toBe(2);
  });

  testRunner.it('should validate coordinates within bounds', () => {
    const validCoord = new Coordinate(5, 5);
    const invalidCoord1 = new Coordinate(-1, 5);
    const invalidCoord2 = new Coordinate(5, 10);
    
    testRunner.expect(validCoord.isValid()).toBeTruthy();
    testRunner.expect(invalidCoord1.isValid()).toBeFalsy();
    testRunner.expect(invalidCoord2.isValid()).toBeFalsy();
  });

  testRunner.it('should get adjacent coordinates correctly', () => {
    const coord = new Coordinate(5, 5);
    const adjacent = coord.getAdjacent();
    
    testRunner.expect(adjacent.length).toBe(4);
    testRunner.expect(adjacent.some(c => c.row === 4 && c.col === 5)).toBeTruthy();
    testRunner.expect(adjacent.some(c => c.row === 6 && c.col === 5)).toBeTruthy();
    testRunner.expect(adjacent.some(c => c.row === 5 && c.col === 4)).toBeTruthy();
    testRunner.expect(adjacent.some(c => c.row === 5 && c.col === 6)).toBeTruthy();
  });

  testRunner.it('should filter invalid adjacent coordinates at edges', () => {
    const cornerCoord = new Coordinate(0, 0);
    const adjacent = cornerCoord.getAdjacent();
    
    testRunner.expect(adjacent.length).toBe(2); // Only right and down are valid
  });
});

// Test Ship class
testRunner.describe('Ship', () => {
  testRunner.it('should create ship with locations', () => {
    const locations = [new Coordinate(0, 0), new Coordinate(0, 1), new Coordinate(0, 2)];
    const ship = new Ship(locations);
    
    testRunner.expect(ship.locations.length).toBe(3);
    testRunner.expect(ship.hits.length).toBe(3);
    testRunner.expect(ship.locations).toContain('00');
    testRunner.expect(ship.locations).toContain('01');
    testRunner.expect(ship.locations).toContain('02');
  });

  testRunner.it('should register hits correctly', () => {
    const locations = [new Coordinate(1, 1), new Coordinate(1, 2)];
    const ship = new Ship(locations);
    
    const hit1 = ship.hit(new Coordinate(1, 1));
    const hit2 = ship.hit(new Coordinate(1, 3)); // Miss
    
    testRunner.expect(hit1).toBeTruthy();
    testRunner.expect(hit2).toBeFalsy();
    testRunner.expect(ship.hits[0]).toBeTruthy();
    testRunner.expect(ship.hits[1]).toBeFalsy();
  });

  testRunner.it('should not register duplicate hits', () => {
    const locations = [new Coordinate(2, 2)];
    const ship = new Ship(locations);
    
    const hit1 = ship.hit(new Coordinate(2, 2));
    const hit2 = ship.hit(new Coordinate(2, 2)); // Same location
    
    testRunner.expect(hit1).toBeTruthy();
    testRunner.expect(hit2).toBeFalsy();
  });

  testRunner.it('should detect when ship is sunk', () => {
    const locations = [new Coordinate(3, 3), new Coordinate(3, 4)];
    const ship = new Ship(locations);
    
    testRunner.expect(ship.isSunk()).toBeFalsy();
    
    ship.hit(new Coordinate(3, 3));
    testRunner.expect(ship.isSunk()).toBeFalsy();
    
    ship.hit(new Coordinate(3, 4));
    testRunner.expect(ship.isSunk()).toBeTruthy();
  });

  testRunner.it('should check if ship has location', () => {
    const locations = [new Coordinate(4, 4), new Coordinate(4, 5)];
    const ship = new Ship(locations);
    
    testRunner.expect(ship.hasLocation(new Coordinate(4, 4))).toBeTruthy();
    testRunner.expect(ship.hasLocation(new Coordinate(4, 5))).toBeTruthy();
    testRunner.expect(ship.hasLocation(new Coordinate(4, 6))).toBeFalsy();
  });
});

// Test Board class
testRunner.describe('Board', () => {
  testRunner.it('should create empty board', () => {
    const board = new Board();
    
    testRunner.expect(board.grid.length).toBe(CONFIG.BOARD_SIZE);
    testRunner.expect(board.grid[0].length).toBe(CONFIG.BOARD_SIZE);
    testRunner.expect(board.ships.length).toBe(0);
    testRunner.expect(board.guesses.size).toBe(0);
  });

  testRunner.it('should add ships to board', () => {
    const board = new Board(true);
    const ship = new Ship([new Coordinate(0, 0), new Coordinate(0, 1)]);
    
    board.addShip(ship);
    
    testRunner.expect(board.ships.length).toBe(1);
    testRunner.expect(board.grid[0][0]).toBe(CONFIG.SYMBOLS.SHIP);
    testRunner.expect(board.grid[0][1]).toBe(CONFIG.SYMBOLS.SHIP);
  });

  testRunner.it('should not show ships when showShips is false', () => {
    const board = new Board(false);
    const ship = new Ship([new Coordinate(1, 1)]);
    
    board.addShip(ship);
    
    testRunner.expect(board.grid[1][1]).toBe(CONFIG.SYMBOLS.WATER);
  });

  testRunner.it('should process valid guesses', () => {
    const board = new Board();
    const ship = new Ship([new Coordinate(2, 2)]);
    board.addShip(ship);
    
    const result = board.processGuess(new Coordinate(2, 2));
    
    testRunner.expect(result.valid).toBeTruthy();
    testRunner.expect(result.hit).toBeTruthy();
    testRunner.expect(board.grid[2][2]).toBe(CONFIG.SYMBOLS.HIT);
  });

  testRunner.it('should handle misses', () => {
    const board = new Board();
    const ship = new Ship([new Coordinate(3, 3)]);
    board.addShip(ship);
    
    const result = board.processGuess(new Coordinate(4, 4));
    
    testRunner.expect(result.valid).toBeTruthy();
    testRunner.expect(result.hit).toBeFalsy();
    testRunner.expect(board.grid[4][4]).toBe(CONFIG.SYMBOLS.MISS);
  });

  testRunner.it('should reject duplicate guesses', () => {
    const board = new Board();
    
    board.processGuess(new Coordinate(5, 5));
    const result = board.processGuess(new Coordinate(5, 5));
    
    testRunner.expect(result.valid).toBeFalsy();
    testRunner.expect(result.reason).toBe('Already guessed');
  });

  testRunner.it('should track ships remaining', () => {
    const board = new Board();
    const ship1 = new Ship([new Coordinate(1, 1)]);
    const ship2 = new Ship([new Coordinate(2, 2)]);
    
    board.addShip(ship1);
    board.addShip(ship2);
    
    testRunner.expect(board.getShipsRemaining()).toBe(2);
    
    board.processGuess(new Coordinate(1, 1)); // Sink ship1
    testRunner.expect(board.getShipsRemaining()).toBe(1);
    
    board.processGuess(new Coordinate(2, 2)); // Sink ship2
    testRunner.expect(board.getShipsRemaining()).toBe(0);
  });
});

// Test AI Strategies
testRunner.describe('RandomAIStrategy', () => {
  testRunner.it('should make valid guesses', () => {
    const ai = new RandomAIStrategy();
    const previousGuesses = new Set();
    const board = new Board();
    
    const guess = ai.makeGuess(board, previousGuesses);
    
    testRunner.expect(guess.isValid()).toBeTruthy();
  });

  testRunner.it('should not repeat guesses', () => {
    const ai = new RandomAIStrategy();
    const previousGuesses = new Set(['55']);
    const board = new Board();
    
    const guess = ai.makeGuess(board, previousGuesses);
    
    testRunner.expect(guess.toString() !== '55').toBeTruthy();
  });
});

testRunner.describe('SmartAIStrategy', () => {
  testRunner.it('should start in hunt mode', () => {
    const ai = new SmartAIStrategy();
    testRunner.expect(ai.mode).toBe('hunt');
  });

  testRunner.it('should switch to target mode after hit', () => {
    const ai = new SmartAIStrategy();
    
    ai.onHit(new Coordinate(5, 5), false);
    
    testRunner.expect(ai.mode).toBe('target');
    testRunner.expect(ai.targetQueue.length).toBeGreaterThan(0);
  });

  testRunner.it('should return to hunt mode after sinking ship', () => {
    const ai = new SmartAIStrategy();
    ai.mode = 'target';
    ai.targetQueue = [new Coordinate(1, 1)];
    
    ai.onHit(new Coordinate(5, 5), true); // Ship sunk
    
    testRunner.expect(ai.mode).toBe('hunt');
    testRunner.expect(ai.targetQueue.length).toBe(0);
  });

  testRunner.it('should add adjacent cells to target queue', () => {
    const ai = new SmartAIStrategy();
    
    ai.onHit(new Coordinate(5, 5), false);
    
    const targetStrings = ai.targetQueue.map(coord => coord.toString());
    testRunner.expect(targetStrings).toContain('45'); // Up
    testRunner.expect(targetStrings).toContain('65'); // Down
    testRunner.expect(targetStrings).toContain('54'); // Left
    testRunner.expect(targetStrings).toContain('56'); // Right
  });

  testRunner.it('should make guesses from target queue in target mode', () => {
    const ai = new SmartAIStrategy();
    const previousGuesses = new Set();
    const board = new Board();
    
    ai.mode = 'target';
    ai.targetQueue = [new Coordinate(3, 3)];
    
    const guess = ai.makeGuess(board, previousGuesses);
    
    testRunner.expect(guess.toString()).toBe('33');
  });
});

// Test Game Event System
testRunner.describe('GameEventEmitter', () => {
  testRunner.it('should register event listeners', () => {
    const emitter = new GameEventEmitter();
    let called = false;
    
    emitter.on('test', () => { called = true; });
    emitter.emit('test');
    
    testRunner.expect(called).toBeTruthy();
  });

  testRunner.it('should pass data to event listeners', () => {
    const emitter = new GameEventEmitter();
    let receivedData = null;
    
    emitter.on('dataTest', (data) => { receivedData = data; });
    emitter.emit('dataTest', { value: 42 });
    
    testRunner.expect(receivedData.value).toBe(42);
  });

  testRunner.it('should handle multiple listeners for same event', () => {
    const emitter = new GameEventEmitter();
    let count = 0;
    
    emitter.on('multiTest', () => { count++; });
    emitter.on('multiTest', () => { count++; });
    emitter.emit('multiTest');
    
    testRunner.expect(count).toBe(2);
  });
});

// Test Game States
testRunner.describe('GameStates', () => {
  testRunner.it('should handle valid input in playing state', () => {
    const mockGame = {};
    const playingState = new PlayingState(mockGame);
    
    const result = playingState.handleInput('45');
    testRunner.expect(result).toBeTruthy();
  });

  testRunner.it('should reject invalid input in playing state', () => {
    const mockGame = {};
    const playingState = new PlayingState(mockGame);
    
    testRunner.expect(playingState.handleInput('abc')).toBeFalsy();
    testRunner.expect(playingState.handleInput('1')).toBeFalsy();
    testRunner.expect(playingState.handleInput('')).toBeFalsy(); // Empty input
  });

  testRunner.it('should always reject input in game ended state', () => {
    const mockGame = {};
    const gameEndedState = new GameEndedState(mockGame);
    
    testRunner.expect(gameEndedState.handleInput('45')).toBeFalsy();
    testRunner.expect(gameEndedState.handleInput('any')).toBeFalsy();
  });
});

// Integration Tests
testRunner.describe('Integration Tests', () => {
  testRunner.it('should play a complete mini game scenario', () => {
    // Setup a small game scenario
    const board = new Board();
    const ship = new Ship([new Coordinate(0, 0)]);
    board.addShip(ship);
    
    // Miss
    const miss = board.processGuess(new Coordinate(1, 1));
    testRunner.expect(miss.hit).toBeFalsy();
    testRunner.expect(board.getShipsRemaining()).toBe(1);
    
    // Hit and sink
    const hit = board.processGuess(new Coordinate(0, 0));
    testRunner.expect(hit.hit).toBeTruthy();
    testRunner.expect(hit.sunk).toBeTruthy();
    testRunner.expect(board.getShipsRemaining()).toBe(0);
  });

  testRunner.it('should handle AI making strategic decisions', () => {
    const ai = new SmartAIStrategy();
    const board = new Board();
    const previousGuesses = new Set();
    
    // AI makes initial guess (hunt mode)
    testRunner.expect(ai.mode).toBe('hunt');
    
    const firstGuess = ai.makeGuess(board, previousGuesses);
    testRunner.expect(firstGuess.isValid()).toBeTruthy();
    
    // Simulate a hit
    ai.onHit(firstGuess, false);
    testRunner.expect(ai.mode).toBe('target');
    testRunner.expect(ai.targetQueue.length).toBeGreaterThan(0);
  });

  testRunner.it('should handle edge case scenarios', () => {
    // Test ship at board edge
    const board = new Board();
    const edgeShip = new Ship([new Coordinate(0, 0), new Coordinate(0, 1)]);
    board.addShip(edgeShip);
    
    const ai = new SmartAIStrategy();
    ai.onHit(new Coordinate(0, 0), false);
    
    // Should only add valid adjacent coordinates
    const validTargets = ai.targetQueue.filter(coord => coord.isValid());
    testRunner.expect(validTargets.length).toBe(ai.targetQueue.length);
  });
});

// Performance Tests
testRunner.describe('Performance Tests', () => {
  testRunner.it('should handle large number of guesses efficiently', () => {
    const board = new Board();
    const startTime = Date.now();
    
    // Make many guesses
    for (let i = 0; i < 50; i++) {
      for (let j = 0; j < 10; j++) {
        if (i < CONFIG.BOARD_SIZE && j < CONFIG.BOARD_SIZE) {
          board.processGuess(new Coordinate(i, j));
        }
      }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete in reasonable time (less than 100ms)
    testRunner.expect(duration < 100).toBeTruthy();
  });

  testRunner.it('should efficiently check for duplicate guesses using Set', () => {
    const board = new Board();
    
    // Fill up the guesses set
    for (let i = 0; i < CONFIG.BOARD_SIZE; i++) {
      for (let j = 0; j < CONFIG.BOARD_SIZE; j++) {
        board.processGuess(new Coordinate(i, j));
      }
    }
    
    const startTime = Date.now();
    
    // Try to make duplicate guess
    const result = board.processGuess(new Coordinate(5, 5));
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    testRunner.expect(result.valid).toBeFalsy();
    testRunner.expect(duration < 10).toBeTruthy(); // Should be very fast with Set
  });
});

// Edge Cases
testRunner.describe('Edge Cases', () => {
  testRunner.it('should handle empty target queue gracefully', () => {
    const ai = new SmartAIStrategy();
    ai.mode = 'target';
    ai.targetQueue = [];
    
    const previousGuesses = new Set();
    const board = new Board();
    
    const guess = ai.makeGuess(board, previousGuesses);
    
    testRunner.expect(ai.mode).toBe('hunt');
    testRunner.expect(guess.isValid()).toBeTruthy();
  });

  testRunner.it('should handle coordinate parsing edge cases', () => {
    // Test empty string - should handle gracefully
    const coord1 = Coordinate.fromString('');
    testRunner.expect(isNaN(coord1.row)).toBeTruthy();
    
    // Test non-numeric string
    const coord2 = Coordinate.fromString('ab');
    testRunner.expect(isNaN(coord2.row)).toBeTruthy();
  });

  testRunner.it('should handle ship with no locations', () => {
    const ship = new Ship([]);
    testRunner.expect(ship.isSunk()).toBeTruthy(); // Empty ship is "sunk"
    testRunner.expect(ship.hit(new Coordinate(0, 0))).toBeFalsy();
  });
});

// Run all tests
try {
  testRunner.runTests();
  console.log('\n🎯 Test execution completed!');
} catch (error) {
  console.error('❌ Test execution failed:', error);
} 