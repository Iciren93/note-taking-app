# Getting Started with Note Taking API

This guide will help you run and test the Note Taking API

---

## Prerequisites

Before starting, ensure you have:

- **Node.js** v16 or higher ([Download](https://nodejs.org/))
- **MySQL** v8.0 or higher ([Download](https://dev.mysql.com/downloads/))
- **Redis** v6.0 or higher ([Installation Guide](#installing-redis))
- **Git** (for cloning the repository)

**OR**

- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop)) - if using Docker

---

## 🚀 Quick Start

Choose your preferred method:

### Method 1: Docker (Recommended - Easiest)

```bash
# 1. Clone and navigate to project
git clone <repository-url>
cd note-taking-app

# 2. Start all services (MySQL, Redis, API)
docker-compose up -d

# 3. Wait 30 seconds for initialization

# 4. Test the API
curl http://localhost:3000/api/health
```

✅ **Done!** Skip to [Testing the API](#testing-the-api)

---

### Method 2: Local Installation

#### Step 1: Install Dependencies

```bash
# Clone repository
git clone <repository-url>
cd note-taking-app

# Install npm packages
npm install
```

#### Step 2: Configure Environment

Create a `.env` file:

```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

Edit `.env` with your settings:

```env
PORT=3000
NODE_ENV=development

# Update these with your MySQL credentials
DB_HOST=localhost
DB_PORT=3306
DB_NAME=note_taking_db
DB_USER=root
DB_PASSWORD=your_mysql_password

# Redis settings
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Generate a random secret for JWT
JWT_SECRET=your_random_secret_key_here
JWT_EXPIRES_IN=24h

CACHE_TTL=3600
```

#### Step 3: Set Up Database

```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE note_taking_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

Or use the one-liner:
```bash
mysql -u root -p -e "CREATE DATABASE note_taking_db"
```

#### Step 4: Start Services

**Terminal 1 - Start Redis:**
```bash
redis-server
```

**Terminal 2 - Start Application:**
```bash
npm run dev
```

You should see:
```
✅ Database connection established successfully.
✅ Database models synchronized successfully.
✅ Redis client connected
✅ Redis client ready
✅ Server is running on port 3000
```

---

## 🔧 Configuration Reference

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 3000 | No |
| `NODE_ENV` | Environment | development | No |
| `DB_HOST` | MySQL host | localhost | Yes |
| `DB_PORT` | MySQL port | 3306 | No |
| `DB_NAME` | Database name | note_taking_db | Yes |
| `DB_USER` | MySQL user | root | Yes |
| `DB_PASSWORD` | MySQL password | - | Yes |
| `REDIS_HOST` | Redis host | localhost | Yes |
| `REDIS_PORT` | Redis port | 6379 | No |
| `REDIS_PASSWORD` | Redis password | - | No |
| `JWT_SECRET` | Secret for JWT | - | Yes |
| `JWT_EXPIRES_IN` | Token expiration | 24h | No |
| `CACHE_TTL` | Cache duration (seconds) | 3600 | No |

### Docker Configuration

For Docker setup, edit `docker-compose.yml`:

```yaml
services:
  app:
    environment:
      DB_USER: noteuser           # Change for production
      DB_PASSWORD: notepassword   # Change for production
      JWT_SECRET: your_secret     # CHANGE THIS!
```

---

## 🧪 Testing the API

### 1. Verify Server is Running

**Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2026-01-19T..."
}
```

### 2. Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"myname","email":"myemail@mymail.com","password":"password123"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "myname",
      "email": "myemail@mymail.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**⭐ Save the token!** You'll need it for authenticated requests.

### 3. Set Token Variable

```bash
# Mac/Linux
export TOKEN="paste_your_token_here"

# Windows PowerShell
$TOKEN="paste_your_token_here"
```

### 4. Create a Note

```bash
# Mac/Linux
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"My First Note","content":"This is a test note about JavaScript"}'

# Windows PowerShell
curl -X POST http://localhost:3000/api/notes `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $TOKEN" `
  -d '{"title":"My First Note","content":"This is a test note about JavaScript"}'
```

### 5. Get All Notes

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/notes
```

**First request:** `"source": "database"`  
**Second request:** `"source": "cache"` ✅ Redis is working!

### 6. Search Notes

```bash
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/notes/search?q=JavaScript"
```

### 7. Update Note (Test Versioning)

```bash
curl -X PUT http://localhost:3000/api/notes/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Updated Note","content":"Updated content","version":1}'
```

**Notice:** Version changes from 1 → 2

### 8. View Version History

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/notes/1/versions
```

### 9. Test Concurrency Control

Try updating with an old version number:

```bash
curl -X PUT http://localhost:3000/api/notes/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Another Update","content":"New content","version":1}'
```

**Expected:** `409 Conflict` - Optimistic locking works! ✅

---

## 🎯 Complete API Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Create new user | No |
| POST | `/api/auth/login` | Login and get token | No |
| GET | `/api/auth/profile` | Get current user | Yes |

### Note Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/notes` | Create a note | Yes |
| GET | `/api/notes` | Get all user notes | Yes |
| GET | `/api/notes/:id` | Get specific note | Yes |
| PUT | `/api/notes/:id` | Update note | Yes |
| DELETE | `/api/notes/:id` | Delete note (soft) | Yes |
| GET | `/api/notes/search?q=keyword` | Search notes | Yes |
| GET | `/api/notes/:id/versions` | Get version history | Yes |
| POST | `/api/notes/:id/revert/:versionNumber` | Revert to version | Yes |

---

## 🔍 Testing with Postman

### Import Collection

1. Open Postman
2. Click **Import**
3. Select `postman/Note_Taking_API.postman_collection.json`
4. Click **Import**

### Configure Environment

1. Click on collection → **Variables** tab
2. Set `baseUrl` to `http://localhost:3000/api`
3. Save

### Run Requests

1. Execute **Register User** or **Login**
2. Token is automatically saved!
3. Test other endpoints

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to database"

**Check:**
```bash
# MySQL is running
mysql -u root -p

# Database exists
mysql -u root -p -e "SHOW DATABASES;"

# Credentials match .env file
```

**Fix:**
```bash
# Create database if missing
mysql -u root -p -e "CREATE DATABASE note_taking_db"

# Verify .env has correct DB_PASSWORD
```

### Issue: "Redis connection failed"

**Check:**
```bash
# Redis is running
redis-cli ping
# Should return: PONG
```

**Fix:**
```bash
# Start Redis
redis-server

# Or if using Docker
docker-compose up -d redis
```

### Issue: "Port 3000 already in use"

**Fix:**
```bash
# Option 1: Change port in .env
PORT=3001

# Option 2: Kill process using port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

### Issue: "JWT token invalid"

**Fix:**
- Ensure JWT_SECRET is set in .env
- Re-login to get a fresh token
- Check Authorization header format: `Bearer <token>`

### Issue: "Full-text search not working"

**Check:**
- MySQL version 5.6+ supports FULLTEXT
- Database has been synchronized (app creates indexes automatically)

**Fix:**
```bash
# Restart app to sync models
npm run dev
```

---

## 🔐 Security Notes

### For Development:
- ✅ Default passwords are fine
- ✅ Use any JWT_SECRET
- ✅ HTTP is acceptable

### For Production:
- ⚠️ Change all default passwords
- ⚠️ Use strong JWT_SECRET (32+ random characters)
- ⚠️ Use HTTPS/TLS
- ⚠️ Set NODE_ENV=production
- ⚠️ Enable Redis authentication
- ⚠️ Configure firewall rules
- ⚠️ Use environment-specific .env files

---

## 📊 Verification Checklist

Before testing, ensure:

- [ ] MySQL is running and accessible
- [ ] Redis is running (verify with `redis-cli ping`)
- [ ] `.env` file exists with correct values
- [ ] Database `note_taking_db` created
- [ ] `npm install` completed successfully
- [ ] No errors when running `npm run dev`
- [ ] Health endpoint returns 200 OK
- [ ] Can register a user
- [ ] Can create and retrieve notes

---

## 🎓 Next Steps

### Learn More:
- **Full API Documentation:** [README.md](README.md)
- **Docker Guide:** [DOCKER_GUIDE.md](DOCKER_GUIDE.md)
- **Testing Scenarios:** [docs/API_TESTING.md](docs/API_TESTING.md)
- **Architecture:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Technical Analysis:** [TECHNICAL_ANALYSIS.md](TECHNICAL_ANALYSIS.md)

### Advanced Features:
- Test version control system
- Try concurrent updates (optimistic locking)
- Explore full-text search capabilities
- Monitor Redis cache performance
- Review version history

---

## 📞 Getting Help

### Common Resources:

**Setup Issues:**
- Check [Troubleshooting](#troubleshooting) section above
- Review `.env` configuration
- Verify all services are running

**API Questions:**
- See [Complete API Reference](#complete-api-reference)
- Check [README.md](README.md) for detailed examples
- Import Postman collection for easy testing

**Docker Issues:**
- See [DOCKER_GUIDE.md](DOCKER_GUIDE.md)
- Run `docker-compose logs app` to view errors
- Ensure ports 3000, 3306, 6379 are available

---

## 🚀 Quick Command Reference

### Local Development

```bash
# Start application
npm run dev

# View logs (check terminal output)

# Stop application
Ctrl + C
```

### Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Restart after code changes
docker-compose up -d --build

# Clean up everything
docker-compose down -v
```

### Database

```bash
# Access MySQL
mysql -u root -p note_taking_db

# View tables
SHOW TABLES;

# View data
SELECT * FROM users;
SELECT * FROM notes;
SELECT * FROM note_versions;
```

### Redis

```bash
# Access Redis CLI
redis-cli

# View all cached keys
KEYS *

# View specific cache
GET notes:user:1:all

# Clear all cache
FLUSHALL
```

---

## ✅ Success Indicators

Your application is working correctly when:

1. ✅ Server starts without errors
2. ✅ Health check returns `200 OK`
3. ✅ Can register and login users
4. ✅ Tokens are generated and accepted
5. ✅ Can create, read, update, delete notes
6. ✅ Search returns relevant results
7. ✅ Second GET request shows `"source": "cache"`
8. ✅ Version numbers increment on updates
9. ✅ Concurrent updates return `409 Conflict`
10. ✅ Can view version history

---

## 🎉 You're All Set!

Your Note Taking API is now running with:
- ✅ MySQL database with full-text search
- ✅ Redis caching for performance
- ✅ JWT authentication
- ✅ Version control system
- ✅ Concurrency protection
- ✅ Comprehensive API

**Start testing and building amazing features!** 🚀

---

**Need more details?** Check out the complete documentation in [README.md](README.md) or [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)

