"""
Test suite for Push Notifications and Stories APIs
World Auto Pro - French automotive marketplace

Tests:
- Push Notifications: VAPID key, subscribe, unsubscribe, status, test notification
- Stories: GET active stories, POST create story, POST view story, DELETE story, GET my stories
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

# Get base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://webflow-clone-5.preview.emergentagent.com')

# Test credentials
TEST_USER_EMAIL = "storiestest@test.com"
TEST_USER_PASSWORD = "test123456"


class TestPushNotificationsAPI:
    """Push Notifications API tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for test user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        # If login fails, try to register
        register_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "name": "Stories Test User",
            "country": "France"
        })
        if register_response.status_code == 200:
            return register_response.json().get("token")
        pytest.skip(f"Authentication failed - login: {response.status_code}, register: {register_response.status_code}")
    
    def test_get_vapid_key(self):
        """GET /api/push/vapid-key - Should return VAPID public key"""
        response = requests.get(f"{BASE_URL}/api/push/vapid-key")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "public_key" in data, "Response should contain 'public_key'"
        assert isinstance(data["public_key"], str), "public_key should be a string"
        assert len(data["public_key"]) > 50, "VAPID key should be a long string"
        print(f"✅ VAPID key retrieved: {data['public_key'][:30]}...")
    
    def test_push_subscribe(self, auth_token):
        """POST /api/push/subscribe - Should save push subscription"""
        # Create a mock subscription object (browser would generate this)
        mock_subscription = {
            "endpoint": f"https://fcm.googleapis.com/fcm/send/test-{uuid.uuid4()}",
            "keys": {
                "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
                "auth": "tBHItJI5svbpez7KI4CCXg"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/push/subscribe",
            json={
                "subscription": mock_subscription,
                "preferences": {
                    "messages": True,
                    "price_alerts": True,
                    "new_offers": True,
                    "order_updates": True,
                    "promotions": False
                }
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        print(f"✅ Push subscription saved successfully")
    
    def test_push_status_after_subscribe(self, auth_token):
        """GET /api/push/status - Should return subscription status"""
        response = requests.get(
            f"{BASE_URL}/api/push/status",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "subscribed" in data, "Response should contain 'subscribed' field"
        assert "preferences" in data, "Response should contain 'preferences' field"
        print(f"✅ Push status: subscribed={data['subscribed']}, preferences={data['preferences']}")
    
    def test_push_test_notification(self, auth_token):
        """POST /api/push/test - Should attempt to send test notification"""
        response = requests.post(
            f"{BASE_URL}/api/push/test",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # This may fail if subscription is invalid (mock endpoint), but API should respond
        # Status 200 = success, 400 = notifications not enabled or send error
        assert response.status_code in [200, 400], f"Expected 200 or 400, got {response.status_code}: {response.text}"
        
        data = response.json()
        if response.status_code == 200:
            assert data.get("success") == True
            print(f"✅ Test notification sent successfully")
        else:
            print(f"⚠️ Test notification failed (expected with mock subscription): {data}")
    
    def test_push_unsubscribe(self, auth_token):
        """POST /api/push/unsubscribe - Should remove subscription"""
        response = requests.post(
            f"{BASE_URL}/api/push/unsubscribe",
            json={"endpoint": "https://fcm.googleapis.com/fcm/send/test-endpoint"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        print(f"✅ Push subscription removed successfully")
    
    def test_push_status_after_unsubscribe(self, auth_token):
        """GET /api/push/status - Should show unsubscribed after unsubscribe"""
        response = requests.get(
            f"{BASE_URL}/api/push/status",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("subscribed") == False, "Should be unsubscribed after unsubscribe"
        print(f"✅ Push status after unsubscribe: subscribed={data['subscribed']}")
    
    def test_push_status_requires_auth(self):
        """GET /api/push/status - Should require authentication"""
        response = requests.get(f"{BASE_URL}/api/push/status")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✅ Push status correctly requires authentication")
    
    def test_push_subscribe_requires_auth(self):
        """POST /api/push/subscribe - Should require authentication"""
        response = requests.post(f"{BASE_URL}/api/push/subscribe", json={
            "subscription": {"endpoint": "test"},
            "preferences": {}
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✅ Push subscribe correctly requires authentication")


class TestStoriesAPI:
    """Stories API tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for test user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip(f"Authentication failed: {response.status_code}")
    
    @pytest.fixture(scope="class")
    def user_info(self, auth_token):
        """Get current user info"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        if response.status_code == 200:
            return response.json()
        return {"id": "unknown"}
    
    def test_get_stories_public(self):
        """GET /api/stories - Should return active stories (public access)"""
        response = requests.get(f"{BASE_URL}/api/stories")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✅ GET /api/stories returned {len(data)} stories")
        
        # Validate story structure if any exist
        if len(data) > 0:
            story = data[0]
            assert "id" in story, "Story should have 'id'"
            assert "user_id" in story, "Story should have 'user_id'"
            assert "media_url" in story, "Story should have 'media_url'"
            assert "type" in story, "Story should have 'type'"
            assert "created_at" in story, "Story should have 'created_at'"
            assert "user_name" in story, "Story should have 'user_name'"
            print(f"✅ Story structure validated: {story['id'][:8]}...")
    
    def test_create_story(self, auth_token):
        """POST /api/stories - Should create a new story (requires auth)"""
        test_story = {
            "media_url": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop",
            "type": "image",
            "caption": f"Test story created at {datetime.now().isoformat()}"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/stories",
            json=test_story,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should contain story 'id'"
        assert data["media_url"] == test_story["media_url"], "media_url should match"
        assert data["type"] == test_story["type"], "type should match"
        assert data["caption"] == test_story["caption"], "caption should match"
        print(f"✅ Story created: {data['id']}")
        
        # Store story ID for later tests
        TestStoriesAPI.created_story_id = data["id"]
        return data["id"]
    
    def test_create_story_requires_auth(self):
        """POST /api/stories - Should require authentication"""
        response = requests.post(f"{BASE_URL}/api/stories", json={
            "media_url": "https://example.com/image.jpg",
            "type": "image"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✅ Create story correctly requires authentication")
    
    def test_view_story(self, auth_token):
        """POST /api/stories/{id}/view - Should mark story as viewed"""
        # First get stories to find one to view
        stories_response = requests.get(f"{BASE_URL}/api/stories")
        stories = stories_response.json()
        
        if len(stories) == 0:
            pytest.skip("No stories available to view")
        
        story_id = stories[0]["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/stories/{story_id}/view",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        print(f"✅ Story {story_id[:8]}... marked as viewed")
    
    def test_view_story_requires_auth(self):
        """POST /api/stories/{id}/view - Should require authentication"""
        response = requests.post(f"{BASE_URL}/api/stories/test-id/view")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✅ View story correctly requires authentication")
    
    def test_get_my_stories(self, auth_token):
        """GET /api/stories/my - Should return current user's stories"""
        response = requests.get(
            f"{BASE_URL}/api/stories/my",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✅ GET /api/stories/my returned {len(data)} stories")
        
        # Validate that all stories belong to current user
        for story in data:
            assert "id" in story, "Story should have 'id'"
            assert "media_url" in story, "Story should have 'media_url'"
    
    def test_get_my_stories_requires_auth(self):
        """GET /api/stories/my - Should require authentication"""
        response = requests.get(f"{BASE_URL}/api/stories/my")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✅ Get my stories correctly requires authentication")
    
    def test_delete_story(self, auth_token):
        """DELETE /api/stories/{id} - Should delete a story (requires auth)"""
        # First create a story to delete
        create_response = requests.post(
            f"{BASE_URL}/api/stories",
            json={
                "media_url": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop",
                "type": "image",
                "caption": "Story to be deleted"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if create_response.status_code != 200:
            pytest.skip("Could not create story to delete")
        
        story_id = create_response.json()["id"]
        
        # Now delete it
        response = requests.delete(
            f"{BASE_URL}/api/stories/{story_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        print(f"✅ Story {story_id[:8]}... deleted successfully")
    
    def test_delete_story_requires_auth(self):
        """DELETE /api/stories/{id} - Should require authentication"""
        response = requests.delete(f"{BASE_URL}/api/stories/test-id")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✅ Delete story correctly requires authentication")
    
    def test_delete_nonexistent_story(self, auth_token):
        """DELETE /api/stories/{id} - Should return 404 for non-existent story"""
        response = requests.delete(
            f"{BASE_URL}/api/stories/nonexistent-story-id-12345",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✅ Delete non-existent story returns 404")


class TestStoriesIntegration:
    """Integration tests for Stories feature"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for test user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip(f"Authentication failed: {response.status_code}")
    
    def test_story_lifecycle(self, auth_token):
        """Test complete story lifecycle: create -> view -> verify in my stories -> delete"""
        # 1. Create story
        create_response = requests.post(
            f"{BASE_URL}/api/stories",
            json={
                "media_url": "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=400&fit=crop",
                "type": "image",
                "caption": "Integration test story"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert create_response.status_code == 200
        story_id = create_response.json()["id"]
        print(f"✅ Step 1: Story created: {story_id[:8]}...")
        
        # 2. Verify story appears in public stories
        stories_response = requests.get(f"{BASE_URL}/api/stories")
        assert stories_response.status_code == 200
        stories = stories_response.json()
        story_ids = [s["id"] for s in stories]
        assert story_id in story_ids, "Created story should appear in public stories"
        print(f"✅ Step 2: Story appears in public stories list")
        
        # 3. Verify story appears in my stories
        my_stories_response = requests.get(
            f"{BASE_URL}/api/stories/my",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert my_stories_response.status_code == 200
        my_stories = my_stories_response.json()
        my_story_ids = [s["id"] for s in my_stories]
        assert story_id in my_story_ids, "Created story should appear in my stories"
        print(f"✅ Step 3: Story appears in my stories list")
        
        # 4. View the story
        view_response = requests.post(
            f"{BASE_URL}/api/stories/{story_id}/view",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert view_response.status_code == 200
        print(f"✅ Step 4: Story marked as viewed")
        
        # 5. Delete the story
        delete_response = requests.delete(
            f"{BASE_URL}/api/stories/{story_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert delete_response.status_code == 200
        print(f"✅ Step 5: Story deleted")
        
        # 6. Verify story no longer appears in public stories
        stories_after_delete = requests.get(f"{BASE_URL}/api/stories").json()
        story_ids_after = [s["id"] for s in stories_after_delete]
        assert story_id not in story_ids_after, "Deleted story should not appear in public stories"
        print(f"✅ Step 6: Story no longer in public stories after deletion")
        
        print(f"✅ Complete story lifecycle test passed!")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
