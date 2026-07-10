import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

import models
import schemas
from crud import create_user, get_users
from database import SessionLocal, engine
from routers import auth, categories, dashboard, products, reports, sales, stock, store_settings, units, users

logger = logging.getLogger("smartpos")

DEFAULT_ADMIN_USERNAME = "admin"
DEFAULT_ADMIN_PASSWORD = "admin123"


def seed_default_admin():
    db = SessionLocal()
    try:
        if not get_users(db):
            create_user(
                db,
                schemas.UserCreate(
                    username=DEFAULT_ADMIN_USERNAME,
                    email="admin@smartpos.com",
                    password=DEFAULT_ADMIN_PASSWORD,
                    full_name="Administrator",
                    role=models.RoleEnum.admin,
                ),
            )
            print(
                f"[seed] User admin dibuat -> username: {DEFAULT_ADMIN_USERNAME}, "
                f"password: {DEFAULT_ADMIN_PASSWORD} (segera ganti password ini)"
            )
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    models.Base.metadata.create_all(bind=engine)
    seed_default_admin()
    yield


app = FastAPI(title="SmartPOS API", lifespan=lifespan)

cors_origins = [
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Catch-all for database errors no router already handles specifically
    (e.g. a value rejected by a Postgres-native enum type after schema drift).
    Without this, such errors leak a raw Python traceback to the client as a 500."""
    logger.exception("Unhandled database error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Terjadi kesalahan pada server. Silakan coba lagi atau hubungi admin."},
    )


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(units.router)
app.include_router(products.router)
app.include_router(store_settings.router)
app.include_router(stock.router)
app.include_router(sales.router)
app.include_router(reports.router)
app.include_router(dashboard.router)


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
