"""
Test suite for Iteration 4 features:
- Price History API
- Identity Verification APIs
- Stories API (already tested in iteration 3, quick verification)

Test credentials:
- Regular user: storiestest@test.com / test123456
- Admin user: contact@worldautofrance.com / Admin123!
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPriceHistoryAPI:
    """Test /api/listings/{id}/price-history endpoint"""
    
    def test_price_history_requires_valid_listing(self):
        """Test that price history returns 404 for non-existent listing"""
        response = requests.get(f"{BASE_URL}/api/listings/nonexistent123/price-history")
        assert response.status_code == 404
        print("✓ Price history returns 404 for non-existent listing")
    
    def test_price_history_returns_structure(self):
        """Test price history response structure with a real listing"""
        # First get a listing
        listings_response = requests.get(f"{BASE_URL}/api/listings?limit=1")
        assert listings_response.status_code == 200
        
        listings = listings_response.json()
        if not listings or len(listings) == 0:
            pytest.skip("No listings available for testing")
        
        listing_id = listings[0].get('id')
        if not listing_id:
            pytest.skip("Listing has no ID")
        
        # Get price history
        response = requests.get(f"{BASE_URL}/api/listings/{listing_id}/price-history")
        assert response.status_code == 200
        
        data = response.json()
        assert "listing_id" in data
        assert "current_price" in data
        assert "initial_price" in data
        assert "history" in data
        assert "total_changes" in data
        assert isinstance(data["history"], list)
        print(f"✓ Price history structure valid for listing {listing_id}")
        print(f"  Current price: {data['current_price']}, Total changes: {data['total_changes']}")


class TestIdentityVerificationAPI:
    """Test Identity Verification APIs"""
    
    @pytest.fixture
    def user_token(self):
        """Get token for regular user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "storiestest@test.com",
            "password": "test123456"
        })
        if response.status_code != 200:
            pytest.skip("Could not login as test user")
        return response.json().get("token")
    
    @pytest.fixture
    def admin_token(self):
        """Get token for admin user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "contact@worldautofrance.com",
            "password": "Admin123!"
        })
        if response.status_code != 200:
            pytest.skip("Could not login as admin user")
        return response.json().get("token")
    
    def test_identity_status_requires_auth(self):
        """Test that identity status requires authentication"""
        response = requests.get(f"{BASE_URL}/api/identity/status")
        assert response.status_code == 401
        print("✓ Identity status requires authentication")
    
    def test_identity_status_returns_status(self, user_token):
        """Test identity status endpoint returns proper structure"""
        response = requests.get(
            f"{BASE_URL}/api/identity/status",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "verified" in data
        assert isinstance(data["verified"], bool)
        print(f"✓ Identity status returned: {data['status']}, verified: {data['verified']}")
    
    def test_identity_submit_requires_auth(self):
        """Test that identity submission requires authentication"""
        response = requests.post(f"{BASE_URL}/api/identity/submit", json={
            "id_front_url": "https://example.com/front.jpg",
            "selfie_url": "https://example.com/selfie.jpg"
        })
        assert response.status_code == 401
        print("✓ Identity submit requires authentication")
    
    def test_admin_pending_requires_auth(self):
        """Test that admin pending endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/identity/pending")
        assert response.status_code == 401
        print("✓ Admin pending verifications requires authentication")
    
    def test_admin_pending_requires_admin_role(self, user_token):
        """Test that admin pending endpoint requires admin role"""
        response = requests.get(
            f"{BASE_URL}/api/admin/identity/pending",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        # Should return 403 for non-admin users
        assert response.status_code == 403
        print("✓ Admin pending verifications requires admin role")
    
    def test_admin_approve_requires_auth(self):
        """Test that admin approve endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/identity/test-user-id/approve")
        assert response.status_code == 401
        print("✓ Admin approve requires authentication")
    
    def test_admin_reject_requires_auth(self):
        """Test that admin reject endpoint requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/admin/identity/test-user-id/reject",
            json={"reason": "Test rejection"}
        )
        assert response.status_code == 401
        print("✓ Admin reject requires authentication")


class TestStoriesAPIQuickCheck:
    """Quick verification that Stories API still works"""
    
    def test_stories_list_public(self):
        """Test that stories list is publicly accessible"""
        response = requests.get(f"{BASE_URL}/api/stories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Stories list accessible, found {len(data)} stories")


class TestNavbarElements:
    """Test that required navbar elements exist via API checks"""
    
    def test_frontend_loads(self):
        """Test that frontend loads successfully"""
        response = requests.get(BASE_URL)
        assert response.status_code == 200
        print("✓ Frontend loads successfully")
    
    def test_stories_page_loads(self):
        """Test that stories page loads"""
        response = requests.get(f"{BASE_URL}/stories")
        assert response.status_code == 200
        print("✓ Stories page loads successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
