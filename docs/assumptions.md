# Assumptions

The brief intentionally leaves some behavior open. These are the explicit assumptions used by this MVP.

1. **One active pool per Tesla.** Bullet cannot serve two active trips at once.
2. **Automatic matching, explicit driver acceptance.** A passenger can be matched to Bullet while the pool is `OPEN`; Jashim must press Accept before the trip progresses.
3. **Matching rule.** Same pickup area + same destination corridor + enough capacity.
4. **Fare quote stability.** Once a passenger earns the pooled discount, another rider cancelling does not increase the already quoted fare.
5. **Cancellation cutoff.** Passengers may cancel through `DRIVER_ARRIVED`, but not after `STARTED`.
6. **No real payments.** `CASH` and simulated `TESLAPAY` are recorded only as preferences.
7. **Static distance matrix.** Unknown predefined area pairs use a deterministic fallback; this is not presented as real road distance.
8. **Driver account creation is administrative.** Public sign-up only creates passenger accounts; Jashim is seeded as the driver.
9. **Polling instead of websockets.** The frontend refreshes live state every ~3.5 seconds, sufficient for the MVP.
10. **Seat count is per booking.** One passenger account may reserve 1–3 seats, subject to vehicle capacity.
