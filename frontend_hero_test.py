#!/usr/bin/env python3
"""
Frontend Hero Advanced Customization Test
Tests the admin panel functionality for Hero customization
"""

import requests
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import Select
import sys

class HeroCustomizationFrontendTester:
    def __init__(self):
        self.base_url = "https://autopartspro-3.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.driver = None
        self.tests_run = 0
        self.tests_passed = 0
        
    def setup_driver(self):
        """Setup Chrome driver with appropriate options"""
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            return True
        except Exception as e:
            print(f"❌ Failed to setup Chrome driver: {e}")
            return False
    
    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
    
    def login_admin(self):
        """Login as admin user"""
        try:
            self.driver.get(f"{self.base_url}/auth")
            
            # Wait for login form
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
            )
            
            # Fill login form
            email_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='email']")
            password_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='password']")
            
            email_input.send_keys("admin_test@test.com")
            password_input.send_keys("test1234")
            
            # Submit form
            login_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            login_button.click()
            
            # Wait for redirect (should go to dashboard or home)
            WebDriverWait(self.driver, 10).until(
                lambda driver: "/auth" not in driver.current_url
            )
            
            self.log_test("Admin Login", True)
            return True
            
        except Exception as e:
            self.log_test("Admin Login", False, str(e))
            return False
    
    def test_admin_settings_access(self):
        """Test access to admin settings page"""
        try:
            self.driver.get(f"{self.base_url}/admin/parametres")
            
            # Wait for admin settings page to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "h1"))
            )
            
            # Check if we're on the admin settings page
            page_title = self.driver.find_element(By.TAG_NAME, "h1").text
            if "Paramètres" in page_title or "Admin" in page_title:
                self.log_test("Admin Settings Access", True)
                return True
            else:
                self.log_test("Admin Settings Access", False, f"Unexpected page title: {page_title}")
                return False
                
        except Exception as e:
            self.log_test("Admin Settings Access", False, str(e))
            return False
    
    def test_hero_advanced_options_section(self):
        """Test that Hero Advanced Options section is visible"""
        try:
            # Look for the "Options avancées de mise en page" section
            advanced_section = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Options avancées de mise en page')]"))
            )
            
            self.log_test("Hero Advanced Options Section", True)
            return True
            
        except Exception as e:
            self.log_test("Hero Advanced Options Section", False, str(e))
            return False
    
    def test_hero_customization_dropdowns(self):
        """Test Hero customization dropdowns"""
        try:
            # Test Title Size dropdown
            title_size_label = self.driver.find_element(By.XPATH, "//*[contains(text(), 'Taille du titre')]")
            self.log_test("Title Size Dropdown Label", True)
            
            # Test Description Size dropdown
            desc_size_label = self.driver.find_element(By.XPATH, "//*[contains(text(), 'Taille de la description')]")
            self.log_test("Description Size Dropdown Label", True)
            
            # Test Text Alignment dropdown
            text_align_label = self.driver.find_element(By.XPATH, "//*[contains(text(), 'Alignement du texte')]")
            self.log_test("Text Alignment Dropdown Label", True)
            
            # Test Hero Height dropdown
            hero_height_label = self.driver.find_element(By.XPATH, "//*[contains(text(), 'Hauteur du Hero')]")
            self.log_test("Hero Height Dropdown Label", True)
            
            return True
            
        except Exception as e:
            self.log_test("Hero Customization Dropdowns", False, str(e))
            return False
    
    def test_hero_toggles(self):
        """Test Hero toggles for search and categories"""
        try:
            # Test Search Bar toggle
            search_toggle_label = self.driver.find_element(By.XPATH, "//*[contains(text(), 'Afficher la barre de recherche')]")
            self.log_test("Search Bar Toggle Label", True)
            
            # Test Categories toggle
            categories_toggle_label = self.driver.find_element(By.XPATH, "//*[contains(text(), 'Afficher les mini-catégories')]")
            self.log_test("Categories Toggle Label", True)
            
            return True
            
        except Exception as e:
            self.log_test("Hero Toggles", False, str(e))
            return False
    
    def test_category_images_section(self):
        """Test Category Images section"""
        try:
            # Look for the "Images des catégories" section
            category_images_section = self.driver.find_element(By.XPATH, "//*[contains(text(), 'Images des catégories')]")
            self.log_test("Category Images Section", True)
            
            # Check for category inputs (should be 5 categories)
            category_labels = [
                "Pièces détachées",
                "Voitures", 
                "Motos",
                "Utilitaires",
                "Accessoires"
            ]
            
            found_categories = 0
            for category in category_labels:
                try:
                    self.driver.find_element(By.XPATH, f"//*[contains(text(), '{category}')]")
                    found_categories += 1
                    self.log_test(f"Category Input - {category}", True)
                except:
                    self.log_test(f"Category Input - {category}", False, "Not found")
            
            if found_categories == 5:
                self.log_test("All Category Inputs Present", True)
                return True
            else:
                self.log_test("All Category Inputs Present", False, f"Found {found_categories}/5 categories")
                return False
                
        except Exception as e:
            self.log_test("Category Images Section", False, str(e))
            return False
    
    def test_live_preview(self):
        """Test that live preview is present"""
        try:
            # Look for preview elements
            preview_elements = self.driver.find_elements(By.CSS_SELECTOR, "[class*='preview'], [class*='Preview']")
            
            if len(preview_elements) > 0:
                self.log_test("Live Preview Present", True, f"Found {len(preview_elements)} preview elements")
                return True
            else:
                # Try to find hero preview by looking for hero-like content
                hero_elements = self.driver.find_elements(By.CSS_SELECTOR, "[class*='hero'], [class*='Hero']")
                if len(hero_elements) > 0:
                    self.log_test("Live Preview Present", True, f"Found {len(hero_elements)} hero elements")
                    return True
                else:
                    self.log_test("Live Preview Present", False, "No preview elements found")
                    return False
                    
        except Exception as e:
            self.log_test("Live Preview Present", False, str(e))
            return False
    
    def test_desktop_mobile_toggle(self):
        """Test Desktop/Mobile preview toggle"""
        try:
            # Look for desktop/mobile toggle buttons
            desktop_button = None
            mobile_button = None
            
            try:
                desktop_button = self.driver.find_element(By.XPATH, "//*[contains(text(), 'Desktop') or contains(text(), 'Ordinateur')]")
                self.log_test("Desktop Preview Toggle", True)
            except:
                self.log_test("Desktop Preview Toggle", False, "Desktop button not found")
            
            try:
                mobile_button = self.driver.find_element(By.XPATH, "//*[contains(text(), 'Mobile') or contains(text(), 'Téléphone')]")
                self.log_test("Mobile Preview Toggle", True)
            except:
                self.log_test("Mobile Preview Toggle", False, "Mobile button not found")
            
            return desktop_button is not None or mobile_button is not None
            
        except Exception as e:
            self.log_test("Desktop/Mobile Toggle", False, str(e))
            return False
    
    def run_all_tests(self):
        """Run all frontend tests"""
        print("🎨 Starting Hero Advanced Customization Frontend Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        if not self.setup_driver():
            print("❌ Failed to setup browser driver")
            return False
        
        try:
            # Test sequence
            if not self.login_admin():
                return False
            
            if not self.test_admin_settings_access():
                return False
            
            self.test_hero_advanced_options_section()
            self.test_hero_customization_dropdowns()
            self.test_hero_toggles()
            self.test_category_images_section()
            self.test_live_preview()
            self.test_desktop_mobile_toggle()
            
            print("=" * 60)
            print(f"📊 Frontend Test Results: {self.tests_passed}/{self.tests_run} passed")
            
            if self.tests_passed == self.tests_run:
                print("✅ All frontend tests passed!")
                return True
            else:
                print("⚠️ Some frontend tests failed.")
                return False
                
        finally:
            if self.driver:
                self.driver.quit()

if __name__ == "__main__":
    tester = HeroCustomizationFrontendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)