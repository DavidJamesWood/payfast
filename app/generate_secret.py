#!/usr/bin/env python3
"""
Utility script to generate secure secret keys for the PayFast application.
"""

import secrets
import string

def generate_secret_key(length: int = 32) -> str:
    """Generate a secure secret key using the secrets module."""
    return secrets.token_urlsafe(length)

def generate_database_password(length: int = 16) -> str:
    """Generate a secure database password."""
    # Use a mix of letters, digits, and special characters
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(characters) for _ in range(length))

if __name__ == "__main__":
    print("=== PayFast Secret Key Generator ===\n")
    
    # Generate secret key
    secret_key = generate_secret_key()
    print(f"SECRET_KEY={secret_key}")
    
    # Generate database password
    db_password = generate_database_password()
    print(f"Database Password: {db_password}")
    
    print("\n=== Usage Instructions ===")
    print("1. Copy the SECRET_KEY value to your .env file")
    print("2. Use the database password when setting up your PostgreSQL user")
    print("3. Never share these values or commit them to version control")
    print("\nExample .env entry:")
    print(f"SECRET_KEY={secret_key}")
    print(f"DATABASE_URL=postgresql://payfast_user:{db_password}@localhost:5432/payfast_db")
