import os, sys
from logging.config import fileConfig
from alembic import context
from sqlalchemy import engine_from_config, pool

# Ensure /app (project root in the container) is on the path
sys.path.insert(0, os.path.abspath(os.getcwd()))

config = context.config
if config.config_file_name:
    fileConfig(config.config_file_name)

# Pull DB URL from env (Compose passes app/.env)
db_url = os.environ.get("DATABASE_URL")
if db_url:
    config.set_main_option("sqlalchemy.url", db_url)

# ---- import your models.Base ----
try:
    from models import Base  # app/models.py
    target_metadata = Base.metadata
except Exception as e:
    raise RuntimeError(f"Could not import Base for Alembic: {e}")

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()