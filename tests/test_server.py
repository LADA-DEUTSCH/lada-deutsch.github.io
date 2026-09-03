"""Unit tests for FastAPI Web & WebSocket Endpoints."""

import unittest
from fastapi.testclient import TestClient
from app import app


class TestWebServer(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_index_route(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("Deutsch Live Acquisition Companion", response.text)

    def test_profile_api(self):
        response = self.client.get("/api/profile")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("learner_id", data)
        self.assertIn("skills", data)

    def test_mission_api(self):
        response = self.client.get("/api/mission")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("primary_target", data)
        self.assertIn("forbidden_targets", data)

    def test_latest_notebook_api(self):
        response = self.client.get("/api/notebook/latest")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("html", data)

    def test_settings_api(self):
        response = self.client.post("/api/settings", json={"api_key": "AIzaSy_TEST_KEY_123"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get("status"), "success")


if __name__ == "__main__":
    unittest.main()
