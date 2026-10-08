from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "360PARTES"
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ACCESS_EXPIRE: int = 43200
    JWT_REFRESH_EXPIRE: int = 43200
    CORS_ORIGINS: str = "*"
    
    # MinIO
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "360partes"
    MINIO_REGION: str = "us-east-1"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()

