from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.infrastructure.web.api.api import api_router
from app.core.config import settings
from app.core.database import engine
from app.infrastructure.database.models.base import Base

# Autodiscover de todos los modelos para crearlos:
import app.infrastructure.database.models.user
import app.infrastructure.database.models.business
import app.infrastructure.database.models.product
import app.infrastructure.database.models.sale
import app.infrastructure.database.models.purchase
import app.infrastructure.database.models.contacts
import app.infrastructure.database.models.payable
import app.infrastructure.database.models.cash
import app.infrastructure.database.models.expense
import app.infrastructure.database.models.inventory
import app.infrastructure.database.models.debt

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crear todas las tablas al iniciar
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    # Auto-seed the admin user
    try:
        from seed_admin import seed
        await seed()
    except Exception as e:
        print(f"Error seeding admin user: {e}")
        
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for the 360PARTES multi-business management system",
    version="1.0.0",
    lifespan=lifespan
)

# Parse origins for specific domains if needed, but allow all via regex for dev
origins = settings.CORS_ORIGINS.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,

    allow_origin_regex=".*", # Permite cualquier origen (localhost, IPs locales, puertos dinámicos) sin fallar por credenciales


    allow_credentials=False,

    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

from app.infrastructure.web.websocket_manager import manager
from fastapi import WebSocket, WebSocketDisconnect
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import asyncio

class BroadcastMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if request.method in ["POST", "PUT", "PATCH", "DELETE"] and 200 <= response.status_code < 300:
            business_id = request.headers.get("x-business-id", "all")
            asyncio.create_task(manager.broadcast(business_id))
        return response

app.add_middleware(BroadcastMiddleware)

@app.websocket("/api/v1/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
def read_root():
    return {"message": "Welcome to 360PARTES API"}

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}

import subprocess
import datetime
import urllib.parse
import os
from fastapi import BackgroundTasks
from fastapi.responses import FileResponse

@app.post("/api/v1/system/backup")
def create_backup(background_tasks: BackgroundTasks):
    try:
        # postgresql+asyncpg://user:password@host:port/dbname
        db_url_parsed = urllib.parse.urlparse(settings.DATABASE_URL)
        user = db_url_parsed.username or "postgres"
        password = db_url_parsed.password
        host = db_url_parsed.hostname or "localhost"
        port = db_url_parsed.port or 5432
        dbname = db_url_parsed.path.lstrip('/')
        
        # Save to /tmp to avoid permission issues and clutter
        filename = f"/tmp/{dbname}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.dump"
        
        env = os.environ.copy()
        if password:
            env["PGPASSWORD"] = password
            
        cmd = [
            "pg_dump", 
            "-U", user, 
            "-h", host,
            "-p", str(port),
            "-Fc", 
            "--create", 
            dbname, 
            "-f", filename
        ]
        
        # Run synchronously to allow download
        subprocess.run(cmd, env=env, check=True, capture_output=True)
        
        # Optionally schedule a background task to delete the file after some time, or let container restart handle it
        def cleanup_file():
            import time
            time.sleep(300) # wait 5 minutes before deleting
            try:
                os.remove(filename)
            except:
                pass
                
        background_tasks.add_task(cleanup_file)
        
        return FileResponse(
            path=filename,
            media_type="application/octet-stream",
            filename=os.path.basename(filename)
        )
    except Exception as e:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

