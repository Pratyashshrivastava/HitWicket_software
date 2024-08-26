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

ws.onmessage = function (event) {
  const data = JSON.parse(event.data);
  console.log("Received data from server:", data);

  if (data.status === "valid") {
    renderBoard(data.new_state.board); // Re-render the entire board
    statusElement.innerText = `Current Player: ${data.new_state.current_player}`; // Update current player status
    selectedPiece = null; // Reset selected piece
    disableMoveButtons(); // Disable all move buttons after move
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

  // Disable all buttons initially
  Object.values(moveButtons).forEach((button) => (button.disabled = true));

  // Determine valid moves based on the piece type and enable those buttons
  const validMoves = getValidMoves(piece, row, col);
  validMoves.forEach((move) => {
    if (moveButtons[move]) {
      moveButtons[move].disabled = false; // Enable only valid move buttons
    }
  });
}

// Function to determine valid moves for the selected piece
function getValidMoves(piece, row, col) {
  const validMoves = [];
  const characterType = piece.split("-")[1]; // Get the type (P1, H1, H2)
  const player = piece[0]; // Get the player (A or B)

  if (
    characterType === "P1" ||
    characterType === "P2" ||
    characterType === "P3"
  ) {
    // Pawns move one block in any direction
    if (isValidPosition(row - 1, col, player)) validMoves.push("F");
    if (isValidPosition(row + 1, col, player)) validMoves.push("B");
    if (isValidPosition(row, col - 1, player)) validMoves.push("L");
    if (isValidPosition(row, col + 1, player)) validMoves.push("R");
  } else if (characterType === "H1") {
    // Hero1 moves two blocks straight in any direction
    if (isValidPosition(row - 2, col, player)) validMoves.push("F");
    if (isValidPosition(row + 2, col, player)) validMoves.push("B");
    if (isValidPosition(row, col - 2, player)) validMoves.push("L");
    if (isValidPosition(row, col + 2, player)) validMoves.push("R");
  } else if (characterType === "H2") {
    // Hero2 moves two blocks diagonally in any direction
    if (isValidPosition(row - 2, col - 2, player)) validMoves.push("FL");
    if (isValidPosition(row - 2, col + 2, player)) validMoves.push("FR");
    if (isValidPosition(row + 2, col - 2, player)) validMoves.push("BL");
    if (isValidPosition(row + 2, col + 2, player)) validMoves.push("BR");
  }

  return validMoves;
}

// Helper function to check if a move is valid based on the board and player
function isValidPosition(newRow, newCol, player) {
  const boardSize = 5;

  // Check if the position is within the board boundaries
  if (newRow < 0 || newRow >= boardSize || newCol < 0 || newCol >= boardSize) {
    return false;
  }

  // Get the target cell content
  const targetCell = boardElement.querySelector(
    `[data-row="${newRow}"][data-col="${newCol}"]`
  );

  // Check if the target cell is empty or contains an opponent's piece
  if (!targetCell.innerText || !targetCell.innerText.startsWith(player)) {
    return true;
  }

  return false;
}

// Disable all move buttons
function disableMoveButtons() {
  document.querySelectorAll(".move-button").forEach((button) => {
    button.disabled = true;
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

  // Keep the move buttons enabled to allow retrying after an invalid move
}

// Restart button logic
restartButton.addEventListener("click", () => {
  ws.send(JSON.stringify({ type: "restart" }));
  selectedPiece = null; // Ensure no piece is selected after restarting
  disableMoveButtons(); // Disable move buttons until a piece is selected
});
