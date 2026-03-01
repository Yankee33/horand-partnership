import os
import uuid
from fastapi import UploadFile, HTTPException
from app.config import settings

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


async def save_photo(file: UploadFile, subfolder: str = "photos") -> str:
    """Save photo locally or to DO Spaces. Returns public URL."""

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WEBP allowed")

    contents = await file.read()
    if len(contents) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large (max {settings.MAX_FILE_SIZE_MB}MB)")

    ext = file.filename.rsplit(".", 1)[-1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"

    if settings.USE_S3:
        return await _save_to_spaces(contents, filename, subfolder)
    else:
        return _save_locally(contents, filename, subfolder)


def _save_locally(contents: bytes, filename: str, subfolder: str) -> str:
    folder = os.path.join(settings.UPLOAD_DIR, subfolder)
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, filename)
    with open(path, "wb") as f:
        f.write(contents)
    return f"/uploads/{subfolder}/{filename}"


async def _save_to_spaces(contents: bytes, filename: str, subfolder: str) -> str:
    """Upload to DigitalOcean Spaces (S3-compatible)."""
    import boto3
    from botocore.client import Config

    s3 = boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT_URL,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
        config=Config(signature_version="s3v4"),
        region_name=settings.S3_REGION,
    )
    key = f"{subfolder}/{filename}"
    s3.put_object(
        Bucket=settings.S3_BUCKET_NAME,
        Key=key,
        Body=contents,
        ACL="public-read",
        ContentType="image/jpeg",
    )
    return f"{settings.S3_ENDPOINT_URL}/{settings.S3_BUCKET_NAME}/{key}"
