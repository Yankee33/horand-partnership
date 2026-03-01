from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/horand"
    SECRET_KEY: str = "my-super-secret-key-which-is-long-enough-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 5
    USE_S3: bool = False
    S3_ENDPOINT_URL: Optional[str] = None
    S3_ACCESS_KEY: Optional[str] = None
    S3_SECRET_KEY: Optional[str] = None
    S3_BUCKET_NAME: Optional[str] = None
    S3_REGION: Optional[str] = "nyc3"
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()