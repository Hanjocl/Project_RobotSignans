import serial
import serial.tools.list_ports
from log_manager import create_log, get_latest_log
from main import app
import time
from fastapi import WebSocket
import numpy as np
import asyncio
import re
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
        if app.state.ser and input is not None and "ok" in get_latest_log():
            command = input.strip() + '\n'
            app.state.ser.write(command.encode())
            return f"Send: {input}"
    except Exception as e:
        disconnect_from_esp32()
        return f"ERROR: could not write to ESP32 - {str(e)}"


async def read_serial_lines(websocket: WebSocket = None, condition="ok", timeout=4):
    start_time = time.time()
    update_time = start_time
    processing_response = True
    buffer = ""
    while processing_response:
        if app.state.ser and app.state.ser.in_waiting > 0:
            # Read bytes (non-blocking)
            raw = app.state.ser.read(app.state.ser.in_waiting)
            try:
                buffer += raw.decode("utf-8")
            except UnicodeDecodeError:
                print("ERROR: Unicode Decoder failed to decode")
                continue  # Skip malformed data

            # Process full lines
            while "\n" in buffer:

                line, buffer = buffer.split("\n", 1)
                line = line.strip()

                if "echo:busy: processing" in line:
                    continue

                if websocket is not None:
                    line = line.replace("echo:", "")
                    log = create_log(f"Received: {line}")
                    await websocket.send_text(log)
                else:
                    print(line)

                if condition in line:
                    processing_response = False

        if time.time() - update_time > timeout:
            processing_response = False

        update_time = time.time()
        await asyncio.sleep(0.01)  # Let event loop breathe

    return True

async def get_position(condition="ok", timeout=10):
    start_time = time.time()
    processing_repsonse = True
    response = ""

    write_to_esp32("M114")
    while processing_repsonse:
        if app.state.ser and app.state.ser.in_waiting > 0:
            line = app.state.ser.readline().decode('utf-8').strip()

            if "echo:busy: processing" in line:
                continue

            # Add each line as soon as it's received
            response += str(line)

            # Stop if condition is met
            if condition in line:
                processing_repsonse = False

                match = re.search(r'X:([-\d.]+)\s+Y:([-\d.]+)\s+Z:([-\d.]+)', response)
                if not match:
                    raise ValueError("Failed to parse position from M114 response")
                
                captured_position = np.array([float(match.group(1)), float(match.group(2)),float(match.group(3))])
                
                return captured_position

        # Timeout
        if time.time() - start_time > timeout:
            processing_repsonse = False

        await asyncio.sleep(0.01)
