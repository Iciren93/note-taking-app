# 🐳 Docker & Docker Compose Guide

Complete guide to running the Note Taking API with Docker.

---

## 📋 **Prerequisites**

### **Install Docker & Docker Compose**

#### **Windows:**
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Install and restart
3. Verify installation:
   ```powershell
   docker --version
   docker-compose --version
   ```

#### **Mac:**
```bash
# Using Homebrew
brew install --cask docker

# Or download from:
# https://www.docker.com/products/docker-desktop
```

#### **Linux (Ubuntu/Debian):**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

---

## 🚀 **Quick Start (Production)**

### **1. Start All Services**

```bash
# Start in detached mode
docker-compose up -d

# Or with build
docker-compose up -d --build
```

This will start:
- ✅ MySQL database (port 3306)
- ✅ Redis cache (port 6379)
- ✅ Node.js API (port 3000)

### **2. Check Status**

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs

# Follow logs
docker-compose logs -f

# View specific service logs
docker-compose logs app
docker-compose logs mysql
docker-compose logs redis
```

### **3. Test API**

```bash
# Health check
curl http://localhost:3000/api/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"myname","email":"myemail@mymail.com","password":"password123"}'
```

### **4. Stop Services**

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (delete data)
docker-compose down -v
```

---

## 🛠️ **Development Mode**

For development with hot reload:

### **1. Start Development Environment**

```bash
# Use development compose file
docker-compose -f docker-compose.dev.yml up -d

# Or with build
docker-compose -f docker-compose.dev.yml up -d --build
```

### **2. Features in Dev Mode:**
- ✅ Hot reload (nodemon)
- ✅ Source code mounted as volume
- ✅ All npm packages installed
- ✅ Development environment variables

### **3. View Logs**

```bash
docker-compose -f docker-compose.dev.yml logs -f app
```

### **4. Make Changes**

Edit files in `src/` - changes will auto-reload!

---

## 📊 **Docker Architecture**

```
┌─────────────────────────────────────────┐
│         Docker Network                  │
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │    MySQL     │  │    Redis     │   │
│  │   (port:     │  │   (port:     │   │
│  │    3306)     │  │    6379)     │   │
│  └──────┬───────┘  └──────┬───────┘   │
│         │                  │            │
│         └─────────┬────────┘            │
│                   │                     │
│         ┌─────────▼───────────┐        │
│         │   Node.js App       │        │
│         │   (port: 3000)      │        │
│         └─────────────────────┘        │
│                   │                     │
└───────────────────┼─────────────────────┘
                    │
              Host Machine
           (localhost:3000)
```

---

## 🔧 **Configuration**

### **Environment Variables**

Edit `docker-compose.yml` or use `.env.docker`:

```yaml
environment:
  PORT: 3000
  NODE_ENV: production
  DB_HOST: mysql          # Service name
  DB_PORT: 3306
  DB_NAME: note_taking_db
  DB_USER: noteuser
  DB_PASSWORD: notepassword
  REDIS_HOST: redis       # Service name
  JWT_SECRET: your_secret  # CHANGE THIS!
```

### **Change Ports**

If ports are already in use:

```yaml
services:
  app:
    ports:
      - "3001:3000"  # Host:Container
  
  mysql:
    ports:
      - "3307:3306"
  
  redis:
    ports:
      - "6380:6379"
```

---

## 📦 **Docker Commands Reference**

### **Build & Start**

```bash
# Build images
docker-compose build

# Start services
docker-compose up

# Start in background
docker-compose up -d

# Build and start
docker-compose up -d --build

# Start specific service
docker-compose up app
```

### **Stop & Remove**

```bash
# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove containers and volumes
docker-compose down -v

# Remove containers, volumes, and images
docker-compose down -v --rmi all
```

### **View & Monitor**

```bash
# List containers
docker-compose ps

# View logs
docker-compose logs

# Follow logs
docker-compose logs -f

# View specific service
docker-compose logs app

# View last 100 lines
docker-compose logs --tail=100 app
```

### **Execute Commands**

```bash
# Execute command in running container
docker-compose exec app sh

# Run npm commands
docker-compose exec app npm install package-name

# Access MySQL
docker-compose exec mysql mysql -u noteuser -pnotepassword note_taking_db

# Access Redis
docker-compose exec redis redis-cli
```

### **Restart Services**

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart app
```

---

## 🗄️ **Database Management**

### **Access MySQL**

```bash
# Connect to MySQL
docker-compose exec mysql mysql -u noteuser -pnotepassword note_taking_db

# From host (if MySQL client installed)
mysql -h 127.0.0.1 -P 3306 -u noteuser -pnotepassword note_taking_db
```

### **Run SQL Scripts**

```bash
# Execute SQL file
docker-compose exec -T mysql mysql -u noteuser -pnotepassword note_taking_db < database/schema.sql

# Reset database
docker-compose exec -T mysql mysql -u noteuser -pnotepassword note_taking_db < database/reset.sql
```

### **Backup Database**

```bash
# Create backup
docker-compose exec mysql mysqldump -u noteuser -pnotepassword note_taking_db > backup.sql

# Restore backup
docker-compose exec -T mysql mysql -u noteuser -pnotepassword note_taking_db < backup.sql
```

---

## 💾 **Data Persistence**

Docker volumes store data persistently:

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect note-taking-app_mysql_data

# Remove volumes (deletes all data!)
docker-compose down -v
```

**Volumes created:**
- `mysql_data` - Database files
- `redis_data` - Redis persistence

**Data survives:**
- ✅ Container restarts
- ✅ Container removal
- ✅ Compose down (without -v flag)

**Data deleted when:**
- ❌ `docker-compose down -v`
- ❌ Manual volume deletion

---

## 🔍 **Debugging**

### **Check Container Health**

```bash
# View health status
docker-compose ps

# Inspect container
docker inspect note-taking-app

# View health check logs
docker inspect --format='{{json .State.Health}}' note-taking-app
```

### **Access Container Shell**

```bash
# Access app container
docker-compose exec app sh

# View files
ls -la

# Check environment
env | grep DB

# Test connections
ping mysql
ping redis
```

### **View Application Logs**

```bash
# All logs
docker-compose logs app

# Follow logs
docker-compose logs -f app

# Last 50 lines
docker-compose logs --tail=50 app

# Logs with timestamps
docker-compose logs -f -t app
```

### **Common Issues**

#### **Issue: Port already in use**

```bash
# Check what's using the port
# Windows:
netstat -ano | findstr :3000

# Mac/Linux:
lsof -i :3000

# Solution: Change port in docker-compose.yml
ports:
  - "3001:3000"
```

#### **Issue: Cannot connect to MySQL**

```bash
# Check MySQL is running
docker-compose ps mysql

# Check health
docker-compose logs mysql

# Wait for health check
docker-compose up -d
# Wait 30 seconds for MySQL to initialize
```

#### **Issue: App can't connect to database**

```bash
# Restart services in order
docker-compose down
docker-compose up -d mysql redis
# Wait 20 seconds
docker-compose up -d app
```

---

## 🚀 **Production Deployment**

### **Best Practices:**

1. **Use environment variables file:**
   ```bash
   # Create .env file
   cp .env.docker .env
   
   # Edit with production values
   nano .env
   
   # Start with env file
   docker-compose --env-file .env up -d
   ```

2. **Set strong passwords:**
   ```yaml
   MYSQL_ROOT_PASSWORD: "strong_random_password_here"
   MYSQL_PASSWORD: "another_strong_password"
   JWT_SECRET: "your_long_random_secret_key"
   ```

3. **Enable Redis password:**
   ```yaml
   redis:
     command: redis-server --requirepass your_redis_password
   
   app:
     environment:
       REDIS_PASSWORD: your_redis_password
   ```

4. **Use specific image tags:**
   ```yaml
   mysql:
     image: mysql:8.0.35  # Not :latest
   
   redis:
     image: redis:7.2.3-alpine
   ```

5. **Limit resources:**
   ```yaml
   app:
     deploy:
       resources:
         limits:
           cpus: '1'
           memory: 512M
         reservations:
           cpus: '0.5'
           memory: 256M
   ```

6. **Use secrets (Docker Swarm):**
   ```yaml
   secrets:
     db_password:
       external: true
   
   services:
     app:
       secrets:
         - db_password
   ```

---

## 📊 **Monitoring**

### **View Resource Usage**

```bash
# Real-time stats
docker stats

# Specific container
docker stats note-taking-app
```

### **Health Checks**

All services have health checks:

```bash
# Check health
docker-compose ps

# Healthy services show: Up (healthy)
# Unhealthy services show: Up (unhealthy)
```

---

## 🧪 **Testing**

### **Run Tests in Docker**

```bash
# Run tests
docker-compose exec app npm test

# Run with coverage
docker-compose exec app npm run test:coverage
```

---

## 🔄 **Updates & Maintenance**

### **Update Application**

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build
```

### **Update Base Images**

```bash
# Pull latest images
docker-compose pull

# Rebuild
docker-compose up -d --build
```

### **Clean Up**

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a
```

---

## 📝 **Complete Example Workflow**

### **First Time Setup:**

```bash
# 1. Clone repository
git clone <repo-url>
cd note-taking-app

# 2. Review configuration
cat docker-compose.yml

# 3. Start services
docker-compose up -d

# 4. Wait for health checks (30 seconds)
sleep 30

# 5. Check status
docker-compose ps

# 6. View logs
docker-compose logs app

# 7. Test API
curl http://localhost:3000/api/health
```

### **Daily Development:**

```bash
# Start dev environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app

# Make changes to src/ files
# Changes auto-reload!

# Stop when done
docker-compose -f docker-compose.dev.yml down
```

---

## ✅ **Verification Checklist**

- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Ports 3000, 3306, 6379 available
- [ ] `docker-compose up -d` successful
- [ ] All services show "healthy" status
- [ ] Health check returns 200 OK
- [ ] Can register user
- [ ] Can create notes
- [ ] Can search notes

---

## 🆘 **Need Help?**

```bash
# Check Docker version
docker --version
docker-compose --version

# Check service status
docker-compose ps

# View all logs
docker-compose logs

# Restart everything
docker-compose restart

# Start fresh
docker-compose down -v
docker-compose up -d --build
```

---

**Your application is now fully Dockerized!** 🎉

All services run in isolated containers with automatic networking, health checks, and data persistence.

