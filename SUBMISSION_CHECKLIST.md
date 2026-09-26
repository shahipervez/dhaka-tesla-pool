# Final submission checklist

## Already in this project

- [x] React frontend
- [x] Node.js backend
- [x] PostgreSQL relational model
- [x] Passenger + driver flows
- [x] pooling/capacity rules
- [x] individual fares
- [x] ride lifecycle + cancellation
- [x] Docker Compose
- [x] `.env.example`
- [x] migration + seed cast (Jashim/Bullet/Nusrat/Rafiq/Shirin)
- [x] health check
- [x] architecture diagram
- [x] ERD
- [x] unit + concurrency/ownership integration tests
- [x] CI workflow
- [x] technology/trade-off documentation
- [x] AI usage disclosure
- [x] viral-scale reasoning
- [x] 6-minute video script
- [x] UI preview images

## You must complete before sending the application

- [ ] Create a **public/evaluator-accessible GitHub repository**.
- [ ] Re-create a truthful incremental Git history using feature branches; do not push this ZIP as one giant final commit.
- [ ] Ensure long-lived branches exist: `master`, `pre-release`, `release/v1.0.0`.
- [ ] Push `release/v1.0.0` and use that exact version for the video.
- [ ] Deploy on a free/free-tier platform, if available.
- [ ] Replace `ADD_LIVE_URL_HERE` in README with the real URL.
- [ ] Capture fresh screenshots/GIF from the deployed build and replace preview images if desired.
- [ ] Record a **maximum 6-minute** Loom/Drive/YouTube walkthrough using `docs/video-script.md`.
- [ ] Replace `ADD_VIDEO_URL_HERE` in README.
- [ ] Run `docker compose up --build` on a clean machine.
- [ ] Run the test suite including DB tests.
- [ ] Inspect `git diff`, `git log --graph --all`, and ensure no `.env`, token, password, or secret is committed.
- [ ] Submit the GitHub URL, live URL, and video URL in the application form.
