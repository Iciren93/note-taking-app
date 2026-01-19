# System Architecture Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (Web Browser, Mobile App, Postman, cURL, etc.)            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS/REST API
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   API Gateway / Load Balancer                │
│              (Future: nginx, AWS ALB, etc.)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼─────────┐      ┌───────▼─────────┐
│  Express App 1  │      │  Express App N  │
│                 │      │                 │
│  ┌───────────┐  │      │  ┌───────────┐  │
│  │  Routes   │  │      │  │  Routes   │  │
│  └─────┬─────┘  │      │  └─────┬─────┘  │
│        │        │      │        │        │
│  ┌─────▼─────┐  │      │  ┌─────▼─────┐  │
│  │Middleware │  │      │  │Middleware │  │
│  └─────┬─────┘  │      │  └─────┬─────┘  │
│        │        │      │        │        │
│  ┌─────▼─────┐  │      │  ┌─────▼─────┐  │
│  │Controllers│  │      │  │Controllers│  │
│  └─────┬─────┘  │      │  └─────┬─────┘  │
│        │        │      │        │        │
│  ┌─────▼─────┐  │      │  ┌─────▼─────┐  │
│  │  Models   │  │      │  │  Models   │  │
│  └─────┬─────┘  │      │  └─────┬─────┘  │
└────────┼─────────┘      └────────┼─────────┘
         │                         │
         └────────────┬────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
┌────────▼─────────┐      ┌────────▼─────────┐
│  MySQL Database  │      │  Redis Cache     │
│                  │      │                  │
│  ┌────────────┐  │      │  ┌────────────┐  │
│  │   Users    │  │      │  │ Note Cache │  │
│  ├────────────┤  │      │  ├────────────┤  │
│  │   Notes    │  │      │  │Search Cache│  │
│  ├────────────┤  │      │  ├────────────┤  │
│  │  Versions  │  │      │  │ User Cache │  │
│  └────────────┘  │      │  └────────────┘  │
└──────────────────┘      └──────────────────┘
```

## Component Breakdown

### 1. Client Layer
- **Purpose**: User interface and API consumers
- **Technologies**: Any HTTP client
- **Communication**: RESTful API over HTTPS

### 2. API Gateway (Future Enhancement)
- **Purpose**: Request routing, rate limiting, SSL termination
- **Technologies**: nginx, AWS ALB, Kong
- **Features**:
  - Load balancing across multiple app instances
  - SSL/TLS termination
  - DDoS protection
  - Request logging

### 3. Application Layer (Express.js)

#### 3.1 Routes Layer
- **Purpose**: Define API endpoints and map to controllers
- **Files**: `src/routes/*.js`
- **Responsibilities**:
  - URL mapping
  - HTTP method handling
  - Route grouping

#### 3.2 Middleware Layer
- **Purpose**: Request preprocessing and validation
- **Components**:
  - **Authentication** (`auth.js`): JWT verification
  - **Validation** (`validate.js`): Input validation with Joi
  - **Error Handler** (`errorHandler.js`): Centralized error handling
- **Flow**: Request → Middleware → Controller

#### 3.3 Controllers Layer
- **Purpose**: Business logic and request handling
- **Files**: `src/controllers/*.js`
- **Responsibilities**:
  - Process requests
  - Call model methods
  - Handle caching logic
  - Return responses

#### 3.4 Models Layer
- **Purpose**: Data models and database interaction
- **Files**: `src/models/*.js`
- **Components**:
  - User model
  - Note model
  - NoteVersion model
- **ORM**: Sequelize

### 4. Data Layer

#### 4.1 MySQL Database
- **Purpose**: Persistent data storage
- **Schema**:
  - `users`: User accounts
  - `notes`: Note content and metadata
  - `note_versions`: Version history
- **Features**:
  - ACID compliance
  - Foreign key constraints
  - Full-text indexing
  - Soft deletion support

#### 4.2 Redis Cache
- **Purpose**: Performance optimization
- **Strategy**: Cache-aside pattern
- **Cached Data**:
  - User notes list
  - Individual notes
  - Search results
- **TTL**: 3600s for notes, 1800s for search

## Design Patterns

### 1. Singleton Pattern

**Implementation**: Database and Redis connections

```javascript
class DatabaseConnection {
  constructor() {
    if (DatabaseConnection.instance) {
      return DatabaseConnection.instance;
    }
    // Initialize connection
    DatabaseConnection.instance = this;
  }
}
```

**Benefits**:
- Single connection pool
- Resource optimization
- Consistent state
- Easy testing

### 2. MVC Pattern

**Model**: Data and business logic (Sequelize models)
**View**: JSON responses (API endpoints)
**Controller**: Request handling (Controllers)

### 3. Middleware Chain Pattern

**Request Flow**:
```
Request → Rate Limiter → Body Parser → Auth → Validation → Controller → Response
```

### 4. Repository Pattern (Implicit via ORM)

Models abstract database operations:
```javascript
Note.findAll({ where: { userId } })
// Instead of raw SQL
```

## Data Flow Diagrams

### Create Note Flow

```
Client
  │
  │ POST /api/notes
  │ { title, content }
  │ + JWT Token
  ▼
Auth Middleware
  │
  │ Verify JWT
  │ Extract user ID
  ▼
Validation Middleware
  │
  │ Validate input
  │ (Joi schema)
  ▼
Note Controller
  │
  ├─► Create note in DB
  │   (Note model)
  │
  ├─► Create version 1
  │   (NoteVersion model)
  │
  └─► Invalidate cache
      (Redis)
  │
  ▼
Response
  │
  │ 201 Created
  │ { note data }
  ▼
Client
```

### Get Note Flow (with Caching)

```
Client
  │
  │ GET /api/notes/123
  │ + JWT Token
  ▼
Auth Middleware
  │
  │ Verify JWT
  ▼
Note Controller
  │
  ├─► Check Redis cache
  │   Key: "notes:123"
  │
  ├─── Cache HIT?
  │    Yes │         No
  │        │          │
  │        │          ├─► Query MySQL
  │        │          │
  │        │          └─► Store in Redis
  │        │             (TTL: 3600s)
  │        │
  │        └──────────┘
  │
  ▼
Response
  │
  │ 200 OK
  │ { note data }
  │ source: "cache" or "database"
  ▼
Client
```

### Update Note Flow (with Concurrency Control)

```
Client
  │
  │ PUT /api/notes/123
  │ { title, content, version: 5 }
  │ + JWT Token
  ▼
Auth Middleware
  │
  │ Verify JWT
  ▼
Validation Middleware
  │
  │ Validate input
  │ Check version field
  ▼
Note Controller
  │
  ├─► Start Transaction
  │
  ├─► Lock note row
  │   (SELECT FOR UPDATE)
  │
  ├─► Check version
  │   │
  │   ├─── Match?
  │   │    Yes │         No
  │   │        │          │
  │   │        │          └─► Rollback
  │   │        │              Return 409 Conflict
  │   │        │
  │   │        ├─► Update note
  │   │        │   version = version + 1
  │   │        │
  │   │        ├─► Create version snapshot
  │   │        │   (NoteVersion)
  │   │        │
  │   │        └─► Commit transaction
  │   │
  │   └─────────────┘
  │
  ├─► Invalidate cache
  │   - notes:123
  │   - notes:user:X:all
  │
  ▼
Response
  │
  │ 200 OK
  │ { updated note, version: 6 }
  ▼
Client
```

### Full-Text Search Flow

```
Client
  │
  │ GET /api/notes/search?q=javascript
  │ + JWT Token
  ▼
Auth Middleware
  │
  │ Verify JWT
  ▼
Note Controller
  │
  ├─► Check Redis cache
  │   Key: "notes:search:userX:javascript"
  │
  ├─── Cache HIT?
  │    Yes │         No
  │        │          │
  │        │          ├─► Full-text search (MySQL)
  │        │          │   MATCH(title, content)
  │        │          │   AGAINST('javascript')
  │        │          │
  │        │          └─► Store in Redis
  │        │             (TTL: 1800s)
  │        │
  │        └──────────┘
  │
  ▼
Response
  │
  │ 200 OK
  │ { notes with relevance scores }
  ▼
Client
```

## Concurrency Control Mechanism

### Optimistic Locking Strategy

```
User A                          User B
  │                              │
  ├─► GET note (version: 5)      │
  │                              ├─► GET note (version: 5)
  │                              │
  │                              ├─► PUT note (version: 5)
  │                              │   ✅ Success (version → 6)
  │                              │
  ├─► PUT note (version: 5)      │
  │   ❌ 409 Conflict            │
  │   (current version: 6)       │
  │                              │
  ├─► GET note (version: 6)      │
  │   (refresh to get latest)    │
  │                              │
  ├─► PUT note (version: 6)      │
  │   ✅ Success (version → 7)   │
```

## Security Architecture

### Authentication Flow

```
Client
  │
  │ POST /auth/login
  │ { email, password }
  ▼
Auth Controller
  │
  ├─► Find user by email
  │
  ├─► Compare password
  │   (bcrypt)
  │   │
  │   ├─── Valid?
  │   │    Yes │      No
  │   │        │       │
  │   │        │       └─► 401 Unauthorized
  │   │        │
  │   │        ├─► Generate JWT
  │   │        │   {
  │   │        │     id, username, email,
  │   │        │     exp: 24h
  │   │        │   }
  │   │        │   Signed with JWT_SECRET
  │   │        │
  │   │        └─► Return token
  │   │
  │   └─────────────┘
  │
  ▼
Response
  │
  │ { user, token }
  ▼
Client
  │
  │ Store token
  │
  │ Future requests:
  │ Authorization: Bearer <token>
  ▼
Auth Middleware
  │
  ├─► Verify JWT signature
  │
  ├─► Check expiration
  │
  └─► Extract user info
      Attach to request
  │
  ▼
Protected Route
```

## Caching Strategy

### Cache Key Structure

```
notes:user:{userId}:all           # All user notes
notes:{noteId}                    # Individual note
notes:search:{userId}:{query}     # Search results
```

### Cache Invalidation Rules

| Operation | Invalidate |
|-----------|-----------|
| Create Note | `notes:user:{userId}:all` |
| Update Note | `notes:{noteId}`, `notes:user:{userId}:all` |
| Delete Note | `notes:{noteId}`, `notes:user:{userId}:all` |
| Search | No invalidation (TTL handles freshness) |

### Cache Consistency

```
Write Operation
  │
  ├─► Update Database
  │   (in transaction)
  │
  ├─► Transaction successful?
  │   Yes │         No
  │       │          │
  │       │          └─► No cache invalidation
  │       │              (data unchanged)
  │       │
  │       ├─► Invalidate cache
  │       │   (delete relevant keys)
  │       │
  │       └─► Cache invalidation failed?
  │           │
  │           └─► Log error
  │               TTL will fix eventually
  │
  ▼
Response
```

## Scalability Considerations

### Current (Single Server)
- **Capacity**: 100-500 req/s
- **Users**: 10K-100K
- **Notes**: 1M-10M

### Phase 1: Horizontal Scaling
- Multiple app instances
- Shared database
- Redis cluster
- **Capacity**: 1K-5K req/s

### Phase 2: Database Scaling
- Read replicas
- Write to primary
- Read from replicas
- **Capacity**: 5K-10K req/s

### Phase 3: Sharding
- User-based sharding
- Distributed cache
- **Capacity**: 10K+ req/s

## Monitoring Points

```
┌─────────────────────┐
│   Metrics Layer     │
├─────────────────────┤
│ - Request rate      │
│ - Response time     │
│ - Error rate        │
│ - Cache hit ratio   │
│ - DB query time     │
│ - Connection pool   │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Logging Layer      │
├─────────────────────┤
│ - Access logs       │
│ - Error logs        │
│ - Audit logs        │
│ - Performance logs  │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Alerting Layer     │
├─────────────────────┤
│ - High error rate   │
│ - Slow responses    │
│ - DB connection loss│
│ - Redis down        │
└─────────────────────┘
```

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js | JavaScript runtime |
| Framework | Express.js | Web framework |
| ORM | Sequelize | Database abstraction |
| Database | MySQL 8.0 | Persistent storage |
| Cache | Redis 6.0 | Performance optimization |
| Auth | JWT | Stateless authentication |
| Validation | Joi | Input validation |
| Password | bcrypt | Password hashing |
| Security | Helmet.js | Security headers |
| Rate Limit | express-rate-limit | API protection |

---

This architecture provides:
- ✅ **Scalability**: Horizontal scaling support
- ✅ **Performance**: Multi-layer caching
- ✅ **Reliability**: ACID transactions
- ✅ **Security**: JWT + bcrypt + validation
- ✅ **Maintainability**: Clean separation of concerns
- ✅ **Observability**: Logging and monitoring points

