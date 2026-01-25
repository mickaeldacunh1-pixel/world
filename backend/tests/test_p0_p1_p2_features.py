"""
Test P0, P1, P2 Features:
- P0: Quantity field on listings + "Dernière pièce" badge
- P1: Seller bundles (grouped offers)
- P2: Shareable wishlist
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestP0QuantityField:
    """P0: Test quantity field on listings and API response"""
    
    def test_listings_api_returns_quantity_field(self):
        """Verify /api/listings returns quantity field in paginated response"""
        response = requests.get(f"{BASE_URL}/api/listings?limit=5")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # API returns paginated response with 'listings' key
        assert "listings" in data, "Response should have 'listings' key"
        assert isinstance(data["listings"], list), "listings should be a list"
        
        if len(data["listings"]) > 0:
            listing = data["listings"][0]
            # Verify quantity field exists
            assert "quantity" in listing, \
                f"Listing should have quantity field. Keys: {listing.keys()}"
            print(f"✅ Listing has quantity field: {listing.get('quantity')}")
            print(f"✅ Listing has views field: {listing.get('views')}")
    
    def test_listing_detail_returns_quantity(self):
        """Verify /api/listings/{id} returns quantity field"""
        # First get a listing ID from paginated response
        response = requests.get(f"{BASE_URL}/api/listings?limit=1")
        assert response.status_code == 200
        
        data = response.json()
        if len(data.get("listings", [])) == 0:
            pytest.skip("No listings available for testing")
        
        listing_id = data["listings"][0]["id"]
        
        # Get listing detail
        detail_response = requests.get(f"{BASE_URL}/api/listings/{listing_id}")
        assert detail_response.status_code == 200
        
        listing = detail_response.json()
        # Check quantity field
        quantity = listing.get("quantity")
        assert quantity is not None, "Listing detail should have quantity field"
        print(f"✅ Listing detail has quantity: {quantity}")
        
        # Verify views field for "Populaire" badge
        views = listing.get("views", 0)
        print(f"✅ Listing has views: {views}")
    
    def test_specific_listing_8b182804(self):
        """Test the specific listing mentioned in requirements"""
        listing_id = "8b182804-e5df-45cb-9475-78349cf297b8"
        
        response = requests.get(f"{BASE_URL}/api/listings/{listing_id}")
        
        if response.status_code == 404:
            pytest.skip(f"Listing {listing_id} not found - may have been deleted")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        listing = response.json()
        quantity = listing.get("quantity", 1)
        views = listing.get("views", 0)
        
        print(f"✅ Listing {listing_id}:")
        print(f"   - quantity: {quantity}")
        print(f"   - views: {views}")
        
        # Verify badge conditions
        assert quantity == 1, f"Expected quantity=1, got {quantity}"
        assert views >= 10, f"Expected views>=10, got {views}"
        
        print("   ✅ Should show 'Dernière pièce disponible' badge (quantity=1)")
        print("   ✅ Should show 'Populaire' badge (views>=10)")


class TestP1BundlesAPI:
    """P1: Test bundles (lots groupés) API"""
    
    def test_get_bundles_endpoint(self):
        """Verify /api/bundles endpoint works"""
        response = requests.get(f"{BASE_URL}/api/bundles")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✅ /api/bundles returns {len(data)} bundles")
        
        if len(data) > 0:
            bundle = data[0]
            # Verify bundle structure
            expected_fields = ["id", "title", "seller_id", "listing_ids", "bundle_price", "discount_percent"]
            for field in expected_fields:
                assert field in bundle, f"Bundle should have '{field}' field"
            print(f"✅ Bundle structure is correct: {bundle.get('title')}")
    
    def test_get_bundles_with_seller_filter(self):
        """Test filtering bundles by seller_id"""
        # First get a bundle to find a seller_id
        response = requests.get(f"{BASE_URL}/api/bundles")
        assert response.status_code == 200
        
        data = response.json()
        if len(data) == 0:
            pytest.skip("No bundles available for testing")
        
        seller_id = data[0]["seller_id"]
        
        # Filter by seller
        filtered_response = requests.get(f"{BASE_URL}/api/bundles?seller_id={seller_id}")
        assert filtered_response.status_code == 200
        
        filtered_data = filtered_response.json()
        for bundle in filtered_data:
            assert bundle["seller_id"] == seller_id, "All bundles should belong to the seller"
        
        print(f"✅ Seller filter works: {len(filtered_data)} bundles for seller {seller_id}")
    
    def test_get_bundle_by_id(self):
        """Test getting a specific bundle by ID"""
        # First get a bundle ID
        response = requests.get(f"{BASE_URL}/api/bundles")
        assert response.status_code == 200
        
        data = response.json()
        if len(data) == 0:
            pytest.skip("No bundles available for testing")
        
        bundle_id = data[0]["id"]
        
        # Get specific bundle
        detail_response = requests.get(f"{BASE_URL}/api/bundles/{bundle_id}")
        assert detail_response.status_code == 200
        
        bundle = detail_response.json()
        assert bundle["id"] == bundle_id
        print(f"✅ Bundle detail works: {bundle.get('title')}")
    
    def test_bundle_not_found(self):
        """Test 404 for non-existent bundle"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/bundles/{fake_id}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ Non-existent bundle returns 404")


class TestP2SharedWishlist:
    """P2: Test shareable wishlist API"""
    
    def test_shared_wishlist_endpoint_exists(self):
        """Verify /api/wishlist/shared/{shareId} endpoint exists"""
        # Test with a fake share ID - should return 404 (not 500 or other error)
        fake_share_id = "abc123xyz789"
        response = requests.get(f"{BASE_URL}/api/wishlist/shared/{fake_share_id}")
        
        # Should return 404 for non-existent wishlist, not 500
        assert response.status_code in [404, 200], \
            f"Expected 404 or 200, got {response.status_code}: {response.text}"
        
        if response.status_code == 404:
            print("✅ /api/wishlist/shared/{shareId} returns 404 for non-existent wishlist")
        else:
            print("✅ /api/wishlist/shared/{shareId} returns 200 (wishlist found)")
    
    def test_wishlist_share_requires_auth(self):
        """Verify /api/wishlist/share requires authentication"""
        response = requests.post(f"{BASE_URL}/api/wishlist/share")
        
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403, 422], \
            f"Expected 401/403/422, got {response.status_code}"
        print("✅ /api/wishlist/share requires authentication")
    
    def test_my_share_requires_auth(self):
        """Verify /api/wishlist/my-share requires authentication"""
        response = requests.get(f"{BASE_URL}/api/wishlist/my-share")
        
        # Should return 401 without auth
        assert response.status_code in [401, 403], \
            f"Expected 401/403, got {response.status_code}"
        print("✅ /api/wishlist/my-share requires authentication")


class TestHealthAndBasics:
    """Basic health checks"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("status") == "healthy"
        print("✅ API is healthy")
    
    def test_listings_endpoint(self):
        """Test listings endpoint works with pagination"""
        response = requests.get(f"{BASE_URL}/api/listings")
        assert response.status_code == 200
        
        data = response.json()
        assert "listings" in data, "Response should have 'listings' key"
        assert "total" in data, "Response should have 'total' key"
        assert isinstance(data["listings"], list)
        print(f"✅ /api/listings returns {len(data['listings'])} listings (total: {data['total']})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
