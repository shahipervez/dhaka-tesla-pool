# Contributing / submission workflow

This repository is intentionally structured to support the branch history requested by the challenge.

1. Create `master`.
2. Build each logical capability in a `feature/*` branch with incremental commits.
3. Merge tested features into `master`.
4. Cut `pre-release` after MVP integration.
5. Make integration/documentation/deployment fixes there.
6. Cut `release/v1.0.0` from `pre-release` and use that exact release in the video.

Use conventional messages:

```text
feat(auth): add passenger registration and login
feat(fare): add integer-poysha fare calculator
feat(pool): match compatible Banani rides
fix(pool): prevent concurrent overbooking
feat(driver): add pool lifecycle transitions
feat(web): add passenger and driver dashboards
test(pool): cover final-seat race
build(docker): add postgres api and web services
docs(readme): document trade-offs and demo flow
```

One commit should represent one understandable logical change. Do not manufacture meaningless micro-commits.
