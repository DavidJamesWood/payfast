#!/usr/bin/env python3
"""
Utility script to securely add OpenAI API key to .env file.
"""

import os
import getpass
from pathlib import Path

def add_openai_key():
    """Add OpenAI API key to .env file."""
    env_path = Path(".env")
    
    if not env_path.exists():
        print("❌ .env file not found!")
        print("Please run 'python setup_env.py' first to create the .env file.")
        return
    
    # Read current .env content
    with open(env_path, 'r') as f:
        content = f.read()
    
    # Check if OPENAI_API_KEY already exists
    if "OPENAI_API_KEY=" in content and not "OPENAI_API_KEY=your-openai-api-key-here" in content:
        print("⚠️  OpenAI API key already set in .env file!")
        response = input("Do you want to update it? (y/N): ")
        if response.lower() != 'y':
            print("Operation cancelled.")
            return
    
    # Get API key securely (hidden input)
    print("🔑 Enter your OpenAI API key:")
    print("   (The key will be hidden as you type)")
    api_key = getpass.getpass("OpenAI API Key: ").strip()
    
    if not api_key:
        print("❌ No API key provided. Operation cancelled.")
        return
    
    if not api_key.startswith("sk-"):
        print("⚠️  Warning: OpenAI API keys typically start with 'sk-'")
        response = input("Continue anyway? (y/N): ")
        if response.lower() != 'y':
            print("Operation cancelled.")
            return
    
    # Update the content
    if "OPENAI_API_KEY=your-openai-api-key-here" in content:
        # Replace placeholder
        new_content = content.replace("OPENAI_API_KEY=your-openai-api-key-here", f"OPENAI_API_KEY={api_key}")
    elif "OPENAI_API_KEY=" in content:
        # Update existing key
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if line.startswith("OPENAI_API_KEY="):
                lines[i] = f"OPENAI_API_KEY={api_key}"
                break
        new_content = '\n'.join(lines)
    else:
        # Add new key
        new_content = content.rstrip() + f"\nOPENAI_API_KEY={api_key}\n"
    
    # Write back to file
    with open(env_path, 'w') as f:
        f.write(new_content)
    
    print("✅ OpenAI API key added successfully!")
    print("🔒 The key is now stored securely in your .env file")
    print("⚠️  Remember: Never commit the .env file to version control")

if __name__ == "__main__":
    print("=== OpenAI API Key Setup ===\n")
    add_openai_key()
