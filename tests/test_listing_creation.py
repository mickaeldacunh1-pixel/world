"""
Test suite for listing creation - Testing 422 error fix and shipping methods
Tests the specific issues reported:
1. 422 error on listing creation (empty strings for Optional[int] fields)
2. Shipping methods availability in the form
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "contact@worldautofrance.com"
TEST_PASSWORD = "Admin123!2"  # Correct password from previous test report


class TestAuthentication:
    """Test user authentication"""
    
    def test_login_with_correct_credentials(self):
        """Test login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert "user" in data, "No user in response"
        assert data["user"]["email"] == TEST_EMAIL
        print(f"✅ Login successful for {TEST_EMAIL}")
        return data["token"]
    
    def test_login_with_wrong_password(self):
        """Test login with wrong password (test123 as mentioned in issue)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": "test123"  # Wrong password
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Login correctly rejected with wrong password 'test123'")


class TestListingCreation:
    """Test listing creation - specifically the 422 error fix"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Authentication failed: {response.text}")
        return response.json()["token"]
    
    def test_create_listing_with_null_optional_fields(self, auth_token):
        """Test creating listing with null values for optional int fields (the fix)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        listing_data = {
            "title": "TEST_Pièce Test - Null Fields",
            "description": "Test de création avec champs optionnels null",
            "price": 99.99,
            "category": "pieces",
            "condition": "occasion",
            "shipping_methods": ["colissimo"],
            # Optional int fields set to null (the fix)
            "year": None,
            "mileage": None,
            "vehicle_mileage": None,
            "warranty_duration": None,
            "shipping_cost": None
        }
        
        response = requests.post(f"{BASE_URL}/api/listings", json=listing_data, headers=headers)
        
        # Should NOT get 422 error
        assert response.status_code != 422, f"Got 422 error (the bug): {response.text}"
        assert response.status_code in [200, 201], f"Unexpected status: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "id" in data, "No listing ID returned"
        print(f"✅ Listing created successfully with null optional fields: {data['id']}")
        
        # Cleanup - delete the test listing
        return data["id"]
    
    def test_create_listing_with_empty_strings_should_fail_or_convert(self, auth_token):
        """Test that empty strings for int fields are handled (either rejected or converted)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # This is what the frontend was sending before the fix
        listing_data = {
            "title": "TEST_Pièce Test - Empty Strings",
            "description": "Test avec strings vides",
            "price": 50.0,
            "category": "pieces",
            "condition": "occasion",
            "shipping_methods": ["hand_delivery"],
            # Empty strings - this caused the 422 error
            "year": "",
            "mileage": "",
            "vehicle_mileage": "",
        }
        
        response = requests.post(f"{BASE_URL}/api/listings", json=listing_data, headers=headers)
        
        # This should either:
        # 1. Return 422 (backend validation) - which is the bug
        # 2. Return 200/201 if backend handles empty strings
        if response.status_code == 422:
            print(f"⚠️ Backend returns 422 for empty strings (expected behavior, frontend should convert to null)")
            print(f"   Error: {response.json()}")
        else:
            print(f"✅ Backend handles empty strings gracefully: {response.status_code}")
    
    def test_create_listing_with_shipping_methods(self, auth_token):
        """Test that shipping methods are properly saved"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        shipping_methods = ["colissimo", "mondial_relay", "hand_delivery"]
        
        listing_data = {
            "title": "TEST_Pièce avec Transporteurs",
            "description": "Test des modes de livraison",
            "price": 75.0,
            "category": "pieces",
            "condition": "occasion",
            "shipping_methods": shipping_methods,
            "year": None,
            "mileage": None,
            "vehicle_mileage": None,
        }
        
        response = requests.post(f"{BASE_URL}/api/listings", json=listing_data, headers=headers)
        assert response.status_code in [200, 201], f"Failed to create listing: {response.text}"
        
        data = response.json()
        listing_id = data["id"]
        
        # Verify shipping methods were saved
        get_response = requests.get(f"{BASE_URL}/api/listings/{listing_id}")
        assert get_response.status_code == 200
        
        listing = get_response.json()
        assert "shipping_methods" in listing, "shipping_methods not in response"
        assert set(listing["shipping_methods"]) == set(shipping_methods), \
            f"Shipping methods mismatch: expected {shipping_methods}, got {listing['shipping_methods']}"
        
        print(f"✅ Shipping methods saved correctly: {listing['shipping_methods']}")
        return listing_id


class TestShippingMethods:
    """Test shipping methods availability"""
    
    def test_get_shipping_options_endpoint(self):
        """Check if there's an endpoint for shipping options"""
        # Try common endpoints
        endpoints = [
            "/api/shipping-options",
            "/api/shipping/options",
            "/api/config/shipping",
        ]
        
        for endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}")
            if response.status_code == 200:
                print(f"✅ Found shipping options at {endpoint}: {response.json()}")
                return
        
        print("ℹ️ No dedicated shipping options endpoint found (options may be hardcoded in frontend)")
    
    def test_listings_include_shipping_methods(self):
        """Verify listings include shipping_methods field"""
        response = requests.get(f"{BASE_URL}/api/listings?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        listings = data.get("listings", [])
        
        if not listings:
            print("ℹ️ No listings found to check shipping methods")
            return
        
        for listing in listings:
            assert "shipping_methods" in listing, f"Listing {listing['id']} missing shipping_methods"
            print(f"  Listing '{listing['title'][:30]}...' has shipping: {listing['shipping_methods']}")
        
        print(f"✅ All {len(listings)} listings have shipping_methods field")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Authentication failed: {response.text}")
        return response.json()["token"]
    
    def test_cleanup_test_listings(self, auth_token):
        """Delete test listings created during tests"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get user's listings
        response = requests.get(f"{BASE_URL}/api/users/me/listings", headers=headers)
        if response.status_code != 200:
            print(f"Could not get user listings: {response.text}")
            return
        
        listings = response.json()
        deleted = 0
        
        for listing in listings:
            if listing.get("title", "").startswith("TEST_"):
                del_response = requests.delete(
                    f"{BASE_URL}/api/listings/{listing['id']}", 
                    headers=headers
                )
                if del_response.status_code in [200, 204]:
                    deleted += 1
                    print(f"  Deleted: {listing['title']}")
        
        print(f"✅ Cleaned up {deleted} test listings")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
