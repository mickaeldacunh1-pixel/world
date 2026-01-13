#!/usr/bin/env python3
"""
Script d'initialisation WorldAuto
Exécuter une seule fois après le premier déploiement
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os

# Configuration
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://worldauto_admin:WA_Secure_2026!@mongodb:27017/test_database?authSource=admin')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

async def init_database():
    print("=" * 50)
    print("🚀 INITIALISATION WORLDAUTO")
    print("=" * 50)
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Vérifier si déjà initialisé
    existing_admin = await db.users.find_one({'email': 'contact@worldautofrance.com'})
    if existing_admin:
        print("⚠️  Base déjà initialisée. Voulez-vous réinitialiser ? (o/n)")
        response = input().strip().lower()
        if response != 'o':
            print("Annulé.")
            return
    
    print("\n👤 Création des comptes...")
    
    # Supprimer anciens comptes
    await db.users.delete_many({'email': {'$in': ['contact@worldautofrance.com', '2db.auto.service@gmail.com']}})
    
    # Compte admin
    hash1 = pwd_context.hash('Admin123!2')
    await db.users.insert_one({
        'id': 'admin-001',
        'email': 'contact@worldautofrance.com',
        'password': hash1,
        'name': 'Admin WorldAuto',
        'phone': '',
        'is_professional': True,
        'is_active': True,
        'credits': 1000,
        'role': 'admin'
    })
    print("   ✅ contact@worldautofrance.com / Admin123!2")
    
    # Compte pro
    hash2 = pwd_context.hash('Admin123!3')
    await db.users.insert_one({
        'id': 'pro-002',
        'email': '2db.auto.service@gmail.com',
        'password': hash2,
        'name': '2DB Auto Service',
        'phone': '',
        'is_professional': True,
        'is_active': True,
        'credits': 100,
        'role': 'pro'
    })
    print("   ✅ 2db.auto.service@gmail.com / Admin123!3")
    
    print("\n📻 Configuration radio...")
    await db.settings.delete_one({'type': 'radio_settings'})
    await db.settings.insert_one({
        'type': 'radio_settings',
        'enabled': True,
        'position': 'bottom-left',
        'auto_play': False,
        'default_volume': 70
    })
    
    await db.radio_stations.delete_many({})
    stations = [
        {'id': 'skyrock', 'name': 'Skyrock', 'genre': 'Rap & RnB', 'logo': '🎤', 'stream_url': 'https://icecast.skyrock.net/s/natio_mp3_128k', 'color': '#000000', 'enabled': True, 'order': 0},
        {'id': 'nrj', 'name': 'NRJ', 'genre': 'Hits', 'logo': '⚡', 'stream_url': 'https://scdn.nrjaudio.fm/adwz2/fr/30001/mp3_128.mp3', 'color': '#E31937', 'enabled': True, 'order': 1},
        {'id': 'funradio', 'name': 'Fun Radio', 'genre': 'Dance', 'logo': '🎧', 'stream_url': 'https://streaming.radio.funradio.fr/fun-1-44-128', 'color': '#FF6B00', 'enabled': True, 'order': 2},
        {'id': 'rtl2', 'name': 'RTL2', 'genre': 'Pop Rock', 'logo': '🎸', 'stream_url': 'https://streaming.radio.rtl2.fr/rtl2-1-44-128', 'color': '#00A0E4', 'enabled': True, 'order': 3},
        {'id': 'franceinter', 'name': 'France Inter', 'genre': 'Généraliste', 'logo': '🇫🇷', 'stream_url': 'https://icecast.radiofrance.fr/franceinter-midfi.mp3', 'color': '#E20074', 'enabled': True, 'order': 4},
        {'id': 'fip', 'name': 'FIP', 'genre': 'Jazz & Groove', 'logo': '🎹', 'stream_url': 'https://icecast.radiofrance.fr/fip-midfi.mp3', 'color': '#E85D75', 'enabled': True, 'order': 5},
    ]
    await db.radio_stations.insert_many(stations)
    print("   ✅ 6 stations radio")
    
    print("\n🎨 Configuration hero...")
    await db.settings.delete_one({'type': 'hero'})
    await db.settings.insert_one({
        'type': 'hero',
        'hero_title_line1': 'La marketplace auto',
        'hero_title_line2': 'pour tous',
        'hero_description': 'Achetez et vendez des pièces détachées, voitures, motos et utilitaires. Pour particuliers et professionnels.',
        'hero_image': 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2832&auto=format&fit=crop',
        'hero_cta_text': 'Déposer une annonce',
        'hero_cta_link': '/deposer',
        'hero_show_search': True,
        'hero_show_categories': True,
        'hero_overlay_opacity': 50,
        'hero_badge_enabled': True,
        'hero_badge_text': 'La référence automobile en France',
        'hero_badge_icon': '✨',
        'category_pieces_image': 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop',
        'category_voitures_image': 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=400&fit=crop',
        'category_motos_image': 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&h=400&fit=crop',
        'category_utilitaires_image': 'https://images.unsplash.com/photo-1532581140115-3e355d1ed1de?w=600&h=400&fit=crop',
        'category_engins_image': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&h=400&fit=crop',
        'category_accessoires_image': 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=600&h=400&fit=crop'
    })
    print("   ✅ Hero configuré")
    
    print("\n" + "=" * 50)
    print("🎉 INITIALISATION TERMINÉE !")
    print("=" * 50)
    print("\nComptes créés :")
    print("  📧 contact@worldautofrance.com / Admin123!2 (admin)")
    print("  📧 2db.auto.service@gmail.com / Admin123!3 (pro)")
    print("\nVotre site est prêt !")
    
    client.close()

if __name__ == '__main__':
    asyncio.run(init_database())
