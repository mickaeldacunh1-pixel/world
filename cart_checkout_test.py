#!/usr/bin/env python3
"""
Focused test for cart checkout flow
Tests the POST /api/orders/checkout endpoint specifically
"""

import requests
import json
from datetime import datetime

class CartCheckoutTester:
    def __init__(self, base_url="https://webflow-clone-5.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.test_results = []

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} - {test_name}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make API request"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            
            result = {
                "status_code": response.status_code,
                "success": success
            }
            
            try:
                result["data"] = response.json()
            except:
                result["data"] = response.text
                
            return result

        except Exception as e:
            return {"error": str(e), "status_code": 0, "success": False}

    def register_test_user(self):
        """Register a test user for authentication"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "name": f"Cart Test User {timestamp}",
            "email": f"carttest{timestamp}@example.com",
            "password": "CartTest123!",
            "phone": "0612345678",
            "is_professional": False
        }
        
        result = self.make_request("POST", "auth/register", user_data, 200)
        
        if result["success"] and "token" in result.get("data", {}):
            self.token = result["data"]["token"]
            if "user" in result["data"]:
                self.user_id = result["data"]["user"].get("id")
            self.log_result("User Registration", True, f"Registered user: {user_data['email']}")
            return True
        else:
            self.log_result("User Registration", False, f"Error: {result.get('data', 'Unknown error')}")
            return False

    def test_checkout_empty_cart(self):
        """Test checkout with empty cart (should return 400)"""
        checkout_data = {
            "listing_ids": [],
            "buyer_address": "123 rue Test",
            "buyer_city": "Paris",
            "buyer_postal": "75001",
            "buyer_phone": "0612345678"
        }
        
        result = self.make_request("POST", "orders/checkout", checkout_data, 400)
        
        if result["success"]:
            self.log_result("Empty Cart Checkout", True, "Correctly returned 400 for empty cart")
            return True
        else:
            self.log_result("Empty Cart Checkout", False, f"Expected 400, got {result['status_code']}")
            return False

    def test_checkout_invalid_listing(self):
        """Test checkout with non-existent listing ID"""
        checkout_data = {
            "listing_ids": ["non-existent-listing-id"],
            "buyer_address": "123 rue Test",
            "buyer_city": "Paris",
            "buyer_postal": "75001",
            "buyer_phone": "0612345678"
        }
        
        result = self.make_request("POST", "orders/checkout", checkout_data, 400)
        
        if result["success"]:
            # Check if response contains error details
            data = result.get("data", {})
            if isinstance(data, dict) and "detail" in data:
                detail = data["detail"]
                if isinstance(detail, dict) and "errors" in detail:
                    self.log_result("Invalid Listing Checkout", True, "Correctly returned errors for invalid listing")
                    return True
                elif isinstance(detail, str) and "non trouvée" in detail:
                    self.log_result("Invalid Listing Checkout", True, "Correctly handled invalid listing")
                    return True
            self.log_result("Invalid Listing Checkout", True, "Correctly returned 400 for invalid listing")
            return True
        else:
            self.log_result("Invalid Listing Checkout", False, f"Expected 400, got {result['status_code']}")
            return False

    def test_checkout_endpoint_structure(self):
        """Test that checkout endpoint accepts required fields"""
        # Test with minimal required data
        checkout_data = {
            "listing_ids": ["test-listing-id"],
            "buyer_address": "123 rue de la Paix",
            "buyer_city": "Paris",
            "buyer_postal": "75001",
            "buyer_phone": "0612345678"
        }
        
        result = self.make_request("POST", "orders/checkout", checkout_data, 400)
        
        # We expect this to fail due to listing not found, but endpoint should accept the request
        if result["status_code"] in [200, 400, 404]:
            self.log_result("Checkout Endpoint Structure", True, "Endpoint accepts required fields")
            return True
        else:
            self.log_result("Checkout Endpoint Structure", False, f"Unexpected status: {result['status_code']}")
            return False

    def test_checkout_missing_fields(self):
        """Test checkout with missing required fields"""
        # Test missing buyer_address
        incomplete_data = {
            "listing_ids": ["test-listing-id"],
            "buyer_city": "Paris",
            "buyer_postal": "75001"
        }
        
        result = self.make_request("POST", "orders/checkout", incomplete_data, 422)
        
        if result["success"]:
            self.log_result("Missing Fields Validation", True, "Correctly validated missing fields")
            return True
        else:
            self.log_result("Missing Fields Validation", False, f"Expected 422, got {result['status_code']}")
            return False

    def test_authentication_required(self):
        """Test that checkout requires authentication"""
        # Temporarily remove token
        original_token = self.token
        self.token = None
        
        checkout_data = {
            "listing_ids": ["test-listing-id"],
            "buyer_address": "123 rue Test",
            "buyer_city": "Paris",
            "buyer_postal": "75001",
            "buyer_phone": "0612345678"
        }
        
        result = self.make_request("POST", "orders/checkout", checkout_data, 401)
        
        # Restore token
        self.token = original_token
        
        if result["success"]:
            self.log_result("Authentication Required", True, "Correctly requires authentication")
            return True
        else:
            self.log_result("Authentication Required", False, f"Expected 401, got {result['status_code']}")
            return False

    def run_all_tests(self):
        """Run all cart checkout tests"""
        print("🛒 Starting Cart Checkout Flow Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Step 1: Register user for authentication
        if not self.register_test_user():
            print("❌ Cannot proceed without authentication")
            return False
        
        # Step 2: Test authentication requirement
        self.test_authentication_required()
        
        # Step 3: Test endpoint structure
        self.test_checkout_endpoint_structure()
        
        # Step 4: Test validation
        self.test_checkout_missing_fields()
        
        # Step 5: Test empty cart
        self.test_checkout_empty_cart()
        
        # Step 6: Test invalid listing
        self.test_checkout_invalid_listing()
        
        # Summary
        print("=" * 60)
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        print(f"📊 Test Results: {passed}/{total} passed")
        
        if passed == total:
            print("🎉 All cart checkout tests passed!")
            return True
        else:
            print("⚠️  Some tests failed.")
            return False

def main():
    tester = CartCheckoutTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    import sys
    sys.exit(main())