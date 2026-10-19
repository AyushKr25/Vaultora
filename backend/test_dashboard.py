"""
Test all dashboard-related API endpoints
"""
import requests

BASE_URL = "http://localhost:5000/api"

# First, login to get token
print("1. Logging in...")
login_resp = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "admin@bank.com",
    "password": "Password@123"
})
print(f"   Login: {login_resp.status_code}")

if login_resp.status_code != 200:
    print(f"   Error: {login_resp.text}")
    exit(1)

token = login_resp.json().get("accessToken")
headers = {"Authorization": f"Bearer {token}"}

# Test /auth/me
print("\n2. Testing /auth/me...")
resp = requests.get(f"{BASE_URL}/auth/me", headers=headers)
print(f"   Status: {resp.status_code}")
if resp.status_code != 200:
    print(f"   Error: {resp.text[:500]}")
else:
    print(f"   User: {resp.json().get('user', {}).get('email')}")

# Test /accounts/summary
print("\n3. Testing /accounts/summary...")
resp = requests.get(f"{BASE_URL}/accounts/summary", headers=headers)
print(f"   Status: {resp.status_code}")
if resp.status_code != 200:
    print(f"   Error: {resp.text[:500]}")
else:
    print(f"   Response: {resp.json()}")

# Test /transactions/history
print("\n4. Testing /transactions/history...")
resp = requests.get(f"{BASE_URL}/transactions/history", headers=headers)
print(f"   Status: {resp.status_code}")
if resp.status_code != 200:
    print(f"   Error: {resp.text[:500]}")

# Test /transactions/analytics
print("\n5. Testing /transactions/analytics...")
resp = requests.get(f"{BASE_URL}/transactions/analytics", headers=headers)
print(f"   Status: {resp.status_code}")
if resp.status_code != 200:
    print(f"   Error: {resp.text[:500]}")
