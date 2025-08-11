#!/usr/bin/env python3
"""
Setup script to create a .env file with secure defaults.
"""

import os
import secrets
import string
from pathlib import Path

def generate_secret_key(length: int = 32) -> str:
    """Generate a secure secret key."""
    return secrets.token_urlsafe(length)

def generate_database_password(length: int = 16) -> str:
    """Generate a secure database password."""
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(characters) for _ in range(length))

def create_env_file():
    """Create a .env file with secure defaults."""
    env_path = Path(".env")
    
    if env_path.exists():
        print("⚠️  .env file already exists!")
        response = input("Do you want to overwrite it? (y/N): ")
        if response.lower() != 'y':
            print("Setup cancelled.")
            return
    
    # Generate secure values
    secret_key = generate_secret_key()
    db_password = generate_database_password()
    
    # Create .env content
    env_content = f"""# Database Configuration
DATABASE_URL=postgresql://payfast_user:{db_password}@localhost:5432/payfast_db

# Security Keys
SECRET_KEY={secret_key}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Environment
ENVIRONMENT=development
DEBUG=true

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# LLM Configuration
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
OPENAI_API_KEY=your-openai-api-key-here

# Add your API keys here as needed
# EXTERNAL_API_KEY=your-external-api-key-here
"""
    
    # Write the file
    with open(env_path, 'w') as f:
        f.write(env_content)
    
    print("✅ .env file created successfully!")
    print(f"📝 Database password: {db_password}")
    print(f"🔑 Secret key: {secret_key}")
    print("\n⚠️  IMPORTANT:")
    print("- Save these credentials securely")
    print("- Never commit the .env file to version control")
    print("- Update the database password in your PostgreSQL setup")
    print("\n📖 See ENV_SETUP.md for more information")

if __name__ == "__main__":
    print("=== PayFast Environment Setup ===\n")
    create_env_file()
