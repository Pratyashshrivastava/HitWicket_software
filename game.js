// Define a base class for all characters

let gameState = {
  board: [
    ["A-P1", "A-P2", "A-H1", "A-H2", "A-P3"],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["B-P1", "B-P2", "B-H1", "B-H2", "B-P3"],
  ],
  current_player: "A", // Start with player A
  moveHistory: [],
};

class Character {
  constructor(type, moveSet) {
    this.type = type;
    this.moveSet = moveSet; // An array of possible move directions
  }

  // Method to get valid moves based on position and board state
  getValidMoves(row, col, player, board) {
    const validMoves = [];
    for (let move of this.moveSet) {
      let [newRow, newCol] = this.calculateNewPosition(row, col, move, player);
      if (this.isValidPosition(newRow, newCol, player, board)) {
        validMoves.push(move);
      }
    }
    return validMoves;
  }

  // Calculate new position based on move and player perspective
  calculateNewPosition(row, col, move, player) {
    if (player === "A") {
      // Player A's perspective
      if (move === "F") return [row - 1, col];
      if (move === "B") return [row + 1, col];
      if (move === "L") return [row, col - 1];
      if (move === "R") return [row, col + 1];
    } else if (player === "B") {
      // Player B's perspective (reversed)
      if (move === "F") return [row + 1, col];
      if (move === "B") return [row - 1, col];
      if (move === "L") return [row, col - 1];
      if (move === "R") return [row, col + 1];
    }
    return [row, col];
  }

  // Check if a position is valid on the board
  isValidPosition(newRow, newCol, player, board) {
    const boardSize = 5;
    if (
      newRow < 0 ||
      newRow >= boardSize ||
      newCol < 0 ||
      newCol >= boardSize
    ) {
      return false;
    }
    const targetCell = board[newRow][newCol];
    if (!targetCell || !targetCell.startsWith(player)) {
      return true;
    }
    return false;
  }
}

// Define a Pawn class
class Pawn extends Character {
  constructor() {
    super("Pawn", ["L", "R", "F", "B"]);
  }
}

// Define a Hero1 class
class Hero1 extends Character {
  constructor() {
    super("Hero1", ["L", "R", "F", "B"]);
  }
}

// Define a Hero2 class
class Hero2 extends Character {
  constructor() {
    super("Hero2", ["FL", "FR", "BL", "BR"]);
  }

  calculateNewPosition(row, col, move, player) {
    if (player === "A") {
      if (move === "FL") return [row - 2, col - 2];
      if (move === "FR") return [row - 2, col + 2];
      if (move === "BL") return [row + 2, col - 2];
      if (move === "BR") return [row + 2, col + 2];
    } else if (player === "B") {
      if (move === "FL") return [row + 2, col + 2];
      if (move === "FR") return [row + 2, col - 2];
      if (move === "BL") return [row - 2, col - 2];
      if (move === "BR") return [row - 2, col + 2];
    }
    return [row, col];
  }
}

// DOM Elements
const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const restartButton = document.getElementById("restartButton");
const ws = new WebSocket("ws://localhost:8765");
let selectedPiece = null;

// WebSocket event handlers
ws.onopen = function () {
  console.log("Connected to WebSocket server.");
};

function checkForWin() {
  const playerAChars = gameState.board
    .flat()
    .filter((cell) => cell && cell.startsWith("A"));
  const playerBChars = gameState.board
    .flat()
    .filter((cell) => cell && cell.startsWith("B"));

  if (playerAChars.length === 0) {
    alert("Player B wins!");
    ws.send(JSON.stringify({ type: "game_over", winner: "B" }));
    disableMoveButtons();
    return true;
  } else if (playerBChars.length === 0) {
    alert("Player A wins!");
    ws.send(JSON.stringify({ type: "game_over", winner: "A" }));
    disableMoveButtons();
    return true;
  }
  return false;
}

// WebSocket event handlers
ws.onmessage = function (event) {
  const data = JSON.parse(event.data);
  console.log("Received data from server:", data);

  if (data.status === "valid") {
    gameState.board = data.new_state.board; // Update the board state
    renderBoard(gameState.board); // Re-render the entire board
    gameState.current_player = data.new_state.current_player; // Update current player status
    statusElement.innerText = `Current Player: ${gameState.current_player}`;
    selectedPiece = null; // Reset selected piece

    // Check for win condition
    if (!checkForWin()) {
      disableMoveButtons(); // Disable all move buttons after move
    }
  } else {
    // If the move was invalid, don't change the player turn
    alert(data.message); // Show an alert for the invalid move
    // Enable the move buttons for retrying the move
    enableValidMoves(selectedPiece.piece, selectedPiece.row, selectedPiece.col);
  }
};

ws.onerror = function (error) {
  console.log("WebSocket Error: ", error);
};

ws.onclose = function () {
  console.log("WebSocket connection closed.");
};

// Function to render the game board
function renderBoard(board) {
  boardElement.innerHTML = ""; // Clear the board
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = board[row][col];
      const cellDiv = document.createElement("div");
      cellDiv.className = "cell";
      cellDiv.dataset.row = row;
      cellDiv.dataset.col = col;
      if (cell) {
        cellDiv.innerText = cell; // Display the character name
        cellDiv.classList.add(cell[0]); // Apply the player color class (A or B)
        cellDiv.addEventListener("click", () => selectPiece(cell, row, col));
      }
      boardElement.appendChild(cellDiv);
    }
  }
}

function addMoveToHistory(move) {
  const moveHistoryElement = document.querySelector("#moveHistory ul");
  const moveItem = document.createElement("li");
  moveItem.innerText = move;
  moveHistoryElement.appendChild(moveItem);
}

// Function to select a piece
function selectPiece(piece, row, col) {
  selectedPiece = { piece, row, col };
  document
    .querySelectorAll(".cell")
    .forEach((cell) => cell.classList.remove("selected"));
  const selectedCell = document.querySelector(
    `[data-row="${row}"][data-col="${col}"]`
  );
  selectedCell.classList.add("selected");
  enableValidMoves(piece, row, col); // Enable only valid move buttons for the selected piece
  console.log("Selected piece:", selectedPiece);
}

// Function to enable only valid move buttons
function enableValidMoves(piece, row, col) {
  const moveButtons = {
    F: document.querySelector('.move-button[data-direction="F"]'),
    B: document.querySelector('.move-button[data-direction="B"]'),
    L: document.querySelector('.move-button[data-direction="L"]'),
    R: document.querySelector('.move-button[data-direction="R"]'),
    FL: document.querySelector('.move-button[data-direction="FL"]'),
    FR: document.querySelector('.move-button[data-direction="FR"]'),
    BL: document.querySelector('.move-button[data-direction="BL"]'),
    BR: document.querySelector('.move-button[data-direction="BR"]'),
  };

  // Hide all buttons initially
  Object.values(moveButtons).forEach(
    (button) => (button.style.display = "none")
  );

  // Get the character type and create an instance of the appropriate class
  let character;
  const characterType = piece.split("-")[1];
  if (characterType.startsWith("P")) {
    character = new Pawn();
  } else if (characterType === "H1") {
    character = new Hero1();
  } else if (characterType === "H2") {
    character = new Hero2();
  }

  // Get valid moves for the character
  const validMoves = character.getValidMoves(
    row,
    col,
    piece[0],
    gameState.board
  );

  // Show and enable only the valid move buttons
  validMoves.forEach((move) => {
    if (moveButtons[move]) {
      moveButtons[move].style.display = "inline-block";
      moveButtons[move].disabled = false;
    }
  });
}

// Disable all move buttons
function disableMoveButtons() {
  document.querySelectorAll(".move-button").forEach((button) => {
    button.disabled = true;
    button.style.display = "none";
  });
}

// Event listeners and other logic
document.querySelectorAll(".move-button").forEach((button) => {
  button.addEventListener("click", () => {
    const direction = button.dataset.direction;
    sendMove(direction);
  });
});

// Function to send the move to the server
function sendMove(direction) {
  if (!selectedPiece) {
    alert("Please select a piece first!");
    return;
  }

  // Check if it's the current player's turn
  const currentPlayer = statusElement.innerText.split(": ")[1]; // Extract current player from the status text
  if (selectedPiece.piece[0] !== currentPlayer) {
    alert(`It's ${currentPlayer}'s turn!`);
    return;
  }

  const move = `${selectedPiece.piece}:${direction}`;
  console.log("Sending move:", move);
  ws.send(
    JSON.stringify({ type: "move", player: selectedPiece.piece[0], move })
  );
  gameState.moveHistory.push(move);
  addMoveToHistory(move);
  // Disable buttons after sending move to avoid double clicks
  disableMoveButtons();
}

// Restart button logic
restartButton.addEventListener("click", () => {
  ws.send(JSON.stringify({ type: "restart" }));
  selectedPiece = null; // Ensure no piece is selected after restarting
  disableMoveButtons(); // Disable move buttons until a piece is selected
});
