# Requirement traceability

This file maps the challenge requirements to concrete implementation locations so an evaluator can inspect the project quickly.

| PRD area | Implementation |
|---|---|
| Passenger sign-up/sign-in | `apps/api/src/routes/auth.ts`, `apps/web/src/pages/LoginPage.tsx` |
| Request pickup/destination/seats | `apps/api/src/routes/rides.ts`, `PassengerPage.tsx` |
| Estimated fare | `domain/fare.ts`, `POST /api/rides/estimate` |
| Passenger lifecycle/status | `domain/lifecycle.ts`, `services/driver.ts`, passenger polling UI |
| History and valid cancellation | `GET /api/rides/me`, `services/ride.ts` |
| Driver sign-in | seeded Jashim + `auth.ts` |
| Driver online/offline | `PATCH /api/driver/vehicle/online` |
| Fixed vehicle capacity | `Vehicle.capacity`, migration constraints, pool service |
| Driver relevant requests | `GET /api/driver/dashboard` |
| Accept pool/request | `driver/pools/:id/transition`, `driver/requests/:id/accept` |
| Arrive/start/complete | `services/driver.ts` |
| Passenger/seat visibility | driver dashboard selects names/routes/seats |
| Multiple passengers share Tesla | `services/pool.ts` |
| Capacity never exceeded | serializable transaction, optimistic update, DB constraints, concurrency test |
| Individual passenger fare/privacy | `RideRequest.farePoysha`; passenger ownership routes; driver payload omits fare |
| Geography kept simple | `domain/geography.ts` |
| Explainable matching rule | same pickup + destination corridor + capacity |
| Fare testability | integer poysha + fixed matrix + fare unit tests |
| Cash/simulated TeslaPay | `PaymentMethod` enum and request form |
| API validation/error handling | Zod + centralized error middleware |
| Database relationships/indexes | Prisma schema + SQL migration |
| Docker compose | root `docker-compose.yml` |
| `.env.example` | root and app examples |
| Migrations | `apps/api/prisma/migrations/.../migration.sql` |
| Seed cast | `apps/api/src/seed.ts` |
| Health check | `/health` + Compose health checks |
| Architecture diagram | README Mermaid architecture |
| ERD | README Mermaid ERD |
| Git workflow | `CONTRIBUTING.md`, `docs/git-plan.md` |
| Meaningful tests | `apps/api/src/tests` |
| AI disclosure | README AI Usage |
| Viral-scale reasoning | README scaling section |
| Six-minute video plan | `docs/video-script.md` |
| Deployment guidance | `docs/deployment.md` |
