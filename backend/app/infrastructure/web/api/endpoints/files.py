from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.concurrency import run_in_threadpool
import uuid
from typing import Dict

from app.infrastructure.web.api.deps import get_current_business_id
from app.infrastructure.services.storage_service import StorageService

router = APIRouter()
storage_service = StorageService()

@router.post("/upload", response_model=Dict[str, str])
async def upload_file(
    file: UploadFile = File(...),
    business_id: uuid.UUID = Depends(get_current_business_id)
):
    """
    Sube un archivo a MinIO y retorna la URL.
    Solo usuarios autenticados con un negocio activo pueden subir archivos.
    """
    try:
        # Ejecutamos boto3 en un threadpool para no bloquear el event loop asíncrono
        file_url = await run_in_threadpool(
            storage_service.upload_file, 
            file.file, 
            file.filename,
            file.content_type
        )
        return {"url": file_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error subiendo archivo: {str(e)}")
