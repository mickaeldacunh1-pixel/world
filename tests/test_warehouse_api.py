"""
Test suite for Warehouse (Mon Entrepôt Pro) API endpoints
Tests: sections CRUD, items CRUD, stock adjustment, stats
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "contact@worldautofrance.com"
TEST_PASSWORD = "Admin123!"


class TestWarehouseAPI:
    """Warehouse API endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.created_section_id = None
        self.created_item_id = None
    
    def test_01_warehouse_stats(self):
        """Test GET /api/warehouse/stats"""
        response = requests.get(f"{BASE_URL}/api/warehouse/stats", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_items" in data
        assert "total_sections" in data
        assert "total_stock" in data
        assert "stock_value" in data
        assert "low_stock_count" in data
        print(f"✅ Stats: {data['total_items']} items, {data['total_sections']} sections, {data['total_stock']} stock")
    
    def test_02_warehouse_categories(self):
        """Test GET /api/warehouse/categories"""
        response = requests.get(f"{BASE_URL}/api/warehouse/categories", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "moteur" in data
        assert "carrosserie" in data
        assert "freinage" in data
        print(f"✅ Categories: {len(data)} categories available")
    
    def test_03_warehouse_sections_list(self):
        """Test GET /api/warehouse/sections"""
        response = requests.get(f"{BASE_URL}/api/warehouse/sections", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Sections: {len(data)} sections found")
    
    def test_04_create_section(self):
        """Test POST /api/warehouse/sections"""
        section_data = {
            "name": "TEST_Section_Pytest",
            "category": "moteur",
            "description": "Test section created by pytest"
        }
        response = requests.post(f"{BASE_URL}/api/warehouse/sections", 
                                json=section_data, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == section_data["name"]
        assert data["category"] == section_data["category"]
        assert "id" in data
        self.__class__.created_section_id = data["id"]
        print(f"✅ Section created: {data['id']}")
    
    def test_05_warehouse_items_list(self):
        """Test GET /api/warehouse/items"""
        response = requests.get(f"{BASE_URL}/api/warehouse/items", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Items: {len(data)} items found")
    
    def test_06_create_item(self):
        """Test POST /api/warehouse/items"""
        # First get a section ID
        sections_response = requests.get(f"{BASE_URL}/api/warehouse/sections", headers=self.headers)
        sections = sections_response.json()
        if not sections:
            pytest.skip("No sections available to create item")
        
        section_id = sections[0]["id"]
        
        item_data = {
            "name": "TEST_Item_Pytest",
            "section_id": section_id,
            "quantity": 10,
            "location": "A1-E1-B1",
            "reference_oem": "TEST123456",
            "brand": "TestBrand",
            "condition": "occasion",
            "purchase_price": 25.00,
            "selling_price": 50.00,
            "alert_threshold": 2
        }
        response = requests.post(f"{BASE_URL}/api/warehouse/items", 
                                json=item_data, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == item_data["name"]
        assert data["quantity"] == item_data["quantity"]
        assert "id" in data
        self.__class__.created_item_id = data["id"]
        print(f"✅ Item created: {data['id']}")
    
    def test_07_adjust_stock_increase(self):
        """Test POST /api/warehouse/items/{id}/adjust-stock (increase)"""
        # Get an item
        items_response = requests.get(f"{BASE_URL}/api/warehouse/items", headers=self.headers)
        items = items_response.json()
        if not items:
            pytest.skip("No items available to adjust stock")
        
        item_id = items[0]["id"]
        initial_quantity = items[0]["quantity"]
        
        response = requests.post(
            f"{BASE_URL}/api/warehouse/items/{item_id}/adjust-stock?adjustment=1",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["new_quantity"] == initial_quantity + 1
        print(f"✅ Stock increased: {initial_quantity} -> {data['new_quantity']}")
    
    def test_08_adjust_stock_decrease(self):
        """Test POST /api/warehouse/items/{id}/adjust-stock (decrease)"""
        # Get an item
        items_response = requests.get(f"{BASE_URL}/api/warehouse/items", headers=self.headers)
        items = items_response.json()
        if not items:
            pytest.skip("No items available to adjust stock")
        
        item_id = items[0]["id"]
        initial_quantity = items[0]["quantity"]
        
        response = requests.post(
            f"{BASE_URL}/api/warehouse/items/{item_id}/adjust-stock?adjustment=-1",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["new_quantity"] == initial_quantity - 1
        print(f"✅ Stock decreased: {initial_quantity} -> {data['new_quantity']}")
    
    def test_09_search_items(self):
        """Test GET /api/warehouse/items with search parameter"""
        response = requests.get(
            f"{BASE_URL}/api/warehouse/items?search=BMW",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Search 'BMW': {len(data)} items found")
    
    def test_10_cleanup_test_data(self):
        """Cleanup: Delete test items and sections"""
        # Delete test items
        items_response = requests.get(f"{BASE_URL}/api/warehouse/items", headers=self.headers)
        items = items_response.json()
        for item in items:
            if item["name"].startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/warehouse/items/{item['id']}", headers=self.headers)
                print(f"✅ Deleted test item: {item['name']}")
        
        # Delete test sections
        sections_response = requests.get(f"{BASE_URL}/api/warehouse/sections", headers=self.headers)
        sections = sections_response.json()
        for section in sections:
            if section["name"].startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/warehouse/sections/{section['id']}", headers=self.headers)
                print(f"✅ Deleted test section: {section['name']}")


class TestCreateListingAPI:
    """Create Listing API endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_01_create_listing(self):
        """Test POST /api/listings - verify no white page bug"""
        listing_data = {
            "title": "TEST_Listing_Pytest",
            "description": "Test listing created by pytest to verify bug fix",
            "price": 99.00,
            "category": "pieces",
            "subcategory": "moteur",
            "brand": "BMW",
            "model": "E46",
            "condition": "occasion",
            "location": "Paris",
            "postal_code": "75001",
            "shipping_methods": ["colissimo"],
            "shipping_cost": 10.00,
            "images": []
        }
        response = requests.post(f"{BASE_URL}/api/listings", 
                                json=listing_data, headers=self.headers)
        assert response.status_code == 200, f"Create listing failed: {response.text}"
        data = response.json()
        
        # Verify all required fields in response (bug fix verification)
        assert "id" in data
        assert "title" in data
        assert "description" in data
        assert "price" in data
        assert "category" in data
        assert "seller_id" in data
        assert "seller_name" in data
        assert "created_at" in data
        assert "status" in data
        assert "views" in data
        assert "compatible_brands" in data
        assert "compatible_models" in data
        assert "shipping_methods" in data
        
        print(f"✅ Listing created: {data['id']}")
        print(f"✅ All required fields present in response - bug fix verified")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/listings/{data['id']}", headers=self.headers)
        print(f"✅ Test listing deleted")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
