# 6-minute walkthrough script

Keep the finished recording at or under six minutes. Speak naturally; do not read the PRD.

## 0:00–1:00 — problem, users, idea

“Dhaka Tesla Pool is a small ride-pooling MVP for a three-seat local electric vehicle. The main users are passengers like Nusrat, Rafiq and Shirin, and the driver Jashim with his vehicle Bullet. The engineering problem is not maps — it is deciding when rides can share a vehicle, keeping capacity correct under concurrency, showing each passenger only their own fare/status, and keeping a traceable ride lifecycle.”

Show the landing/login screen and the story cast.

## 1:00–3:00 — engineering

Show the README architecture diagram and ERD.

Explain:

- React/Vite TypeScript frontend;
- Node/Express TypeScript REST API;
- PostgreSQL + Prisma;
- httpOnly JWT auth;
- Zod validation;
- predefined areas and a documented matching rule;
- fare stored in integer poysha;
- serializable transaction + DB constraint for capacity;
- lifecycle validation in domain code.

Key decision:
“Matching is automatic for compatible open pools, but the driver must explicitly accept before the trip progresses.”

Trade-off:
“I intentionally did not add Google Maps, Redis, queues, or microservices because they do not improve the MVP’s core correctness. I documented when I would add them.”

## 3:00–6:00 — product tour

1. Log in as **Nusrat**. Request Banani → Mohakhali, 1 seat. Show estimated fare/status.
2. In another browser/incognito session, log in as **Rafiq**. Request Banani → Gulshan 1. Show both now share the same pool and Rafiq only sees his own fare.
3. Log in as **Jashim**. Show Bullet, capacity bar, passenger names/seats, and accept the pool.
4. Mark **arrived**, then **started**. Refresh passenger view to show status.
5. Edge case: explain the final-seat concurrency test, or attempt another request once Bullet is full and show it cannot overbook.
6. Complete the trip. Show passenger and driver history.
7. End on deployment URL (if deployed), `/health`, and the Git branch/history view.

Closing line:
“The project is intentionally small enough to explain live, but the data integrity, tests, Docker setup, documentation and scaling notes are production-minded.”
