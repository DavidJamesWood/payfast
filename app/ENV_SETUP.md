# Environment Variables Setup

This document explains how to set up environment variables for the PayFast application securely.

## Quick Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit the .env file with your actual values:**
   ```bash
   # Edit the file with your real database credentials and secrets
   nano .env
   ```

## Environment Variables

### Required Variables

- `DATABASE_URL`: PostgreSQL connection string
  - Format: `postgresql://username:password@host:port/database`
  - Example: `postgresql://payfast_user:secure_password@localhost:5432/payfast_db`

### Security Variables

- `SECRET_KEY`: Secret key for JWT tokens and encryption
  - Generate a secure key: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
  - **Never use the default value in production!**

- `ALGORITHM`: JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time (default: 30)

### Optional Variables

- `ENVIRONMENT`: Set to "production" for production environment
- `DEBUG`: Set to "false" in production
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins

## Security Best Practices

1. **Never commit .env files to version control**
   - The `.env` file is already in `.gitignore`
   - Only commit `.env.example` as a template

2. **Use strong, unique secrets**
   - Generate unique secrets for each environment
   - Use a password manager or secret management service

3. **Rotate secrets regularly**
   - Change database passwords and API keys periodically
   - Update the .env file when secrets change

4. **Environment-specific files**
   - Use different .env files for different environments
   - Consider using `.env.local`, `.env.production`, etc.

## Example .env file

```bash
# Database Configuration
DATABASE_URL=postgresql://payfast_user:your_secure_password@localhost:5432/payfast_db

# Security Keys
SECRET_KEY=your-super-secret-key-generated-with-secrets-module
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Environment
ENVIRONMENT=development
DEBUG=true

# CORS Origins
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Troubleshooting

- **Missing DATABASE_URL**: Make sure your .env file exists and contains the DATABASE_URL
- **Permission errors**: Ensure the .env file has proper read permissions
- **Invalid format**: Check that your environment variables follow the correct format

## Production Deployment

For production deployments:

1. Set `ENVIRONMENT=production`
2. Set `DEBUG=false`
3. Use a strong, unique `SECRET_KEY`
4. Configure proper `ALLOWED_ORIGINS` for your domain
5. Use environment-specific database credentials
6. Consider using a secrets management service (AWS Secrets Manager, Azure Key Vault, etc.)
