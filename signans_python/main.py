from fastapi import FastAPI
from contextlib import asynccontextmanager
import asyncio
import uvicorn


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("App starting...")
    from ws_routes import router as ws_router
    init_states()
    app.include_router(ws_router)
    await asyncio.sleep(1)

    # Import to avoid circular imports
    from device_scanner import scan_for_esp32
    
    asyncio.create_task(scan_for_esp32())
    

    yield
    print("App shutting down...")

def init_states():
    app.state.ser = None  # Initialize `ser` in the app state
    app.state.draw_task = None

app = FastAPI(lifespan=lifespan)


if __name__ == "__main__":    
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)