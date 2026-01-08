"""Routes package"""
from .auth import router as auth_router
from .videos import router as videos_router

__all__ = [
    'auth_router',
    'videos_router',
]
