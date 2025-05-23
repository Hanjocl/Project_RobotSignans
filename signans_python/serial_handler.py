import serial
import serial.tools.list_ports
from log_manager import create_log
from main import app


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


def write_to_esp32(input: str):
    try:
        app.state.ser.write((input + '\n').encode())
        input = create_log(f"Send: {input}")

        if "G28" in input:
            response = read_until_condition(timeout=320)
        else:
            response = read_until_condition(timeout=10)

        response_log = create_log(f"Received: {response}")

        return input + "\n" + response_log
    except:
        disconnect_from_esp32()
        return "ERROR: could not write to ESP32"

def read_until_condition(condition="ok", timeout=2):
    import time
    start_time = time.time()
    response = ""

    while True:
        if app.state.ser and app.state.ser.in_waiting > 0:
            line = app.state.ser.readline().decode('utf-8').strip()
            if "echo:busy: processing" not in line:
                line = line.replace("echo:", "")
                response += line + "\n"
            if condition in line:
                return response
        if time.time() - start_time > timeout and timeout != 0:
            return response
        time.sleep(0.1)
