/**
 * Sea Battle Game - Enhanced Version
 * A console-based implementation of the classic Battleship game with improved
 * code structure, readability, and maintainability.
 * 
 * Features:
 * - Object-oriented design with design patterns
 * - Intelligent AI with hunt/target strategies
 * - Event-driven architecture
 * - Comprehensive error handling
 * - Modular and testable code structure
 * 
 * @author Enhanced by AI Assistant
 * @version 2.0
 */

const readline = require('readline');

// =====================================================
// GAME CONFIGURATION AND CONSTANTS
// =====================================================

/**
 * Core game configuration constants
 * @readonly
 * @enum {number|string}
 */
const GAME_CONFIG = {
  // Board dimensions
  BOARD_SIZE: 10,
  BOARD_MIN_INDEX: 0,
  BOARD_MAX_INDEX: 9,
  
  // Ship configuration
  SHIPS_PER_PLAYER: 3,
  SHIP_LENGTH: 3,
  
  // Game mechanics
  MAX_SHIP_PLACEMENT_ATTEMPTS: 1000,
  GAME_LOOP_DELAY_MS: 10,
  
  // User input validation
  COORDINATE_INPUT_LENGTH: 2,
  
  // Display formatting
  BOARD_SPACING: '     '
};

/**
 * Visual symbols used in the game display
 * @readonly
 * @enum {string}
 */
const VISUAL_SYMBOLS = {
  EMPTY_WATER: '~',
  PLAYER_SHIP: 'S',
  SUCCESSFUL_HIT: 'X',
  MISSED_SHOT: 'O'
};

/**
 * Ship placement orientations
 * @readonly
 * @enum {string}
 */
const SHIP_ORIENTATION = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical'
};

/**
 * AI operating modes for strategic gameplay
 * @readonly
 * @enum {string}
 */
const AI_MODE = {
  HUNTING: 'hunt',
  TARGETING: 'target'
};

/**
 * Game event types for the observer pattern
 * @readonly
 * @enum {string}
 */
const GAME_EVENTS = {
  PLAYER_HIT: 'playerHit',
  PLAYER_MISS: 'playerMiss',
  CPU_HIT: 'cpuHit',
  CPU_MISS: 'cpuMiss',
  GAME_WON: 'gameWon',
  GAME_LOST: 'gameLost'
};

/**
 * User interface messages for consistent communication
 * @readonly
 * @enum {string}
 */
const UI_MESSAGES = {
  // Input prompts
  COORDINATE_PROMPT: 'Enter your guess (e.g., 00): ',
  
  // Input validation errors
  INVALID_INPUT_FORMAT: 'Oops, input must be exactly two digits (e.g., 00, 34, 98).',
  INVALID_COORDINATE_RANGE: `Please enter valid coordinates between ${GAME_CONFIG.BOARD_MIN_INDEX} and ${GAME_CONFIG.BOARD_MAX_INDEX}.`,
  DUPLICATE_GUESS: 'You already guessed that location!',
  
  // Game setup and status
  SETTING_UP_GAME: 'Setting up game...',
  SHIPS_PLACED: 'ships placed randomly',
  GAME_START: "\nLet's play Sea Battle!",
  TRY_TO_SINK: 'Try to sink the',
  ENEMY_SHIPS: 'enemy ships.',
  
  // Turn indicators
  CPU_TURN_HEADER: "\n--- CPU's Turn ---",
  
  // Game feedback messages
  PLAYER_HIT: 'PLAYER HIT!',
  PLAYER_MISS: 'PLAYER MISS.',
  ENEMY_SHIP_SUNK: 'You sunk an enemy battleship!',
  PLAYER_SHIP_SUNK: 'CPU sunk your battleship!',
  VICTORY_MESSAGE: '\n*** CONGRATULATIONS! You sunk all enemy battleships! ***',
  DEFEAT_MESSAGE: '\n*** GAME OVER! The CPU sunk all your battleships! ***',
  GAME_ENDED: 'Game has ended. Please restart to play again.',
  
  // Board display headers
  OPPONENT_BOARD_HEADER: '   --- OPPONENT BOARD ---',
  PLAYER_BOARD_HEADER: '--- YOUR BOARD ---'
};

// =====================================================
// UTILITY CLASSES AND DATA STRUCTURES
// =====================================================

/**
 * Represents a coordinate position on the game board
 * Provides validation and utility methods for coordinate manipulation
 */
class BoardCoordinate {
  /**
   * Creates a new coordinate
   * @param {number} rowIndex - Zero-based row index (0-9)
   * @param {number} columnIndex - Zero-based column index (0-9)
   */
  constructor(rowIndex, columnIndex) {
    this.rowIndex = rowIndex;
    this.columnIndex = columnIndex;
  }

  /**
   * Converts coordinate to string representation
   * @returns {string} String format like "57" for row 5, col 7
   */
  toString() {
    return `${this.rowIndex}${this.columnIndex}`;
  }

  /**
   * Creates coordinate from string representation
   * @param {string} coordinateString - String like "57" 
   * @returns {BoardCoordinate} New coordinate instance
   */
  static fromString(coordinateString) {
    const rowIndex = parseInt(coordinateString[0], 10);
    const columnIndex = parseInt(coordinateString[1], 10);
    return new BoardCoordinate(rowIndex, columnIndex);
  }

  /**
   * Validates if coordinate is within board boundaries
   * @returns {boolean} True if coordinate is valid
   */
  isWithinBoardBounds() {
    return this.rowIndex >= GAME_CONFIG.BOARD_MIN_INDEX && 
           this.rowIndex <= GAME_CONFIG.BOARD_MAX_INDEX && 
           this.columnIndex >= GAME_CONFIG.BOARD_MIN_INDEX && 
           this.columnIndex <= GAME_CONFIG.BOARD_MAX_INDEX;
  }

  /**
   * Gets all adjacent coordinates (up, down, left, right)
   * Only returns coordinates that are within board bounds
   * @returns {BoardCoordinate[]} Array of valid adjacent coordinates
   */
  getAdjacentCoordinates() {
    const potentialAdjacent = [
      new BoardCoordinate(this.rowIndex - 1, this.columnIndex), // Up
      new BoardCoordinate(this.rowIndex + 1, this.columnIndex), // Down
      new BoardCoordinate(this.rowIndex, this.columnIndex - 1), // Left
      new BoardCoordinate(this.rowIndex, this.columnIndex + 1)  // Right
    ];

    return potentialAdjacent.filter(coordinate => coordinate.isWithinBoardBounds());
  }

  /**
   * Checks if this coordinate equals another coordinate
   * @param {BoardCoordinate} otherCoordinate - Coordinate to compare with
   * @returns {boolean} True if coordinates are equal
   */
  equals(otherCoordinate) {
    return this.rowIndex === otherCoordinate.rowIndex && 
           this.columnIndex === otherCoordinate.columnIndex;
  }
}

/**
 * Represents the result of processing a guess on the board
 * Encapsulates all information about a guess attempt
 */
class GuessResult {
  /**
   * Creates a new guess result
   * @param {boolean} isValid - Whether the guess was valid
   * @param {boolean} isHit - Whether the guess hit a ship
   * @param {boolean} isShipSunk - Whether the hit sunk a ship
   * @param {string} [reasonForInvalidity] - Reason if guess was invalid
   * @param {BattleShip} [hitShip] - The ship that was hit (if any)
   */
  constructor(isValid, isHit = false, isShipSunk = false, reasonForInvalidity = null, hitShip = null) {
    this.isValid = isValid;
    this.isHit = isHit;
    this.isShipSunk = isShipSunk;
    this.reasonForInvalidity = reasonForInvalidity;
    this.hitShip = hitShip;
  }

  /**
   * Creates a result for an invalid guess
   * @param {string} reason - Reason why the guess was invalid
   * @returns {GuessResult} Invalid guess result
   */
  static createInvalidResult(reason) {
    return new GuessResult(false, false, false, reason);
  }

  /**
   * Creates a result for a successful hit
   * @param {boolean} isShipSunk - Whether the ship was sunk
   * @param {BattleShip} hitShip - The ship that was hit
   * @returns {GuessResult} Hit result
   */
  static createHitResult(isShipSunk, hitShip) {
    return new GuessResult(true, true, isShipSunk, null, hitShip);
  }

  /**
   * Creates a result for a miss
   * @returns {GuessResult} Miss result
   */
  static createMissResult() {
    return new GuessResult(true, false, false);
  }
}

// =====================================================
// GAME ENTITIES
// =====================================================

/**
 * Represents a ship in the Sea Battle game
 * Manages ship locations, hit tracking, and sinking status
 */
class BattleShip {
  /**
   * Creates a new ship
   * @param {BoardCoordinate[]} shipLocations - Array of coordinates where ship is placed
   */
  constructor(shipLocations) {
    this.locationStrings = shipLocations.map(coordinate => coordinate.toString());
    this.hitStatusArray = new Array(shipLocations.length).fill(false);
  }

  /**
   * Attempts to hit the ship at given coordinate
   * @param {BoardCoordinate} targetCoordinate - Coordinate of the attack
   * @returns {boolean} True if hit was successful and not duplicate
   */
  attemptHit(targetCoordinate) {
    const targetLocationString = targetCoordinate.toString();
    const locationIndex = this.locationStrings.indexOf(targetLocationString);
    
    if (locationIndex >= 0 && !this.hitStatusArray[locationIndex]) {
      this.hitStatusArray[locationIndex] = true;
      return true;
    }
    
    return false;
  }

  /**
   * Checks if ship is completely sunk
   * @returns {boolean} True if all ship locations have been hit
   */
  isCompletelyDestroyed() {
    return this.hitStatusArray.every(isLocationHit => isLocationHit);
  }

  /**
   * Checks if ship occupies given coordinate
   * @param {BoardCoordinate} queryCoordinate - Coordinate to check
   * @returns {boolean} True if ship is at this coordinate
   */
  occupiesCoordinate(queryCoordinate) {
    return this.locationStrings.includes(queryCoordinate.toString());
  }

  /**
   * Gets the number of hits this ship has taken
   * @returns {number} Number of successful hits
   */
  getHitCount() {
    return this.hitStatusArray.filter(isHit => isHit).length;
  }

  /**
   * Gets the remaining health of the ship
   * @returns {number} Number of locations not yet hit
   */
  getRemainingHealth() {
    return this.locationStrings.length - this.getHitCount();
  }
}

/**
 * Represents the game board for Sea Battle
 * Manages grid state, ships, and guess processing
 */
class GameBoard {
  /**
   * Creates a new game board
   * @param {boolean} shouldDisplayShips - Whether to show ship locations on display
   */
  constructor(shouldDisplayShips = false) {
    this.gameGrid = this.initializeEmptyGrid();
    this.placedShips = [];
    this.previousGuesses = new Set();
    this.shouldDisplayShips = shouldDisplayShips;
  }

  /**
   * Initializes an empty grid filled with water symbols
   * @private
   * @returns {string[][]} 2D array representing empty board
   */
  initializeEmptyGrid() {
    return Array(GAME_CONFIG.BOARD_SIZE).fill(null).map(() => 
      Array(GAME_CONFIG.BOARD_SIZE).fill(VISUAL_SYMBOLS.EMPTY_WATER)
    );
  }

  /**
   * Adds a ship to the board
   * @param {BattleShip} ship - Ship to add to the board
   */
  addShipToBoard(ship) {
    this.placedShips.push(ship);
    
    if (this.shouldDisplayShips) {
      ship.locationStrings.forEach(locationString => {
        const coordinate = BoardCoordinate.fromString(locationString);
        this.gameGrid[coordinate.rowIndex][coordinate.columnIndex] = VISUAL_SYMBOLS.PLAYER_SHIP;
      });
    }
  }

  /**
   * Processes a guess and updates board state
   * @param {BoardCoordinate} guessCoordinate - Coordinate being guessed
   * @returns {GuessResult} Result of the guess
   */
  processPlayerGuess(guessCoordinate) {
    const coordinateString = guessCoordinate.toString();
    
    // Check for duplicate guess
    if (this.previousGuesses.has(coordinateString)) {
      return GuessResult.createInvalidResult(UI_MESSAGES.DUPLICATE_GUESS);
    }

    // Record this guess
    this.previousGuesses.add(coordinateString);

    // Check for ship hits
    for (const ship of this.placedShips) {
      if (ship.attemptHit(guessCoordinate)) {
        this.gameGrid[guessCoordinate.rowIndex][guessCoordinate.columnIndex] = VISUAL_SYMBOLS.SUCCESSFUL_HIT;
        return GuessResult.createHitResult(ship.isCompletelyDestroyed(), ship);
      }
    }

    // No hit - record as miss
    this.gameGrid[guessCoordinate.rowIndex][guessCoordinate.columnIndex] = VISUAL_SYMBOLS.MISSED_SHOT;
    return GuessResult.createMissResult();
  }

  /**
   * Gets count of ships that are still afloat
   * @returns {number} Number of undestroyed ships
   */
  getRemainingShipCount() {
    return this.placedShips.filter(ship => !ship.isCompletelyDestroyed()).length;
  }

  /**
   * Generates string representation of the board for display
   * @returns {string} Formatted board display
   */
  generateBoardDisplay() {
    let displayOutput = '\n  ';
    
    // Add column headers
    for (let columnIndex = 0; columnIndex < GAME_CONFIG.BOARD_SIZE; columnIndex++) {
      displayOutput += `${columnIndex} `;
    }
    displayOutput += '\n';

    // Add rows with row headers
    for (let rowIndex = 0; rowIndex < GAME_CONFIG.BOARD_SIZE; rowIndex++) {
      displayOutput += `${rowIndex} `;
      for (let columnIndex = 0; columnIndex < GAME_CONFIG.BOARD_SIZE; columnIndex++) {
        displayOutput += `${this.gameGrid[rowIndex][columnIndex]} `;
      }
      displayOutput += '\n';
    }
    
    return displayOutput;
  }

  /**
   * Checks if a coordinate has been guessed before
   * @param {BoardCoordinate} coordinate - Coordinate to check
   * @returns {boolean} True if coordinate was previously guessed
   */
  hasCoordinateBeenGuessed(coordinate) {
    return this.previousGuesses.has(coordinate.toString());
  }

  /**
   * Gets all ship locations for collision detection
   * @returns {string[]} Array of coordinate strings where ships are placed
   */
  getAllShipLocations() {
    return this.placedShips.flatMap(ship => ship.locationStrings);
  }
}

// =====================================================
// SHIP PLACEMENT FACTORY
// =====================================================

/**
 * Factory class responsible for creating and placing ships
 * Implements the Factory pattern for ship creation
 */
class ShipPlacementFactory {
  /**
   * Creates a single ship with random placement
   * @private
   * @returns {BattleShip} Newly created ship with random location
   */
  static createRandomlyPlacedShip() {
    const orientation = Math.random() < 0.5 ? SHIP_ORIENTATION.HORIZONTAL : SHIP_ORIENTATION.VERTICAL;
    const startingPosition = this.calculateRandomStartPosition(orientation);
    const shipCoordinates = this.generateShipCoordinates(startingPosition, orientation);
    
    return new BattleShip(shipCoordinates);
  }

  /**
   * Calculates a random starting position for ship placement
   * @private
   * @param {string} orientation - Ship orientation (horizontal or vertical)
   * @returns {BoardCoordinate} Valid starting coordinate
   */
  static calculateRandomStartPosition(orientation) {
    let startRow, startColumn;
    
    if (orientation === SHIP_ORIENTATION.HORIZONTAL) {
      startRow = Math.floor(Math.random() * GAME_CONFIG.BOARD_SIZE);
      startColumn = Math.floor(Math.random() * (GAME_CONFIG.BOARD_SIZE - GAME_CONFIG.SHIP_LENGTH + 1));
    } else {
      startRow = Math.floor(Math.random() * (GAME_CONFIG.BOARD_SIZE - GAME_CONFIG.SHIP_LENGTH + 1));
      startColumn = Math.floor(Math.random() * GAME_CONFIG.BOARD_SIZE);
    }
    
    return new BoardCoordinate(startRow, startColumn);
  }

  /**
   * Generates coordinates for ship based on starting position and orientation
   * @private
   * @param {BoardCoordinate} startingCoordinate - Starting position
   * @param {string} orientation - Ship orientation
   * @returns {BoardCoordinate[]} Array of coordinates for ship placement
   */
  static generateShipCoordinates(startingCoordinate, orientation) {
    const coordinates = [];
    
    for (let segmentIndex = 0; segmentIndex < GAME_CONFIG.SHIP_LENGTH; segmentIndex++) {
      const rowIndex = orientation === SHIP_ORIENTATION.HORIZONTAL 
        ? startingCoordinate.rowIndex 
        : startingCoordinate.rowIndex + segmentIndex;
        
      const columnIndex = orientation === SHIP_ORIENTATION.HORIZONTAL 
        ? startingCoordinate.columnIndex + segmentIndex 
        : startingCoordinate.columnIndex;
        
      coordinates.push(new BoardCoordinate(rowIndex, columnIndex));
    }
    
    return coordinates;
  }

  /**
   * Places multiple ships randomly on a board
   * @param {GameBoard} targetBoard - Board to place ships on
   * @param {number} numberOfShips - Number of ships to place
   * @throws {Error} If unable to place all ships after maximum attempts
   */
  static placeShipsRandomlyOnBoard(targetBoard, numberOfShips) {
    let successfullyPlacedShips = 0;
    let placementAttempts = 0;

    while (successfullyPlacedShips < numberOfShips && 
           placementAttempts < GAME_CONFIG.MAX_SHIP_PLACEMENT_ATTEMPTS) {
      
      placementAttempts++;
      const candidateShip = this.createRandomlyPlacedShip();
      
      if (this.isShipPlacementValid(candidateShip, targetBoard)) {
        targetBoard.addShipToBoard(candidateShip);
        successfullyPlacedShips++;
      }
    }

    if (successfullyPlacedShips < numberOfShips) {
      throw new Error(
        `Ship placement failed: Could only place ${successfullyPlacedShips} out of ${numberOfShips} ships after ${placementAttempts} attempts`
      );
    }
  }

  /**
   * Validates if ship placement would cause collision
   * @private
   * @param {BattleShip} candidateShip - Ship to validate
   * @param {GameBoard} targetBoard - Board to check against
   * @returns {boolean} True if placement is valid (no collisions)
   */
  static isShipPlacementValid(candidateShip, targetBoard) {
    return !candidateShip.locationStrings.some(locationString => {
      const coordinate = BoardCoordinate.fromString(locationString);
      return targetBoard.placedShips.some(existingShip => 
        existingShip.occupiesCoordinate(coordinate)
      );
    });
  }
}

// =====================================================
// AI STRATEGY IMPLEMENTATIONS
// =====================================================

/**
 * Abstract base class for AI strategies
 * Implements the Strategy pattern for different AI behaviors
 */
class AIStrategy {
  /**
   * Makes a guess for the AI player
   * @abstract
   * @param {GameBoard} targetBoard - Board to make guess on
   * @param {Set<string>} previousGuesses - Set of previous guess coordinates
   * @returns {BoardCoordinate} AI's chosen coordinate
   * @throws {Error} If not implemented by subclass
   */
  makeStrategicGuess(targetBoard, previousGuesses) {
    throw new Error('makeStrategicGuess must be implemented by AI strategy subclass');
  }
}

/**
 * Random AI strategy - makes completely random guesses
 * Good for beginner difficulty level
 */
class RandomGuessingAIStrategy extends AIStrategy {
  /**
   * Makes a random guess that hasn't been tried before
   * @param {GameBoard} targetBoard - Board to make guess on
   * @param {Set<string>} previousGuesses - Set of previous guess coordinates
   * @returns {BoardCoordinate} Random valid coordinate
   */
  makeStrategicGuess(targetBoard, previousGuesses) {
    let candidateCoordinate;
    
    do {
      const randomRow = Math.floor(Math.random() * GAME_CONFIG.BOARD_SIZE);
      const randomColumn = Math.floor(Math.random() * GAME_CONFIG.BOARD_SIZE);
      candidateCoordinate = new BoardCoordinate(randomRow, randomColumn);
    } while (previousGuesses.has(candidateCoordinate.toString()));
    
    return candidateCoordinate;
  }
}

/**
 * Intelligent AI strategy - uses hunt and target modes
 * Provides challenging gameplay with strategic decision making
 */
class IntelligentHuntingAIStrategy extends AIStrategy {
  constructor() {
    super();
    this.currentMode = AI_MODE.HUNTING;
    this.targetingQueue = [];
  }

  /**
   * Makes a strategic guess based on current AI mode
   * @param {GameBoard} targetBoard - Board to make guess on
   * @param {Set<string>} previousGuesses - Set of previous guess coordinates
   * @returns {BoardCoordinate} Strategically chosen coordinate
   */
  makeStrategicGuess(targetBoard, previousGuesses) {
    if (this.currentMode === AI_MODE.TARGETING && this.targetingQueue.length > 0) {
      return this.executeTargetingMode(previousGuesses);
    }
    
    this.currentMode = AI_MODE.HUNTING;
    return this.executeHuntingMode(previousGuesses);
  }

  /**
   * Executes targeting mode - focuses on adjacent cells after a hit
   * @private
   * @param {Set<string>} previousGuesses - Previous guess coordinates
   * @returns {BoardCoordinate} Target coordinate from queue
   */
  executeTargetingMode(previousGuesses) {
    let targetCoordinate;
    
    do {
      if (this.targetingQueue.length === 0) {
        this.currentMode = AI_MODE.HUNTING;
        return this.executeHuntingMode(previousGuesses);
      }
      targetCoordinate = this.targetingQueue.shift();
    } while (previousGuesses.has(targetCoordinate.toString()));
    
    return targetCoordinate;
  }

  /**
   * Executes hunting mode - makes random guesses to find ships
   * @private
   * @param {Set<string>} previousGuesses - Previous guess coordinates
   * @returns {BoardCoordinate} Random coordinate
   */
  executeHuntingMode(previousGuesses) {
    let huntingCoordinate;
    
    do {
      const randomRow = Math.floor(Math.random() * GAME_CONFIG.BOARD_SIZE);
      const randomColumn = Math.floor(Math.random() * GAME_CONFIG.BOARD_SIZE);
      huntingCoordinate = new BoardCoordinate(randomRow, randomColumn);
    } while (previousGuesses.has(huntingCoordinate.toString()));
    
    return huntingCoordinate;
  }

  /**
   * Notifies AI of hit result to adjust strategy
   * @param {BoardCoordinate} hitCoordinate - Coordinate that was hit
   * @param {boolean} wasShipDestroyed - Whether the hit destroyed the ship
   */
  notifyOfHitResult(hitCoordinate, wasShipDestroyed) {
    if (wasShipDestroyed) {
      // Ship destroyed - return to hunting
      this.currentMode = AI_MODE.HUNTING;
      this.targetingQueue = [];
    } else {
      // Ship hit but not destroyed - switch to targeting
      this.currentMode = AI_MODE.TARGETING;
      this.addAdjacentCoordinatesToTargetQueue(hitCoordinate);
    }
  }

  /**
   * Adds adjacent coordinates to targeting queue for follow-up attacks
   * @private
   * @param {BoardCoordinate} hitCoordinate - Coordinate that was successfully hit
   */
  addAdjacentCoordinatesToTargetQueue(hitCoordinate) {
    const adjacentCoordinates = hitCoordinate.getAdjacentCoordinates();
    
    adjacentCoordinates.forEach(adjacentCoord => {
      const isAlreadyQueued = this.targetingQueue.some(queuedCoord => 
        queuedCoord.toString() === adjacentCoord.toString()
      );
      
      if (!isAlreadyQueued) {
        this.targetingQueue.push(adjacentCoord);
      }
    });
  }

  /**
   * Gets current AI mode for debugging/display purposes
   * @returns {string} Current AI mode
   */
  getCurrentMode() {
    return this.currentMode;
  }

  /**
   * Gets current targeting queue size for debugging purposes
   * @returns {number} Number of coordinates in targeting queue
   */
  getTargetQueueSize() {
    return this.targetingQueue.length;
  }
}

// =====================================================
// EVENT SYSTEM
// =====================================================

/**
 * Event emitter for game events
 * Implements the Observer pattern for loose coupling between game components
 */
class GameEventSystem {
  constructor() {
    this.eventListeners = {};
  }

  /**
   * Registers an event listener for a specific event type
   * @param {string} eventType - Type of event to listen for
   * @param {Function} handlerFunction - Function to call when event occurs
   */
  registerEventListener(eventType, handlerFunction) {
    if (!this.eventListeners[eventType]) {
      this.eventListeners[eventType] = [];
    }
    this.eventListeners[eventType].push(handlerFunction);
  }

  /**
   * Emits an event to all registered listeners
   * @param {string} eventType - Type of event to emit
   * @param {Object} [eventData] - Data to pass to event handlers
   */
  emitEvent(eventType, eventData = null) {
    if (this.eventListeners[eventType]) {
      this.eventListeners[eventType].forEach(handler => {
        try {
          handler(eventData);
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error.message);
        }
      });
    }
  }

  /**
   * Removes all listeners for a specific event type
   * @param {string} eventType - Event type to clear
   */
  clearEventListeners(eventType) {
    if (this.eventListeners[eventType]) {
      this.eventListeners[eventType] = [];
    }
  }

  /**
   * Removes all event listeners
   */
  clearAllEventListeners() {
    this.eventListeners = {};
  }
}

// =====================================================
// GAME STATE MANAGEMENT
// =====================================================

/**
 * Abstract base class for game states
 * Implements the State pattern for clean game flow control
 */
class GameState {
  /**
   * Creates a new game state
   * @param {SeaBattleGameController} gameController - Reference to main game controller
   */
  constructor(gameController) {
    this.gameController = gameController;
  }

  /**
   * Handles user input in this state
   * @abstract
   * @param {string} userInput - Raw user input
   * @returns {boolean} Whether input was processed successfully
   * @throws {Error} If not implemented by subclass
   */
  processUserInput(userInput) {
    throw new Error('processUserInput must be implemented by game state subclass');
  }
}

/**
 * Game state when actively playing
 * Handles coordinate input validation and processing
 */
class ActiveGameState extends GameState {
  /**
   * Processes user coordinate input during active gameplay
   * @param {string} userInput - User's coordinate input
   * @returns {boolean} True if input was valid and processed
   */
  processUserInput(userInput) {
    // Validate input format
    if (!this.isInputFormatValid(userInput)) {
      console.log(UI_MESSAGES.INVALID_INPUT_FORMAT);
      return false;
    }

    // Parse and validate coordinate
    const playerCoordinate = new BoardCoordinate(
      parseInt(userInput[0], 10), 
      parseInt(userInput[1], 10)
    );
    
    if (!playerCoordinate.isWithinBoardBounds()) {
      console.log(UI_MESSAGES.INVALID_COORDINATE_RANGE);
      return false;
    }

    // Process the player's turn
    return this.gameController.executePlayerTurn(playerCoordinate);
  }

  /**
   * Validates the format of user input
   * @private
   * @param {string} input - Input to validate
   * @returns {boolean} True if input format is valid
   */
  isInputFormatValid(input) {
    return input && 
           input.length === GAME_CONFIG.COORDINATE_INPUT_LENGTH && 
           !isNaN(parseInt(input[0], 10)) && 
           !isNaN(parseInt(input[1], 10));
  }
}

/**
 * Game state when game has ended
 * Prevents further input processing and informs player
 */
class GameCompletedState extends GameState {
  /**
   * Handles input when game has ended
   * @param {string} userInput - User input (ignored)
   * @returns {boolean} Always false since game has ended
   */
  processUserInput(userInput) {
    console.log(UI_MESSAGES.GAME_ENDED);
    return false;
  }
}

// =====================================================
// MAIN GAME CONTROLLER
// =====================================================

/**
 * Main game controller that orchestrates all game components
 * Implements MVC pattern as the controller layer
 */
class SeaBattleGameController {
  constructor() {
    this.initializeGameComponents();
    this.setupEventHandlers();
    this.createReadlineInterface();
  }

  /**
   * Initializes all game components
   * @private
   */
  initializeGameComponents() {
    this.playerGameBoard = new GameBoard(true);  // Show player's ships
    this.opponentGameBoard = new GameBoard(false); // Hide opponent ships
    this.artificialIntelligence = new IntelligentHuntingAIStrategy();
    this.gameEventSystem = new GameEventSystem();
    this.currentGameState = new ActiveGameState(this);
    this.aiPreviousGuesses = new Set();
  }

  /**
   * Sets up event handlers for game events
   * @private
   */
  setupEventHandlers() {
    this.gameEventSystem.registerEventListener(GAME_EVENTS.PLAYER_HIT, (eventData) => {
      console.log(UI_MESSAGES.PLAYER_HIT);
      if (eventData.isShipDestroyed) {
        console.log(UI_MESSAGES.ENEMY_SHIP_SUNK);
      }
    });

    this.gameEventSystem.registerEventListener(GAME_EVENTS.PLAYER_MISS, () => {
      console.log(UI_MESSAGES.PLAYER_MISS);
    });

    this.gameEventSystem.registerEventListener(GAME_EVENTS.CPU_HIT, (eventData) => {
      console.log(`CPU HIT at ${eventData.coordinateString}!`);
      if (eventData.isShipDestroyed) {
        console.log(UI_MESSAGES.PLAYER_SHIP_SUNK);
      }
      this.artificialIntelligence.notifyOfHitResult(
        BoardCoordinate.fromString(eventData.coordinateString), 
        eventData.isShipDestroyed
      );
    });

    this.gameEventSystem.registerEventListener(GAME_EVENTS.CPU_MISS, (eventData) => {
      console.log(`CPU MISS at ${eventData.coordinateString}.`);
    });

    this.gameEventSystem.registerEventListener(GAME_EVENTS.GAME_WON, () => {
      console.log(UI_MESSAGES.VICTORY_MESSAGE);
      this.currentGameState = new GameCompletedState(this);
    });

    this.gameEventSystem.registerEventListener(GAME_EVENTS.GAME_LOST, () => {
      console.log(UI_MESSAGES.DEFEAT_MESSAGE);
      this.currentGameState = new GameCompletedState(this);
    });
  }

  /**
   * Creates readline interface for user input
   * @private
   */
  createReadlineInterface() {
    this.readlineInterface = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * Initializes the game and starts gameplay
   * @async
   */
  async initializeAndStartGame() {
    try {
      console.log(UI_MESSAGES.SETTING_UP_GAME);
      
      this.placeShipsOnBoards();
      this.displayGameStartMessages();
      this.beginGameLoop();
      
    } catch (error) {
      console.error('Error initializing game:', error.message);
    }
  }

  /**
   * Places ships on both player and opponent boards
   * @private
   */
  placeShipsOnBoards() {
    ShipPlacementFactory.placeShipsRandomlyOnBoard(
      this.playerGameBoard, 
      GAME_CONFIG.SHIPS_PER_PLAYER
    );
    
    ShipPlacementFactory.placeShipsRandomlyOnBoard(
      this.opponentGameBoard, 
      GAME_CONFIG.SHIPS_PER_PLAYER
    );
  }

  /**
   * Displays initial game messages
   * @private
   */
  displayGameStartMessages() {
    console.log(`${GAME_CONFIG.SHIPS_PER_PLAYER} ${UI_MESSAGES.SHIPS_PLACED} for each player.`);
    console.log(UI_MESSAGES.GAME_START);
    console.log(`${UI_MESSAGES.TRY_TO_SINK} ${GAME_CONFIG.SHIPS_PER_PLAYER} ${UI_MESSAGES.ENEMY_SHIPS}`);
  }

  /**
   * Displays both game boards side by side
   */
  displayGameBoards() {
    console.log(`\n${UI_MESSAGES.OPPONENT_BOARD_HEADER}${GAME_CONFIG.BOARD_SPACING}${UI_MESSAGES.PLAYER_BOARD_HEADER}`);
    
    const opponentBoardLines = this.opponentGameBoard.generateBoardDisplay().split('\n');
    const playerBoardLines = this.playerGameBoard.generateBoardDisplay().split('\n');
    
    for (let lineIndex = 0; lineIndex < opponentBoardLines.length; lineIndex++) {
      if (opponentBoardLines[lineIndex] && playerBoardLines[lineIndex]) {
        console.log(`${opponentBoardLines[lineIndex]}${GAME_CONFIG.BOARD_SPACING}${playerBoardLines[lineIndex]}`);
      }
    }
    console.log();
  }

  /**
   * Executes a player's turn
   * @param {BoardCoordinate} targetCoordinate - Coordinate player is attacking
   * @returns {boolean} True if turn was executed successfully
   */
  executePlayerTurn(targetCoordinate) {
    const guessResult = this.opponentGameBoard.processPlayerGuess(targetCoordinate);
    
    if (!guessResult.isValid) {
      console.log(guessResult.reasonForInvalidity);
      return false;
    }

    if (guessResult.isHit) {
      this.gameEventSystem.emitEvent(GAME_EVENTS.PLAYER_HIT, {
        coordinateString: targetCoordinate.toString(),
        isShipDestroyed: guessResult.isShipSunk
      });
    } else {
      this.gameEventSystem.emitEvent(GAME_EVENTS.PLAYER_MISS, {
        coordinateString: targetCoordinate.toString()
      });
    }

    return true;
  }

  /**
   * Executes the AI opponent's turn
   */
  executeAITurn() {
    console.log(UI_MESSAGES.CPU_TURN_HEADER);
    
    const aiGuessCoordinate = this.artificialIntelligence.makeStrategicGuess(
      this.playerGameBoard, 
      this.aiPreviousGuesses
    );
    
    this.aiPreviousGuesses.add(aiGuessCoordinate.toString());
    
    const guessResult = this.playerGameBoard.processPlayerGuess(aiGuessCoordinate);
    
    if (guessResult.isHit) {
      this.gameEventSystem.emitEvent(GAME_EVENTS.CPU_HIT, {
        coordinateString: aiGuessCoordinate.toString(),
        isShipDestroyed: guessResult.isShipSunk
      });
    } else {
      this.gameEventSystem.emitEvent(GAME_EVENTS.CPU_MISS, {
        coordinateString: aiGuessCoordinate.toString()
      });
    }
  }

  /**
   * Checks if game has ended and emits appropriate events
   * @returns {boolean} True if game has ended
   */
  evaluateGameEndConditions() {
    if (this.opponentGameBoard.getRemainingShipCount() === 0) {
      this.gameEventSystem.emitEvent(GAME_EVENTS.GAME_WON);
  return true;
}

    if (this.playerGameBoard.getRemainingShipCount() === 0) {
      this.gameEventSystem.emitEvent(GAME_EVENTS.GAME_LOST);
      return true;
    }
    
    return false;
  }

  /**
   * Main game loop that handles turn sequence
   */
  beginGameLoop() {
    const executeSingleGameStep = () => {
      // Check for game end before showing boards
      if (this.evaluateGameEndConditions()) {
        this.displayGameBoards();
        this.readlineInterface.close();
        return;
      }

      // Display current game state
      this.displayGameBoards();
      
      // Get player input
      this.readlineInterface.question(UI_MESSAGES.COORDINATE_PROMPT, (playerInput) => {
        const wasPlayerTurnSuccessful = this.currentGameState.processUserInput(playerInput);
        
        if (wasPlayerTurnSuccessful) {
          // Check for game end after player turn
          if (this.evaluateGameEndConditions()) {
            this.displayGameBoards();
            this.readlineInterface.close();
            return;
          }

          // Execute AI turn
          this.executeAITurn();
          
          // Check for game end after AI turn
          if (this.evaluateGameEndConditions()) {
            this.displayGameBoards();
            this.readlineInterface.close();
        return;
      }
    }

        // Schedule next game step
        setTimeout(executeSingleGameStep, GAME_CONFIG.GAME_LOOP_DELAY_MS);
      });
    };

    executeSingleGameStep();
  }

  /**
   * Gets current game statistics for debugging/display
   * @returns {Object} Game statistics
   */
  getGameStatistics() {
    return {
      playerShipsRemaining: this.playerGameBoard.getRemainingShipCount(),
      opponentShipsRemaining: this.opponentGameBoard.getRemainingShipCount(),
      playerGuessCount: this.playerGameBoard.previousGuesses.size,
      aiGuessCount: this.aiPreviousGuesses.size,
      aiCurrentMode: this.artificialIntelligence.getCurrentMode(),
      aiTargetQueueSize: this.artificialIntelligence.getTargetQueueSize()
    };
  }

}

// =====================================================
// GAME INITIALIZATION AND STARTUP
// =====================================================

/**
 * Entry point for the Sea Battle game
 * Creates and initializes the main game controller
 */
function startSeaBattleGame() {
  const gameController = new SeaBattleGameController();
  gameController.initializeAndStartGame();
}

// Start the game when script is executed
if (require.main === module) {
  startSeaBattleGame();
}

// Export for testing purposes
module.exports = {
  SeaBattleGameController,
  BoardCoordinate,
  BattleShip,
  GameBoard,
  ShipPlacementFactory,
  IntelligentHuntingAIStrategy,
  RandomGuessingAIStrategy,
  GameEventSystem,
  GAME_CONFIG,
  VISUAL_SYMBOLS,
  UI_MESSAGES
}; 