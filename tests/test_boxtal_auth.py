"""
Test Boxtal API Authentication - Testing different credential combinations
to find the correct format for POST https://api.boxtal.build/iam/account-app/token

Credentials:
- BOXTAL_APP_ID: app-7f579a44-ed18-40a6-8feb-b924396302d2
- BOXTAL_ACCESS_KEY: 5DAZG2L2AVL5JUBMASPXJVBZXJY3Y0O0P09AY416
- BOXTAL_SECRET_KEY: a97a9989-227a-4997-a826-6bd8e0ffe712

Note: The .env file has a different SECRET_KEY (marketplace-debug-7) which is likely wrong.
Using the correct SECRET_KEY from the task requirements.
"""

import pytest
import requests
import base64
import json
import os

# Boxtal credentials from task requirements
BOXTAL_APP_ID = "app-7f579a44-ed18-40a6-8feb-b924396302d2"
BOXTAL_ACCESS_KEY = "5DAZG2L2AVL5JUBMASPXJVBZXJY3Y0O0P09AY416"
BOXTAL_SECRET_KEY = "a97a9989-227a-4997-a826-6bd8e0ffe712"
AUTH_URL = "https://api.boxtal.build/iam/account-app/token"


class TestBoxtalAuthentication:
    """Test different authentication combinations for Boxtal API"""
    
    def test_01_basic_auth_access_key_secret_key(self):
        """Test 1: Basic Auth with ACCESS_KEY:SECRET_KEY (current implementation)"""
        print("\n" + "="*60)
        print("TEST 1: Basic Auth with ACCESS_KEY:SECRET_KEY")
        print("="*60)
        
        credentials = f"{BOXTAL_ACCESS_KEY}:{BOXTAL_SECRET_KEY}"
        encoded = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {encoded}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {"grant_type": "client_credentials"}
        
        print(f"URL: {AUTH_URL}")
        print(f"Headers: {headers}")
        print(f"Data: {data}")
        
        response = requests.post(AUTH_URL, headers=headers, data=data, timeout=30)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:500] if response.text else 'Empty body'}")
        
        if response.status_code == 200:
            print("✅ SUCCESS - This combination works!")
            return True
        return False
    
    def test_02_basic_auth_app_id_secret_key(self):
        """Test 2: Basic Auth with APP_ID:SECRET_KEY"""
        print("\n" + "="*60)
        print("TEST 2: Basic Auth with APP_ID:SECRET_KEY")
        print("="*60)
        
        credentials = f"{BOXTAL_APP_ID}:{BOXTAL_SECRET_KEY}"
        encoded = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {encoded}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {"grant_type": "client_credentials"}
        
        print(f"URL: {AUTH_URL}")
        print(f"Credentials: {BOXTAL_APP_ID}:{BOXTAL_SECRET_KEY[:10]}...")
        print(f"Data: {data}")
        
        response = requests.post(AUTH_URL, headers=headers, data=data, timeout=30)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:500] if response.text else 'Empty body'}")
        
        if response.status_code == 200:
            print("✅ SUCCESS - This combination works!")
            return True
        return False
    
    def test_03_basic_auth_app_id_access_key(self):
        """Test 3: Basic Auth with APP_ID:ACCESS_KEY"""
        print("\n" + "="*60)
        print("TEST 3: Basic Auth with APP_ID:ACCESS_KEY")
        print("="*60)
        
        credentials = f"{BOXTAL_APP_ID}:{BOXTAL_ACCESS_KEY}"
        encoded = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {encoded}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {"grant_type": "client_credentials"}
        
        print(f"URL: {AUTH_URL}")
        print(f"Credentials: {BOXTAL_APP_ID}:{BOXTAL_ACCESS_KEY[:10]}...")
        print(f"Data: {data}")
        
        response = requests.post(AUTH_URL, headers=headers, data=data, timeout=30)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:500] if response.text else 'Empty body'}")
        
        if response.status_code == 200:
            print("✅ SUCCESS - This combination works!")
            return True
        return False
    
    def test_04_body_credentials_form_urlencoded(self):
        """Test 4: Credentials in body (form-urlencoded) - client_id/client_secret"""
        print("\n" + "="*60)
        print("TEST 4: Credentials in body (form-urlencoded)")
        print("="*60)
        
        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {
            "grant_type": "client_credentials",
            "client_id": BOXTAL_ACCESS_KEY,
            "client_secret": BOXTAL_SECRET_KEY
        }
        
        print(f"URL: {AUTH_URL}")
        print(f"Headers: {headers}")
        print(f"Data: {data}")
        
        response = requests.post(AUTH_URL, headers=headers, data=data, timeout=30)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:500] if response.text else 'Empty body'}")
        
        if response.status_code == 200:
            print("✅ SUCCESS - This combination works!")
            return True
        return False
    
    def test_05_body_credentials_with_app_id(self):
        """Test 5: Credentials in body with APP_ID as client_id"""
        print("\n" + "="*60)
        print("TEST 5: Credentials in body with APP_ID as client_id")
        print("="*60)
        
        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {
            "grant_type": "client_credentials",
            "client_id": BOXTAL_APP_ID,
            "client_secret": BOXTAL_SECRET_KEY
        }
        
        print(f"URL: {AUTH_URL}")
        print(f"Data: {data}")
        
        response = requests.post(AUTH_URL, headers=headers, data=data, timeout=30)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:500] if response.text else 'Empty body'}")
        
        if response.status_code == 200:
            print("✅ SUCCESS - This combination works!")
            return True
        return False
    
    def test_06_json_body_credentials(self):
        """Test 6: JSON body instead of form-urlencoded"""
        print("\n" + "="*60)
        print("TEST 6: JSON body credentials")
        print("="*60)
        
        headers = {
            "Content-Type": "application/json"
        }
        data = {
            "grant_type": "client_credentials",
            "client_id": BOXTAL_ACCESS_KEY,
            "client_secret": BOXTAL_SECRET_KEY
        }
        
        print(f"URL: {AUTH_URL}")
        print(f"Headers: {headers}")
        print(f"Data: {json.dumps(data)}")
        
        response = requests.post(AUTH_URL, headers=headers, json=data, timeout=30)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:500] if response.text else 'Empty body'}")
        
        if response.status_code == 200:
            print("✅ SUCCESS - This combination works!")
            return True
        return False
    
    def test_07_json_body_with_app_id(self):
        """Test 7: JSON body with APP_ID"""
        print("\n" + "="*60)
        print("TEST 7: JSON body with APP_ID as client_id")
        print("="*60)
        
        headers = {
            "Content-Type": "application/json"
        }
        data = {
            "grant_type": "client_credentials",
            "client_id": BOXTAL_APP_ID,
            "client_secret": BOXTAL_SECRET_KEY
        }
        
        print(f"URL: {AUTH_URL}")
        print(f"Data: {json.dumps(data)}")
        
        response = requests.post(AUTH_URL, headers=headers, json=data, timeout=30)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:500] if response.text else 'Empty body'}")
        
        if response.status_code == 200:
            print("✅ SUCCESS - This combination works!")
            return True
        return False
    
    def test_08_password_grant_type(self):
        """Test 8: Using password grant_type"""
        print("\n" + "="*60)
        print("TEST 8: Password grant_type")
        print("="*60)
        
        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {
            "grant_type": "password",
            "username": BOXTAL_ACCESS_KEY,
            "password": BOXTAL_SECRET_KEY
        }
        
        print(f"URL: {AUTH_URL}")
        print(f"Data: {data}")
        
        response = requests.post(AUTH_URL, headers=headers, data=data, timeout=30)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:500] if response.text else 'Empty body'}")
        
        if response.status_code == 200:
            print("✅ SUCCESS - This combination works!")
            return True
        return False
    
    def test_09_basic_auth_with_accept_header(self):
        """Test 9: Basic Auth with Accept header"""
        print("\n" + "="*60)
        print("TEST 9: Basic Auth with Accept header")
        print("="*60)
        
        credentials = f"{BOXTAL_ACCESS_KEY}:{BOXTAL_SECRET_KEY}"
        encoded = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {encoded}",
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        }
        data = {"grant_type": "client_credentials"}
        
        print(f"URL: {AUTH_URL}")
        print(f"Headers: {headers}")
        print(f"Data: {data}")
        
        response = requests.post(AUTH_URL, headers=headers, data=data, timeout=30)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:500] if response.text else 'Empty body'}")
        
        if response.status_code == 200:
            print("✅ SUCCESS - This combination works!")
            return True
        return False
    
    def test_10_basic_auth_with_x_app_id_header(self):
        """Test 10: Basic Auth with X-App-Id header"""
        print("\n" + "="*60)
        print("TEST 10: Basic Auth with X-App-Id header")
        print("="*60)
        
        credentials = f"{BOXTAL_ACCESS_KEY}:{BOXTAL_SECRET_KEY}"
        encoded = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {encoded}",
            "Content-Type": "application/x-www-form-urlencoded",
            "X-App-Id": BOXTAL_APP_ID
        }
        data = {"grant_type": "client_credentials"}
        
        print(f"URL: {AUTH_URL}")
        print(f"Headers: {headers}")
        print(f"Data: {data}")
        
        response = requests.post(AUTH_URL, headers=headers, data=data, timeout=30)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:500] if response.text else 'Empty body'}")
        
        if response.status_code == 200:
            print("✅ SUCCESS - This combination works!")
            return True
        return False
    
    def test_11_basic_auth_with_app_id_in_body(self):
        """Test 11: Basic Auth with app_id in body (current implementation style)"""
        print("\n" + "="*60)
        print("TEST 11: Basic Auth with app_id in body")
        print("="*60)
        
        credentials = f"{BOXTAL_ACCESS_KEY}:{BOXTAL_SECRET_KEY}"
        encoded = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {encoded}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {
            "grant_type": "client_credentials",
            "app_id": BOXTAL_APP_ID
        }
        
        print(f"URL: {AUTH_URL}")
        print(f"Headers: {headers}")
        print(f"Data: {data}")
        
        response = requests.post(AUTH_URL, headers=headers, data=data, timeout=30)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:500] if response.text else 'Empty body'}")
        
        if response.status_code == 200:
            print("✅ SUCCESS - This combination works!")
            return True
        return False
    
    def test_12_all_three_credentials_in_body(self):
        """Test 12: All three credentials in body"""
        print("\n" + "="*60)
        print("TEST 12: All three credentials in body")
        print("="*60)
        
        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {
            "grant_type": "client_credentials",
            "app_id": BOXTAL_APP_ID,
            "access_key": BOXTAL_ACCESS_KEY,
            "secret_key": BOXTAL_SECRET_KEY
        }
        
        print(f"URL: {AUTH_URL}")
        print(f"Data: {data}")
        
        response = requests.post(AUTH_URL, headers=headers, data=data, timeout=30)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:500] if response.text else 'Empty body'}")
        
        if response.status_code == 200:
            print("✅ SUCCESS - This combination works!")
            return True
        return False
    
    def test_13_basic_auth_app_id_secret_with_access_in_body(self):
        """Test 13: Basic Auth APP_ID:SECRET_KEY with access_key in body"""
        print("\n" + "="*60)
        print("TEST 13: Basic Auth APP_ID:SECRET_KEY with access_key in body")
        print("="*60)
        
        credentials = f"{BOXTAL_APP_ID}:{BOXTAL_SECRET_KEY}"
        encoded = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {encoded}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {
            "grant_type": "client_credentials",
            "access_key": BOXTAL_ACCESS_KEY
        }
        
        print(f"URL: {AUTH_URL}")
        print(f"Headers: {headers}")
        print(f"Data: {data}")
        
        response = requests.post(AUTH_URL, headers=headers, data=data, timeout=30)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:500] if response.text else 'Empty body'}")
        
        if response.status_code == 200:
            print("✅ SUCCESS - This combination works!")
            return True
        return False
    
    def test_14_oauth2_style_with_scope(self):
        """Test 14: OAuth2 style with scope parameter"""
        print("\n" + "="*60)
        print("TEST 14: OAuth2 style with scope parameter")
        print("="*60)
        
        credentials = f"{BOXTAL_ACCESS_KEY}:{BOXTAL_SECRET_KEY}"
        encoded = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {encoded}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {
            "grant_type": "client_credentials",
            "scope": "shipping"
        }
        
        print(f"URL: {AUTH_URL}")
        print(f"Headers: {headers}")
        print(f"Data: {data}")
        
        response = requests.post(AUTH_URL, headers=headers, data=data, timeout=30)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:500] if response.text else 'Empty body'}")
        
        if response.status_code == 200:
            print("✅ SUCCESS - This combination works!")
            return True
        return False
    
    def test_15_alternative_auth_url(self):
        """Test 15: Try alternative auth URL (api.boxtal.com instead of api.boxtal.build)"""
        print("\n" + "="*60)
        print("TEST 15: Alternative auth URL (api.boxtal.com)")
        print("="*60)
        
        alt_url = "https://api.boxtal.com/iam/account-app/token"
        
        credentials = f"{BOXTAL_ACCESS_KEY}:{BOXTAL_SECRET_KEY}"
        encoded = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {encoded}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {"grant_type": "client_credentials"}
        
        print(f"URL: {alt_url}")
        print(f"Headers: {headers}")
        print(f"Data: {data}")
        
        try:
            response = requests.post(alt_url, headers=headers, data=data, timeout=30)
            
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text[:500] if response.text else 'Empty body'}")
            
            if response.status_code == 200:
                print("✅ SUCCESS - This combination works!")
                return True
        except Exception as e:
            print(f"Error: {e}")
        return False
    
    def test_16_no_grant_type(self):
        """Test 16: Without grant_type parameter"""
        print("\n" + "="*60)
        print("TEST 16: Without grant_type parameter")
        print("="*60)
        
        credentials = f"{BOXTAL_ACCESS_KEY}:{BOXTAL_SECRET_KEY}"
        encoded = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {encoded}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {}  # No grant_type
        
        print(f"URL: {AUTH_URL}")
        print(f"Headers: {headers}")
        print(f"Data: {data}")
        
        response = requests.post(AUTH_URL, headers=headers, data=data, timeout=30)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:500] if response.text else 'Empty body'}")
        
        if response.status_code == 200:
            print("✅ SUCCESS - This combination works!")
            return True
        return False


def run_all_tests():
    """Run all tests and summarize results"""
    test_instance = TestBoxtalAuthentication()
    results = {}
    
    test_methods = [
        ("test_01_basic_auth_access_key_secret_key", "Basic Auth ACCESS_KEY:SECRET_KEY"),
        ("test_02_basic_auth_app_id_secret_key", "Basic Auth APP_ID:SECRET_KEY"),
        ("test_03_basic_auth_app_id_access_key", "Basic Auth APP_ID:ACCESS_KEY"),
        ("test_04_body_credentials_form_urlencoded", "Body credentials (form-urlencoded)"),
        ("test_05_body_credentials_with_app_id", "Body credentials with APP_ID"),
        ("test_06_json_body_credentials", "JSON body credentials"),
        ("test_07_json_body_with_app_id", "JSON body with APP_ID"),
        ("test_08_password_grant_type", "Password grant_type"),
        ("test_09_basic_auth_with_accept_header", "Basic Auth with Accept header"),
        ("test_10_basic_auth_with_x_app_id_header", "Basic Auth with X-App-Id header"),
        ("test_11_basic_auth_with_app_id_in_body", "Basic Auth with app_id in body"),
        ("test_12_all_three_credentials_in_body", "All three credentials in body"),
        ("test_13_basic_auth_app_id_secret_with_access_in_body", "Basic Auth APP_ID:SECRET with access_key in body"),
        ("test_14_oauth2_style_with_scope", "OAuth2 style with scope"),
        ("test_15_alternative_auth_url", "Alternative auth URL (api.boxtal.com)"),
        ("test_16_no_grant_type", "Without grant_type"),
    ]
    
    print("\n" + "="*80)
    print("BOXTAL API AUTHENTICATION TEST SUITE")
    print("="*80)
    print(f"APP_ID: {BOXTAL_APP_ID}")
    print(f"ACCESS_KEY: {BOXTAL_ACCESS_KEY}")
    print(f"SECRET_KEY: {BOXTAL_SECRET_KEY[:10]}...")
    print(f"AUTH_URL: {AUTH_URL}")
    print("="*80)
    
    for method_name, description in test_methods:
        try:
            method = getattr(test_instance, method_name)
            result = method()
            results[description] = "✅ SUCCESS" if result else "❌ FAILED"
        except Exception as e:
            results[description] = f"❌ ERROR: {str(e)[:50]}"
    
    print("\n" + "="*80)
    print("SUMMARY OF RESULTS")
    print("="*80)
    
    for test_name, result in results.items():
        print(f"{result} - {test_name}")
    
    successful = [k for k, v in results.items() if "SUCCESS" in v]
    if successful:
        print("\n" + "="*80)
        print("🎉 WORKING COMBINATIONS:")
        print("="*80)
        for s in successful:
            print(f"  ✅ {s}")
    else:
        print("\n" + "="*80)
        print("❌ NO WORKING COMBINATION FOUND")
        print("="*80)
    
    return results


if __name__ == "__main__":
    run_all_tests()
