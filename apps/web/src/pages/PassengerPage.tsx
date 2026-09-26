import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { api, money, prettyArea } from "../lib/api";
import { StatusBadge } from "../components/StatusBadge";

type AreaOption = { value: string; label: string };
type Ride = {
  id: string;
  pickupArea: string;
  destinationArea: string;
  seats: number;
  distanceM: number;
  soloFarePoysha: number;
  farePoysha: number;
  pooled: boolean;
  paymentMethod: string;
  status: string;
  cancellationReason?: string | null;
  createdAt: string;
  pool?: { id: string; vehicle: { id: string; name: string } } | null;
  events?: { id: string; toStatus: string; note?: string | null; createdAt: string }[];
};

const activeStatuses = new Set(["REQUESTED", "MATCHED", "ACCEPTED", "DRIVER_ARRIVED", "STARTED"]);

export function PassengerPage() {
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [pickup, setPickup] = useState("BANANI");
  const [destination, setDestination] = useState("MOHAKHALI");
  const [seats, setSeats] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [quote, setQuote] = useState<{ distanceM: number; soloFarePoysha: number; pooledFarePoysha: number } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [meta, data] = await Promise.all([
      api<{ areas: AreaOption[] }>("/meta/areas"),
      api<{ rides: Ride[] }>("/rides/me")
    ]);
    setAreas(meta.areas);
    setRides(data.rides);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message));
    const timer = window.setInterval(() => {
      api<{ rides: Ride[] }>("/rides/me").then((d) => setRides(d.rides)).catch(() => {});
    }, 3500);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (pickup === destination) {
      setQuote(null);
      return;
    }
    api<{ quote: typeof quote }>("/rides/estimate", {
      method: "POST",
      body: JSON.stringify({ pickupArea: pickup, destinationArea: destination })
    })
      .then((d) => setQuote(d.quote))
      .catch(() => setQuote(null));
  }, [pickup, destination]);

  const active = useMemo(() => rides.find((r) => activeStatuses.has(r.status)), [rides]);
  const history = rides.filter((r) => !activeStatuses.has(r.status));

  async function requestRide(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/rides", {
        method: "POST",
        body: JSON.stringify({
          pickupArea: pickup,
          destinationArea: destination,
          seats,
          paymentMethod
        })
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not request ride");
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id: string) {
    setError("");
    try {
      await api(`/rides/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: "Passenger changed plans" })
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not cancel ride");
    }
  }

  return (
    <section className="page-grid">
      <div className="stack">
        <div className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">PASSENGER</span>
              <h2>Request a ride</h2>
            </div>
            <span className="mini-note">No map API. Deterministic zones.</span>
          </div>

          <form className="ride-form" onSubmit={requestRide}>
            <label>
              Pickup
              <select value={pickup} onChange={(e) => setPickup(e.target.value)}>
                {areas.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </label>
            <label>
              Destination
              <select value={destination} onChange={(e) => setDestination(e.target.value)}>
                {areas.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </label>
            <label>
              Seats
              <select value={seats} onChange={(e) => setSeats(Number(e.target.value))}>
                <option value={1}>1 seat</option>
                <option value={2}>2 seats</option>
                <option value={3}>3 seats</option>
              </select>
            </label>
            <label>
              Payment
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="CASH">Cash</option>
                <option value="TESLAPAY">TeslaPay (simulated)</option>
              </select>
            </label>

            <div className="fare-preview">
              {pickup === destination ? (
                <span>Choose two different areas.</span>
              ) : quote ? (
                <>
                  <div><small>Distance</small><strong>{(quote.distanceM / 1000).toFixed(1)} km</strong></div>
                  <div><small>Solo estimate</small><strong>{money(quote.soloFarePoysha)}</strong></div>
                  <div><small>If pooled</small><strong>{money(quote.pooledFarePoysha)}</strong></div>
                </>
              ) : <span>Calculating…</span>}
            </div>

            {error && <div className="alert error">{error}</div>}
            <button className="btn primary" disabled={busy || !!active || pickup === destination}>
              {active ? "Finish your active ride first" : busy ? "Requesting…" : "Request ride"}
            </button>
          </form>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">HISTORY</span>
              <h2>Past rides</h2>
            </div>
          </div>
          {history.length === 0 ? (
            <div className="empty">Completed and cancelled rides will appear here.</div>
          ) : (
            <div className="list">
              {history.map((ride) => (
                <div className="list-row" key={ride.id}>
                  <div>
                    <strong>{prettyArea(ride.pickupArea)} → {prettyArea(ride.destinationArea)}</strong>
                    <span>{new Date(ride.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="row-end">
                    <strong>{money(ride.farePoysha)}</strong>
                    <StatusBadge status={ride.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <aside className="stack">
        <div className="panel sticky">
          <span className="eyebrow">YOUR LIVE RIDE</span>
          {!active ? (
            <div className="empty tall">
              <div className="big-icon">↗</div>
              <strong>No active ride</strong>
              <span>Request one from the form. If a compatible Tesla is online, matching is automatic.</span>
            </div>
          ) : (
            <div className="active-card">
              <div className="active-top">
                <StatusBadge status={active.status} />
                <span>{active.pool?.vehicle?.name || "Waiting for Tesla"}</span>
              </div>
              <h2>{prettyArea(active.pickupArea)} → {prettyArea(active.destinationArea)}</h2>
              <div className="metric-grid">
                <div><small>Your seats</small><strong>{active.seats}</strong></div>
                <div><small>Your fare</small><strong>{money(active.farePoysha)}</strong></div>
                <div><small>Pool saving</small><strong>{active.pooled ? money(active.soloFarePoysha - active.farePoysha) : "—"}</strong></div>
                <div><small>Payment</small><strong>{active.paymentMethod}</strong></div>
              </div>
              {active.pooled && <div className="alert success">Shared pool discount applied. Your fare is private.</div>}
              <div className="timeline">
                {(active.events || []).slice(-6).map((event) => (
                  <div key={event.id}>
                    <span className="dot" />
                    <p><strong>{event.toStatus.replaceAll("_", " ")}</strong><small>{event.note}</small></p>
                  </div>
                ))}
              </div>
              {["REQUESTED", "MATCHED", "ACCEPTED", "DRIVER_ARRIVED"].includes(active.status) && (
                <button className="btn danger" onClick={() => cancel(active.id)}>Cancel ride</button>
              )}
            </div>
          )}
        </div>
      </aside>
    </section>
  );
}
