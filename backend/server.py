from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()
from starlette.middleware.cors import CORSMiddleware # JÁ IMPORTADO NA LINHA 3

# Endereço do seu frontend (Vercel)
# Este é o domínio que o erro CORS mostrou
FRONTEND_URL = "https://trabalho-reciclagem-novo.vercel.app" 

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],  # Permite APENAS o seu frontend
    allow_credentials=True,
    allow_methods=["*"],           # Permite todos os métodos (GET, POST, etc.)
    allow_headers=["*"],           # Permite todos os cabeçalhos
)
# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Basic health check
@api_router.get("/")
async def root():
    return {"message": "Plastic Bag King API is running!"}

# Import and include game routes
from game_routes import game_router

# Include the API router with health check
app.include_router(api_router, tags=["health"])

# Include the game router
app.include_router(game_router, tags=["game"])

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
