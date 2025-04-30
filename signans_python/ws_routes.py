from fastapi import WebSocket, WebSocketDisconnect, APIRouter
from fastapi.websockets import WebSocketDisconnect, WebSocketState
from device_scanner import getConnectionStatus
from serial_handler import write_to_esp32
from log_manager import get_logs
from draw_loop import main_draw_loop
from main import app
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


@router.websocket("/ws/steps/")
async def websocket_steps(websocket: WebSocket):
    await websocket.accept()
    while websocket.client_state == WebSocketState.CONNECTED:
        try:
            await asyncio.sleep(1)
        except WebSocketDisconnect:
            print("Client disconnected from /steps")
            pass


@router.websocket("/ws/drawLoopArming/")
async def websocket_drawLoopArming(websocket: WebSocket):
    await websocket.accept()

    # Send current state upon connection
    task = getattr(app.state, 'draw_task', None)
    if task is not None and not task.done():
        await websocket.send_text("Drawing")
    else:
        await websocket.send_text("Stopped")


    try:
        while websocket.client_state == WebSocketState.CONNECTED:
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


