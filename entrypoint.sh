#!/usr/bin/env bash
set -euo pipefail

cd /app

mkdir -p /app/logs /app/data /app/backups /app/static/uploads/images

exec python -u Start.py
