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
      if (move === "L") return [row, col + 1];
      if (move === "R") return [row, col - 1];
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

  // Check if a piece is at the baseline and restrict moves accordingly
  restrictMovesAtBaseline(row, col, player) {
    const isAtBaseline =
      (player === "A" && row === 4) || (player === "B" && row === 0);
    if (isAtBaseline && this.type !== "Hero2") {
      return ["F"]; // Only allow forward move for non-Hero2 pieces at the baseline
    } else if (this.type === "Hero2" && isAtBaseline) {
      // Allow only forward-left and forward-right for Hero2 at the baseline
      if (col === 0) return ["FR"];
      if (col === 4) return ["FL"];
      return ["FL", "FR"];
    }
    return this.moveSet; // No restriction if not at the baseline
  }
}

// Define a Pawn class
class Pawn extends Character {
  constructor() {
    super("Pawn", ["L", "R", "F", "B"]);
  }

  // getValidMoves(row, col, player, board) {
  //   this.moveSet = this.restrictMovesAtBaseline(row, col, player);
  //   return super.getValidMoves(row, col, player, board);
  // }
  getValidMoves(row, col, player, board) {
    const validMoves = [];
    const boardSize = 5; // Assuming a 5x5 board

    if (player === "A") {
      // Player A's perspective
      if (row > 0 && !board[row - 1][col]) validMoves.push("F"); // Forward (up)
      if (row < boardSize - 1 && !board[row + 1][col]) validMoves.push("B"); // Backward (down)
      if (col > 0 && !board[row][col - 1]) validMoves.push("L"); // Left
      if (col < boardSize - 1 && !board[row][col + 1]) validMoves.push("R"); // Right
    } else if (player === "B") {
      // Player B's perspective
      if (row < boardSize - 1 && !board[row + 1][col]) validMoves.push("F"); // Forward (down)
      if (row > 0 && !board[row - 1][col]) validMoves.push("B"); // Backward (up)
      if (col > 0 && !board[row][col - 1]) validMoves.push("L"); // Left
      if (col < boardSize - 1 && !board[row][col + 1]) validMoves.push("R"); // Right
    }

    return validMoves;
  }
}

// Define a Hero1 class
class Hero1 extends Character {
  constructor() {
    super("Hero1", ["L", "R", "F", "B"]);
  }

  // getValidMoves(row, col, player, board) {
  //   this.moveSet = this.restrictMovesAtBaseline(row, col, player);
  //   return super.getValidMoves(row, col, player, board);
  // }
  calculateNewPosition(row, col, move, player) {
    if (player === "A") {
      // Player A's perspective
      if (move === "F") return [row - 2, col];
      if (move === "B") return [row + 2, col];
      if (move === "L") return [row, col - 2];
      if (move === "R") return [row, col + 2];
    } else if (player === "B") {
      // Player B's perspective (reversed)
      if (move === "F") return [row + 2, col];
      if (move === "B") return [row - 2, col];
      if (move === "L") return [row, col - 2];
      if (move === "R") return [row, col + 2];
    }
    return [row, col];
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
      if (move === "BL") return [row - 2, col + 2];
      if (move === "BR") return [row - 2, col - 2];
    }
    return [row, col];
  }

  getValidMoves(row, col, player, board) {
    this.moveSet = this.restrictMovesAtBaseline(row, col, player);
    return super.getValidMoves(row, col, player, board);
  }
}

// DOM Elements
const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const restartButton = document.getElementById("restartButton");
const moveHistoryElement = document.querySelector("#moveHistory ul");
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

  const winnerMessageElement = document.getElementById("winnerMessage");

  if (playerAChars.length === 0) {
    winnerMessageElement.innerText = "Player B wins!";
    winnerMessageElement.classList.add("winner");
    winnerMessageElement.style.color = "green"; // Adjust color as needed
    ws.send(JSON.stringify({ type: "game_over", winner: "B" }));
    disableMoveButtons();
    return true;
  } else if (playerBChars.length === 0) {
    winnerMessageElement.innerText = "Player A wins!";
    winnerMessageElement.classList.add("winner");
    winnerMessageElement.style.color = "green"; // Adjust color as needed
    ws.send(JSON.stringify({ type: "game_over", winner: "A" }));
    disableMoveButtons();
    return true;
  }
  return false;
}

ws.onmessage = function (event) {
  const data = JSON.parse(event.data);
  console.log("Received data from server:", data);

  if (data.status === "valid") {
    gameState.board = data.new_state.board; // Update the board state
    renderBoard(gameState.board); // Re-render the entire board
    gameState.current_player = data.new_state.current_player; // Update current player status
    statusElement.innerText = `Current Player: ${gameState.current_player}`;
    selectedPiece = null; // Reset selected piece

    // Rotate the board based on the current player
    updateBoardRotation();

    // Check for win condition
    if (!checkForWin()) {
      disableMoveButtons(); // Disable all move buttons after move
    }
  } else {
    alert(data.message); // Show an alert for the invalid move
    enableValidMoves(selectedPiece.piece, selectedPiece.row, selectedPiece.col);
  }
};

ws.onerror = function (error) {
  console.log("WebSocket Error: ", error);
};

ws.onclose = function () {
  console.log("WebSocket connection closed.");
};

function updateBoardRotation() {
  if (gameState.current_player === "A") {
    boardElement.classList.add("rotated-board");
  } else {
    boardElement.classList.remove("rotated-board");
  }
}

// function renderBoard(board) {
//   boardElement.innerHTML = ""; // Clear the board
//   for (let row = 0; row < board.length; row++) {
//     for (let col = 0; col < board[row].length; col++) {
//       const cell = board[row][col];
//       const cellDiv = document.createElement("div");
//       cellDiv.className = "cell";
//       cellDiv.dataset.row = row;
//       cellDiv.dataset.col = col;
//       if (cell) {
//         cellDiv.innerText = cell; // Display the character name
//         cellDiv.classList.add(cell[0]); // Apply the player color class (A or B)
//         cellDiv.addEventListener("click", () => selectPiece(cell, row, col));
//       }
//       boardElement.appendChild(cellDiv);
//     }
//   }
// }

function selectPiece(piece, row, col) {
  selectedPiece = { piece, row, col };
  document
    .querySelectorAll(".cell")
    .forEach((cell) => cell.classList.remove("selected"));
  const selectedCell = document.querySelector(
    `[data-row="${row}"][data-col="${col}"]`
  );
  selectedCell.classList.add("selected");
  enableValidMoves(piece, row, col);
}

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
  // Object.values(moveButtons).forEach(
  //   (button) => (button.style.display = "none")
  // );

  let character;
  const characterType = piece.split("-")[1];
  if (characterType.startsWith("P")) {
    character = new Pawn();
  } else if (characterType === "H1") {
    character = new Hero1();
  } else if (characterType === "H2") {
    character = new Hero2();
  }

  const validMoves = character.getValidMoves(
    row,
    col,
    piece[0],
    gameState.board
  );
  Object.values(moveButtons).forEach(
    (button) => (button.style.display = "none")
  );
  validMoves.forEach((move) => {
    if (moveButtons[move]) {
      moveButtons[move].style.display = "inline-block";
      moveButtons[move].disabled = false;
    }
  });

  // Adjust button labels based on the current player's perspective
  if (gameState.current_player === "B") {
    moveButtons.F.innerText = "B";
    moveButtons.B.innerText = "F";
    moveButtons.R.innerText = "R";
    moveButtons.L.innerText = "L";
    moveButtons.FL.innerText = "BR";
    moveButtons.FR.innerText = "BL";
    moveButtons.BL.innerText = "FR";
    moveButtons.BR.innerText = "FL";
  } else {
    moveButtons.F.innerText = "B";
    moveButtons.B.innerText = "F";
    moveButtons.R.innerText = "R";
    moveButtons.L.innerText = "L";
    moveButtons.FL.innerText = "BR";
    moveButtons.FR.innerText = "BL";
    moveButtons.BL.innerText = "FR";
    moveButtons.BR.innerText = "FL";
  }

  // Show and enable only the valid move buttons
  validMoves.forEach((move) => {
    if (moveButtons[move]) {
      moveButtons[move].style.display = "inline-block";
      moveButtons[move].disabled = false;
    }
  });
}

function disableMoveButtons() {
  document.querySelectorAll(".move-button").forEach((button) => {
    button.disabled = true;
    button.style.display = "none";
  });
}

// document.querySelectorAll(".move-button").forEach((button) => {
//   button.addEventListener("click", () => {
//     const direction = button.dataset.direction;
//     sendMove(direction);
//   });
// });
document.querySelectorAll(".move-button").forEach((button) => {
  button.addEventListener("click", () => {
    const direction = button.getAttribute("data-direction"); // Ensure we use data-direction
    sendMove(direction);
  });
});

function sendMove(direction) {
  if (!selectedPiece) {
    alert("Please select a piece first!");
    return;
  }

  const currentPlayer = statusElement.innerText.split(": ")[1];
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
  disableMoveButtons();
}

function addMoveToHistory(move) {
  const moveHistoryElement = document.querySelector("#moveHistory ul");
  const moveItem = document.createElement("li");
  moveItem.innerText = move; // Add the correct move to history
  moveHistoryElement.appendChild(moveItem);
}
restartButton.addEventListener("click", () => {
  ws.send(JSON.stringify({ type: "restart" }));
  selectedPiece = null;
  disableMoveButtons();
  gameState.current_player = "A"; // Reset to Player A's turn
  updateBoardRotation(); // Reset board orientation
  moveHistoryElement.innerHTML = ""; // Clear move history

  // Clear the winner message
  const winnerMessageElement = document.getElementById("winnerMessage");
  winnerMessageElement.innerText = "";
  winnerMessageElement.classList.remove("winner");
});

function selectPiece(piece, row, col) {
  selectedPiece = { piece, row, col };

  // Clear previous selections
  document
    .querySelectorAll(".cell")
    .forEach((cell) => cell.classList.remove("selected"));

  // Highlight the selected cell
  const selectedCell = document.querySelector(
    `[data-row="${row}"][data-col="${col}"]`
  );
  selectedCell.classList.add("selected");

  // Update the selected piece display
  const selectedPieceElement = document.getElementById("selectedPiece");
  selectedPieceElement.innerText = `Selected: ${piece}`;

  // Enable valid moves for the selected piece
  enableValidMoves(piece, row, col);
  console.log("Selected piece:", selectedPiece);
}

function updateBoardState(currentPosition, newPosition, character) {
  const [oldRow, oldCol] = currentPosition;
  const [newRow, newCol] = newPosition;

  // Check if the destination cell is occupied by an opponent's piece
  const targetCell = gameState.board[newRow][newCol];
  if (targetCell && targetCell[0] !== character[0]) {
    // An opponent's piece is captured
    console.log(`${targetCell} captured by ${character}`);

    // Add capture information to the move history
    const captureMove = `${character}:${getDirectionName(
      currentPosition,
      newPosition
    )} (Captured ${targetCell})`;
    gameState.moveHistory.push(captureMove);
    addMoveToHistory(captureMove);
  } else {
    // Regular move
    const move = `${character}:${getDirectionName(
      currentPosition,
      newPosition
    )}`;
    gameState.moveHistory.push(move);
    addMoveToHistory(move);
  }

  // Move the piece
  gameState.board[oldRow][oldCol] = ""; // Clear the old position
  gameState.board[newRow][newCol] = character; // Place the piece in the new position
}

function getDirectionName(currentPosition, newPosition) {
  const [oldRow, oldCol] = currentPosition;
  const [newRow, newCol] = newPosition;

  if (oldRow > newRow && oldCol === newCol) return "F"; // Forward
  if (oldRow < newRow && oldCol === newCol) return "B"; // Backward
  if (oldRow === newRow && oldCol > newCol) return "L"; // Left
  if (oldRow === newRow && oldCol < newCol) return "R"; // Right
  if (oldRow > newRow && oldCol > newCol) return "FL"; // Forward-Left
  if (oldRow > newRow && oldCol < newCol) return "FR"; // Forward-Right
  if (oldRow < newRow && oldCol > newCol) return "BL"; // Backward-Left
  if (oldRow < newRow && oldCol < newCol) return "BR"; // Backward-Right
}

function processMove(player, move) {
  const [character, direction] = move.split(":");
  const currentPosition = findCharacterPosition(character);

  if (!currentPosition) {
    return { status: "invalid", message: "Character not found." };
  }

  const newPosition = calculateNewPosition(
    currentPosition,
    direction,
    character
  );

  if (!isValidMove(newPosition, player)) {
    return { status: "invalid", message: "Invalid move." };
  }

  // Handle capture and update the board state
  updateBoardState(currentPosition, newPosition, character);

  // Change the current player
  gameState.current_player = player === "A" ? "B" : "A";

  return { status: "valid", new_state: gameState };
}

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
