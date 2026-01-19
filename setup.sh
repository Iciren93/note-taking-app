#!/bin/bash

# Setup Script for Mac/Linux
# Make this file executable: chmod +x setup.sh

echo "=========================================="
echo "  Note Taking API - Setup Script"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check Node.js
echo -e "${YELLOW}Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js not found. Please install Node.js v16+ from https://nodejs.org${NC}"
    exit 1
fi

# Check npm
echo -e "${YELLOW}Checking npm...${NC}"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ npm installed: v$NPM_VERSION${NC}"
else
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi

# Check MySQL
echo -e "${YELLOW}Checking MySQL...${NC}"
if command -v mysql &> /dev/null; then
    MYSQL_VERSION=$(mysql --version)
    echo -e "${GREEN}✓ MySQL installed: $MYSQL_VERSION${NC}"
else
    echo -e "${YELLOW}⚠ MySQL not found. Make sure MySQL is installed and running.${NC}"
    echo -e "${YELLOW}  Mac: brew install mysql${NC}"
    echo -e "${YELLOW}  Ubuntu: sudo apt-get install mysql-server${NC}"
fi

# Check Redis
echo -e "${YELLOW}Checking Redis...${NC}"
if command -v redis-cli &> /dev/null; then
    REDIS_VERSION=$(redis-cli --version)
    echo -e "${GREEN}✓ Redis installed: $REDIS_VERSION${NC}"
else
    echo -e "${YELLOW}⚠ Redis not found.${NC}"
    echo -e "${YELLOW}  Mac: brew install redis${NC}"
    echo -e "${YELLOW}  Ubuntu: sudo apt-get install redis-server${NC}"
fi

echo ""
echo -e "${CYAN}==========================================${NC}"
echo -e "${CYAN}  Installing Dependencies${NC}"
echo -e "${CYAN}==========================================${NC}"

npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}==========================================${NC}"
echo -e "${CYAN}  Environment Configuration${NC}"
echo -e "${CYAN}==========================================${NC}"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    
    # Generate random JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    
    cat > .env << EOF
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=note_taking_db
DB_USER=root
DB_PASSWORD=

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=24h

# Cache Configuration
CACHE_TTL=3600
EOF
    
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠ Please edit .env and set your DB_PASSWORD${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

echo ""
echo -e "${CYAN}==========================================${NC}"
echo -e "${CYAN}  Next Steps${NC}"
echo -e "${CYAN}==========================================${NC}"
echo ""
echo -e "1. Edit .env file with your database credentials:"
echo -e "   ${CYAN}nano .env${NC}"
echo ""
echo -e "2. Create MySQL database:"
echo -e "   ${CYAN}mysql -u root -p -e \"CREATE DATABASE note_taking_db\"${NC}"
echo ""
echo -e "3. Start Redis server:"
echo -e "   ${CYAN}redis-server${NC}"
echo -e "   or"
echo -e "   ${CYAN}brew services start redis${NC} (Mac)"
echo ""
echo -e "4. Start the application:"
echo -e "   ${CYAN}npm run dev${NC}"
echo ""
echo -e "5. Test the API:"
echo -e "   ${CYAN}curl http://localhost:3000/api/health${NC}"
echo ""
echo -e "${CYAN}==========================================${NC}"
echo -e "${CYAN}  Documentation${NC}"
echo -e "${CYAN}==========================================${NC}"
echo ""
echo "• Quick Start: QUICKSTART.md"
echo "• Full API Docs: README.md"
echo "• Testing Guide: docs/API_TESTING.md"
echo "• Architecture: docs/ARCHITECTURE.md"
echo "• Technical Analysis: TECHNICAL_ANALYSIS.md"
echo ""
echo -e "${GREEN}Setup complete! 🚀${NC}"
echo ""

