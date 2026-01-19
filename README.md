# Note Taking API

A robust RESTful API for note-taking with advanced features including versioning, concurrency control, full-text search, and Redis caching.

## 🚀 Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Note Management**: Create, read, update, delete notes
- **Version Control**: Track all changes to notes with version history
- **Concurrency Control**: Optimistic locking to prevent concurrent update conflicts
- **Full-Text Search**: Fast keyword-based search using MySQL full-text indexing
- **Redis Caching**: Improved performance for frequently accessed data
- **Soft Deletion**: Notes are soft-deleted, preserving history
- **Design Patterns**: Singleton pattern for database and Redis connections

## 📋 Prerequisites

- **Node.js**: v16 or higher
- **MySQL**: v8.0 or higher
- **Redis**: v6.0 or higher
- **npm**: v7 or higher

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd note-taking-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=note_taking_db
DB_USER=root
DB_PASSWORD=your_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRES_IN=24h

# Cache Configuration
CACHE_TTL=3600
```

### 4. Set up MySQL database

Create the database:

```sql
CREATE DATABASE note_taking_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

The application will automatically create tables and set up the schema on first run.

### 5. Start Redis

Make sure Redis is running:

```bash
# On Windows (if installed)
redis-server 

if not installed:
# 1. Install WSL2 (PowerShell as Admin)
wsl --install

# 2. Restart computer

# 3. Open Ubuntu from Start Menu

# 4. In Ubuntu terminal:
sudo apt update && sudo apt install redis-server -y
sudo service redis-server start
redis-cli ping

# 5. Keep Ubuntu terminal open and run your app in another terminal
npm run dev

# On macOS/Linux
redis-server
```

### 6. Run the application

Development mode (with auto-reload):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication Endpoints

### 1. Register User

**POST** `/api/auth/register`

Register a new user account.

**Request Body:**

```json
{
  "username": "myname",
  "email": "myemail@mymail.com",
  "password": "password123"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "myname",
      "email": "myemail@mymail.com",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login

**POST** `/api/auth/login`

Authenticate and receive access token.

**Request Body:**

```json
{
  "email": "myemail@mymail.com",
  "password": "password123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
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

### 3. Get Profile

**GET** `/api/auth/profile`

Get current user profile (requires authentication).

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "myname",
      "email": "myemail@mymail.com"
    }
  }
}
```

---

## 📝 Note Endpoints

### 1. Create Note

**POST** `/api/notes`

Create a new note with automatic versioning.

**Request Body:**

```json
{
  "title": "My First Note",
  "content": "This is the content of my first note."
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Note created successfully",
  "data": {
    "note": {
      "id": 1,
      "userId": 1,
      "title": "My First Note",
      "content": "This is the content of my first note.",
      "version": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 2. Get All Notes

**GET** `/api/notes`

Retrieve all notes for the authenticated user.

**Response (200 OK):**

```json
{
  "success": true,
  "source": "cache",
  "data": {
    "notes": [
      {
        "id": 1,
        "title": "My First Note",
        "content": "This is the content of my first note.",
        "version": 1,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**Note:** `source` can be `"cache"` or `"database"` indicating where data was retrieved from.

### 3. Get Note by ID

**GET** `/api/notes/:id`

Retrieve a specific note by its ID.

**Response (200 OK):**

```json
{
  "success": true,
  "source": "database",
  "data": {
    "note": {
      "id": 1,
      "userId": 1,
      "title": "My First Note",
      "content": "This is the content of my first note.",
      "version": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 4. Update Note

**PUT** `/api/notes/:id`

Update a note with concurrency control.

**Request Body:**

```json
{
  "title": "Updated Title",
  "content": "Updated content.",
  "version": 1
}
```

**Important:** The `version` field is required for optimistic locking. Use the current version number from the note.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Note updated successfully",
  "data": {
    "note": {
      "id": 1,
      "title": "Updated Title",
      "content": "Updated content.",
      "version": 2,
      "updatedAt": "2024-01-01T01:00:00.000Z"
    }
  }
}
```

**Concurrency Conflict (409 Conflict):**

If another user has modified the note:

```json
{
  "success": false,
  "error": "Concurrency conflict: Note has been modified by another user. Please refresh and try again.",
  "currentVersion": 3,
  "providedVersion": 1
}
```

### 5. Delete Note

**DELETE** `/api/notes/:id`

Soft delete a note (preserves version history).

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Note deleted successfully"
}
```

### 6. Search Notes

**GET** `/api/notes/search?q=keyword`

Search notes using full-text search.

**Query Parameters:**
- `q` (required): Search keyword(s)

**Response (200 OK):**

```json
{
  "success": true,
  "source": "database",
  "data": {
    "notes": [
      {
        "id": 1,
        "title": "My First Note",
        "content": "This is the content with keyword.",
        "version": 1,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
        "relevance": 1.5
      }
    ]
  }
}
```

**Note:** Results are ordered by relevance score (descending).

### 7. Get Note Versions

**GET** `/api/notes/:id/versions`

Retrieve all versions of a note.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "id": 2,
        "noteId": 1,
        "title": "Updated Title",
        "content": "Updated content.",
        "versionNumber": 2,
        "createdAt": "2024-01-01T01:00:00.000Z"
      },
      {
        "id": 1,
        "noteId": 1,
        "title": "My First Note",
        "content": "Original content.",
        "versionNumber": 1,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### 8. Revert to Previous Version

**POST** `/api/notes/:id/revert/:versionNumber`

Revert a note to a previous version.

**Request Body:**

```json
{
  "version": 2
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Note reverted to version 1",
  "data": {
    "note": {
      "id": 1,
      "title": "My First Note",
      "content": "Original content.",
      "version": 3,
      "updatedAt": "2024-01-01T02:00:00.000Z"
    }
  }
}
```

**Note:** Reverting creates a new version with the old content.

---

## 🏗️ Database Schema

### Users Table

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

### Notes Table

```sql
CREATE TABLE notes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_deleted_at (deleted_at),
  FULLTEXT INDEX idx_fulltext_title_content (title, content)
);
```

### Note Versions Table

```sql
CREATE TABLE note_versions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  note_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  version_number INT NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  INDEX idx_note_id (note_id),
  UNIQUE INDEX idx_note_version (note_id, version_number)
);
```

---

## 🔧 Testing the API

### Using cURL

**Register a user:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"myname","email":"myemail@mymail.com","password":"password123"}'
```

**Login:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"myemail@mymail.com","password":"password123"}'
```

**Create a note:**

```bash
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title":"My Note","content":"Note content here"}'
```

### Using Postman

1. Import the API endpoints into Postman
2. Set up an environment variable for the token
3. Use the Collection Runner for automated testing

---

## 🎨 Design Patterns

### Singleton Pattern

The application implements the Singleton pattern for:

1. **Database Connection** (`src/config/database.js`)
   - Ensures only one database connection pool exists
   - Prevents connection leaks and optimizes resource usage

2. **Redis Client** (`src/config/redis.js`)
   - Single Redis client instance throughout the application
   - Manages connection lifecycle efficiently

**Benefits:**
- Consistent connection management
- Reduced memory footprint
- Easier to test and maintain
- Thread-safe in Node.js single-threaded environment

---

## ⚡ Performance Optimizations

### Redis Caching Strategy

- **Cache Key Pattern**: `notes:user:{userId}:all`, `notes:{noteId}`
- **TTL**: 3600 seconds (1 hour) for notes, 1800 seconds for search results
- **Invalidation**: Cache is invalidated on create, update, and delete operations

### Database Optimizations

- **Indexes**: User ID, deleted_at, full-text search on title and content
- **Connection Pooling**: Maximum 5 connections with proper timeout handling
- **Eager/Lazy Loading**: Optimized query patterns to prevent N+1 problems

---

## 🛡️ Security Features

- **Password Hashing**: bcrypt with salt rounds of 10
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet.js**: Security headers for Express
- **Input Validation**: Joi schemas for all user inputs
- **SQL Injection Prevention**: Sequelize ORM with parameterized queries

---

## 🐛 Error Handling

The API uses consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": ["Additional error details"]
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `404`: Not Found
- `409`: Conflict (concurrency conflict, duplicate entry)
- `500`: Internal Server Error

---

## 📊 Monitoring and Logging

- Request logging in development mode
- Error logging for all uncaught exceptions
- Graceful shutdown handling for SIGTERM and SIGINT

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## 📄 License

MIT License

---

## 🆘 Troubleshooting

### Cannot connect to MySQL

- Verify MySQL is running: `mysql -u root -p`
- Check credentials in `.env` file
- Ensure database exists: `CREATE DATABASE note_taking_db;`

### Cannot connect to Redis

- Verify Redis is running: `redis-cli ping` (should return PONG)
- Check Redis host and port in `.env` file

### JWT Token errors

- Ensure `JWT_SECRET` is set in `.env` file
- Check token expiration time
- Verify token format in Authorization header: `Bearer <token>`

### Full-text search not working

- Ensure MySQL version supports full-text search (5.6+)
- Verify FULLTEXT index is created on notes table
- Use natural language mode keywords

---

## 📞 Support

For issues, questions, or contributions, please open an issue in the repository.

