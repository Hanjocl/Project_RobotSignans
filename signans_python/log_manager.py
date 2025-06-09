import time

logs = ["logs: initalized -> ok"]

def add_log(message: str):
    logs.append(message)

def get_latest_log() -> str:
    if logs:
        return logs[-1]
    return "ERROR: No logs available."

def create_log(entry: str) -> str:
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    full_entry = f"[{timestamp}] {entry}"
    logs.append(full_entry)

    # Trim if needed
    if len(logs) > 500:
        logs.pop(0)

    print(full_entry, flush=True)
    return full_entry

def get_logs() -> list[str]:
    return logs
