# Suggested truthful Git history

The evaluator explicitly inspects history. Do not import a finished ZIP and pretend these commits happened. Use this as a plan while you move the generated baseline into your own repository and verify each stage.

```bash
git init -b master

git checkout -b feature/project-foundation
# add workspace, env examples, API/web skeleton
git add .
git commit -m "chore(repo): scaffold web api and shared docker layout"
git checkout master
git merge --no-ff feature/project-foundation

git checkout -b feature/passenger-auth
# add user model, auth middleware/routes, seed users
git commit -am "feat(auth): add passenger and driver authentication"
git checkout master && git merge --no-ff feature/passenger-auth

git checkout -b feature/fare-and-geography
# add areas, matrix, fare calculator + tests
git commit -am "feat(fare): add deterministic Dhaka fare calculation"
git checkout master && git merge --no-ff feature/fare-and-geography

git checkout -b feature/tesla-pooling
# add pool/request schema, matching, concurrency protection
git commit -am "feat(pool): add compatible ride pooling"
git commit -am "fix(pool): protect final seat with serializable transaction"
git checkout master && git merge --no-ff feature/tesla-pooling

git checkout -b feature/driver-flow
git commit -am "feat(driver): add pool lifecycle and vehicle availability"
git checkout master && git merge --no-ff feature/driver-flow

git checkout -b feature/frontend
git commit -am "feat(web): add passenger and driver product flows"
git checkout master && git merge --no-ff feature/frontend

git checkout -b feature/testing-docs
git commit -am "test(pool): cover fare lifecycle and capacity risks"
git commit -am "docs(readme): add architecture erd tradeoffs and video plan"
git checkout master && git merge --no-ff feature/testing-docs

git branch pre-release
git checkout pre-release
git commit --allow-empty -m "chore(release): prepare v1.0.0 integration"
git branch release/v1.0.0
```
