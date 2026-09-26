const label: Record<string, string> = {
  REQUESTED: "Waiting",
  MATCHED: "Matched",
  OPEN: "Open pool",
  ACCEPTED: "Accepted",
  DRIVER_ARRIVED: "Driver arrived",
  STARTED: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled"
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status status-${status.toLowerCase()}`}>{label[status] || status}</span>;
}
