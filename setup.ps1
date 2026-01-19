# Setup Script for Windows
# Run this in PowerShell

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Note Taking API - Setup Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js v16+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found" -ForegroundColor Red
    exit 1
}

# Check MySQL
Write-Host "Checking MySQL..." -ForegroundColor Yellow
try {
    $mysqlVersion = mysql --version
    Write-Host "✓ MySQL installed: $mysqlVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠ MySQL not found in PATH. Make sure MySQL is installed and running." -ForegroundColor Yellow
    Write-Host "  Download from: https://dev.mysql.com/downloads/installer/" -ForegroundColor Yellow
}

# Check Redis
Write-Host "Checking Redis..." -ForegroundColor Yellow
try {
    redis-cli --version
    Write-Host "✓ Redis installed" -ForegroundColor Green
} catch {
    Write-Host "⚠ Redis not found. Install Redis for Windows:" -ForegroundColor Yellow
    Write-Host "  https://github.com/microsoftarchive/redis/releases" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Installing Dependencies" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Environment Configuration" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    
    # Generate random JWT secret
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    
    $envContent = @"
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
JWT_SECRET=$jwtSecret
JWT_EXPIRES_IN=24h

# Cache Configuration
CACHE_TTL=3600
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✓ .env file created" -ForegroundColor Green
    Write-Host "⚠ Please edit .env and set your DB_PASSWORD" -ForegroundColor Yellow
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Edit .env file with your database credentials:" -ForegroundColor White
Write-Host "   notepad .env" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Create MySQL database:" -ForegroundColor White
Write-Host "   mysql -u root -p -e `"CREATE DATABASE note_taking_db`"" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Start Redis server:" -ForegroundColor White
Write-Host "   redis-server" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Start the application:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Test the API:" -ForegroundColor White
Write-Host "   curl http://localhost:3000/api/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Documentation" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "• Quick Start: QUICKSTART.md" -ForegroundColor White
Write-Host "• Full API Docs: README.md" -ForegroundColor White
Write-Host "• Testing Guide: docs/API_TESTING.md" -ForegroundColor White
Write-Host "• Architecture: docs/ARCHITECTURE.md" -ForegroundColor White
Write-Host "• Technical Analysis: TECHNICAL_ANALYSIS.md" -ForegroundColor White
Write-Host ""
Write-Host "Setup complete! 🚀" -ForegroundColor Green
Write-Host ""

