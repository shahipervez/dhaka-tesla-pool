import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { api, type User } from "../lib/api";
import { useAuth } from "../lib/auth";

export function LoginPage() {
  const { user, refresh } = useAuth();
  const [email, setEmail] = useState("nusrat@demo.local");
  const [password, setPassword] = useState("Pass123!");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [name, setName] = useState("");

  if (user) return <Navigate to="/dashboard" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (registering) {
        await api<{ user: User }>("/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password })
        });
      } else {
        await api<{ user: User }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password })
        });
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  function fillDemo(kind: "nusrat" | "rafiq" | "shirin" | "driver") {
    const map = {
      nusrat: ["nusrat@demo.local", "Pass123!"],
      rafiq: ["rafiq@demo.local", "Pass123!"],
      shirin: ["shirin@demo.local", "Pass123!"],
      driver: ["jashim@demo.local", "Driver123!"]
    } as const;
    setEmail(map[kind][0]);
    setPassword(map[kind][1]);
    setRegistering(false);
  }

  return (
    <section className="login-grid">
      <div className="hero-card">
        <span className="eyebrow">BANANI · RUSH HOUR</span>
        <h1>One tiny Tesla.<br/>Three seats.<br/>No overbooking.</h1>
        <p>
          Request a ride, share Bullet when routes are compatible, and follow a
          strict trip lifecycle from waiting to completed.
        </p>
        <div className="story-row">
          <div><strong>Nusrat</strong><span>Banani → Mohakhali</span></div>
          <div><strong>Rafiq</strong><span>Banani → Gulshan 1</span></div>
          <div><strong>Jashim + Bullet</strong><span>3 seats · online</span></div>
        </div>
      </div>

      <form className="panel login-panel" onSubmit={submit}>
        <div>
          <span className="eyebrow">DEMO ACCESS</span>
          <h2>{registering ? "Create passenger account" : "Sign in"}</h2>
          <p className="muted">Use a seeded user or create a new passenger.</p>
        </div>

        {registering && (
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} minLength={2} required />
          </label>
        )}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        </label>

        {error && <div className="alert error">{error}</div>}
        <button className="btn primary" disabled={busy}>
          {busy ? "Please wait…" : registering ? "Create account" : "Sign in"}
        </button>
        <button className="btn ghost" type="button" onClick={() => setRegistering(!registering)}>
          {registering ? "Back to sign in" : "New passenger? Register"}
        </button>

        <div className="demo-box">
          <span>Quick demo</span>
          <div className="demo-buttons">
            <button type="button" onClick={() => fillDemo("nusrat")}>Nusrat</button>
            <button type="button" onClick={() => fillDemo("rafiq")}>Rafiq</button>
            <button type="button" onClick={() => fillDemo("shirin")}>Shirin</button>
            <button type="button" onClick={() => fillDemo("driver")}>Jashim · Driver</button>
          </div>
        </div>
      </form>
    </section>
  );
}
