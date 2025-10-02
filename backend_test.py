#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Plastic Bag King Game
Tests all API endpoints with various scenarios including error cases
"""

import requests
import json
import time
import uuid
from datetime import datetime
from typing import Dict, List, Any

# Get backend URL from environment
BACKEND_URL = "https://leap-recycle.preview.emergentagent.com/api"

class PlasticBagKingTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat(),
            'response_data': response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if details:
            print(f"    Details: {details}")
        if not success and response_data:
            print(f"    Response: {response_data}")
        print()

    def test_health_check(self):
        """Test GET /api/ - Health check"""
        try:
            response = self.session.get(f"{self.base_url}/")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "Plastic Bag King API" in data["message"]:
                    self.log_test("Health Check", True, f"API is running: {data['message']}")
                else:
                    self.log_test("Health Check", False, "Unexpected response format", data)
            else:
                self.log_test("Health Check", False, f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")

    def test_save_score_valid(self):
        """Test POST /api/scores with valid data"""
        test_data = {
            "player_name": "João Silva",
            "height": 75,
            "completed": False,
            "completion_time": None
        }
        
        try:
            response = self.session.post(f"{self.base_url}/scores", json=test_data)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["success", "score_id", "new_record"]
                
                if all(field in data for field in required_fields):
                    if data["success"] and data["score_id"]:
                        self.log_test("Save Score - Valid Data", True, 
                                    f"Score saved successfully. New record: {data['new_record']}")
                        return data["score_id"]
                    else:
                        self.log_test("Save Score - Valid Data", False, "Success flag is False", data)
                else:
                    self.log_test("Save Score - Valid Data", False, "Missing required fields", data)
            else:
                self.log_test("Save Score - Valid Data", False, f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Save Score - Valid Data", False, f"Exception: {str(e)}")
        
        return None

    def test_save_score_completed(self):
        """Test POST /api/scores with completed game"""
        test_data = {
            "player_name": "Maria Santos",
            "height": 320,
            "completed": True,
            "completion_time": 240
        }
        
        try:
            response = self.session.post(f"{self.base_url}/scores", json=test_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("score_id"):
                    self.log_test("Save Score - Completed Game", True, 
                                f"Completed game score saved. Height: {test_data['height']}, Time: {test_data['completion_time']}s")
                    return data["score_id"]
                else:
                    self.log_test("Save Score - Completed Game", False, "Failed to save completed score", data)
            else:
                self.log_test("Save Score - Completed Game", False, f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Save Score - Completed Game", False, f"Exception: {str(e)}")
        
        return None

    def test_save_multiple_scores(self):
        """Test saving multiple scores for leaderboard testing"""
        test_scores = [
            {"player_name": "Pedro Costa", "height": 45, "completed": False},
            {"player_name": "Ana Lima", "height": 120, "completed": False},
            {"player_name": "Carlos Mendes", "height": 85, "completed": False},
            {"player_name": "Lucia Ferreira", "height": 310, "completed": True, "completion_time": 420},
            {"player_name": "Roberto Silva", "height": 305, "completed": True, "completion_time": 380}
        ]
        
        saved_count = 0
        for score_data in test_scores:
            try:
                response = self.session.post(f"{self.base_url}/scores", json=score_data)
                if response.status_code == 200 and response.json().get("success"):
                    saved_count += 1
            except:
                pass
        
        if saved_count == len(test_scores):
            self.log_test("Save Multiple Scores", True, f"Successfully saved {saved_count} test scores")
        else:
            self.log_test("Save Multiple Scores", False, f"Only saved {saved_count}/{len(test_scores)} scores")

    def test_leaderboard_default(self):
        """Test GET /api/leaderboard with default limit"""
        try:
            response = self.session.get(f"{self.base_url}/leaderboard")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    if len(data) > 0:
                        # Check if sorted by height (descending)
                        heights = [entry.get("height", 0) for entry in data]
                        is_sorted = all(heights[i] >= heights[i+1] for i in range(len(heights)-1))
                        
                        if is_sorted:
                            self.log_test("Leaderboard - Default", True, 
                                        f"Retrieved {len(data)} entries, properly sorted by height")
                        else:
                            self.log_test("Leaderboard - Default", False, "Leaderboard not sorted correctly", data)
                    else:
                        self.log_test("Leaderboard - Default", True, "Empty leaderboard (no scores yet)")
                else:
                    self.log_test("Leaderboard - Default", False, "Response is not a list", data)
            else:
                self.log_test("Leaderboard - Default", False, f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Leaderboard - Default", False, f"Exception: {str(e)}")

    def test_leaderboard_with_limit(self):
        """Test GET /api/leaderboard with custom limit"""
        try:
            response = self.session.get(f"{self.base_url}/leaderboard?limit=3")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    if len(data) <= 3:
                        self.log_test("Leaderboard - With Limit", True, 
                                    f"Retrieved {len(data)} entries (limit=3)")
                    else:
                        self.log_test("Leaderboard - With Limit", False, 
                                    f"Returned {len(data)} entries, expected max 3")
                else:
                    self.log_test("Leaderboard - With Limit", False, "Response is not a list", data)
            else:
                self.log_test("Leaderboard - With Limit", False, f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Leaderboard - With Limit", False, f"Exception: {str(e)}")

    def test_game_stats(self):
        """Test GET /api/stats - Game statistics"""
        try:
            response = self.session.get(f"{self.base_url}/stats")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["total_plays", "average_height", "completion_rate", "total_play_time"]
                
                if all(field in data for field in required_fields):
                    # Validate data types
                    if (isinstance(data["total_plays"], int) and 
                        isinstance(data["average_height"], (int, float)) and
                        isinstance(data["completion_rate"], (int, float)) and
                        isinstance(data["total_play_time"], str)):
                        
                        self.log_test("Game Stats", True, 
                                    f"Total plays: {data['total_plays']}, Avg height: {data['average_height']}, "
                                    f"Completion rate: {data['completion_rate']}%, Play time: {data['total_play_time']}")
                    else:
                        self.log_test("Game Stats", False, "Invalid data types in response", data)
                else:
                    self.log_test("Game Stats", False, "Missing required fields", data)
            else:
                self.log_test("Game Stats", False, f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Game Stats", False, f"Exception: {str(e)}")

    def test_start_session_with_name(self):
        """Test POST /api/session/start with player name"""
        test_data = {"player_name": "Teste Sessão"}
        
        try:
            response = self.session.post(f"{self.base_url}/session/start", json=test_data)
            
            if response.status_code == 200:
                data = response.json()
                if "session_id" in data and data["session_id"]:
                    self.log_test("Start Session - With Name", True, f"Session started: {data['session_id']}")
                    return data["session_id"]
                else:
                    self.log_test("Start Session - With Name", False, "No session_id in response", data)
            else:
                self.log_test("Start Session - With Name", False, f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Start Session - With Name", False, f"Exception: {str(e)}")
        
        return None

    def test_start_session_anonymous(self):
        """Test POST /api/session/start without player name"""
        test_data = {}
        
        try:
            response = self.session.post(f"{self.base_url}/session/start", json=test_data)
            
            if response.status_code == 200:
                data = response.json()
                if "session_id" in data and data["session_id"]:
                    self.log_test("Start Session - Anonymous", True, f"Anonymous session started: {data['session_id']}")
                    return data["session_id"]
                else:
                    self.log_test("Start Session - Anonymous", False, "No session_id in response", data)
            else:
                self.log_test("Start Session - Anonymous", False, f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Start Session - Anonymous", False, f"Exception: {str(e)}")
        
        return None

    def test_update_session(self, session_id: str):
        """Test PUT /api/session/{session_id} - Update session progress"""
        if not session_id:
            self.log_test("Update Session", False, "No session_id provided")
            return
            
        update_data = {
            "height": 95,
            "completed": False,
            "play_time": 180
        }
        
        try:
            response = self.session.put(f"{self.base_url}/session/{session_id}", json=update_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Update Session", True, f"Session updated: height={update_data['height']}")
                else:
                    self.log_test("Update Session", False, "Success flag is False", data)
            else:
                self.log_test("Update Session", False, f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Update Session", False, f"Exception: {str(e)}")

    def test_update_nonexistent_session(self):
        """Test PUT /api/session/{session_id} with invalid session ID"""
        fake_session_id = str(uuid.uuid4())
        update_data = {
            "height": 50,
            "completed": False,
            "play_time": 120
        }
        
        try:
            response = self.session.put(f"{self.base_url}/session/{fake_session_id}", json=update_data)
            
            if response.status_code == 404:
                self.log_test("Update Nonexistent Session", True, "Correctly returned 404 for invalid session")
            else:
                self.log_test("Update Nonexistent Session", False, 
                            f"Expected 404, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Update Nonexistent Session", False, f"Exception: {str(e)}")

    def test_get_player_achievements(self):
        """Test GET /api/achievements/{player_name}"""
        player_name = "Maria Santos"  # Player who completed the game
        
        try:
            response = self.session.get(f"{self.base_url}/achievements/{player_name}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check if achievements have required fields
                    if len(data) > 0:
                        achievement = data[0]
                        required_fields = ["id", "name", "description", "icon", "unlocked"]
                        
                        if all(field in achievement for field in required_fields):
                            unlocked_count = sum(1 for a in data if a.get("unlocked"))
                            self.log_test("Get Player Achievements", True, 
                                        f"Retrieved {len(data)} achievements, {unlocked_count} unlocked")
                        else:
                            self.log_test("Get Player Achievements", False, "Missing required fields", achievement)
                    else:
                        self.log_test("Get Player Achievements", True, "No achievements found (empty list)")
                else:
                    self.log_test("Get Player Achievements", False, "Response is not a list", data)
            else:
                self.log_test("Get Player Achievements", False, f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Get Player Achievements", False, f"Exception: {str(e)}")

    def test_unlock_achievement(self):
        """Test POST /api/achievements/unlock"""
        unlock_data = {
            "achievement_id": "first_steps",
            "player_name": "Teste Conquista"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/achievements/unlock", json=unlock_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Unlock Achievement", True, 
                                f"Achievement unlocked: {data.get('achievement', {}).get('name', 'Unknown')}")
                else:
                    # Check if it's already unlocked
                    if "already unlocked" in data.get("message", "").lower():
                        self.log_test("Unlock Achievement", True, "Achievement already unlocked (expected)")
                    else:
                        self.log_test("Unlock Achievement", False, "Failed to unlock achievement", data)
            else:
                self.log_test("Unlock Achievement", False, f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Unlock Achievement", False, f"Exception: {str(e)}")

    def test_unlock_achievement_already_unlocked(self):
        """Test unlocking the same achievement again"""
        unlock_data = {
            "achievement_id": "first_steps",
            "player_name": "Teste Conquista"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/achievements/unlock", json=unlock_data)
            
            if response.status_code == 200:
                data = response.json()
                if not data.get("success") and "already unlocked" in data.get("message", "").lower():
                    self.log_test("Unlock Already Unlocked Achievement", True, 
                                "Correctly handled already unlocked achievement")
                else:
                    self.log_test("Unlock Already Unlocked Achievement", False, 
                                "Should have returned 'already unlocked' message", data)
            else:
                self.log_test("Unlock Already Unlocked Achievement", False, 
                            f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Unlock Already Unlocked Achievement", False, f"Exception: {str(e)}")

    def test_invalid_endpoints(self):
        """Test invalid endpoints return appropriate errors"""
        invalid_endpoints = [
            "/api/invalid",
            "/api/scores/invalid",
            "/api/achievements/",
            "/api/session/invalid-id"
        ]
        
        for endpoint in invalid_endpoints:
            try:
                response = self.session.get(f"{self.base_url.replace('/api', '')}{endpoint}")
                if response.status_code in [404, 405, 422]:
                    continue  # Expected error codes
                else:
                    self.log_test("Invalid Endpoints", False, 
                                f"Endpoint {endpoint} returned unexpected status: {response.status_code}")
                    return
            except:
                continue
        
        self.log_test("Invalid Endpoints", True, "All invalid endpoints handled correctly")

    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        print("🎮 Starting Comprehensive Backend Testing for Plastic Bag King")
        print("=" * 60)
        
        # Basic functionality tests
        self.test_health_check()
        
        # Score management tests
        self.test_save_score_valid()
        self.test_save_score_completed()
        self.test_save_multiple_scores()
        
        # Leaderboard tests
        self.test_leaderboard_default()
        self.test_leaderboard_with_limit()
        
        # Statistics tests
        self.test_game_stats()
        
        # Session management tests
        session_id = self.test_start_session_with_name()
        self.test_start_session_anonymous()
        self.test_update_session(session_id)
        self.test_update_nonexistent_session()
        
        # Achievement tests
        self.test_get_player_achievements()
        self.test_unlock_achievement()
        self.test_unlock_achievement_already_unlocked()
        
        # Error handling tests
        self.test_invalid_endpoints()
        
        # Generate summary
        self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🚨 FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  ❌ {result['test']}: {result['details']}")
        
        print("\n✅ PASSED TESTS:")
        for result in self.test_results:
            if result['success']:
                print(f"  ✅ {result['test']}")
        
        return {
            'total': total_tests,
            'passed': passed_tests,
            'failed': failed_tests,
            'success_rate': (passed_tests/total_tests)*100,
            'results': self.test_results
        }

if __name__ == "__main__":
    tester = PlasticBagKingTester()
    tester.run_comprehensive_test()