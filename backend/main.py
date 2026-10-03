import os
import sqlite3
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

app = FastAPI(title="SchemaHeal Harness")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

DB_FILE = "pipeline.db"

def init_database():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS accounts;")
    cursor.execute("DROP TABLE IF EXISTS orders;")
    
    # Active/Evolved Schema
    cursor.execute("""
        CREATE TABLE accounts (
            account_id INTEGER PRIMARY KEY,
            full_name TEXT,
            email_addr TEXT,
            tier TEXT,
            is_active INTEGER
        );
    """)
    cursor.execute("""
        CREATE TABLE orders (
            order_id INTEGER PRIMARY KEY,
            account_id INTEGER,
            amount_cents INTEGER,
            status TEXT
        );
    """)
    cursor.executemany("INSERT INTO accounts VALUES (?, ?, ?, ?, ?);", [
        (1, "Alice Walker", "alice@enterprise.com", "enterprise", 1),
        (2, "Bob Vance", "bob@startup.io", "pro", 1),
        (3, "Charlie Day", "charlie@analytics.org", "starter", 0)
    ])
    cursor.executemany("INSERT INTO orders VALUES (?, ?, ?, ?);", [
        (101, 1, 95000, "settled"),
        (102, 1, 15000, "settled"),
        (103, 2, 6200, "pending")
    ])
    conn.commit()
    conn.close()

init_database()

def get_live_schema() -> str:
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table';")
    schema = "\n".join([row[0] for row in cursor.fetchall() if row[0]])
    conn.close()
    return schema

def heal_query(failing_sql: str, error_msg: str, schema: str) -> dict:
    prompt = f"""You are an autonomous database self-healing execution harness.
A production SQL query crashed due to database schema drift or column renames.
Fix the query so it runs successfully on the active schema while preserving original query intent.

ACTIVE DATABASE DDL:
{schema}

FAILED QUERY:
{failing_sql}

DATABASE EXCEPTION:
{error_msg}

Return ONLY a valid JSON object matching this schema:
{{
  "diagnosis": "Short single-sentence root cause explanation",
  "healed_sql": "SELECT ... FROM ...",
  "confidence": 0.98
}}
"""
    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a database repair engine that responds only in JSON."},
            {"role": "user", "content": prompt}
        ],
        model="openai/gpt-oss-20b",
        response_format={"type": "json_object"}
    )
    return json.loads(chat_completion.choices[0].message.content)

class QueryRequest(BaseModel):
    sql: str

@app.post("/api/execute")
def execute_query(req: QueryRequest):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        cursor.execute(req.sql)
        records = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return {
            "status": "success",
            "healed": False,
            "original_sql": req.sql,
            "final_sql": req.sql,
            "diagnosis": "Query executed cleanly without schema drift.",
            "data": records
        }
    except sqlite3.OperationalError as e:
        err = str(e)
        schema = get_live_schema()
        patch = heal_query(req.sql, err, schema)
        cursor.execute(patch["healed_sql"])
        records = [dict(r) for r in cursor.fetchall()]
        conn.close()

        return {
            "status": "healed",
            "healed": True,
            "original_sql": req.sql,
            "original_error": err,
            "diagnosis": patch["diagnosis"],
            "final_sql": patch["healed_sql"],
            "data": records
        }