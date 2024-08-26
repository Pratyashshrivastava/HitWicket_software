# import asyncio
# import websockets
# import json

# # Simplified echo server for debugging
# async def handle_connection(websocket, path):
#     print("Client connected")
    
#     try:
#         async for message in websocket:
#             print(f"Received message from client: {message}")  # Log the received message
#             response = {
#                 "status": "received",
#                 "original_message": message,
#                 "message": "Message received successfully"
#             }
#             await websocket.send(json.dumps(response))  # Echo back a response to the client
#     except websockets.exceptions.ConnectionClosed as e:
#         print(f"Connection closed: {e}")

# async def main():
#     async with websockets.serve(handle_connection, "localhost", 8765):
#         print("WebSocket server started on ws://localhost:8765")
#         await asyncio.Future()  # Keep running

# if __name__ == "__main__":
#     asyncio.run(main())


import asyncio
import websockets
import json

# Global game state
game_state = {
    "players": {
        "A": [],
        "B": []
    },
    "board": [["" for _ in range(5)] for _ in range(5)],
    "current_player": "A",
    "move_history": []
}

# def initialize_game():
#     game_state["players"]["A"] = ["A-P1", "A-P2", "A-H1", "A-H2", "A-P3"]
#     game_state["players"]["B"] = ["B-P1", "B-P2", "B-H1", "B-H2", "B-P3"]

#     # Place players on the board
#     game_state["board"][0] = game_state["players"]["A"]
#     game_state["board"][4] = game_state["players"]["B"]

#     print("Initial game state:", game_state)
def initialize_game():
    game_state["players"] = {
        "A": ["A-P1", "A-P2", "A-H1", "A-H2", "A-P3"],
        "B": ["B-P1", "B-P2", "B-H1", "B-H2", "B-P3"]
    }
    game_state["board"] = [["" for _ in range(5)] for _ in range(5)]
    
    # Place players on the board
    game_state["board"][0] = game_state["players"]["A"]
    game_state["board"][4] = game_state["players"]["B"]

    game_state["current_player"] = "A"
    game_state["move_history"] = []

    print("Game has been re-initialized.")
    print("Initial game state:", game_state)


initialize_game()

# 2. Game Logic Functions
def find_character_position(character):
    for row in range(5):
        for col in range(5):
            if game_state["board"][row][col] == character:
                return (row, col)
    return None

# def calculate_new_position(current_position, direction, character):
#     row, col = current_position
#     if direction == "F":
#         return (row - 1, col) if character.startswith("A") else (row + 1, col)
#     elif direction == "B":
#         return (row + 1, col) if character.startswith("A") else (row - 1, col)
#     elif direction == "L":
#         return (row, col - 1)
#     elif direction == "R":
#         return (row, col + 1)
#     # Add logic for diagonal moves for Hero2
#     return (row, col)  # Placeholder

def calculate_new_position(current_position, direction, character):
    row, col = current_position
    
    # Determine movement distance
    if character.endswith('H1'):  # Hero1 moves 2 blocks straight
        move_distance = 2
    elif character.endswith('H2'):  # Hero2 moves 2 blocks diagonally
        move_distance = 2
    else:  # Pawn moves 1 block in any direction
        move_distance = 1

    # Calculate new position based on the direction
    if direction == "F":
        return (row - move_distance, col) if character.startswith("A") else (row + move_distance, col)
    elif direction == "B":
        return (row + move_distance, col) if character.startswith("A") else (row - move_distance, col)
    elif direction == "L":
        return (row, col - move_distance)
    elif direction == "R":
        return (row, col + move_distance)
    elif direction == "FL":
        return (row - move_distance, col - move_distance) if character.startswith("A") else (row + move_distance, col + move_distance)
    elif direction == "FR":
        return (row - move_distance, col + move_distance) if character.startswith("A") else (row + move_distance, col - move_distance)
    elif direction == "BL":
        return (row + move_distance, col - move_distance) if character.startswith("A") else (row - move_distance, col + move_distance)
    elif direction == "BR":
        return (row + move_distance, col + move_distance) if character.startswith("A") else (row - move_distance, col - move_distance)
    
    return current_position  # If no valid direction, return original position


def is_valid_move(new_position, player, character, current_position, direction):
    row, col = new_position
    
    # Check if the new position is within the board boundaries
    if not (0 <= row < 5 and 0 <= col < 5):
        return False
    
    # Check if the new position targets a friendly character
    target = game_state["board"][row][col]
    if target and target.startswith(player):
        return False  # Can't move to a space occupied by a friendly character

    # Additional checks for Hero1 and Hero2
    if character.endswith('H1'):
        # Check if any opponent's character is in the path
        intermediate_positions = get_intermediate_positions(current_position, new_position, direction, character)
        for pos in intermediate_positions:
            inter_row, inter_col = pos
            if game_state["board"][inter_row][inter_col] and not game_state["board"][inter_row][inter_col].startswith(player):
                # An opponent is in the path and should be captured
                game_state["board"][inter_row][inter_col] = ""
    
    elif character.endswith('H2'):
        # Check for opponent's character in the diagonal path
        intermediate_positions = get_intermediate_positions(current_position, new_position, direction, character)
        for pos in intermediate_positions:
            inter_row, inter_col = pos
            if game_state["board"][inter_row][inter_col] and not game_state["board"][inter_row][inter_col].startswith(player):
                # An opponent is in the path and should be captured
                game_state["board"][inter_row][inter_col] = ""

    return True

def get_intermediate_positions(start, end, direction, character):
    start_row, start_col = start
    end_row, end_col = end
    positions = []
    
    if character.endswith('H1'):
        # Hero1 moves straight
        if direction in ['F', 'B']:
            positions.append(((start_row + end_row) // 2, start_col))
        elif direction in ['L', 'R']:
            positions.append((start_row, (start_col + end_col) // 2))

    elif character.endswith('H2'):
        # Hero2 moves diagonally
        positions.append(((start_row + end_row) // 2, (start_col + end_col) // 2))
    
    return positions



def update_board_state(current_position, new_position, character):
    old_row, old_col = current_position
    new_row, new_col = new_position
    game_state["board"][old_row][old_col] = ""
    game_state["board"][new_row][new_col] = character

def check_for_captures(position):
    # Implement logic to remove captured characters
    pass

# Function to process moves (same as before)
# def process_move(player, move):
#     # Ensure it's the correct player's turn
#     if player != game_state["current_player"]:
#         return {"status": "invalid", "message": "It's not your turn!"}

#     character, direction = move.split(":")
#     current_position = find_character_position(character)
#     if not current_position:
#         return {"status": "invalid", "message": "Character not found."}

#     new_position = calculate_new_position(current_position, direction, character)
#     if not is_valid_move(new_position, player, character, current_position, direction):
#         return {"status": "invalid", "message": "Invalid move."}

#     update_board_state(current_position, new_position, character)
#     check_for_captures(new_position)
#     game_state["current_player"] = "B" if player == "A" else "A"
#     return {"status": "valid", "new_state": game_state}


def process_move(player, move):
    # Ensure it's the correct player's turn
    if player != game_state["current_player"]:
        return {"status": "invalid", "message": "It's not your turn!"}

    character, direction = move.split(":")
    current_position = find_character_position(character)
    if not current_position:
        return {"status": "invalid", "message": "Character not found."}

    new_position = calculate_new_position(current_position, direction, character)
    if not is_valid_move(new_position, player, character, current_position, direction):
        return {"status": "invalid", "message": "Invalid move."}

    # If the move is valid, update the board state
    update_board_state(current_position, new_position, character)
    check_for_captures(new_position)
    game_state["current_player"] = "B" if player == "A" else "A"
    return {"status": "valid", "new_state": game_state}



# Simplified handler to ensure responses are working
# async def handle_connection(websocket, path):
#     print("Client connected")

#     # Send initial game state to the client
#     await websocket.send(json.dumps({
#         "status": "valid",
#         "new_state": game_state,
#         "message": "Welcome! Here is the initial game state."
#     }))

#     try:
#         async for message in websocket:
#             print(f"Received message from client: {message}")  # Log the received message
#             data = json.loads(message)

#             if data["type"] == "move":
#                 move_result = process_move(data["player"], data["move"])
#                 await websocket.send(json.dumps(move_result))
#             else:
#                 response = {
#                     "status": "received",
#                     "original_message": message,
#                     "message": "Unrecognized message type"
#                 }
#                 await websocket.send(json.dumps(response))
#     except websockets.exceptions.ConnectionClosed as e:
#         print(f"Connection closed: {e}")

async def handle_connection(websocket, path):
    print("Client connected")

    # Send initial game state to the client
    await websocket.send(json.dumps({
        "status": "valid",
        "new_state": game_state,
        "message": "Welcome! Here is the initial game state."
    }))

    try:
        async for message in websocket:
            print(f"Received message from client: {message}")  # Log the received message
            data = json.loads(message)

            if data["type"] == "move":
                move_result = process_move(data["player"], data["move"])
                await websocket.send(json.dumps(move_result))
            elif data["type"] == "restart":
                initialize_game()  # Restart the game
                await websocket.send(json.dumps({
                    "status": "valid",
                    "new_state": game_state,
                    "message": "Game restarted!"
                }))
            else:
                response = {
                    "status": "received",
                    "original_message": message,
                    "message": "Unrecognized message type"
                }
                await websocket.send(json.dumps(response))
    except websockets.exceptions.ConnectionClosed as e:
        print(f"Connection closed: {e}")

async def main():
    async with websockets.serve(handle_connection, "localhost", 8765):
        print("WebSocket server started on ws://localhost:8765")
        await asyncio.Future()  # Keep running

if __name__ == "__main__":
    asyncio.run(main())
