import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.main import app

client = TestClient(app)

def test_reverse_geocode_endpoint():
    # Test valid latitude/longitude
    response = client.get("/api/location/reverse-geocode?latitude=19.2403124&longitude=73.1305127&source=gps")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "location" in data
    # Verify exact coordinates preserved
    assert data["location"]["latitude"] == 19.2403124
    assert data["location"]["longitude"] == 73.1305127

def test_reverse_geocode_invalid_coordinates():
    # Latitude out of bounds
    response = client.get("/api/location/reverse-geocode?latitude=999.0&longitude=73.1305127")
    assert response.status_code == 422

def test_location_search_endpoint():
    response = client.get("/api/location/search?q=Kalyan")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "results" in data
