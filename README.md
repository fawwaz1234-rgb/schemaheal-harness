# SchemaHeal: Autonomous SQL Schema Drift Harness

## Team / attendee
- **Team name:** Solo
- **Members and GitHub usernames:** Mohammed Abdul Fawwaz (@fawwaz1234-rgb)
- **Profile links:** https://github.com/fawwaz1234-rgb

## Challenge
Select the challenge you are entering:
- [x] Best Open-Source AI Project
- [ ] Best Use of Gemma 4
- [ ] Build on elah

## Project links
- **Public GitHub repository:** https://github.com/fawwaz1234-rgb/schemaheal-harness
- **Open-source license:** https://github.com/fawwaz1234-rgb/schemaheal-harness/blob/main/LICENSE

## Problem and solution
- **Who is this for?** Data engineers, backend developers, and automated ETL pipelines that break when upstream schemas change without deprecation warnings.
- **Problem:** Production database migrations (renamed tables, split columns, altered relations) silently fail downstream batch queries, halting pipeline execution and corrupting downstream dashboards.
- **Workflow:** 
  1. An application or ETL script submits a legacy/stale SQL query.
  2. The harness intercepts execution exceptions (e.g., `no such table`, `no such column`).
  3. Instead of crashing, the harness introspects the live SQLite/PostgreSQL schema metadata and passes the failing query, error traceback, and live DDL to an open-weight model (`openai/gpt-oss-20b`).
  4. The model diagnoses the drift, outputs a corrected query, executes the patch, and returns the query results back to the caller seamlessly.

## Tech stack
- **Backend:** Python 3.12, FastAPI, SQLite, Pydantic
- **Frontend Dashboard:** React, Vite, Tailwind CSS
- **Model Inference:** Open-weight LLM via Groq high-throughput inference
- **Evaluation:** Preset schema migration test vectors (renamed tables, drifted join foreign keys)

## Evidence & Verification
- **Model Integration:** `backend/main.py` (`heal_query` function)
- **Interactive UI:** `frontend/src/App.jsx`
- **Zero Lock-in:** Configured entirely on standard SQL DDL reflection and open-weight model endpoints.
