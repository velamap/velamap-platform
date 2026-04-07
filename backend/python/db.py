"""Shared database engine."""
import os
from sqlalchemy import create_engine

_db_url = os.getenv("DATABASE_URL") or (
    "postgresql://{user}:{password}@{host}/{db}".format(
        user=os.getenv("POSTGRES_USER", "vela_user"),
        password=os.getenv("POSTGRES_PASSWORD", "vela_secure_pass"),
        host=os.getenv("POSTGRES_HOST", "postgres"),
        db=os.getenv("POSTGRES_DB", "velamap"),
    ) if os.getenv("POSTGRES_HOST") else None
)

engine = create_engine(_db_url) if _db_url else None
