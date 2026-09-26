import { useCallback, useEffect, useState } from "react";
import { api, prettyArea } from "../lib/api";
import { StatusBadge } from "../components/StatusBadge";

type Dashboard = {
  vehicle: { id: string; name: string; plate: string; capacity: number; isOnline: boolean };
  activePool: null | {
    id: string;
    pickupArea: string;
    corridor: string;
    occupiedSeats: number;
    status: string;
    rides: {
      id: string;
      pickupArea: string;
      destinationArea: string;
      seats: number;
      status: string;
      passenger: { id: string; name: string };
    }[];
  };
  waitingRequests: {
    id: string;
    pickupArea: string;
    destinationArea: string;
    seats: number;
    createdAt: string;
    passenger: { name: string };
  }[];
  history: { id: string; pickupArea: string; status: string; updatedAt: string }[];
};

const nextAction: Record<string, { action: string; label: string }> = {
  OPEN: { action: "accept", label: "Accept pool" },
  ACCEPTED: { action: "arrived", label: "Mark arrived" },
  DRIVER_ARRIVED: { action: "start", label: "Start trip" },
  STARTED: { action: "complete", label: "Complete trip" }
};

export function DriverPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const d = await api<Dashboard>("/driver/dashboard");
    setData(d);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message));
    const timer = window.setInterval(() => load().catch(() => {}), 3500);
    return () => window.clearInterval(timer);
  }, [load]);

  if (!data) return <section className="panel loading">{error || "Loading driver dashboard…"}</section>;

  async function toggleOnline() {
    setBusy(true);
    setError("");
    try {
      await api("/driver/vehicle/online", {
        method: "PATCH",
        body: JSON.stringify({ isOnline: !data.vehicle.isOnline })
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update status");
    } finally {
      setBusy(false);
    }
  }

  async function transition() {
    if (!data.activePool) return;
    const next = nextAction[data.activePool.status];
    if (!next) return;
    setBusy(true);
    setError("");
    try {
      await api(`/driver/pools/${data.activePool.id}/transition`, {
        method: "POST",
        body: JSON.stringify({ action: next.action })
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not advance trip");
    } finally {
      setBusy(false);
    }
  }

  async function acceptWaiting(id: string) {
    setBusy(true);
    setError("");
    try {
      await api(`/driver/requests/${id}/accept`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not accept request");
    } finally {
      setBusy(false);
    }
  }

  const occupancy = data.activePool?.occupiedSeats || 0;
  const pct = Math.min(100, (occupancy / data.vehicle.capacity) * 100);

  return (
    <section className="driver-grid">
      <div className="stack">
        <div className="panel vehicle-card">
          <div className="panel-head">
            <div>
              <span className="eyebrow">DRIVER · JASHIM</span>
              <h2>{data.vehicle.name}</h2>
              <p className="muted">{data.vehicle.plate} · {data.vehicle.capacity} seats</p>
            </div>
            <button className={`switch ${data.vehicle.isOnline ? "on" : ""}`} onClick={toggleOnline} disabled={busy}>
              <span />
              {data.vehicle.isOnline ? "Online" : "Offline"}
            </button>
          </div>

          <div className="capacity">
            <div>
              <span>Pool occupancy</span>
              <strong>{occupancy}/{data.vehicle.capacity} seats</strong>
            </div>
            <div className="bar"><span style={{ width: `${pct}%` }} /></div>
          </div>

          {error && <div className="alert error">{error}</div>}
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">ACTIVE POOL</span>
              <h2>{data.activePool ? prettyArea(data.activePool.pickupArea) : "No active pool"}</h2>
            </div>
            {data.activePool && <StatusBadge status={data.activePool.status} />}
          </div>

          {!data.activePool ? (
            <div className="empty">Go online and wait for passenger requests.</div>
          ) : (
            <>
              <div className="passenger-list">
                {data.activePool.rides.map((ride) => (
                  <div className="passenger-row" key={ride.id}>
                    <div className="avatar">{ride.passenger.name.slice(0, 1)}</div>
                    <div>
                      <strong>{ride.passenger.name}</strong>
                      <span>{prettyArea(ride.pickupArea)} → {prettyArea(ride.destinationArea)}</span>
                    </div>
                    <div className="row-end">
                      <strong>{ride.seats} seat{ride.seats > 1 ? "s" : ""}</strong>
                      <StatusBadge status={ride.status} />
                    </div>
                  </div>
                ))}
              </div>
              {nextAction[data.activePool.status] && (
                <button className="btn primary wide" onClick={transition} disabled={busy}>
                  {nextAction[data.activePool.status].label}
                </button>
              )}
              <p className="privacy-note">Passenger fares are intentionally not shown on the driver passenger list.</p>
            </>
          )}
        </div>
      </div>

      <div className="stack">
        <div className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">WAITING REQUESTS</span>
              <h2>Queue</h2>
            </div>
            <span className="count-pill">{data.waitingRequests.length}</span>
          </div>
          {data.waitingRequests.length === 0 ? (
            <div className="empty">No unmatched requests.</div>
          ) : (
            <div className="list">
              {data.waitingRequests.map((r) => (
                <div className="list-row queue-row" key={r.id}>
                  <div>
                    <strong>{r.passenger.name} · {r.seats} seat{r.seats > 1 ? "s" : ""}</strong>
                    <span>{prettyArea(r.pickupArea)} → {prettyArea(r.destinationArea)}</span>
                  </div>
                  <button className="btn ghost small" disabled={busy || !!data.activePool || !data.vehicle.isOnline} onClick={() => acceptWaiting(r.id)}>
                    Accept
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">RECENT</span>
              <h2>Pool history</h2>
            </div>
          </div>
          {data.history.length === 0 ? (
            <div className="empty">Complete a trip to build history.</div>
          ) : (
            <div className="list">
              {data.history.map((p) => (
                <div className="list-row" key={p.id}>
                  <div>
                    <strong>{prettyArea(p.pickupArea)} pool</strong>
                    <span>{new Date(p.updatedAt).toLocaleString()}</span>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
