#!/usr/bin/env bash

set -e

echo "Starting Inter-Mobi..."

docker compose up -d --build

echo ""
echo "Inter-Mobi is running."
echo "Open: http://localhost:3000/"
