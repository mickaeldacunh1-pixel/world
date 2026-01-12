"""
Test suite for WorldAuto Authentication API
Tests login, register, and /me endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://auto-parts-app-2.preview.emergentagent.com').rstrip('/')


class TestAuthLogin:
    """Test POST /api/auth/login endpoint"""
    
    def test_login_account_1_success(self):
        """Test login with contact@worldautofrance.com / Admin123!2"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "contact@worldautofrance.com",
                "password": "Admin123!2"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        assert data["user"]["email"] == "contact@worldautofrance.com"
        assert isinstance(data["token"], str)
        assert len(data["token"]) > 0
        print(f"✅ Login successful for contact@worldautofrance.com")
    
    def test_login_account_2_success(self):
        """Test login with 2db.auto.service@gmail.com / Admin123!3"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "2db.auto.service@gmail.com",
                "password": "Admin123!3"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        assert data["user"]["email"] == "2db.auto.service@gmail.com"
        assert isinstance(data["token"], str)
        assert len(data["token"]) > 0
        print(f"✅ Login successful for 2db.auto.service@gmail.com")
    
    def test_login_wrong_password(self):
        """Test login with wrong password returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "contact@worldautofrance.com",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data
        assert "incorrect" in data["detail"].lower() or "mot de passe" in data["detail"].lower()
        print(f"✅ Wrong password correctly rejected with 401")
    
    def test_login_nonexistent_email(self):
        """Test login with non-existent email returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "Admin123!2"
            }
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✅ Non-existent email correctly rejected with 401")
    
    def test_login_invalid_email_format(self):
        """Test login with invalid email format returns 422"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "not-an-email",
                "password": "Admin123!2"
            }
        )
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print(f"✅ Invalid email format correctly rejected with 422")
    
    def test_login_missing_password(self):
        """Test login with missing password returns 422"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "contact@worldautofrance.com"
            }
        )
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print(f"✅ Missing password correctly rejected with 422")


class TestAuthMe:
    """Test GET /api/auth/me endpoint"""
    
    @pytest.fixture
    def auth_token_account_1(self):
        """Get auth token for account 1"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "contact@worldautofrance.com",
                "password": "Admin123!2"
            }
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Could not authenticate account 1")
    
    @pytest.fixture
    def auth_token_account_2(self):
        """Get auth token for account 2"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "2db.auto.service@gmail.com",
                "password": "Admin123!3"
            }
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Could not authenticate account 2")
    
    def test_me_with_valid_token_account_1(self, auth_token_account_1):
        """Test /me endpoint with valid token for account 1"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {auth_token_account_1}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["email"] == "contact@worldautofrance.com"
        assert "id" in data
        assert "name" in data
        print(f"✅ /me endpoint works for account 1: {data['name']}")
    
    def test_me_with_valid_token_account_2(self, auth_token_account_2):
        """Test /me endpoint with valid token for account 2"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {auth_token_account_2}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["email"] == "2db.auto.service@gmail.com"
        assert "id" in data
        assert "name" in data
        print(f"✅ /me endpoint works for account 2: {data['name']}")
    
    def test_me_without_token(self):
        """Test /me endpoint without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✅ /me without token correctly rejected with 401")
    
    def test_me_with_invalid_token(self):
        """Test /me endpoint with invalid token returns 401"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✅ /me with invalid token correctly rejected with 401")


class TestAuthRegister:
    """Test POST /api/auth/register endpoint"""
    
    def test_register_new_user(self):
        """Test registration of a new user"""
        unique_email = f"test_user_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": unique_email,
                "password": "TestPassword123!",
                "name": "TEST_User_Pytest",
                "phone": "0612345678",
                "is_professional": False,
                "country": "France"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        assert data["user"]["email"] == unique_email
        assert data["user"]["name"] == "TEST_User_Pytest"
        assert "referral_code" in data["user"], "User should have a referral code"
        print(f"✅ Registration successful for {unique_email}")
        
        # Verify we can login with the new account
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": unique_email,
                "password": "TestPassword123!"
            }
        )
        assert login_response.status_code == 200, "Should be able to login with new account"
        print(f"✅ Login with new account successful")
    
    def test_register_duplicate_email(self):
        """Test registration with existing email returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": "contact@worldautofrance.com",
                "password": "TestPassword123!",
                "name": "Duplicate User",
                "country": "France"
            }
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data
        assert "email" in data["detail"].lower() or "utilisé" in data["detail"].lower()
        print(f"✅ Duplicate email correctly rejected with 400")
    
    def test_register_professional_user(self):
        """Test registration of a professional user with trial"""
        unique_email = f"test_pro_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": unique_email,
                "password": "TestPassword123!",
                "name": "TEST_Pro_User_Pytest",
                "phone": "0612345678",
                "is_professional": True,
                "company_name": "Test Company SARL",
                "siret": "12345678901234",
                "country": "France"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["user"]["is_professional"] == True
        # Pro users get trial credits
        assert data["user"]["credits"] >= 10, "Pro users should get trial credits"
        print(f"✅ Professional registration successful with {data['user']['credits']} credits")
    
    def test_register_with_promo_code(self):
        """Test registration with LANCEMENT promo code"""
        unique_email = f"test_promo_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": unique_email,
                "password": "TestPassword123!",
                "name": "TEST_Promo_User_Pytest",
                "country": "France",
                "promo_code": "LANCEMENT"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Check if promo was applied (may not be if limit reached)
        if data["user"].get("promo_code_used") == "LANCEMENT":
            assert data["user"]["free_ads_remaining"] > 0, "Should have free ads from promo"
            print(f"✅ Promo code LANCEMENT applied: {data['user']['free_ads_remaining']} free ads")
        else:
            print(f"⚠️ Promo code LANCEMENT not applied (may have reached limit)")
    
    def test_register_missing_required_fields(self):
        """Test registration with missing required fields returns 422"""
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": "test@example.com"
                # Missing password and name
            }
        )
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print(f"✅ Missing required fields correctly rejected with 422")
    
    def test_register_invalid_email_format(self):
        """Test registration with invalid email format returns 422"""
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": "not-an-email",
                "password": "TestPassword123!",
                "name": "Test User"
            }
        )
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print(f"✅ Invalid email format correctly rejected with 422")


class TestBcryptPasswordHashing:
    """Test bcrypt password hashing functionality"""
    
    def test_password_verification_works(self):
        """Verify that password verification works correctly by testing login"""
        # Test with correct password
        response_correct = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "contact@worldautofrance.com",
                "password": "Admin123!2"
            }
        )
        assert response_correct.status_code == 200, "Correct password should work"
        
        # Test with wrong password
        response_wrong = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "contact@worldautofrance.com",
                "password": "Admin123!2wrong"
            }
        )
        assert response_wrong.status_code == 401, "Wrong password should fail"
        
        print(f"✅ Bcrypt password verification working correctly")
    
    def test_password_case_sensitive(self):
        """Test that passwords are case-sensitive"""
        # Test with different case
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "contact@worldautofrance.com",
                "password": "admin123!2"  # lowercase
            }
        )
        assert response.status_code == 401, "Password should be case-sensitive"
        print(f"✅ Password is case-sensitive")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
