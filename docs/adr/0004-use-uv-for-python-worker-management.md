# Use uv for Python worker management

The Python worker will be managed with uv for environment creation, dependency installation, locking, and command execution. This keeps Python dependency resolution fast and reproducible across local development, tests, Docker builds, and agent-run workflows, instead of mixing ad hoc virtualenv, pip, and pytest invocation patterns.

