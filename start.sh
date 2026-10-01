#!/usr/bin/env bash

set -e

echo "Starting Inter-Mobi..."

docker compose up -d --build

echo "Waiting for frontend..."

until curl -fsS http://localhost:3000 > /dev/null 2>&1; do
    sleep 2
done

echo ""
echo "======================================"
echo " Inter-Mobi is running!"
echo "======================================"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8080"
echo ""
