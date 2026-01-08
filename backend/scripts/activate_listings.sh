#!/bin/bash
# Script simple pour activer toutes les annonces
# À exécuter sur votre VPS dans le dossier backend

# Méthode 1: Via Python inline
echo "🔄 Activation de toutes les annonces..."

python3 << 'EOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def activate():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Avant
    before = await db.listings.count_documents({"status": "active"})
    total = await db.listings.count_documents({})
    print(f"Avant: {before}/{total} annonces actives")
    
    # Activation (sauf vendues)
    result = await db.listings.update_many(
        {"status": {"$ne": "sold"}},
        {"$set": {"status": "active"}}
    )
    
    # Après
    after = await db.listings.count_documents({"status": "active"})
    print(f"Après: {after}/{total} annonces actives")
    print(f"✅ {result.modified_count} annonces activées!")

asyncio.run(activate())
EOF

echo "🎉 Terminé!"
