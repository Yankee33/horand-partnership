from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import settings
from app.database import engine
from app.models.models import Base
from app.routers import auth, companies, contract

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HORAND Partnership API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS — дозволяємо фронтенд
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        settings.FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for local uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Routers
app.include_router(auth.router)
app.include_router(companies.router)
app.include_router(contract.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}