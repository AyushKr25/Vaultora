"""
Test login with verbose output
"""
import requests

url = "http://localhost:5000/api/auth/login"
data = {
    "email": "admin@bank.com",
    "password": "Password@123"
}

print("Sending login request...")
try:
    response = requests.post(url, json=data, timeout=10)
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    print(f"Raw Response: {response.text[:500]}")
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
