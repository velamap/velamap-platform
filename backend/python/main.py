from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import concepts, qdrant_router

app = FastAPI(title="Velamap API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(concepts.router)
app.include_router(qdrant_router.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
