#!/bin/bash
export DATABASE_URL="postgresql+psycopg://app:app@localhost:5432/app"
export API_BASE="http://localhost:8000"

echo "Starting MCP Server with database URL: $DATABASE_URL"
python server.py
