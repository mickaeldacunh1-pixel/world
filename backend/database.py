"""Configuration de la base de données MongoDB"""
from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGO_URL, DB_NAME

# MongoDB connection
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

def get_db():
    """Retourne l'instance de la base de données"""
    return db

def close_db():
    """Ferme la connexion à la base de données"""
    client.close()
