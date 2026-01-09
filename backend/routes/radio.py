from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/api/radio", tags=["radio"])

# Pydantic Models
class RadioStation(BaseModel):
    id: Optional[str] = None
    name: str
    genre: str
    logo: str = "📻"
    stream_url: str
    color: str = "#1E3A5F"
    enabled: bool = True
    order: int = 0

class RadioStationUpdate(BaseModel):
    name: Optional[str] = None
    genre: Optional[str] = None
    logo: Optional[str] = None
    stream_url: Optional[str] = None
    color: Optional[str] = None
    enabled: Optional[bool] = None
    order: Optional[int] = None

class RadioSettings(BaseModel):
    enabled: bool = True
    position: str = "bottom-left"  # bottom-left, bottom-right
    auto_play: bool = False
    default_volume: int = 70

# Default stations
DEFAULT_STATIONS = [
    {"id": "skyrock", "name": "Skyrock", "genre": "Rap & RnB", "logo": "🎤", "stream_url": "https://icecast.skyrock.net/s/natio_mp3_128k", "color": "#000000", "enabled": True, "order": 0},
    {"id": "funradio", "name": "Fun Radio", "genre": "Dance", "logo": "🎧", "stream_url": "https://streaming.radio.funradio.fr/fun-1-44-128", "color": "#FF6B00", "enabled": True, "order": 1},
    {"id": "rtl", "name": "RTL", "genre": "Généraliste", "logo": "📻", "stream_url": "https://streaming.radio.rtl.fr/rtl-1-44-128", "color": "#E30613", "enabled": True, "order": 2},
    {"id": "rtl2", "name": "RTL2", "genre": "Pop Rock", "logo": "🎸", "stream_url": "https://streaming.radio.rtl2.fr/rtl2-1-44-128", "color": "#00A0E4", "enabled": True, "order": 3},
    {"id": "nova", "name": "Radio Nova", "genre": "Éclectique", "logo": "🌟", "stream_url": "https://novazz.ice.infomaniak.ch/novazz-128.mp3", "color": "#FF5500", "enabled": True, "order": 4},
    {"id": "beurfm", "name": "Beur FM", "genre": "Musique du monde", "logo": "🌍", "stream_url": "https://beurfm.ice.infomaniak.ch/beurfm-high.mp3", "color": "#009933", "enabled": True, "order": 5},
    {"id": "franceinter", "name": "France Inter", "genre": "Généraliste", "logo": "🇫🇷", "stream_url": "https://icecast.radiofrance.fr/franceinter-midfi.mp3", "color": "#E20074", "enabled": True, "order": 6},
    {"id": "franceinfo", "name": "France Info", "genre": "Info", "logo": "📰", "stream_url": "https://icecast.radiofrance.fr/franceinfo-midfi.mp3", "color": "#0066CC", "enabled": True, "order": 7},
    {"id": "fip", "name": "FIP", "genre": "Jazz & Groove", "logo": "🎹", "stream_url": "https://icecast.radiofrance.fr/fip-midfi.mp3", "color": "#E85D75", "enabled": True, "order": 8},
    {"id": "mouv", "name": "Mouv'", "genre": "Urban", "logo": "🔥", "stream_url": "https://icecast.radiofrance.fr/mouv-midfi.mp3", "color": "#00D4AA", "enabled": True, "order": 9},
    {"id": "francemusique", "name": "France Musique", "genre": "Classique", "logo": "🎻", "stream_url": "https://icecast.radiofrance.fr/francemusique-midfi.mp3", "color": "#8B4513", "enabled": True, "order": 10},
    {"id": "franceculture", "name": "France Culture", "genre": "Culture", "logo": "📚", "stream_url": "https://icecast.radiofrance.fr/franceculture-midfi.mp3", "color": "#9932CC", "enabled": True, "order": 11},
    {"id": "oui", "name": "OÜI FM", "genre": "Rock Indé", "logo": "🤘", "stream_url": "https://ouifm.ice.infomaniak.ch/ouifm-high.mp3", "color": "#FF0000", "enabled": True, "order": 12},
    {"id": "tsfjazz", "name": "TSF Jazz", "genre": "Jazz", "logo": "🎷", "stream_url": "https://tsfjazz.ice.infomaniak.ch/tsfjazz-high.mp3", "color": "#1E90FF", "enabled": True, "order": 13},
]

# Database reference will be injected
db = None

def set_db(database):
    global db
    db = database

# Routes
@router.get("/stations")
async def get_stations():
    """Get all enabled radio stations"""
    stations = await db.radio_stations.find({"enabled": True}).sort("order", 1).to_list(100)
    
    if not stations:
        # Return default stations if none configured
        return DEFAULT_STATIONS
    
    for station in stations:
        station["id"] = str(station.get("_id", station.get("id", "")))
        station.pop("_id", None)
    
    return stations

@router.get("/stations/all")
async def get_all_stations():
    """Get all radio stations (admin)"""
    stations = await db.radio_stations.find().sort("order", 1).to_list(100)
    
    if not stations:
        # Initialize with defaults
        for station in DEFAULT_STATIONS:
            await db.radio_stations.insert_one(station)
        return DEFAULT_STATIONS
    
    for station in stations:
        station["id"] = str(station.get("_id", station.get("id", "")))
        station.pop("_id", None)
    
    return stations

@router.post("/stations")
async def create_station(station: RadioStation):
    """Create a new radio station"""
    station_dict = station.dict()
    station_dict["id"] = str(uuid.uuid4())
    station_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    # Get max order
    max_order_station = await db.radio_stations.find_one(sort=[("order", -1)])
    station_dict["order"] = (max_order_station.get("order", -1) + 1) if max_order_station else 0
    
    await db.radio_stations.insert_one(station_dict)
    station_dict.pop("_id", None)
    
    return station_dict

@router.put("/stations/{station_id}")
async def update_station(station_id: str, update: RadioStationUpdate):
    """Update a radio station"""
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.radio_stations.update_one(
        {"id": station_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Station not found")
    
    return {"success": True}

@router.delete("/stations/{station_id}")
async def delete_station(station_id: str):
    """Delete a radio station"""
    result = await db.radio_stations.delete_one({"id": station_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Station not found")
    
    return {"success": True}

@router.post("/stations/reorder")
async def reorder_stations(station_ids: List[str]):
    """Reorder stations"""
    for i, station_id in enumerate(station_ids):
        await db.radio_stations.update_one(
            {"id": station_id},
            {"$set": {"order": i}}
        )
    
    return {"success": True}

@router.get("/settings")
async def get_radio_settings():
    """Get radio player settings"""
    settings = await db.radio_settings.find_one({"type": "radio"})
    
    if not settings:
        return {
            "enabled": True,
            "position": "bottom-left",
            "auto_play": False,
            "default_volume": 70
        }
    
    settings.pop("_id", None)
    return settings

@router.post("/settings")
async def update_radio_settings(settings: RadioSettings):
    """Update radio player settings"""
    settings_dict = settings.dict()
    settings_dict["type"] = "radio"
    settings_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.radio_settings.update_one(
        {"type": "radio"},
        {"$set": settings_dict},
        upsert=True
    )
    
    return {"success": True}

@router.post("/stations/reset")
async def reset_stations():
    """Reset stations to defaults"""
    await db.radio_stations.delete_many({})
    
    for station in DEFAULT_STATIONS:
        await db.radio_stations.insert_one(station.copy())
    
    return {"success": True, "count": len(DEFAULT_STATIONS)}
