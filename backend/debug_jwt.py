"""
Debug JWT - print to file to see full output
"""
import os
from dotenv import load_dotenv

output = []

output.append("=" * 50)
output.append("JWT DEBUG")
output.append("=" * 50)

# Load env
load_dotenv()
jwt_key = os.getenv('JWT_SECRET_KEY', 'NOT FOUND')
output.append(f"\n1. JWT_SECRET_KEY from env: {jwt_key}")

# Create app and check config
from app import create_app
app = create_app()

app_jwt_key = app.config.get('JWT_SECRET_KEY', 'NOT FOUND')
output.append(f"\n2. App JWT_SECRET_KEY: {app_jwt_key}")
output.append(f"3. Keys match: {jwt_key == app_jwt_key}")

# Test creating and verifying a token
from flask_jwt_extended import create_access_token, decode_token
with app.app_context():
    output.append("\n4. Creating test token...")
    token = create_access_token(identity=1)
    output.append(f"   Token created: {token[:60]}...")
    
    output.append("\n5. Decoding token...")
    try:
        decoded = decode_token(token)
        output.append(f"   SUCCESS! Identity: {decoded.get('sub')}")
    except Exception as e:
        output.append(f"   FAILED: {type(e).__name__}: {e}")

output.append("\n" + "=" * 50)

# Write to file
with open("debug_output.txt", "w") as f:
    f.write("\n".join(output))

print("Output written to debug_output.txt")
