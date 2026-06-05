from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base
from backend.routers import pipeline, evaluation

# Initialize DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Application Compiler API",
    description="A multi-stage pipeline compiler that converts product prompts into structured application configurations.",
    version="1.0.0"
)

# Setup CORS to allow React development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For demo purposes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API endpoints
app.include_router(pipeline.router)
app.include_router(evaluation.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "AI Application Compiler API",
        "engine": "Base44-inspired Multi-Stage Pipeline Compiler",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
