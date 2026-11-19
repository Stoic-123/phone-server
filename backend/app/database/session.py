import sqlite3
from contextlib import contextmanager
from typing import Generator
from backend.app.core.config import settings

def init_db() -> None:
    """Initializes SQLite database tables and turns on Write-Ahead Logging (WAL) for performance."""
    settings.DATA_PATH.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(settings.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Enable WAL mode for high concurrency & lower flash write wear
    cursor.execute("PRAGMA journal_mode = WAL;")
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    # Projects table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        type TEXT NOT NULL,
        port INTEGER UNIQUE NOT NULL,
        entrypoint TEXT NOT NULL,
        env_vars TEXT DEFAULT '{}',
        status TEXT DEFAULT 'stopped',
        auto_restart INTEGER DEFAULT 0,
        pid INTEGER,
        created_at REAL NOT NULL,
        updated_at REAL NOT NULL
    );
    """)
    
    # Deployments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS deployments (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        source_type TEXT NOT NULL,
        source_ref TEXT DEFAULT '',
        status TEXT DEFAULT 'pending',
        log TEXT DEFAULT '',
        created_at REAL NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    """)
    
    # System logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL,
        source TEXT NOT NULL,
        message TEXT NOT NULL,
        project_id TEXT,
        timestamp REAL NOT NULL
    );
    """)
    
    # AI conversations and tool confirmations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ai_interactions (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        tool_call TEXT,
        confirmed INTEGER DEFAULT 0,
        executed INTEGER DEFAULT 0,
        timestamp REAL NOT NULL
    );
    """)

    # Safe migrations for existing SQLite databases
    try:
        cursor.execute("ALTER TABLE projects ADD COLUMN public_url TEXT DEFAULT NULL;")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE projects ADD COLUMN tunnel_pid INTEGER DEFAULT NULL;")
    except Exception:
        pass
    
    conn.commit()
    conn.close()

@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = sqlite3.connect(settings.DATABASE_PATH, timeout=20.0)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
