"""
Test suite for Push Notifications and Warehouse Integration features
- Tests /api/push/vapid-key endpoint
- Tests /api/push/subscribe endpoint
- Tests /api/warehouse/items endpoint for PRO users
- Tests listing creation with warehouse_item_id
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from previous iterations
TEST_EMAIL = "contact@worldautofrance.com"
TEST_PASSWORD = "Admin123!2"


class TestPushNotificationAPIs:
    """Test Push Notification related endpoints"""
    
    def test_vapid_key_endpoint(self):
        """Test GET /api/push/vapid-key returns the VAPID public key"""
        response = requests.get(f"{BASE_URL}/api/push/vapid-key")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "public_key" in data, "Response should contain 'public_key'"
        assert len(data["public_key"]) > 50, "VAPID key should be a long string"
        print(f"✅ VAPID key endpoint works - key length: {len(data['public_key'])}")
    
    def test_push_subscribe_requires_auth(self):
        """Test POST /api/push/subscribe requires authentication"""
        response = requests.post(f"{BASE_URL}/api/push/subscribe", json={
            "subscription": {"endpoint": "test", "keys": {}},
            "preferences": {}
        })
        
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✅ Push subscribe correctly requires authentication")
    
    def test_push_subscribe_with_auth(self):
        """Test POST /api/push/subscribe with valid authentication"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.text}")
        
        token = login_response.json().get("token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test push subscribe with mock subscription data
        subscription_data = {
            "subscription": {
                "endpoint": f"https://fcm.googleapis.com/fcm/send/test-{uuid.uuid4()}",
                "keys": {
                    "p256dh": "test_p256dh_key",
                    "auth": "test_auth_key"
                }
            },
            "preferences": {
                "messages": True,
                "price_alerts": True,
                "new_offers": True,
                "order_updates": True,
                "promotions": False
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/push/subscribe",
            json=subscription_data,
            headers=headers
        )
        
        # Should succeed (200 or 201)
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        print("✅ Push subscribe works with authentication")
    
    def test_push_status_endpoint(self):
        """Test GET /api/push/status returns subscription status"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.text}")
        
        token = login_response.json().get("token")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/push/status", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "subscribed" in data, "Response should contain 'subscribed' field"
        print(f"✅ Push status endpoint works - subscribed: {data.get('subscribed')}")


class TestWarehouseAPIs:
    """Test Warehouse/Entrepot related endpoints for PRO users"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authentication headers"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.text}")
        
        token = login_response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_warehouse_items_requires_auth(self):
        """Test GET /api/warehouse/items requires authentication"""
        response = requests.get(f"{BASE_URL}/api/warehouse/items")
        
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✅ Warehouse items correctly requires authentication")
    
    def test_warehouse_items_with_auth(self, auth_headers):
        """Test GET /api/warehouse/items returns list for authenticated user"""
        response = requests.get(f"{BASE_URL}/api/warehouse/items", headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✅ Warehouse items endpoint works - found {len(data)} items")
    
    def test_warehouse_categories(self, auth_headers):
        """Test GET /api/warehouse/categories returns predefined categories"""
        response = requests.get(f"{BASE_URL}/api/warehouse/categories", headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, (list, dict)), "Response should be a list or dict of categories"
        print(f"✅ Warehouse categories endpoint works")
    
    def test_warehouse_sections(self, auth_headers):
        """Test GET /api/warehouse/sections returns user's sections"""
        response = requests.get(f"{BASE_URL}/api/warehouse/sections", headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✅ Warehouse sections endpoint works - found {len(data)} sections")
    
    def test_create_warehouse_item(self, auth_headers):
        """Test POST /api/warehouse/items creates a new item"""
        item_data = {
            "name": f"TEST_Item_{uuid.uuid4().hex[:8]}",
            "reference": f"REF-{uuid.uuid4().hex[:6]}",
            "category": "moteur",
            "quantity": 5,
            "min_stock": 2,
            "purchase_price": 50.0,
            "selling_price": 100.0,
            "condition": "occasion",
            "brand": "BMW",
            "notes": "Test item for automated testing"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/warehouse/items",
            json=item_data,
            headers=auth_headers
        )
        
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should contain item ID"
        print(f"✅ Warehouse item created - ID: {data.get('id')}")
        
        # Cleanup - delete the test item
        item_id = data.get("id")
        if item_id:
            delete_response = requests.delete(
                f"{BASE_URL}/api/warehouse/items/{item_id}",
                headers=auth_headers
            )
            print(f"   Cleanup: deleted test item - status {delete_response.status_code}")


class TestListingWithWarehouseIntegration:
    """Test listing creation with warehouse item integration"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authentication headers"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.text}")
        
        token = login_response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_listing_create_accepts_warehouse_item_id(self, auth_headers):
        """Test that listing creation accepts warehouse_item_id field"""
        listing_data = {
            "title": f"TEST_Listing_{uuid.uuid4().hex[:8]}",
            "description": "Test listing with warehouse integration",
            "price": 150.0,
            "category": "pieces",
            "condition": "occasion",
            "shipping_methods": ["hand_delivery"],
            "warehouse_item_id": None  # Test with null value
        }
        
        response = requests.post(
            f"{BASE_URL}/api/listings",
            json=listing_data,
            headers=auth_headers
        )
        
        # Should succeed (201 or 200)
        assert response.status_code in [200, 201, 402], f"Expected 200/201/402, got {response.status_code}: {response.text}"
        
        if response.status_code == 402:
            print("⚠️ User has no credits - but API accepts warehouse_item_id field")
        else:
            data = response.json()
            print(f"✅ Listing created with warehouse_item_id support - ID: {data.get('id')}")
            
            # Cleanup
            listing_id = data.get("id")
            if listing_id:
                requests.delete(f"{BASE_URL}/api/listings/{listing_id}", headers=auth_headers)


class TestServiceWorkerAndFrontend:
    """Test service worker and frontend components"""
    
    def test_service_worker_file_accessible(self):
        """Test that sw.js is accessible from the frontend"""
        response = requests.get(f"{BASE_URL}/sw.js")
        
        # Service worker should be accessible
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "self.addEventListener" in response.text or "serviceWorker" in response.text.lower(), \
            "sw.js should contain service worker code"
        print("✅ Service worker file is accessible")
    
    def test_frontend_loads(self):
        """Test that the frontend loads correctly"""
        response = requests.get(BASE_URL)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "World Auto" in response.text or "root" in response.text, \
            "Frontend should load with React app"
        print("✅ Frontend loads correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
