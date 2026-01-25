"""Routes package"""
from .auth import router as auth_router
from .videos import router as videos_router
from .listings import router as listings_router
from .orders import router as orders_router

__all__ = [
    'auth_router',
    'videos_router',
    'listings_router',
    'orders_router',
]
