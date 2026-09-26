# Interview defense notes

These notes are for understanding the project, not for memorizing lines.

## Why PostgreSQL?

Pooling is relational and transaction-heavy: users, one driver/vehicle, ride requests, a pool, membership via `poolId`, and transition history. PostgreSQL gives strong transactions, constraints, partial indexes, and predictable integer money storage. The concurrency problem is easier to demonstrate honestly here than with an eventually consistent store.

## Why Express instead of NestJS?

The API surface is small. Express keeps the route → validation → service → database path obvious in a six-minute demo. NestJS would become attractive when the codebase has many modules, teams, background jobs, and cross-cutting policies.

## Where is business logic?

- Fare: `src/domain/fare.ts`
- Geography/matching inputs: `src/domain/geography.ts`
- Valid state transitions: `src/domain/lifecycle.ts`
- Pool matching/capacity transaction: `src/services/pool.ts`
- Driver lifecycle updates: `src/services/driver.ts`
- Passenger cancellation: `src/services/ride.ts`

Routes validate/authorize and delegate; they do not own core pooling rules.

## How is overbooking prevented?

Ride assignment is executed in a PostgreSQL Serializable transaction. The code checks the current pool occupancy and conditionally increments it only if the observed value has not changed. Serializable/unique conflicts are retried. The database also guarantees only one active pool per vehicle through a partial unique index. A DB integration test races two passengers against a one-seat vehicle.

## Why integer poysha?

`৳80.75` is stored as `8075`, avoiding binary floating-point rounding. It also makes tests and manual evaluator calculations exact.

## How are users prevented from reading someone else's ride?

Every passenger ride query includes both `ride.id` and `passengerId = authenticated user id`. Unauthorized object access returns 404, so the API does not confirm that another user's ride exists. The driver dashboard gets names/routes/seats, but the selection intentionally excludes passenger fares.

## Why no map API?

The PRD says not to rebuild Google Maps. A deterministic area list + route matrix keeps the focus on pooling and data integrity. The matching rule can be tested by hand.

## Why polling instead of WebSockets?

Status freshness of ~3.5 seconds is enough for the MVP and avoids another connection/state system. At scale, realtime push would be appropriate.

## What happens when Rafiq joins Nusrat?

Nusrat first gets a matched single-rider pool and solo fare. Rafiq has the same pickup and a destination in the same corridor, so he joins if a seat is available. The service then marks active pool members as pooled and applies each passenger's own route-based 15% discount.

## What happens if Rafiq later cancels?

His seats are released. Nusrat keeps the previously quoted pooled fare. That is an explicit customer-trust assumption: the system does not raise a passenger's price because another rider changed plans.

## Why can a driver not go offline with an open pool?

Once a passenger has been matched, taking the vehicle offline would strand a matched request. The API blocks going offline while any pool is active.

## What would change at high scale?

Partition matching by geo cell, introduce a dedicated matching service, geospatial indexes/cache, idempotency keys, event/queue processing for non-critical work, realtime notification infrastructure, read replicas, stronger observability, and careful DB contention management. Those are intentionally not in the MVP because the current single-service design is easier to keep correct.
