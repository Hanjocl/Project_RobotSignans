from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import uvicorn
from camera_capture import initialize_camera
from state import set_all


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("App starting...")
    # Create router
    from ws_routes import router as ws_router
    init_states(app)
    app.include_router(ws_router)
    await asyncio.sleep(1)

    # Import to avoid circular imports
    from device_scanner import scan_for_esp32
    asyncio.create_task(scan_for_esp32())

    set_all() #Debug line to test drawing sequence on simulation esp32 (DO NOT USE FOR REAL ARM)
    
    yield
    print("App shutting down...")

def init_states(app: FastAPI):
    app.state.ser = None  # Initialize `ser` in the app state
    app.state.draw_task = None
    initialize_camera()
    

app = FastAPI(lifespan=lifespan)

origins = [ # DISABLED FOR NOW ==> Security wise I hope nobody will be fucking around with it...
    "http://robosignans1",
    "http://robosignans1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":    
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)