import React, { useState } from 'react';

const DRIFT_PRESETS = [
  {
    name: "Drift 1: Table & Column Renamed",
    desc: "Targeted legacy 'users' table and 'email' column, which drifted to 'accounts' & 'email_addr'",
    sql: "SELECT full_name, email FROM users WHERE tier = 'enterprise';"
  },
  {
    name: "Drift 2: Missing Column in JOIN",
    desc: "Uses old 'user_id' instead of evolved 'account_id'",
    sql: "SELECT a.full_name, o.amount_cents FROM accounts a JOIN orders o ON a.user_id = o.user_id;"
  },
  {
    name: "Clean Native Query (No Drift)",
    desc: "Native columns matching live DDL",
    sql: "SELECT account_id, full_name, tier FROM accounts WHERE is_active = 1;"
  }
];

export default function App() {
  const [sql, setSql] = useState(DRIFT_PRESETS[0].sql);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const handleRun = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch("http://localhost:8000/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql })
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      alert("Error: Ensure backend is running on http://localhost:8000");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="border-b border-neutral-800 pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="text-emerald-400">⚡</span> SchemaHeal
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Autonomous Schema Drift & SQL Self-Healing Model Harness
            </p>
          </div>
          <span className="text-xs px-3 py-1 font-mono rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            Open-Weight: LLaMA 3.3 (Groq LPU)
          </span>
        </header>

        {/* Drift Presets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {DRIFT_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setSql(p.sql)}
              className="p-3 text-left bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 rounded-lg transition"
            >
              <div className="text-xs font-semibold text-emerald-400">{p.name}</div>
              <div className="text-[11px] text-neutral-400 mt-1 leading-tight">{p.desc}</div>
            </button>
          ))}
        </div>

        {/* Query Input */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Pipeline Query Execution Input
          </label>
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            rows={3}
            className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 font-mono text-sm text-neutral-200 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleRun}
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded transition disabled:opacity-50"
          >
            {loading ? "Intercepting & Synthesizing Patch..." : "Execute Query"}
          </button>
        </div>

        {/* Live Execution Trace / Diff */}
        {response && (
          <div className="space-y-4">
            {response.healed ? (
              <div className="bg-amber-950/20 border border-amber-500/40 rounded-lg p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <span>⚠️ Harness Intercepted Database Exception:</span>
                  <code className="bg-amber-950 px-2 py-0.5 rounded border border-amber-800 text-[11px]">
                    {response.original_error}
                  </code>
                </div>
                <div className="text-neutral-300">
                  <span className="font-semibold text-neutral-200">Root Cause Diagnosis:</span> {response.diagnosis}
                </div>
                <div className="font-mono bg-neutral-950 border border-neutral-800 rounded p-2.5 mt-2">
                  <span className="text-neutral-500 block text-[10px] uppercase">Patched SQL Query</span>
                  <span className="text-emerald-400">{response.final_sql}</span>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-lg p-3 text-xs text-emerald-300">
                ✓ Query executed directly against the live schema with zero exceptions.
              </div>
            )}

            {/* Recovered Data Output */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-neutral-950 border-b border-neutral-800 text-xs font-semibold text-neutral-400">
                Pipeline Dataset Result ({response.data.length} records recovered)
              </div>
              {response.data.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-neutral-300">
                    <thead className="bg-neutral-950/50 text-[11px] uppercase text-neutral-500 border-b border-neutral-800">
                      <tr>
                        {Object.keys(response.data[0]).map((col) => (
                          <th key={col} className="px-4 py-2 font-mono">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800 font-mono">
                      {response.data.map((row, i) => (
                        <tr key={i} className="hover:bg-neutral-800/30">
                          {Object.values(row).map((v, j) => (
                            <td key={j} className="px-4 py-2">{String(v)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-neutral-500">0 records returned.</div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}