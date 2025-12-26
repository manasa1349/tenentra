#!/bin/sh
set -e

echo "Waiting for database..."
sleep 5

echo "Running migrations..."
npm run migrate

echo "Running seed data..."
npm run seed

echo "Starting server..."
npm start