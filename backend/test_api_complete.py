"""
Complete API test with detailed output
"""
import requests
import json

BASE_URL = "http://localhost:5000/api"

print("=" * 50)
print("TESTING BANK APP API")
print("=" * 50)

# Step 1: Login
print("\n[1] LOGIN TEST")
print("-" * 30)
try:
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@bank.com",
        "password": "Password@123"
    }, timeout=10)
    print(f"Status: {resp.status_code}")
    
    if resp.status_code == 200:
        data = resp.json()
        token = data.get("accessToken", "")
        print(f"Login: SUCCESS")
        print(f"Token: {token[:50]}..." if token else "No token!")
        print(f"User: {data.get('user', {}).get('email', 'N/A')}")
    else:
        print(f"Login FAILED: {resp.text[:200]}")
        exit(1)
except Exception as e:
    print(f"Error: {e}")
    exit(1)

headers = {"Authorization": f"Bearer {token}"}

# Step 2: Test /auth/me
print("\n[2] AUTH/ME TEST")
print("-" * 30)
try:
    resp = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        print("Auth/me: SUCCESS")
        print(f"User: {resp.json().get('user', {}).get('email')}")
    else:
        print(f"FAILED: {resp.text[:300]}")
except Exception as e:
    print(f"Error: {e}")

# Step 3: Test accounts
print("\n[3] ACCOUNTS/SUMMARY TEST")
print("-" * 30)
try:
    resp = requests.get(f"{BASE_URL}/accounts/summary", headers=headers, timeout=10)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        print(f"Summary: {json.dumps(resp.json(), indent=2)[:200]}")
    else:
        print(f"FAILED: {resp.text[:300]}")
except Exception as e:
    print(f"Error: {e}")

# Step 4: Test transactions
print("\n[4] TRANSACTIONS/HISTORY TEST")
print("-" * 30)
try:
    resp = requests.get(f"{BASE_URL}/transactions/history", headers=headers, timeout=10)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        print("History: SUCCESS")
    else:
        print(f"FAILED: {resp.text[:300]}")
except Exception as e:
    print(f"Error: {e}")

print("\n" + "=" * 50)
print("TEST COMPLETE")
print("=" * 50)
