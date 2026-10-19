"""
Test dashboard APIs with proper JWT identity (string)
"""
import urllib.request
import urllib.error
import json

BASE = "http://localhost:5000/api"

# Login
print("1. Login...")
login_data = json.dumps({"email": "admin@bank.com", "password": "Password@123"}).encode()
req = urllib.request.Request(f"{BASE}/auth/login", data=login_data, headers={"Content-Type": "application/json"})

try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode())
        token = data.get("accessToken", "")
        print(f"   Status: {resp.status}")
        print(f"   User: {data.get('user', {}).get('email')}")
except urllib.error.HTTPError as e:
    print(f"   Error {e.code}: {e.read().decode()[:200]}")
    exit(1)
except Exception as e:
    print(f"   Error: {e}")
    exit(1)

headers = {"Authorization": f"Bearer {token}"}

# Test auth/me
print("\n2. Auth/me...")
req = urllib.request.Request(f"{BASE}/auth/me", headers=headers)
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode())
        print(f"   Status: {resp.status}")
        print(f"   User: {data.get('user', {}).get('email')}")
except urllib.error.HTTPError as e:
    print(f"   Error {e.code}: {e.read().decode()[:300]}")
except Exception as e:
    print(f"   Error: {e}")

# Test accounts/summary
print("\n3. Accounts/summary...")
req = urllib.request.Request(f"{BASE}/accounts/summary", headers=headers)
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode())
        print(f"   Status: {resp.status}")
        print(f"   Data: {json.dumps(data, indent=2)}")
except urllib.error.HTTPError as e:
    print(f"   Error {e.code}: {e.read().decode()[:300]}")
except Exception as e:
    print(f"   Error: {e}")

# Test transactions/history
print("\n4. Transactions/history...")
req = urllib.request.Request(f"{BASE}/transactions/history", headers=headers)
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode())
        print(f"   Status: {resp.status}")
        print(f"   Transactions: {len(data.get('transactions', []))}")
except urllib.error.HTTPError as e:
    print(f"   Error {e.code}: {e.read().decode()[:300]}")
except Exception as e:
    print(f"   Error: {e}")

# Test transactions/analytics
print("\n5. Transactions/analytics...")
req = urllib.request.Request(f"{BASE}/transactions/analytics?days=30", headers=headers)
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode())
        print(f"   Status: {resp.status}")
        print(f"   Summary: {data.get('summary', {})}")
except urllib.error.HTTPError as e:
    print(f"   Error {e.code}: {e.read().decode()[:300]}")
except Exception as e:
    print(f"   Error: {e}")

print("\nDone!")
