import os
import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile
from typing import Optional
from ..core.config import settings

class StorageService:
    def __init__(self):
        self.use_s3 = all([
            settings.S3_BUCKET,
            settings.S3_REGION,
            settings.S3_ACCESS_KEY_ID,
            settings.S3_SECRET_ACCESS_KEY
        ])
        if self.use_s3:
            self.s3_client = boto3.client(
                's3',
                region_name=settings.S3_REGION,
                aws_access_key_id=settings.S3_ACCESS_KEY_ID,
                aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
                endpoint_url=settings.S3_ENDPOINT
            )
            self.bucket_name = settings.S3_BUCKET

    def upload_file(self, file_path: str, object_name: str) -> Optional[str]:
        """
        Uploads a file to S3 if configured, otherwise does nothing and returns 'db-only'.
        Returns the S3 URL or 'db-only'.
        """
        if not self.use_s3:
            return "db-only"
            
        try:
            self.s3_client.upload_file(file_path, self.bucket_name, object_name)
            # Generate a generic URL or just return the object key depending on endpoint setup.
            # Using s3:// protocol for easy reference.
            return f"s3://{self.bucket_name}/{object_name}"
        except ClientError as e:
            print(f"[STORAGE] Failed to upload to S3: {e}")
            raise e

    def delete_file(self, object_key: str):
        """
        Deletes a file from S3 if configured.
        """
        if not self.use_s3 or object_key == "db-only" or not object_key.startswith("s3://"):
            return
            
        try:
            # Extract key from s3://bucket/key
            key = object_key.split("/", 3)[-1]
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=key)
        except ClientError as e:
            print(f"[STORAGE] Failed to delete from S3: {e}")

storage_service = StorageService()
