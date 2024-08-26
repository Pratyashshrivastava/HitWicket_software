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

# 1. Initialization Function
def initialize_game():
    game_state["players"]["A"] = ["A-P1", "A-P2", "A-H1", "A-H2", "A-P3"]
    game_state["players"]["B"] = ["B-P1", "B-P2", "B-H1", "B-H2", "B-P3"]

    # Place players on the board
    game_state["board"][0] = game_state["players"]["A"]
    game_state["board"][4] = game_state["players"]["B"]

initialize_game()

# 2. Game Logic Functions
def find_character_position(character):
    for row in range(5):
        for col in range(5):
            if game_state["board"][row][col] == character:
                return (row, col)
    return None

def calculate_new_position(current_position, direction, character):
    row, col = current_position
    if direction == "F":
        return (row - 1, col) if character.startswith("A") else (row + 1, col)
    elif direction == "B":
        return (row + 1, col) if character.startswith("A") else (row - 1, col)
    elif direction == "L":
        return (row, col - 1)
    elif direction == "R":
        return (row, col + 1)
    # Add logic for diagonal moves for Hero2
    return (row, col)  # Placeholder

def is_valid_move(new_position, player):
    row, col = new_position
    if not (0 <= row < 5 and 0 <= col < 5):
        return False
    target = game_state["board"][row][col]
    if target and target.startswith(player):
        return False  # Can't move to a space occupied by a friendly character
    return True

def update_board_state(current_position, new_position, character):
    old_row, old_col = current_position
    new_row, new_col = new_position
    game_state["board"][old_row][old_col] = ""
    game_state["board"][new_row][new_col] = character

def check_for_captures(position):
    # Implement logic to remove captured characters
    pass

def process_move(player, move):
    character, direction = move.split(":")
    current_position = find_character_position(character)
    if not current_position:
        return {"status": "invalid", "message": "Character not found."}

    new_position = calculate_new_position(current_position, direction, character)
    if not is_valid_move(new_position, player):
        return {"status": "invalid", "message": "Invalid move."}

    update_board_state(current_position, new_position, character)
    check_for_captures(new_position)
    game_state["current_player"] = "B" if player == "A" else "A"
    return {"status": "valid", "new_state": game_state}

# 3. WebSocket Handling
# async def handle_connection(websocket, path):
#     # Send the initial game state to the client upon connection
#     await websocket.send(json.dumps({"status": "valid", "new_state": game_state}))
    
#     async for message in websocket:
#         data = json.loads(message)
#         if data["type"] == "move":
#             player = data["player"]
#             if player != game_state["current_player"]:
#                 await websocket.send(json.dumps({"status": "invalid", "message": "Not your turn."}))
#                 continue

#             move_result = process_move(player, data["move"])
#             if move_result["status"] == "valid":
#                 # Send the updated game state to the client
#                 await websocket.send(json.dumps({"status": "valid", "new_state": move_result["new_state"]}))
#             else:
#                 await websocket.send(json.dumps(move_result))

async def handle_connection(websocket, path):
    print("Client connected")
    
    # Send a test message to the client upon connection
    await websocket.send(json.dumps({
        "status": "valid",
        "new_state": game_state,
        "message": "Welcome! Here is the initial game state."
    }))
    
    async for message in websocket:
        data = json.loads(message)
        if data["type"] == "move":
            player = data["player"]
            if player != game_state["current_player"]:
                await websocket.send(json.dumps({"status": "invalid", "message": "Not your turn."}))
                continue

            move_result = process_move(player, data["move"])
            if move_result["status"] == "valid":
                await websocket.send(json.dumps({"status": "valid", "new_state": move_result["new_state"]}))
            else:
                await websocket.send(json.dumps(move_result))



async def main():
    async with websockets.serve(handle_connection, "localhost", 8765):
        print("WebSocket server started on ws://localhost:8765")
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())
