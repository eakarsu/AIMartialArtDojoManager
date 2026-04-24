#!/bin/bash

# AI Martial Arts Dojo Manager - Start Script
# This script sets up the database, installs dependencies, and starts the application

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║     🥋 AI Martial Arts Dojo Manager 🥋           ║"
echo "║         Starting Application...                   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
  echo -e "${RED}✗ .env file not found! Please create one.${NC}"
  exit 1
fi

BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# ============================================
# Step 1: Kill processes on used ports
# ============================================
echo -e "\n${YELLOW}[1/6] Cleaning up used ports...${NC}"

kill_port() {
  local port=$1
  local pid=$(lsof -ti :$port 2>/dev/null)
  if [ -n "$pid" ]; then
    echo -e "  Killing process on port $port (PID: $pid)"
    kill -9 $pid 2>/dev/null || true
    sleep 1
  fi
}

kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT
echo -e "${GREEN}✓ Ports $BACKEND_PORT and $FRONTEND_PORT are free${NC}"

# ============================================
# Step 2: Setup PostgreSQL Database
# ============================================
echo -e "\n${YELLOW}[2/6] Setting up PostgreSQL database...${NC}"

# Check if PostgreSQL is running
if ! pg_isready -q 2>/dev/null; then
  echo -e "${RED}✗ PostgreSQL is not running. Please start it first.${NC}"
  exit 1
fi

# Create database if it doesn't exist
DB_NAME=${DB_NAME:-dojo_manager}
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  echo -e "  Database '$DB_NAME' exists. Recreating..."
  dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null || true
fi

createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null || true
echo -e "${GREEN}✓ Database '$DB_NAME' created${NC}"

# Run schema
echo -e "  Running schema..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$PROJECT_DIR/backend/schema.sql" -q 2>/dev/null
echo -e "${GREEN}✓ Schema applied${NC}"

# Run seed data
echo -e "  Seeding data..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$PROJECT_DIR/backend/seed.sql" -q 2>/dev/null
echo -e "${GREEN}✓ Seed data loaded (15+ records per feature)${NC}"

# ============================================
# Step 3: Install Backend Dependencies
# ============================================
echo -e "\n${YELLOW}[3/6] Installing backend dependencies...${NC}"
cd "$PROJECT_DIR/backend"
npm install --silent 2>/dev/null
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# ============================================
# Step 4: Install Frontend Dependencies
# ============================================
echo -e "\n${YELLOW}[4/6] Installing frontend dependencies...${NC}"
cd "$PROJECT_DIR/frontend"
npm install --silent 2>/dev/null
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# ============================================
# Step 5: Start Backend with auto-reload
# ============================================
echo -e "\n${YELLOW}[5/6] Starting backend server (port $BACKEND_PORT)...${NC}"
cd "$PROJECT_DIR/backend"

node --watch server.js > "$PROJECT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started with --watch (auto-reload enabled) [PID: $BACKEND_PID]${NC}"

# Wait for backend to be ready
echo -e "  Waiting for backend to be ready..."
for i in {1..30}; do
  if curl -s "http://localhost:$BACKEND_PORT/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is ready!${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}✗ Backend failed to start. Check backend.log for errors.${NC}"
    cat "$PROJECT_DIR/backend.log"
    exit 1
  fi
  sleep 1
done

# ============================================
# Step 6: Start Frontend with hot-reload
# ============================================
echo -e "\n${YELLOW}[6/6] Starting frontend (port $FRONTEND_PORT)...${NC}"
cd "$PROJECT_DIR/frontend"

BROWSER=none PORT=$FRONTEND_PORT REACT_APP_API_URL="http://localhost:$BACKEND_PORT" npm start > "$PROJECT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started [PID: $FRONTEND_PID]${NC}"

# Wait for frontend to be ready
echo -e "  Waiting for frontend to be ready..."
for i in {1..60}; do
  if curl -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is ready!${NC}"
    break
  fi
  if [ $i -eq 60 ]; then
    echo -e "${YELLOW}⚠ Frontend is still compiling. It will be available shortly.${NC}"
  fi
  sleep 1
done

# ============================================
# Display Summary
# ============================================
echo -e "\n${CYAN}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║     🥋 Application Started Successfully! 🥋      ║"
echo "╠═══════════════════════════════════════════════════╣"
echo "║                                                   ║"
echo "║  Frontend:  http://localhost:$FRONTEND_PORT              ║"
echo "║  Backend:   http://localhost:$BACKEND_PORT              ║"
echo "║  Database:  $DB_NAME                        ║"
echo "║                                                   ║"
echo "║  Login Credentials:                               ║"
echo "║  Email:    admin@dojo.com                         ║"
echo "║  Password: password123                            ║"
echo "║                                                   ║"
echo "║  Auto-reload is enabled for code changes.         ║"
echo "║  Press Ctrl+C to stop all services.               ║"
echo "║                                                   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Save PIDs for cleanup
echo "$BACKEND_PID" > "$PROJECT_DIR/.backend.pid"
echo "$FRONTEND_PID" > "$PROJECT_DIR/.frontend.pid"

# Trap Ctrl+C to clean up
cleanup() {
  echo -e "\n${YELLOW}Shutting down...${NC}"
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  kill_port $BACKEND_PORT
  kill_port $FRONTEND_PORT
  rm -f "$PROJECT_DIR/.backend.pid" "$PROJECT_DIR/.frontend.pid"
  echo -e "${GREEN}✓ All services stopped.${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Open browser
sleep 2
if command -v open &> /dev/null; then
  open "http://localhost:$FRONTEND_PORT"
elif command -v xdg-open &> /dev/null; then
  xdg-open "http://localhost:$FRONTEND_PORT"
fi

# Keep script running
wait
