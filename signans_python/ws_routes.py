from fastapi import WebSocket, WebSocketDisconnect, APIRouter
from fastapi.websockets import WebSocketDisconnect, WebSocketState
from device_scanner import getConnectionStatus
from serial_handler import write_to_esp32
from log_manager import get_logs
from draw_loop import main_draw_loop
from main import app
import json
import asyncio

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


# In-memory storage for step statuses
step_status = {
    "Homing": "pending",
    "Connect Wires": "pending",
    "Corner Calibration": "pending",
    "Camera Calibration": "pending",
    "Final Checklist": "pending"
}

@router.websocket("/ws/steps/")
async def websocket_steps(websocket: WebSocket):
    await websocket.accept()

    for step, status in step_status.items():
        await websocket.send_json({ "step": step, "status": status })


    while websocket.client_state == WebSocketState.CONNECTED:
        try:        
            # Wait for a message from the client
            message = await websocket.receive_text()

            # Parse the received JSON message
            data = json.loads(message)
            step = data.get("step")
            status = data.get("status")

            # Update step status if step and status are provided
            if step and status:
                if step in step_status:
                    step_status[step] = status  # Update the status for the specific step
                    print(f"Updated step '{step}' to {status}", flush=True)

                    # Send the updated status back to the client
                    await websocket.send_json({
                        "step": step,
                        "status": status
                    })
                else:
                    await websocket.send_text(f"Step '{step}' not found.")
            else:
                await websocket.send_text("Invalid message format. 'step' and 'status' are required.")
    
        except WebSocketDisconnect:
            print("Client disconnected from /steps")
            break

# Use this to store predefined positions
Corner_positions = {
    "topLeft": None,
    "topRight": None,
    "bottomLeft": None,
    "bottomRight": None
}

@router.websocket("/ws/capturePosition/")
async def websocket_capture_position(websocket: WebSocket):
    await websocket.accept()        

    # Send back already captured positions upon connection
    for name, position in Corner_positions.items():
        if position is not None:
            await websocket.send_json({
                "status": "captured",
                "positionName": name,
                "position": position
            })

    while websocket.client_state == WebSocketState.CONNECTED:
        try:
            message = await websocket.receive_text()
            data = json.loads(message)

            command = data.get("command")
            position_name = data.get("positionName")

            if command == "capture" and position_name in Corner_positions:
                # Simulate capturing a position
                captured_position = {                                   #TODO -> Add capture with M114 to marlin
                    "x": 0,
                    "y": 10,
                    "z": 50
                }

                Corner_positions[position_name] = captured_position

                # Send back the captured position
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