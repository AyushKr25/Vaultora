"""
Test each endpoint separately to find the failing one
"""
import urllib.request
import urllib.error
import json

BASE = "http://localhost:5000/api"

# Login
print("Login...")
login_data = json.dumps({"email": "admin@bank.com", "password": "Password@123"}).encode()
req = urllib.request.Request(f"{BASE}/auth/login", data=login_data, headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req, timeout=10) as resp:
    data = json.loads(resp.read().decode())
    token = data.get("accessToken", "")
    print(f"Token: {token[:30]}...")

headers = {"Authorization": f"Bearer {token}"}

endpoints = [
    "/auth/me",
    "/accounts/summary",
    "/transactions/history",
    "/transactions/analytics?days=30"
]

for ep in endpoints:
    print(f"\nTesting {ep}...")
    req = urllib.request.Request(f"{BASE}{ep}", headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read().decode()
            if "<html" in data.lower():
                print(f"   ERROR - Got HTML response!")
                print(f"   {data[:500]}")
            else:
                parsed = json.loads(data)
                print(f"   SUCCESS - Status: {resp.status}")
                # Print key info
                if "user" in parsed:
                    print(f"   User: {parsed['user'].get('email')}")
                if "totalAccounts" in parsed:
                    print(f"   Accounts: {parsed['totalAccounts']}, Balance: ${parsed['totalBalance']}")
                if "transactions" in parsed:
                    print(f"   Transactions: {len(parsed['transactions'])}")
                if "summary" in parsed:
                    print(f"   Summary: {parsed['summary']}")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"   ERROR {e.code}")
        if "<html" in body.lower():
            print(f"   HTML Error: {body[:400]}")
        else:
            print(f"   {body[:300]}")
    except Exception as e:
        print(f"   Error: {e}")

print("\nDone!")
