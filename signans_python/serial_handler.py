import serial
import serial.tools.list_ports
from log_manager import create_log
from main import app
import time
from fastapi import WebSocket
import asyncio

from state import reset_all

def find_esp32_port():
    ports = serial.tools.list_ports.comports()
    for port in ports:
        if "USB Serial" in port.description:
            return port.device
    return None

def connect_to_esp32(port: str):
    if app.state.ser is None or not app.state.ser.is_open:
        try:
            app.state.ser = serial.Serial(port, baudrate=115200, timeout=0)
            print(f"Connected to ESP32 on {port}")
            return True
        except serial.SerialException as e:
            print(f"Failed to connect to ESP32: {e}")
            return False

def disconnect_from_esp32():
    if app.state.ser and app.state.ser.is_open:
        app.state.ser.close()
        print("Disconnected from ESP32.")                   # TO-DO: RESET ALL CHECKS

    if app.state.draw_task is not None:
        app.state.draw_task.cancel()
        print("Task cancelled.")

async def reset_esp32():
    if app.state.ser and app.state.ser.is_open:
        try:
            # Toggle DTR to simulate a reset
            app.state.ser.dtr = False
            time.sleep(0.1)
            app.state.ser.dtr = True
            time.sleep(1.0)

            reset_all()
            # reconnect to port again
            disconnect_from_esp32()
            port = find_esp32_port()
            if port:
                connect_to_esp32(port)
            else:
                create_log("ERROR: No port found")
            
            create_log("ESP32 has been reset via DTR toggle.")
            return True
        except Exception as e:
            create_log(f"Failed to reset ESP32: {e}")
            return False
    else:
        create_log("Serial connection not open. Cannot reset ESP32.")
        return False


def write_to_esp32(input: str):
    try:
        command = input.strip() + '\n'
        app.state.ser.write(command.encode())
        return create_log(f"Send: {input}")
    except Exception as e:
        disconnect_from_esp32()
        return f"ERROR: could not write to ESP32 - {str(e)}"

async def read_serial_lines(websocket: WebSocket, condition="ok", timeout=10):
    start_time = time.time()
    processing_repsonse = True

    while processing_repsonse:
        if app.state.ser and app.state.ser.in_waiting > 0:
            line = app.state.ser.readline().decode('utf-8').strip()

            if "echo:busy: processing" in line:
                continue

            line = line.replace("echo:", "")
            log = create_log(f"Received: {line}")

            # SEND each line as soon as it's received
            await websocket.send_text(log)

            # Stop if condition is met
            if condition in line:
                processing_repsonse = False

        # Timeout
        if time.time() - start_time > timeout:
            processing_repsonse = False

        await asyncio.sleep(0.01)

