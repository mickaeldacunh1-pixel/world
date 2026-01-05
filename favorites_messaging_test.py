#!/usr/bin/env python3
"""
Focused test for Favorites and Messaging APIs
Tests the specific endpoints requested in the review
"""

import requests
import sys
import json
from datetime import datetime

class FavoritesMessagingTester:
    def __init__(self, base_url="https://carparts-trade.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.buyer_token = None
        self.seller_token = None
        self.buyer_user_id = None
        self.seller_user_id = None
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

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if token:
            test_headers['Authorization'] = f'Bearer {token}'
        elif headers:
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

    def setup_test_users(self):
        """Create two test users for testing"""
        timestamp = datetime.now().strftime('%H%M%S')
        
        # Create buyer user
        buyer_user = {
            "name": f"Buyer User {timestamp}",
            "email": f"buyer{timestamp}@example.com",
            "password": "BuyerPass123!",
            "phone": "0612345678",
            "is_professional": False
        }
        
        buyer_result = self.run_test("Setup - Register Buyer", "POST", "auth/register", 200, buyer_user)
        if not buyer_result or 'token' not in buyer_result:
            return False
        
        self.buyer_token = buyer_result['token']
        self.buyer_user_id = buyer_result['user']['id']
        
        # Create seller user
        seller_user = {
            "name": f"Seller User {timestamp}",
            "email": f"seller{timestamp}@example.com",
            "password": "SellerPass123!",
            "phone": "0612345679",
            "is_professional": False
        }
        
        seller_result = self.run_test("Setup - Register Seller", "POST", "auth/register", 200, seller_user)
        if not seller_result or 'token' not in seller_result:
            return False
        
        self.seller_token = seller_result['token']
        self.seller_user_id = seller_result['user']['id']
        
        print(f"✅ Test users created:")
        print(f"   Buyer: {buyer_user['email']} (ID: {self.buyer_user_id})")
        print(f"   Seller: {seller_user['email']} (ID: {self.seller_user_id})")
        
        return True

    def test_favorites_authentication(self):
        """Test that all favorites endpoints require authentication"""
        print("\n⭐ Testing Favorites API Authentication...")
        
        test_listing_id = "test-listing-id"
        
        # Test without authentication
        self.run_test("Favorites - Add (No Auth)", "POST", f"favorites/{test_listing_id}", 401)
        self.run_test("Favorites - Get List (No Auth)", "GET", "favorites", 401)
        self.run_test("Favorites - Check (No Auth)", "GET", f"favorites/check/{test_listing_id}", 401)
        self.run_test("Favorites - Remove (No Auth)", "DELETE", f"favorites/{test_listing_id}", 401)
        
        return True

    def test_favorites_with_invalid_listing(self):
        """Test favorites endpoints with invalid listing IDs"""
        print("\n⭐ Testing Favorites API with Invalid Listings...")
        
        invalid_listing_id = "non-existent-listing-id"
        
        # Test adding invalid listing to favorites
        result = self.run_test("Favorites - Add Invalid Listing", "POST", f"favorites/{invalid_listing_id}", 404, token=self.buyer_token)
        
        # Test checking invalid listing
        result = self.run_test("Favorites - Check Invalid Listing", "GET", f"favorites/check/{invalid_listing_id}", 200, token=self.buyer_token)
        if result and result.get("is_favorite") == False:
            self.log_test("Favorites - Invalid Listing Check Response", True, "Correctly returned is_favorite=false")
        else:
            self.log_test("Favorites - Invalid Listing Check Response", False, f"Unexpected response: {result}")
        
        # Test removing invalid listing from favorites
        self.run_test("Favorites - Remove Invalid Listing", "DELETE", f"favorites/{invalid_listing_id}", 404, token=self.buyer_token)
        
        return True

    def test_favorites_list_empty(self):
        """Test getting empty favorites list"""
        print("\n⭐ Testing Empty Favorites List...")
        
        result = self.run_test("Favorites - Get Empty List", "GET", "favorites", 200, token=self.buyer_token)
        if result is not None and isinstance(result, list) and len(result) == 0:
            self.log_test("Favorites - Empty List Structure", True, "Correctly returned empty array")
        else:
            self.log_test("Favorites - Empty List Structure", False, f"Expected empty array, got: {result}")
        
        return True

    def test_messaging_authentication(self):
        """Test that all messaging endpoints require authentication"""
        print("\n💬 Testing Messaging API Authentication...")
        
        # Test without authentication
        self.run_test("Messages - Conversations (No Auth)", "GET", "messages/conversations", 401)
        self.run_test("Messages - Send (No Auth)", "POST", "messages", 401)
        self.run_test("Messages - Get Conversation (No Auth)", "GET", "messages/test-listing/test-user", 401)
        
        return True

    def test_messaging_send_invalid_receiver(self):
        """Test sending message to invalid receiver"""
        print("\n💬 Testing Messaging with Invalid Receiver...")
        
        message_data = {
            "listing_id": "test-listing-id",
            "receiver_id": "non-existent-user-id",
            "content": "Test message to invalid user"
        }
        
        self.run_test("Messages - Send to Invalid User", "POST", "messages", 404, message_data, token=self.buyer_token)
        
        return True

    def test_messaging_between_users(self):
        """Test messaging between two valid users"""
        print("\n💬 Testing Messaging Between Users...")
        
        # Create a mock listing ID for testing
        test_listing_id = "test-listing-for-messaging"
        
        # Send message from buyer to seller
        message_data = {
            "listing_id": test_listing_id,
            "receiver_id": self.seller_user_id,
            "content": "Bonjour, je suis intéressé par cette pièce. Est-elle encore disponible ?"
        }
        
        send_result = self.run_test("Messages - Send Message", "POST", "messages", 200, message_data, token=self.buyer_token)
        if send_result:
            # Verify message structure
            required_fields = ["id", "listing_id", "sender_id", "sender_name", "receiver_id", "receiver_name", "content", "created_at", "read"]
            for field in required_fields:
                if field in send_result:
                    self.log_test(f"Message Field - {field}", True)
                else:
                    self.log_test(f"Message Field - {field}", False, f"Missing field: {field}")
                    return False
            
            # Verify content
            if send_result.get("content") == message_data["content"]:
                self.log_test("Messages - Content Correct", True)
            else:
                self.log_test("Messages - Content Correct", False, "Content mismatch")
                return False
            
            # Verify read status is False for new message
            if send_result.get("read") == False:
                self.log_test("Messages - Initial Read Status", True, "New message marked as unread")
            else:
                self.log_test("Messages - Initial Read Status", False, f"Expected read=false, got {send_result.get('read')}")
                return False
        else:
            return False
        
        # Test getting conversations (from buyer perspective)
        conversations_result = self.run_test("Messages - Get Conversations", "GET", "messages/conversations", 200, token=self.buyer_token)
        if conversations_result and isinstance(conversations_result, list):
            if len(conversations_result) > 0:
                conversation = conversations_result[0]
                # Verify conversation structure
                conv_fields = ["listing_id", "listing_title", "other_user_id", "other_user_name", "last_message", "last_message_at", "unread_count"]
                for field in conv_fields:
                    if field in conversation:
                        self.log_test(f"Conversation Field - {field}", True)
                    else:
                        self.log_test(f"Conversation Field - {field}", False, f"Missing field: {field}")
                        return False
                
                # Verify the conversation contains our test message
                if conversation.get("last_message") == message_data["content"]:
                    self.log_test("Messages - Conversation Last Message", True)
                else:
                    self.log_test("Messages - Conversation Last Message", False, "Last message doesn't match sent message")
                    return False
            else:
                self.log_test("Messages - Conversations Found", False, "No conversations found after sending message")
                return False
        else:
            self.log_test("Messages - Conversations Structure", False, "Expected array response")
            return False
        
        # Test getting messages in conversation
        messages_result = self.run_test("Messages - Get Conversation Messages", "GET", f"messages/{test_listing_id}/{self.seller_user_id}", 200, token=self.buyer_token)
        if messages_result and isinstance(messages_result, list):
            if len(messages_result) > 0:
                message = messages_result[0]
                # Verify message structure
                msg_fields = ["id", "listing_id", "sender_id", "sender_name", "receiver_id", "receiver_name", "content", "created_at", "read"]
                for field in msg_fields:
                    if field in message:
                        self.log_test(f"Conversation Message Field - {field}", True)
                    else:
                        self.log_test(f"Conversation Message Field - {field}", False, f"Missing field: {field}")
                        return False
                
                # Verify content matches
                if message.get("content") == message_data["content"]:
                    self.log_test("Messages - Conversation Message Content", True)
                else:
                    self.log_test("Messages - Conversation Message Content", False, "Message content doesn't match")
                    return False
            else:
                self.log_test("Messages - Conversation Messages Found", False, "No messages found in conversation")
                return False
        else:
            self.log_test("Messages - Conversation Messages Structure", False, "Expected array response")
            return False
        
        # Send a reply from seller to buyer
        reply_data = {
            "listing_id": test_listing_id,
            "receiver_id": self.buyer_user_id,
            "content": "Oui, la pièce est encore disponible. Le prix est ferme."
        }
        
        reply_result = self.run_test("Messages - Send Reply", "POST", "messages", 200, reply_data, token=self.seller_token)
        if not reply_result:
            return False
        
        # Check updated conversation from buyer perspective
        updated_conversations = self.run_test("Messages - Updated Conversations", "GET", "messages/conversations", 200, token=self.buyer_token)
        if updated_conversations and isinstance(updated_conversations, list) and len(updated_conversations) > 0:
            conversation = updated_conversations[0]
            # Check if last message is the reply
            if conversation.get("last_message") == reply_data["content"]:
                self.log_test("Messages - Conversation Updated", True, "Conversation shows latest reply")
            else:
                self.log_test("Messages - Conversation Updated", False, f"Expected '{reply_data['content']}', got '{conversation.get('last_message')}'")
                return False
            
            # Check unread count
            unread_count = conversation.get("unread_count", 0)
            if unread_count > 0:
                self.log_test("Messages - Unread Count", True, f"Unread count: {unread_count}")
            else:
                self.log_test("Messages - Unread Count", False, "Expected unread messages")
                return False
        else:
            self.log_test("Messages - Updated Conversations Structure", False, "Failed to get updated conversations")
            return False
        
        # Get full conversation and verify both messages
        full_conversation = self.run_test("Messages - Full Conversation", "GET", f"messages/{test_listing_id}/{self.seller_user_id}", 200, token=self.buyer_token)
        if full_conversation and isinstance(full_conversation, list):
            if len(full_conversation) >= 2:
                self.log_test("Messages - Full Conversation Length", True, f"Found {len(full_conversation)} messages")
                
                # Verify messages are in chronological order
                first_msg = full_conversation[0]
                second_msg = full_conversation[1]
                
                if first_msg.get("content") == message_data["content"] and second_msg.get("content") == reply_data["content"]:
                    self.log_test("Messages - Conversation Order", True, "Messages in correct chronological order")
                else:
                    self.log_test("Messages - Conversation Order", False, "Messages not in expected order")
                    return False
                
                # After getting messages, they should be marked as read
                final_conversations = self.run_test("Messages - Final Conversations Check", "GET", "messages/conversations", 200, token=self.buyer_token)
                if final_conversations and len(final_conversations) > 0:
                    final_unread = final_conversations[0].get("unread_count", 0)
                    if final_unread == 0:
                        self.log_test("Messages - Mark as Read", True, "Messages marked as read after viewing")
                    else:
                        self.log_test("Messages - Mark as Read", False, f"Still {final_unread} unread messages")
                        return False
            else:
                self.log_test("Messages - Full Conversation Length", False, f"Expected 2+ messages, got {len(full_conversation)}")
                return False
        else:
            self.log_test("Messages - Full Conversation Structure", False, "Failed to get full conversation")
            return False
        
        return True

    def test_messaging_empty_conversations(self):
        """Test getting empty conversations list"""
        print("\n💬 Testing Empty Conversations...")
        
        # Create a fresh user with no conversations
        timestamp = datetime.now().strftime('%H%M%S')
        fresh_user = {
            "name": f"Fresh User {timestamp}",
            "email": f"fresh{timestamp}@example.com",
            "password": "FreshPass123!",
            "phone": "0612345680",
            "is_professional": False
        }
        
        fresh_result = self.run_test("Setup - Register Fresh User", "POST", "auth/register", 200, fresh_user)
        if not fresh_result or 'token' not in fresh_result:
            return False
        
        fresh_token = fresh_result['token']
        
        # Test empty conversations
        result = self.run_test("Messages - Get Empty Conversations", "GET", "messages/conversations", 200, token=fresh_token)
        if result is not None and isinstance(result, list) and len(result) == 0:
            self.log_test("Messages - Empty Conversations Structure", True, "Correctly returned empty array")
        else:
            self.log_test("Messages - Empty Conversations Structure", False, f"Expected empty array, got: {result}")
        
        return True

    def test_messaging_invalid_conversation(self):
        """Test getting messages from invalid conversation"""
        print("\n💬 Testing Invalid Conversation...")
        
        # Test getting messages with invalid listing ID and user ID
        result = self.run_test("Messages - Invalid Conversation", "GET", "messages/invalid-listing/invalid-user", 200, token=self.buyer_token)
        if result is not None and isinstance(result, list) and len(result) == 0:
            self.log_test("Messages - Invalid Conversation Handling", True, "Correctly returned empty array for invalid conversation")
        else:
            self.log_test("Messages - Invalid Conversation Handling", False, "Unexpected response for invalid conversation")
        
        return True

    def run_all_tests(self):
        """Run all favorites and messaging tests"""
        print("🚀 Starting Favorites and Messaging API Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Setup test users
        if not self.setup_test_users():
            print("❌ Failed to setup test users")
            return 1
        
        # Test Favorites API
        print("\n⭐ FAVORITES API TESTS")
        print("-" * 30)
        self.test_favorites_authentication()
        self.test_favorites_with_invalid_listing()
        self.test_favorites_list_empty()
        
        # Test Messaging API
        print("\n💬 MESSAGING API TESTS")
        print("-" * 30)
        self.test_messaging_authentication()
        self.test_messaging_send_invalid_receiver()
        self.test_messaging_between_users()
        self.test_messaging_empty_conversations()
        self.test_messaging_invalid_conversation()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return 1

def main():
    tester = FavoritesMessagingTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())