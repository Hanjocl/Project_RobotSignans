from fastapi import WebSocket, WebSocketDisconnect, APIRouter
from fastapi.websockets import WebSocketDisconnect, WebSocketState
from device_scanner import getConnectionStatus
from serial_handler import write_to_esp32
from log_manager import get_logs
from draw_loop import main_draw_loop
from main import app
import json
import asyncio
import re
from state import shared_positions, shared_status, Position3D

router = APIRouter()

@router.websocket("/ws/connectionStatus/")
async def websocket_status(websocket: WebSocket):
    await websocket.accept()
    while websocket.client_state == WebSocketState.CONNECTED:
        try:
            await websocket.send_text(str(getConnectionStatus()))
            await asyncio.sleep(1)
        except WebSocketDisconnect:
            print("Client disconnected from /connectionStatus")
            break

@router.websocket("/ws/commander/")
async def websocket_commander(websocket: WebSocket):
    await websocket.accept()

    # Send all stored logs
    for entry in get_logs():
        await websocket.send_text(entry)

    while websocket.client_state == WebSocketState.CONNECTED:
        try:
            data = await websocket.receive_text()
            data = data.upper()
            if app.state.ser and getConnectionStatus():
                response = write_to_esp32(data)
                await websocket.send_text(response)
        except WebSocketDisconnect:
            print("Client disconnected from /commander")
            break


@router.websocket("/ws/steps/")
async def websocket_steps(websocket: WebSocket):
    await websocket.accept()

    # Send current status of all steps
    for step, status in shared_status.status.items():
        await websocket.send_json({ "step": step, "status": status })

    while websocket.client_state == WebSocketState.CONNECTED:
        try:
            # Wait for a message from the client
            message = await websocket.receive_text()

            # Parse the received JSON message
            data = json.loads(message)
            step = data.get("step")
            status = data.get("status")

            # Update step status
            if step and status:
                if shared_status.status.update(step, status):
                    print(f"Updated step '{step}' to {status}", flush=True)
                    await websocket.send_json({ "step": step, "status": status })
                else:
                    await websocket.send_text(f"Step '{step}' not found.")
            else:
                await websocket.send_text("Invalid message format. 'step' and 'status' are required.")
        
        except WebSocketDisconnect:
            print("Client disconnected from /steps")
            break

@router.websocket("/ws/captureCornerPosition/")
async def websocket_capture_position(websocket: WebSocket):
    await websocket.accept()        

    # Send back already captured positions upon connection
    for name, position in shared_positions.corner_positions.items():
        if position is not None:
            await websocket.send_json({
                "status": "captured",
                "positionName": name,
                "position": position.to_list()
            })

    while websocket.client_state == WebSocketState.CONNECTED:
        try:
            message = await websocket.receive_text()
            data = json.loads(message)

            command = data.get("command")
            position_name = data.get("positionName")

            if command == "capture" and position_name in shared_positions.corner_positions:

                response = write_to_esp32("M114")

                match = re.search(r'X:([-\d.]+)\s+Y:([-\d.]+)\s+Z:([-\d.]+)', response)
                if not match:
                    raise ValueError("Failed to parse position from M114 response")

                captured_position = Position3D(
                    float(match.group(1)),
                    float(match.group(2)),
                    float(match.group(3))
                )

                shared_positions.corner_positions[position_name] = captured_position
                print(shared_positions.corner_positions["topLeft"].Z)

                await websocket.send_json({
                    "status": "captured",
                    "positionName": position_name,
                    "position": captured_position.to_list()
                })

            else:
                await websocket.send_json({
                    "status": "error",
                    "message": f"Invalid command or unknown position '{position_name}'"
                })

        except WebSocketDisconnect:
            print("Client disconnected")
            break

        except Exception as e:
            await websocket.send_json({
                "status": "error",
                "message": str(e)
            })

@router.websocket("/ws/captureCameraPosition/")
async def websocket_capture_position(websocket: WebSocket):
    await websocket.accept()        

    # Send back already captured camera position on connection
    for name, position in shared_positions.camera_position.items():
        if position is not None:
            await websocket.send_json({
                "status": "captured",
                "positionName": name,
                "position": position  # Now a list: [x, y, z]
            })

    while websocket.client_state == WebSocketState.CONNECTED:
        try:
            message = await websocket.receive_text()
            data = json.loads(message)

            command = data.get("command")
            position_name = data.get("positionName")

            if command == "capture" and position_name == "cameraPosition":

                response = write_to_esp32("M114")
                match = re.search(r'X:([-\d.]+)\s+Y:([-\d.]+)\s+Z:([-\d.]+)', response)
                if not match:
                    raise ValueError("Failed to parse position from M114 response")

                # Store as a list [x, y, z]
                captured_position = [
                    float(match.group(1)),
                    float(match.group(2)),
                    float(match.group(3))
                ]

                shared_positions.camera_position[position_name] = captured_position

                await websocket.send_json({
                    "status": "captured",
                    "positionName": position_name,
                    "position": captured_position
                })

            else:
                await websocket.send_json({
                    "status": "error",
                    "message": f"Invalid command or unknown position '{position_name}'"
                })

        except WebSocketDisconnect:
            print("Client disconnected")
            break

        except Exception as e:
            await websocket.send_json({
                "status": "error",
                "message": str(e)
            })



@router.websocket("/ws/drawLoopArming/")
async def websocket_drawLoopArming(websocket: WebSocket):
    await websocket.accept()

    # Send current state upon connection
    task = getattr(app.state, 'draw_task', None)
    if task is not None and not task.done():
        await websocket.send_text("Drawing")
    else:
        await websocket.send_text("Stopped")


    while websocket.client_state == WebSocketState.CONNECTED:
        try:
            data = await websocket.receive_text()

            if data == "TryStartDrawing":
                app.state.draw_task = asyncio.create_task(main_draw_loop())         # TO-DO: wrap in if statement to check if everything is setup right
                print("TASK: Start drawing")
                
                await websocket.send_text("Drawing")
            elif data == "Stop":
                print("TASK: Stop drawing")
                app.state.draw_task.cancel()
                await websocket.send_text("Stopped")
            else:
                await websocket.send_text("ERROR")
        except WebSocketDisconnect:
            print("Client disconnected.")