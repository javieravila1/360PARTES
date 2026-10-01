from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "360PARTES"
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ACCESS_EXPIRE: int = 30
    JWT_REFRESH_EXPIRE: int = 1440
    CORS_ORIGINS: str = "http://localhost:5173"
    
    # MinIO
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "360partes"
    MINIO_REGION: str = "us-east-1"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()

