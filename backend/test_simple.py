"""
Simple API test - minimal dependencies
"""
import urllib.request
import urllib.error
import json
import ssl

# Ignore SSL warnings for local development
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

BASE = "http://localhost:5000/api"

def test_api():
    print("=" * 50)
    print("API TEST")
    print("=" * 50)
    
    # Test 1: Login
    print("\n[1] LOGIN")
    login_data = json.dumps({"email": "admin@bank.com", "password": "Password@123"}).encode()
    req = urllib.request.Request(f"{BASE}/auth/login", data=login_data, headers={"Content-Type": "application/json"})
    
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            print(f"Status: {resp.status}")
            token = data.get("accessToken", "")
            print(f"Token: {token[:40]}..." if token else "NO TOKEN!")
            print(f"User: {data.get('user', {}).get('email')}")
    except urllib.error.HTTPError as e:
        print(f"Error {e.code}: {e.read().decode()[:200]}")
        return
    except Exception as e:
        print(f"Error: {e}")
        return
    
    # Test 2: Auth Me
    print("\n[2] AUTH/ME")
    req = urllib.request.Request(f"{BASE}/auth/me", headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"Status: {resp.status}")
            data = json.loads(resp.read().decode())
            print(f"User: {data.get('user', {}).get('email')}")
    except urllib.error.HTTPError as e:
        print(f"Error {e.code}: {e.read().decode()[:200]}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 3: Accounts Summary
    print("\n[3] ACCOUNTS/SUMMARY")
    req = urllib.request.Request(f"{BASE}/accounts/summary", headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"Status: {resp.status}")
            data = json.loads(resp.read().decode())
            print(f"Accounts: {data.get('totalAccounts', 0)}, Balance: ${data.get('totalBalance', 0)}")
    except urllib.error.HTTPError as e:
        print(f"Error {e.code}: {e.read().decode()[:200]}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 4: Transactions Analytics
    print("\n[4] TRANSACTIONS/ANALYTICS")
    req = urllib.request.Request(f"{BASE}/transactions/analytics?days=30", headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"Status: {resp.status}")
            data = json.loads(resp.read().decode())
            print(f"Summary: {data.get('summary', {})}")
    except urllib.error.HTTPError as e:
        print(f"Error {e.code}: {e.read().decode()[:200]}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n" + "=" * 50)
    print("TEST COMPLETE")

if __name__ == "__main__":
    test_api()
