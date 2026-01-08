#!/usr/bin/env python3
"""
Script pour activer toutes les annonces sur World Auto France
À exécuter sur le VPS de production

Usage: python3 activate_all_listings.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def main():
    # Configuration - adaptez si nécessaire
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    print(f"🔌 Connexion à MongoDB: {mongo_url}")
    print(f"📁 Base de données: {db_name}")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Statistiques avant modification
    print("\n📊 Statistiques AVANT modification:")
    total = await db.listings.count_documents({})
    active = await db.listings.count_documents({"status": "active"})
    pending = await db.listings.count_documents({"status": "pending"})
    sold = await db.listings.count_documents({"status": "sold"})
    draft = await db.listings.count_documents({"status": "draft"})
    other = total - active - pending - sold - draft
    
    print(f"  Total: {total}")
    print(f"  Active: {active}")
    print(f"  Pending: {pending}")
    print(f"  Sold: {sold}")
    print(f"  Draft: {draft}")
    print(f"  Autre: {other}")
    
    if total == 0:
        print("\n❌ Aucune annonce trouvée dans la base de données!")
        return
    
    # Demander confirmation
    print("\n⚠️  Ce script va passer TOUTES les annonces (sauf 'sold') en status 'active'")
    confirm = input("Voulez-vous continuer? (oui/non): ")
    
    if confirm.lower() not in ['oui', 'o', 'yes', 'y']:
        print("❌ Opération annulée")
        return
    
    # Mettre à jour les annonces pending, draft, ou autre en active
    # On ne touche pas aux annonces "sold" car elles ont été vendues
    result = await db.listings.update_many(
        {"status": {"$nin": ["active", "sold"]}},
        {"$set": {"status": "active"}}
    )
    
    print(f"\n✅ {result.modified_count} annonces passées en 'active'")
    
    # Statistiques après modification
    print("\n📊 Statistiques APRÈS modification:")
    active_after = await db.listings.count_documents({"status": "active"})
    sold_after = await db.listings.count_documents({"status": "sold"})
    print(f"  Active: {active_after}")
    print(f"  Sold: {sold_after}")
    
    # Lister les annonces actives
    print("\n📋 Liste des annonces actives:")
    listings = await db.listings.find(
        {"status": "active"}, 
        {"_id": 0, "title": 1, "price": 1, "region": 1, "seller_name": 1}
    ).to_list(50)
    
    for i, l in enumerate(listings, 1):
        print(f"  {i}. {l.get('title', 'N/A')[:45]} | {l.get('price')}€ | {l.get('region', 'N/A')} | {l.get('seller_name', 'N/A')}")
    
    print("\n🎉 Terminé! Vos annonces sont maintenant visibles sur le site.")

if __name__ == "__main__":
    asyncio.run(main())
