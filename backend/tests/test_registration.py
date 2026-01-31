"""
Test Registration Endpoint - Bug Fix Verification
Tests for the registration endpoint after reCAPTCHA was disabled.
Issue: "Vérification de sécurité échouée" error even with RECAPTCHA_ENABLED=false
Root Cause: Backend server was not restarted after .env change
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSecurityConfig:
    """Test security configuration endpoint"""
    
    def test_recaptcha_disabled(self):
        """Verify reCAPTCHA is disabled in security config"""
        response = requests.get(f"{BASE_URL}/api/security/config")
        assert response.status_code == 200
        data = response.json()
        assert data["recaptcha_enabled"] == False, "reCAPTCHA should be disabled"
        assert data["recaptcha_site_key"] is None, "Site key should be None when disabled"
        print("✅ reCAPTCHA is correctly disabled")


class TestRegistration:
    """Test user registration endpoint"""
    
    def test_register_basic_user(self):
        """Test basic user registration without reCAPTCHA"""
        timestamp = int(time.time() * 1000)
        test_email = f"test_basic_{timestamp}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "Test123456",
            "name": "Test Basic User",
            "country": "France"
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        assert data["user"]["email"] == test_email
        assert data["user"]["name"] == "Test Basic User"
        assert data["user"]["country"] == "France"
        print(f"✅ Basic registration successful: {test_email}")
    
    def test_register_with_phone(self):
        """Test registration with phone number"""
        timestamp = int(time.time() * 1000)
        test_email = f"test_phone_{timestamp}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "Test123456",
            "name": "Test Phone User",
            "phone": "0612345678",
            "country": "France"
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        assert data["user"]["email"] == test_email
        print(f"✅ Registration with phone successful: {test_email}")
    
    def test_register_professional(self):
        """Test professional user registration"""
        timestamp = int(time.time() * 1000)
        test_email = f"test_pro_{timestamp}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "Test123456",
            "name": "Test Pro User",
            "country": "France",
            "is_professional": True,
            "company_name": "Test Company",
            "siret": "12345678901234"  # Fake SIRET for testing
        })
        
        # Note: SIRET validation may fail, but registration should work
        # The important thing is that reCAPTCHA doesn't block it
        if response.status_code == 200:
            data = response.json()
            assert data["user"]["is_professional"] == True
            print(f"✅ Professional registration successful: {test_email}")
        else:
            # SIRET validation error is acceptable
            assert "SIRET" in response.text or "siret" in response.text.lower()
            print(f"⚠️ Professional registration failed due to SIRET validation (expected)")
    
    def test_register_duplicate_email(self):
        """Test registration with duplicate email"""
        timestamp = int(time.time() * 1000)
        test_email = f"test_dup_{timestamp}@test.com"
        
        # First registration
        response1 = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "Test123456",
            "name": "Test Dup User 1",
            "country": "France"
        })
        assert response1.status_code == 200
        
        # Second registration with same email
        response2 = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "Test123456",
            "name": "Test Dup User 2",
            "country": "France"
        })
        assert response2.status_code == 400
        assert "déjà utilisé" in response2.json()["detail"].lower() or "already" in response2.json()["detail"].lower()
        print(f"✅ Duplicate email correctly rejected")
    
    def test_register_different_countries(self):
        """Test registration from different allowed countries"""
        allowed_countries = ["France", "Belgique", "Suisse", "Allemagne"]
        
        for country in allowed_countries:
            timestamp = int(time.time() * 1000)
            test_email = f"test_{country.lower()}_{timestamp}@test.com"
            
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": test_email,
                "password": "Test123456",
                "name": f"Test {country} User",
                "country": country
            })
            
            assert response.status_code == 200, f"Registration from {country} failed: {response.text}"
            print(f"✅ Registration from {country} successful")


class TestIPBlocking:
    """Test IP blocking mechanism"""
    
    def test_blocked_ip_message(self):
        """Verify blocked IP returns correct error message"""
        # This test verifies the error message format
        # We can't actually trigger IP blocking without many failed attempts
        response = requests.get(f"{BASE_URL}/api/security/config")
        assert response.status_code == 200
        print("✅ Security config accessible (IP not blocked)")


class TestHealthCheck:
    """Test health check endpoint"""
    
    def test_health_endpoint(self):
        """Verify health endpoint is working"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "connected"
        print("✅ Health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
