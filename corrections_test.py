#!/usr/bin/env python3
"""
Test script specifically for the French corrections mentioned in the review request.

Tests:
1. Hero Settings API with category_engins_image field
2. Admin authentication and hero settings save functionality
"""

import requests
import json
from datetime import datetime

class CorrectionsAPITester:
    def __init__(self, base_url="https://worldauto-agent.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        if details and success:
            print(f"   ℹ️  {details}")

    def test_hero_settings_get_category_engins_image(self):
        """Test GET /api/settings/hero returns category_engins_image field"""
        print("\n🎨 Testing Hero Settings API - GET category_engins_image...")
        
        try:
            response = requests.get(f"{self.base_url}/settings/hero")
            
            if response.status_code == 200:
                self.log_test("Hero Settings GET - Status 200", True)
                
                try:
                    data = response.json()
                    
                    # Check if category_engins_image field exists
                    if "category_engins_image" in data:
                        self.log_test("Hero Settings - category_engins_image field present", True, 
                                    f"Value: {data.get('category_engins_image')}")
                        
                        # Check if it has a value (not None/empty)
                        engins_image = data.get('category_engins_image')
                        if engins_image:
                            self.log_test("Hero Settings - category_engins_image has value", True, 
                                        f"Image URL: {engins_image}")
                        else:
                            self.log_test("Hero Settings - category_engins_image has value", False, 
                                        "Field exists but is empty/null")
                    else:
                        self.log_test("Hero Settings - category_engins_image field present", False, 
                                    "Field missing from response")
                        return False
                    
                    # Check other expected fields
                    expected_fields = ["hero_title_line1", "hero_title_line2", "hero_description", 
                                     "hero_image", "hero_cta_text", "hero_cta_link"]
                    for field in expected_fields:
                        if field in data:
                            self.log_test(f"Hero Settings - {field} field", True)
                        else:
                            self.log_test(f"Hero Settings - {field} field", False, f"Missing field: {field}")
                    
                    return True
                    
                except json.JSONDecodeError:
                    self.log_test("Hero Settings GET - JSON Parse", False, "Invalid JSON response")
                    return False
            else:
                self.log_test("Hero Settings GET - Status 200", False, 
                            f"Status: {response.status_code}, Response: {response.text[:200]}")
                return False
                
        except Exception as e:
            self.log_test("Hero Settings GET - Request", False, f"Exception: {str(e)}")
            return False

    def test_admin_login(self):
        """Test admin login with contact@worldautofrance.com / Admin123!"""
        print("\n🔐 Testing Admin Login...")
        
        admin_credentials = {
            "email": "contact@worldautofrance.com",
            "password": "Admin123!"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/login", json=admin_credentials)
            
            if response.status_code == 200:
                self.log_test("Admin Login - Status 200", True)
                
                try:
                    data = response.json()
                    
                    if "token" in data:
                        self.admin_token = data["token"]
                        self.log_test("Admin Login - Token received", True, "Admin token obtained")
                        
                        # Check user info
                        if "user" in data:
                            user_info = data["user"]
                            if user_info.get("email") == "contact@worldautofrance.com":
                                self.log_test("Admin Login - Email verification", True, 
                                            f"Logged in as: {user_info.get('email')}")
                            else:
                                self.log_test("Admin Login - Email verification", False, 
                                            f"Unexpected email: {user_info.get('email')}")
                        
                        return True
                    else:
                        self.log_test("Admin Login - Token received", False, "No token in response")
                        return False
                        
                except json.JSONDecodeError:
                    self.log_test("Admin Login - JSON Parse", False, "Invalid JSON response")
                    return False
            else:
                self.log_test("Admin Login - Status 200", False, 
                            f"Status: {response.status_code}, Response: {response.text[:200]}")
                return False
                
        except Exception as e:
            self.log_test("Admin Login - Request", False, f"Exception: {str(e)}")
            return False

    def test_hero_settings_save_with_admin(self):
        """Test POST /api/settings/hero with admin authentication"""
        print("\n💾 Testing Hero Settings Save with Admin...")
        
        if not self.admin_token:
            self.log_test("Hero Settings Save - Admin Token", False, "No admin token available")
            return False
        
        # Test data with category_engins_image
        test_settings = {
            "hero_title_line1": "Test Title Line 1",
            "hero_title_line2": "Test Title Line 2",
            "hero_description": "Test description for hero section",
            "hero_image": "https://example.com/test-hero.jpg",
            "hero_cta_text": "Test CTA",
            "hero_cta_link": "/test-link",
            "category_engins_image": "https://example.com/test-engins-category.jpg"
        }
        
        headers = {
            "Authorization": f"Bearer {self.admin_token}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(f"{self.base_url}/settings/hero", 
                                   json=test_settings, headers=headers)
            
            if response.status_code == 200:
                self.log_test("Hero Settings Save - Status 200", True)
                
                try:
                    data = response.json()
                    
                    # Check for success message
                    if data.get("message"):
                        self.log_test("Hero Settings Save - Success message", True, 
                                    f"Message: {data.get('message')}")
                    else:
                        self.log_test("Hero Settings Save - Success message", False, 
                                    "No success message in response")
                    
                    return True
                    
                except json.JSONDecodeError:
                    self.log_test("Hero Settings Save - JSON Parse", False, "Invalid JSON response")
                    return False
            else:
                self.log_test("Hero Settings Save - Status 200", False, 
                            f"Status: {response.status_code}, Response: {response.text[:200]}")
                return False
                
        except Exception as e:
            self.log_test("Hero Settings Save - Request", False, f"Exception: {str(e)}")
            return False

    def test_hero_settings_persistence(self):
        """Test that saved hero settings are persisted correctly"""
        print("\n🔍 Testing Hero Settings Persistence...")
        
        try:
            response = requests.get(f"{self.base_url}/settings/hero")
            
            if response.status_code == 200:
                self.log_test("Hero Settings Persistence - GET Status", True)
                
                try:
                    data = response.json()
                    
                    # Check if our test values were saved
                    expected_values = {
                        "hero_title_line1": "Test Title Line 1",
                        "hero_title_line2": "Test Title Line 2",
                        "category_engins_image": "https://example.com/test-engins-category.jpg"
                    }
                    
                    all_persisted = True
                    for field, expected_value in expected_values.items():
                        actual_value = data.get(field)
                        if actual_value == expected_value:
                            self.log_test(f"Hero Persistence - {field}", True, 
                                        f"Value: {actual_value}")
                        else:
                            self.log_test(f"Hero Persistence - {field}", False, 
                                        f"Expected: {expected_value}, Got: {actual_value}")
                            all_persisted = False
                    
                    return all_persisted
                    
                except json.JSONDecodeError:
                    self.log_test("Hero Settings Persistence - JSON Parse", False, "Invalid JSON response")
                    return False
            else:
                self.log_test("Hero Settings Persistence - GET Status", False, 
                            f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Hero Settings Persistence - Request", False, f"Exception: {str(e)}")
            return False

    def run_corrections_tests(self):
        """Run all corrections tests"""
        print("🇫🇷 Testing French Corrections for World Auto")
        print("=" * 60)
        print("Testing against:", self.base_url)
        print("=" * 60)
        
        # Test 1: Hero Settings GET with category_engins_image
        test1_success = self.test_hero_settings_get_category_engins_image()
        
        # Test 2: Admin Login
        test2_success = self.test_admin_login()
        
        # Test 3: Hero Settings Save with Admin (only if login succeeded)
        test3_success = False
        if test2_success:
            test3_success = self.test_hero_settings_save_with_admin()
        else:
            self.log_test("Hero Settings Save - Skipped", False, "Admin login failed")
        
        # Test 4: Hero Settings Persistence (only if save succeeded)
        test4_success = False
        if test3_success:
            test4_success = self.test_hero_settings_persistence()
        else:
            self.log_test("Hero Settings Persistence - Skipped", False, "Save operation failed")
        
        # Summary
        print("\n" + "=" * 60)
        print("📋 CORRECTIONS TEST SUMMARY")
        print("=" * 60)
        
        corrections_results = [
            ("Hero Settings API - GET category_engins_image", test1_success),
            ("Admin Login - contact@worldautofrance.com", test2_success),
            ("Hero Settings API - POST with Admin Auth", test3_success),
            ("Hero Settings - Data Persistence", test4_success)
        ]
        
        for test_name, success in corrections_results:
            status = "✅ PASSED" if success else "❌ FAILED"
            print(f"{status} - {test_name}")
        
        print(f"\nCorrections Tests: {self.tests_passed}/{self.tests_run} passed")
        
        # Specific findings for the review request
        print("\n" + "=" * 60)
        print("🎯 SPECIFIC FINDINGS FOR REVIEW REQUEST")
        print("=" * 60)
        
        if test1_success:
            print("✅ GET /api/settings/hero correctly returns category_engins_image field")
        else:
            print("❌ GET /api/settings/hero missing category_engins_image field")
        
        if test2_success:
            print("✅ Admin credentials contact@worldautofrance.com / Admin123! work correctly")
        else:
            print("❌ Admin credentials contact@worldautofrance.com / Admin123! failed")
        
        if test3_success:
            print("✅ POST /api/settings/hero correctly saves category_engins_image with admin auth")
        else:
            print("❌ POST /api/settings/hero failed to save category_engins_image")
        
        if test4_success:
            print("✅ Hero settings including category_engins_image are persisted correctly")
        else:
            print("❌ Hero settings persistence failed")
        
        return self.tests_passed == self.tests_run

def main():
    tester = CorrectionsAPITester()
    success = tester.run_corrections_tests()
    return 0 if success else 1

if __name__ == "__main__":
    import sys
    sys.exit(main())