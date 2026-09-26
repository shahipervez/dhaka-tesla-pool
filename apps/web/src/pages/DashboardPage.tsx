import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { PassengerPage } from "./PassengerPage";
import { DriverPage } from "./DriverPage";

export function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) return <section className="panel loading">Loading session…</section>;
  if (!user) return <Navigate to="/login" replace />;

  return user.role === "DRIVER" ? <DriverPage /> : <PassengerPage />;
}
