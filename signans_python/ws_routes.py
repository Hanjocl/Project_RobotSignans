import os
import time
import json
import asyncio

import cv2
from fastapi import WebSocket, WebSocketDisconnect, APIRouter
from fastapi.websockets import WebSocketState
from fastapi.responses import StreamingResponse
import numpy as np
from state import shared_positions, shared_status, set_all
from main import app
from device_scanner import getConnectionStatus
from serial_handler import reset_esp32, write_to_esp32, read_serial_lines, get_position
from log_manager import create_log, get_logs, get_latest_log
from draw_loop import main_draw_loop, main_test_loop, main_debug_loop
from camera_capture import stream_raw_frames, stream_transformed_frames, camera
from state import camera_perspective_transfrom, set_camera_transform
from gcode_commands import gcode_commands
import re

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

from starlette.websockets import WebSocketDisconnect, WebSocketState
import asyncio

@router.websocket("/ws/commander/")
async def websocket_commander(websocket: WebSocket):
    await websocket.accept()

    pattern = r'\b(?:' + '|'.join(re.escape(cmd) for cmd in gcode_commands) + r')\b'

    # Send initial logs
    for entry in get_logs():
        await websocket.send_text(entry)

    while websocket.client_state == WebSocketState.CONNECTED:
        try:
            # At this point, serial is available — receive a command
            data = await websocket.receive_text()
            data = data.upper()
            
            if data is None:
                create_log(f"ERROR: No command received. (Ok)")
                await websocket.send_text(get_latest_log())
                continue

            if data == "RESET":
                success = await reset_esp32()
                if success:
                    create_log("ESP32 Reset: SUCCESS (ok)")
                    await websocket.send_text(get_latest_log())         # ADD FULL RESET FOR STUFF
                else:
                    create_log("ESP32 Reset: FAILED (ok)")
                    await websocket.send_text(get_latest_log())
                continue
            elif data == "DEBUG":
                set_all()
                create_log("DEBUG MODE ACTIVATED: know what this does before using it... (ok)")
                await websocket.send_text(get_latest_log())
                continue


            if re.search(pattern, data) is None:
                print("ERROR: unknown command")
                await websocket.send_text(f"ERROR: Unknown command '{data}' was given. (Ok)")
                continue

            # Proceed only if serial is available and connected
            if app.state.ser and getConnectionStatus() and "ok" in get_latest_log():
                log = write_to_esp32(data)
                create_log(log)
                await websocket.send_text(get_latest_log())

                timeout = 540 if "G28" in data else 4
                await read_serial_lines(websocket, condition="ok", timeout=timeout)

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

    if websocket.client_state == WebSocketState.CONNECTED:
        # Send back already captured positions
        for name in shared_positions.get_corners():
            array = getattr(shared_positions, name)
            position = array.tolist()
            if position is not None and np.any(array != None):
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

            if command == "capture" and position_name in shared_positions.get_corners():
                # Store as a list [x, y, z]
                captured_position = await get_position()
                print("Position: ")
                print(captured_position)

                setattr(shared_positions, position_name, captured_position)

                await websocket.send_json({
                    "status": "captured",
                    "positionName": position_name,
                    "position": captured_position.tolist()
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
    pos = shared_positions.cameraPosition
    if pos is not None and np.any(pos != None):
        await websocket.send_json({
            "status": "captured",
            "positionName": "cameraPosition",
            "position": pos.tolist()  # Now a list: [x, y, z]
        })

    while websocket.client_state == WebSocketState.CONNECTED:
        try:
            message = await websocket.receive_text()
            data = json.loads(message)

            command = data.get("command")
            position_name = data.get("positionName")

            if command == "capture" and position_name == "cameraPosition":

                # Store as a list [x, y, z]
                captured_position = await get_position()

                shared_positions.cameraPosition = captured_position

                await websocket.send_json({
                    "status": "captured",
                    "positionName": position_name,
                    "position": captured_position.tolist()
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
                print("TASK: starting up drawing")
                app.state.draw_task = asyncio.create_task(main_draw_loop())         # TO-DO: wrap in if statement to check if everything is setup right
                
                await websocket.send_text("Drawing")
            elif data == "Stop":
                print("TASK: Stop drawing")
                app.state.draw_task.cancel()
                await websocket.send_text("Stopped")
            else:
                await websocket.send_text("ERROR")
        except WebSocketDisconnect:
            print("Client disconnected.")

@router.post("/capture")
def capture_image():
    success, frame = camera.read()
    if not success:
        return {"error": "Failed to capture image"}

    # Save the image with timestamp
    filename = f"captured_{int(time.time())}.jpg"
    filepath = os.path.join("captured_images", filename)
    cv2.imwrite(filepath, frame)

    # Return image path or public URL (if served)
    return {"filename": filename, "url": f"http://localhost:8000/captured/{filename}"}

@router.get("/video")
def video_feed_raw():
    return StreamingResponse(stream_raw_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

@router.get("/video_transformed")
def video_feed_transformed():
    return StreamingResponse(stream_transformed_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

@router.websocket("/ws/camera_perspective_transform/")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    camera_points = json.dumps(camera_perspective_transfrom.transform)

    # Send initial point data
    await websocket.send_text(camera_points)

    try:
        while True:
            data = await websocket.receive_text()
            updated_points = json.loads(data)
            set_camera_transform(camera_perspective_transfrom, updated_points)
    except WebSocketDisconnect:
        print("Client disconnected")