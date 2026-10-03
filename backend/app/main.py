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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to 360PARTES API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

