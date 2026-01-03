import requests
import sys
import json
from datetime import datetime

class AutoPiecesAPITester:
    def __init__(self, base_url="https://worldauto-market.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Response: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_root_endpoint(self):
        """Test root API endpoint"""
        result = self.run_test("Root API", "GET", "", 200)
        return result is not None

    def test_pricing_endpoint(self):
        """Test pricing endpoint"""
        result = self.run_test("Get Pricing", "GET", "pricing", 200)
        if result:
            expected_packages = ["single", "pack5", "pack20", "unlimited"]
            for package in expected_packages:
                if package not in result:
                    self.log_test(f"Pricing package {package}", False, "Package missing")
                    return False
                else:
                    self.log_test(f"Pricing package {package}", True)
        return result is not None

    def test_category_stats(self):
        """Test category stats endpoint"""
        result = self.run_test("Category Stats", "GET", "categories/stats", 200)
        return result is not None

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_user = {
            "name": f"Test User {timestamp}",
            "email": f"test{timestamp}@example.com",
            "password": "TestPass123!",
            "phone": "0612345678",
            "is_professional": False
        }
        
        result = self.run_test("User Registration", "POST", "auth/register", 200, test_user)
        if result and 'token' in result:
            self.token = result['token']
            if 'user' in result:
                self.user_id = result['user'].get('id')
            return True
        return False

    def test_user_login(self):
        """Test user login with existing user"""
        # First register a user
        timestamp = datetime.now().strftime('%H%M%S')
        test_user = {
            "name": f"Login Test {timestamp}",
            "email": f"login{timestamp}@example.com",
            "password": "TestPass123!",
            "is_professional": False
        }
        
        # Register
        reg_result = self.run_test("Register for Login Test", "POST", "auth/register", 200, test_user)
        if not reg_result:
            return False
        
        # Now test login
        login_data = {
            "email": test_user["email"],
            "password": test_user["password"]
        }
        
        result = self.run_test("User Login", "POST", "auth/login", 200, login_data)
        if result and 'token' in result:
            # Keep the token for further tests
            self.token = result['token']
            if 'user' in result:
                self.user_id = result['user'].get('id')
            return True
        return False

    def test_get_current_user(self):
        """Test get current user endpoint"""
        if not self.token:
            self.log_test("Get Current User", False, "No token available")
            return False
        
        result = self.run_test("Get Current User", "GET", "auth/me", 200)
        return result is not None

    def test_listings_endpoint(self):
        """Test listings endpoint"""
        result = self.run_test("Get Listings", "GET", "listings", 200)
        if result:
            # Check if response has expected structure
            if 'listings' in result:
                self.log_test("Listings structure", True)
                return True
            else:
                self.log_test("Listings structure", False, "Missing 'listings' key")
        return False

    def test_listings_with_filters(self):
        """Test listings with various filters"""
        # Test category filter
        result = self.run_test("Listings by Category", "GET", "listings?category=pieces", 200)
        if not result:
            return False
        
        # Test search filter
        result = self.run_test("Listings Search", "GET", "listings?search=test", 200)
        if not result:
            return False
        
        # Test price filter
        result = self.run_test("Listings Price Filter", "GET", "listings?min_price=10&max_price=1000", 200)
        return result is not None

    def test_create_listing_without_credits(self):
        """Test creating listing without credits (should fail)"""
        if not self.token:
            self.log_test("Create Listing (No Credits)", False, "No token available")
            return False
        
        listing_data = {
            "title": "Test Listing",
            "description": "Test description",
            "price": 100.0,
            "category": "pieces",
            "condition": "occasion"
        }
        
        # This should fail with 402 (Payment Required) since user has no credits
        result = self.run_test("Create Listing (No Credits)", "POST", "listings", 402, listing_data)
        return result is None  # We expect this to fail

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        if not self.token:
            self.log_test("Dashboard Stats", False, "No token available")
            return False
        
        result = self.run_test("Dashboard Stats", "GET", "stats/dashboard", 200)
        if result:
            expected_keys = ["active_listings", "total_listings", "total_views", "unread_messages", "credits"]
            for key in expected_keys:
                if key not in result:
                    self.log_test(f"Dashboard stat {key}", False, "Key missing")
                else:
                    self.log_test(f"Dashboard stat {key}", True)
        return result is not None

    def test_messages_conversations(self):
        """Test messages conversations endpoint"""
        if not self.token:
            self.log_test("Messages Conversations", False, "No token available")
            return False
        
        result = self.run_test("Messages Conversations", "GET", "messages/conversations", 200)
        return result is not None

    def test_professional_registration(self):
        """Test professional user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        pro_user = {
            "name": f"Pro User {timestamp}",
            "email": f"pro{timestamp}@example.com",
            "password": "TestPass123!",
            "phone": "0612345678",
            "is_professional": True,
            "company_name": "Test Auto SARL",
            "siret": "12345678900001"
        }
        
        result = self.run_test("Professional Registration", "POST", "auth/register", 200, pro_user)
        return result is not None and 'token' in result

    def test_pieces_subcategories(self):
        """Test pieces subcategories endpoint"""
        result = self.run_test("Pieces Subcategories", "GET", "subcategories/pieces", 200)
        if result:
            # Check if we have the expected number of subcategories (31 types)
            if len(result) >= 30:  # Allow some flexibility
                self.log_test("Pieces subcategories count", True, f"Found {len(result)} subcategories")
                # Check for some expected keys
                expected_keys = ["moteur", "boite_vitesse", "embrayage", "freinage", "suspension"]
                for key in expected_keys:
                    if key in result:
                        self.log_test(f"Pieces subcategory {key}", True)
                    else:
                        self.log_test(f"Pieces subcategory {key}", False, "Key missing")
                return True
            else:
                self.log_test("Pieces subcategories count", False, f"Expected ~31, got {len(result)}")
        return False

    def test_accessoires_subcategories(self):
        """Test accessoires subcategories endpoint"""
        result = self.run_test("Accessoires Subcategories", "GET", "subcategories/accessoires", 200)
        if result:
            # Check if we have the expected number of subcategories (25 types)
            if len(result) >= 24:  # Allow some flexibility
                self.log_test("Accessoires subcategories count", True, f"Found {len(result)} subcategories")
                # Check for some expected keys
                expected_keys = ["jantes", "gps_navigation", "autoradio", "alarme", "camera"]
                for key in expected_keys:
                    if key in result:
                        self.log_test(f"Accessoires subcategory {key}", True)
                    else:
                        self.log_test(f"Accessoires subcategory {key}", False, "Key missing")
                return True
            else:
                self.log_test("Accessoires subcategories count", False, f"Expected ~25, got {len(result)}")
        return False

    def test_car_brands(self):
        """Test car brands endpoint"""
        result = self.run_test("Car Brands", "GET", "brands", 200)
        if result:
            # Check if we have the expected number of brands (61 brands)
            if len(result) >= 60:  # Allow some flexibility
                self.log_test("Car brands count", True, f"Found {len(result)} brands")
                # Check for some expected brands
                expected_brands = ["BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Renault", "Peugeot", "Citroën"]
                for brand in expected_brands:
                    if brand in result:
                        self.log_test(f"Car brand {brand}", True)
                    else:
                        self.log_test(f"Car brand {brand}", False, "Brand missing")
                return True
            else:
                self.log_test("Car brands count", False, f"Expected ~61, got {len(result)}")
        return False

    def test_listings_with_subcategory_filter(self):
        """Test listings with subcategory filters"""
        # Test pieces subcategory filter
        result = self.run_test("Listings by Pieces Subcategory", "GET", "listings?category=pieces&subcategory=moteur", 200)
        if not result:
            return False
        
        # Test accessoires subcategory filter
        result = self.run_test("Listings by Accessoires Subcategory", "GET", "listings?category=accessoires&subcategory=jantes", 200)
        if not result:
            return False
        
        return True

    def test_listings_with_compatibility_filters(self):
        """Test listings with vehicle compatibility filters"""
        # Test compatible brand filter
        result = self.run_test("Listings by Compatible Brand", "GET", "listings?compatible_brand=BMW", 200)
        if not result:
            return False
        
        # Test OEM reference filter
        result = self.run_test("Listings by OEM Reference", "GET", "listings?oem_reference=7701474426", 200)
        if not result:
            return False
        
        return True

    def test_invalid_endpoints(self):
        """Test invalid endpoints return 404"""
        result = self.run_test("Invalid Endpoint", "GET", "invalid/endpoint", 404)
        return result is None  # We expect 404

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting AutoPièces API Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Basic endpoints
        self.test_root_endpoint()
        self.test_pricing_endpoint()
        self.test_category_stats()
        
        # NEW: Test subcategories and brands APIs (from review request)
        self.test_pieces_subcategories()
        self.test_accessoires_subcategories()
        self.test_car_brands()
        
        # Authentication tests
        self.test_user_registration()
        self.test_user_login()
        self.test_get_current_user()
        self.test_professional_registration()
        
        # Listings tests
        self.test_listings_endpoint()
        self.test_listings_with_filters()
        self.test_listings_with_subcategory_filter()
        self.test_listings_with_compatibility_filters()
        self.test_create_listing_without_credits()
        
        # Dashboard and messages
        self.test_dashboard_stats()
        self.test_messages_conversations()
        
        # Error handling
        self.test_invalid_endpoints()
        
        # Print summary
        print("=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return 1

def main():
    tester = AutoPiecesAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())