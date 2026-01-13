#!/usr/bin/env python3
"""
Hero Advanced Customization Test - API and Basic Frontend Check
Tests the Hero Advanced Customization feature without browser automation
"""

import requests
import json
import sys

class HeroCustomizationTester:
    def __init__(self):
        self.base_url = "https://parts-emporium-8.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.token = None
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
    
    def login_admin(self):
        """Login as admin user to get token"""
        try:
            response = requests.post(f"{self.api_url}/auth/login", json={
                "email": "admin_test@test.com",
                "password": "test1234"
            })
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('token')
                self.log_test("Admin API Login", True)
                return True
            else:
                self.log_test("Admin API Login", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Admin API Login", False, str(e))
            return False
    
    def test_hero_api_get_advanced_fields(self):
        """Test GET /api/settings/hero returns advanced fields"""
        try:
            response = requests.get(f"{self.api_url}/settings/hero")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for new advanced fields
                advanced_fields = [
                    "hero_title_size", "hero_description_size", "hero_text_align", 
                    "hero_height", "hero_show_search", "hero_show_categories", 
                    "hero_overlay_opacity", "category_pieces_image", "category_voitures_image",
                    "category_motos_image", "category_utilitaires_image", "category_accessoires_image"
                ]
                
                missing_fields = []
                for field in advanced_fields:
                    if field not in data:
                        missing_fields.append(field)
                
                if not missing_fields:
                    self.log_test("Hero API - Advanced Fields Present", True, f"All {len(advanced_fields)} fields found")
                    return True
                else:
                    self.log_test("Hero API - Advanced Fields Present", False, f"Missing fields: {missing_fields}")
                    return False
            else:
                self.log_test("Hero API - Advanced Fields Present", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Hero API - Advanced Fields Present", False, str(e))
            return False
    
    def test_hero_api_save_advanced_settings(self):
        """Test POST /api/settings/hero with advanced settings"""
        if not self.token:
            self.log_test("Hero API - Save Advanced Settings", False, "No admin token")
            return False
        
        try:
            # Test settings with all advanced options
            test_settings = {
                "hero_title_line1": "Test Advanced Title",
                "hero_title_line2": "Customized",
                "hero_description": "Testing advanced hero customization options",
                "hero_image": "https://example.com/test-hero.jpg",
                "hero_cta_text": "Test CTA",
                "hero_cta_link": "/test",
                # Advanced customization options
                "hero_title_size": "xlarge",
                "hero_description_size": "large", 
                "hero_text_align": "center",
                "hero_height": "fullscreen",
                "hero_show_search": False,
                "hero_show_categories": True,
                "hero_overlay_opacity": 75,
                # Category images
                "category_pieces_image": "https://example.com/pieces-test.jpg",
                "category_voitures_image": "https://example.com/voitures-test.jpg",
                "category_motos_image": "https://example.com/motos-test.jpg",
                "category_utilitaires_image": "https://example.com/utilitaires-test.jpg",
                "category_accessoires_image": "https://example.com/accessoires-test.jpg"
            }
            
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.post(f"{self.api_url}/settings/hero", json=test_settings, headers=headers)
            
            if response.status_code == 200:
                self.log_test("Hero API - Save Advanced Settings", True)
                return True
            else:
                self.log_test("Hero API - Save Advanced Settings", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Hero API - Save Advanced Settings", False, str(e))
            return False
    
    def test_hero_api_verify_persistence(self):
        """Test that advanced settings are persisted"""
        try:
            response = requests.get(f"{self.api_url}/settings/hero")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check that our test values were saved
                expected_values = {
                    "hero_title_line1": "Test Advanced Title",
                    "hero_title_size": "xlarge",
                    "hero_text_align": "center",
                    "hero_show_search": False,
                    "hero_show_categories": True,
                    "hero_overlay_opacity": 75
                }
                
                mismatches = []
                for field, expected_value in expected_values.items():
                    actual_value = data.get(field)
                    if actual_value != expected_value:
                        mismatches.append(f"{field}: expected {expected_value}, got {actual_value}")
                
                if not mismatches:
                    self.log_test("Hero API - Settings Persistence", True)
                    return True
                else:
                    self.log_test("Hero API - Settings Persistence", False, f"Mismatches: {mismatches}")
                    return False
            else:
                self.log_test("Hero API - Settings Persistence", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Hero API - Settings Persistence", False, str(e))
            return False
    
    def test_frontend_admin_page_accessible(self):
        """Test that admin settings page is accessible"""
        try:
            response = requests.get(f"{self.base_url}/admin/parametres")
            
            if response.status_code == 200:
                # Check if the response contains React app structure
                content = response.text.lower()
                
                # Look for React app indicators (since it's a SPA)
                react_indicators = [
                    "react", "root", "app", "world auto", "marketplace"
                ]
                
                found_indicators = []
                for indicator in react_indicators:
                    if indicator in content:
                        found_indicators.append(indicator)
                
                # For a React SPA, we just need to verify the page loads and contains the app structure
                if len(found_indicators) >= 2:  # At least 2 indicators should be present
                    self.log_test("Frontend - Admin Page Accessible", True, f"React app loaded, found: {found_indicators}")
                    return True
                else:
                    self.log_test("Frontend - Admin Page Accessible", False, f"React app not detected, found: {found_indicators}")
                    return False
            else:
                self.log_test("Frontend - Admin Page Accessible", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Frontend - Admin Page Accessible", False, str(e))
            return False
    
    def test_home_page_dynamic_rendering(self):
        """Test that home page can access hero settings for dynamic rendering"""
        try:
            response = requests.get(f"{self.base_url}/")
            
            if response.status_code == 200:
                content = response.text
                
                # Check if the page contains React app and can potentially load hero settings
                react_indicators = [
                    "react", "app", "root", "hero", "title", "description"
                ]
                
                found_indicators = []
                for indicator in react_indicators:
                    if indicator.lower() in content.lower():
                        found_indicators.append(indicator)
                
                if len(found_indicators) >= 3:
                    self.log_test("Frontend - Home Page Accessible", True, f"Found indicators: {found_indicators}")
                    return True
                else:
                    self.log_test("Frontend - Home Page Accessible", False, f"Only found: {found_indicators}")
                    return False
            else:
                self.log_test("Frontend - Home Page Accessible", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Frontend - Home Page Accessible", False, str(e))
            return False
    
    def test_api_authentication_required(self):
        """Test that POST /api/settings/hero requires authentication"""
        try:
            test_settings = {"hero_title_line1": "Unauthorized Test"}
            response = requests.post(f"{self.api_url}/settings/hero", json=test_settings)
            
            if response.status_code == 401:
                self.log_test("Hero API - Authentication Required", True)
                return True
            else:
                self.log_test("Hero API - Authentication Required", False, f"Expected 401, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Hero API - Authentication Required", False, str(e))
            return False
    
    def run_all_tests(self):
        """Run all tests"""
        print("🎨 Starting Hero Advanced Customization Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Backend API Tests
        print("\n🔧 Testing Backend API...")
        self.test_hero_api_get_advanced_fields()
        self.test_api_authentication_required()
        
        if self.login_admin():
            self.test_hero_api_save_advanced_settings()
            self.test_hero_api_verify_persistence()
        
        # Frontend Tests
        print("\n🌐 Testing Frontend...")
        self.test_frontend_admin_page_accessible()
        self.test_home_page_dynamic_rendering()
        
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("✅ All Hero Advanced Customization tests passed!")
            return True
        else:
            print("⚠️ Some tests failed.")
            return False

if __name__ == "__main__":
    tester = HeroCustomizationTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)