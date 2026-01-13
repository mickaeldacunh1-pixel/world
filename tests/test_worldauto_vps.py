"""
WorldAuto VPS Pre-deployment Test Suite
Tests all critical functionality before VPS reinstallation
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://auto-parts-app-2.preview.emergentagent.com')

class TestAuthentication:
    """Test authentication endpoints with provided credentials"""
    
    def test_admin_login(self):
        """Test admin account login: contact@worldautofrance.com / Admin123!2"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "contact@worldautofrance.com",
            "password": "Admin123!2"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert data["user"]["email"] == "contact@worldautofrance.com"
        assert data["user"]["name"] == "Admin WorldAuto"
        assert data["user"]["credits"] == 1000
        print(f"✅ Admin login successful - Credits: {data['user']['credits']}")
    
    def test_pro_account_login(self):
        """Test pro account login: 2db.auto.service@gmail.com / Admin123!3"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "2db.auto.service@gmail.com",
            "password": "Admin123!3"
        })
        assert response.status_code == 200, f"Pro account login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert data["user"]["email"] == "2db.auto.service@gmail.com"
        assert data["user"]["name"] == "2DB Auto Service"
        assert data["user"]["credits"] == 100
        print(f"✅ Pro account login successful - Credits: {data['user']['credits']}")
    
    def test_invalid_login(self):
        """Test login with wrong password returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "contact@worldautofrance.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, "Should return 401 for wrong password"
        print("✅ Invalid login correctly rejected")


class TestHeroSettings:
    """Test hero settings API"""
    
    def test_hero_settings_endpoint(self):
        """Test /api/settings/hero returns correct data"""
        response = requests.get(f"{BASE_URL}/api/settings/hero")
        assert response.status_code == 200, f"Hero settings failed: {response.text}"
        data = response.json()
        assert data["type"] == "hero"
        assert "hero_title_line1" in data
        assert data["hero_title_line1"] == "La marketplace auto"
        assert data["hero_title_line2"] == "pour tous"
        assert "hero_image" in data
        print(f"✅ Hero settings loaded - Title: {data['hero_title_line1']} {data['hero_title_line2']}")


class TestRadioStations:
    """Test radio stations API"""
    
    def test_radio_stations_endpoint(self):
        """Test /api/radio/stations returns stations list"""
        response = requests.get(f"{BASE_URL}/api/radio/stations")
        assert response.status_code == 200, f"Radio stations failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Should return a list"
        assert len(data) >= 5, f"Expected at least 5 stations, got {len(data)}"
        
        # Check first station structure
        station = data[0]
        assert "name" in station
        assert "stream_url" in station
        assert "genre" in station
        print(f"✅ Radio stations loaded - {len(data)} stations available")
        for s in data:
            print(f"   - {s['name']} ({s['genre']})")


class TestBrands:
    """Test car brands API"""
    
    def test_brands_endpoint(self):
        """Test /api/brands returns car brands list"""
        response = requests.get(f"{BASE_URL}/api/brands")
        assert response.status_code == 200, f"Brands failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Should return a list"
        assert len(data) >= 50, f"Expected at least 50 brands, got {len(data)}"
        assert "BMW" in data
        assert "Renault" in data
        assert "Peugeot" in data
        print(f"✅ Car brands loaded - {len(data)} brands available")


class TestSubcategories:
    """Test subcategories API"""
    
    def test_pieces_subcategories(self):
        """Test /api/subcategories/pieces returns parts categories"""
        response = requests.get(f"{BASE_URL}/api/subcategories/pieces")
        assert response.status_code == 200, f"Pieces subcategories failed: {response.text}"
        data = response.json()
        assert isinstance(data, dict), "Should return a dict"
        assert "moteur" in data
        assert "carrosserie" in data
        assert "freinage" in data
        print(f"✅ Pieces subcategories loaded - {len(data)} categories")
    
    def test_accessoires_subcategories(self):
        """Test /api/subcategories/accessoires returns accessories categories"""
        response = requests.get(f"{BASE_URL}/api/subcategories/accessoires")
        assert response.status_code == 200, f"Accessoires subcategories failed: {response.text}"
        data = response.json()
        assert isinstance(data, dict), "Should return a dict"
        print(f"✅ Accessoires subcategories loaded - {len(data)} categories")
    
    def test_motos_subcategories(self):
        """Test /api/subcategories/motos returns moto categories"""
        response = requests.get(f"{BASE_URL}/api/subcategories/motos")
        assert response.status_code == 200, f"Motos subcategories failed: {response.text}"
        data = response.json()
        assert isinstance(data, dict), "Should return a dict"
        print(f"✅ Motos subcategories loaded - {len(data)} categories")


class TestListings:
    """Test listings API"""
    
    def test_listings_endpoint(self):
        """Test /api/listings returns listings"""
        response = requests.get(f"{BASE_URL}/api/listings")
        assert response.status_code == 200, f"Listings failed: {response.text}"
        data = response.json()
        # API returns paginated response with 'listings' key
        assert "listings" in data, "Should have 'listings' key"
        assert isinstance(data["listings"], list), "listings should be a list"
        assert "total" in data, "Should have 'total' key"
        print(f"✅ Listings endpoint working - {data['total']} listings")


class TestAuthenticatedEndpoints:
    """Test endpoints that require authentication"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "contact@worldautofrance.com",
            "password": "Admin123!2"
        })
        return response.json()["token"]
    
    def test_auth_me_endpoint(self, admin_token):
        """Test /api/auth/me returns user data"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200, f"Auth me failed: {response.text}"
        data = response.json()
        assert data["email"] == "contact@worldautofrance.com"
        print(f"✅ Auth me endpoint working - User: {data['name']}")
    
    def test_user_stats_endpoint(self, admin_token):
        """Test /api/users/me/stats returns user statistics"""
        response = requests.get(f"{BASE_URL}/api/users/me/stats", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200, f"User stats failed: {response.text}"
        data = response.json()
        assert "active_listings" in data
        assert "total_views" in data
        print(f"✅ User stats endpoint working - Active listings: {data['active_listings']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
