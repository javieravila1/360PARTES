import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
import uuid
from typing import BinaryIO
import mimetypes

class StorageService:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            endpoint_url=f"http://{settings.MINIO_ENDPOINT}",
            aws_access_key_id=settings.MINIO_ACCESS_KEY,
            aws_secret_access_key=settings.MINIO_SECRET_KEY,
            region_name=settings.MINIO_REGION
        )
        self.bucket = settings.MINIO_BUCKET
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        try:
            self.s3_client.head_bucket(Bucket=self.bucket)
        except ClientError as e:
            error_code = int(e.response['Error']['Code'])
            if error_code == 404:
                self.s3_client.create_bucket(Bucket=self.bucket)
                # Configurar política para que sea público para lectura
                policy = {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "PublicRead",
                            "Effect": "Allow",
                            "Principal": "*",
                            "Action": ["s3:GetObject"],
                            "Resource": [f"arn:aws:s3:::{self.bucket}/*"]
                        }
                    ]
                }
                import json
                self.s3_client.put_bucket_policy(Bucket=self.bucket, Policy=json.dumps(policy))

    def upload_file(self, file_obj: BinaryIO, filename: str, content_type: str = None) -> str:
        """Sube un archivo y retorna la URL pública"""
        file_ext = filename.split(".")[-1] if "." in filename else ""
        unique_filename = f"{uuid.uuid4().hex}.{file_ext}" if file_ext else uuid.uuid4().hex

        if not content_type:
            content_type = mimetypes.guess_type(filename)[0] or 'application/octet-stream'

        self.s3_client.upload_fileobj(
            file_obj, 
            self.bucket, 
            unique_filename,
            ExtraArgs={'ContentType': content_type}
        )

        # Retornar la URL pública asumiendo configuración estándar
        return f"http://{settings.MINIO_ENDPOINT}/{self.bucket}/{unique_filename}"
