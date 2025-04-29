from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from contextlib import asynccontextmanager
import serial
import serial.tools.list_ports
import time
import threading
import uvicorn
import asyncio

# SERIAL STUFF
ser = None  # Will hold the serial connection

# Global variable to hold the connection state
connected = False

### BACK-END SERVER START UP
# Lifespan context manager for FastAPI startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("------------------------------")
    print("App is starting...")
    asyncio.create_task(scan_for_esp32())
    yield
    print("App is shutting down...")
    print("------------------------------") 

# Assign lifespan context manager to FastAPI app
app = FastAPI(lifespan=lifespan)
### END OF BACK-END SERVER START UP

### ESP32 COMMUNICATION
def find_esp32_port():
    ports = serial.tools.list_ports.comports()
    for port in ports:
        if ("USB Serial" in port.description):
            return port.device
    return None

def connect_to_esp32(port: str):
    """
    Function to establish a serial connection to the ESP32.
    """
    global ser
    if ser is None or not ser.is_open:
        try:
            ser = serial.Serial(port, baudrate=115200, timeout=0)
            print(f"Connected to ESP32 on {port}")
        except serial.SerialException as e:
            print(f"Failed to connect to ESP32: {e}")


def disconnect_from_esp32():
    """
    Function to close the serial connection.
    """
    global ser
    if ser and ser.is_open:
        ser.close()
        print("Disconnected from ESP32.")

# Function to scan for the ESP32 and update connection status
async def scan_for_esp32():
    global connected
    while True:
        esp32_port = await asyncio.to_thread(find_esp32_port)  # Run blocking function in a thread
        new_connected = esp32_port is not None
        if new_connected != connected:
            connected = new_connected

            if connected:
                connect_to_esp32(esp32_port)
            else:
                # Disconnect if ESP32 is lost
                disconnect_from_esp32()
        await asyncio.sleep(1)  # Scan every second (non-blocking)
### END OF ESP32 COMMUNICATION


### FRONT-END SERVER COMMUNICATION
# WebSocket endpoint
@app.websocket("/ws/status/")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        try:
            status = str(connected)
            await websocket.send_text(status)
            await asyncio.sleep(1)  # Simulate periodic updates
        except WebSocketDisconnect:
            print("Client disconnected")
            break

@app.websocket("/ws/commander/")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        try:
            data = await websocket.receive_text()
            global ser
            if ser is not None:
                if connected and ser:
                    # Send the received data to the ESP32 via serial
                    ser.write((data+ '\n').encode())
                    print(f"Send to  ESP32: {data}", flush=True)

                    if "G28" in data:
                        response = read_until_condition(ser, timeout=0)
                    else:
                        response = read_until_condition(ser, timeout=5)

                    print(f"Received from ESP32: {response}")

                    # Send the response back to the frontend
                    await websocket.send_text(response)            
        except WebSocketDisconnect:
            print("Client disconnected")
            break
### END OF FRONT-END SERVER COMMUNICATION


# Function to read continuously until a specific condition is met
def read_until_condition(ser, condition="ok", timeout=2):
    start_time = time.time()  # Track the start time to manage the timeout
    
    response = ""  # Initialize an empty string to store all the responses
    
    while True:        
        # Check if there's data available in the buffer
        if ser.in_waiting > 0:
            # Read one line of data from the serial port
            line = ser.readline().decode('utf-8').strip()
            if not "echo:busy: processing" in line:
                # Concatenate the response to the string (add a newline for readability)
                response += line + "\n"
            
            
            
            # Check if the condition (e.g., "OK") is met
            if condition in line:
                return response  # Return the concatenated string of responses
            
            # Check if timeout has been exceeded
        if time.time() - start_time > timeout and not timeout == 0:
            return response  # Return the concatenated string of responses
        time.sleep(0.1)
            
#RUN FILE
if __name__ == "__main__":
    # Run FastAPI app
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)
