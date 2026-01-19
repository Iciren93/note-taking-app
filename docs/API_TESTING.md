# API Testing Guide

This guide provides examples for testing the Note Taking API using cURL commands.

## Setup

1. Start the server: `npm run dev`
2. Server should be running at: `http://localhost:3000`

## Variables

Set these variables for easier testing:

```bash
# Base URL
export BASE_URL="http://localhost:3000/api"

# Will be set after login
export TOKEN=""
```

---

## Authentication Tests

### 1. Register a New User

```bash
curl -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
- Status: 201 Created
- Body: User object with JWT token

### 2. Login

```bash
curl -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Save the token:**
```bash
export TOKEN="paste_token_here"
```

### 3. Get User Profile

```bash
curl -X GET $BASE_URL/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

## Note Operations

### 1. Create a Note

```bash
curl -X POST $BASE_URL/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "My First Note",
    "content": "This is a test note with some content about JavaScript and Node.js"
  }'
```

**Save note ID from response for next tests**

### 2. Get All Notes

```bash
curl -X GET $BASE_URL/notes \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Get Specific Note

```bash
# Replace 1 with your note ID
curl -X GET $BASE_URL/notes/1 \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Update Note (with Version Control)

```bash
# Replace 1 with your note ID
# Make sure version number matches current version
curl -X PUT $BASE_URL/notes/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Updated Note Title",
    "content": "This is updated content",
    "version": 1
  }'
```

### 5. Search Notes

```bash
curl -X GET "$BASE_URL/notes/search?q=JavaScript" \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Get Note Version History

```bash
# Replace 1 with your note ID
curl -X GET $BASE_URL/notes/1/versions \
  -H "Authorization: Bearer $TOKEN"
```

### 7. Revert to Previous Version

```bash
# Replace 1 with note ID and 1 with version number to revert to
curl -X POST $BASE_URL/notes/1/revert/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "version": 2
  }'
```

### 8. Delete Note (Soft Delete)

```bash
# Replace 1 with your note ID
curl -X DELETE $BASE_URL/notes/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## Test Scenarios

### Scenario 1: Complete Note Lifecycle

```bash
# 1. Create note
RESPONSE=$(curl -s -X POST $BASE_URL/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Test Note","content":"Original content"}')

# Extract note ID (requires jq)
NOTE_ID=$(echo $RESPONSE | jq -r '.data.note.id')
echo "Created note with ID: $NOTE_ID"

# 2. Update note
curl -X PUT $BASE_URL/notes/$NOTE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Updated Test Note","content":"Updated content","version":1}'

# 3. Update again
curl -X PUT $BASE_URL/notes/$NOTE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Updated Again","content":"More updates","version":2}'

# 4. View version history
curl -X GET $BASE_URL/notes/$NOTE_ID/versions \
  -H "Authorization: Bearer $TOKEN"

# 5. Revert to version 1
curl -X POST $BASE_URL/notes/$NOTE_ID/revert/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"version":3}'

# 6. Delete note
curl -X DELETE $BASE_URL/notes/$NOTE_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Scenario 2: Test Concurrency Control

Open two terminal windows:

**Terminal 1:**
```bash
# Get current note
curl -X GET $BASE_URL/notes/1 \
  -H "Authorization: Bearer $TOKEN"

# Note the version number (e.g., version: 1)
# Wait before updating...
```

**Terminal 2:**
```bash
# Update the same note
curl -X PUT $BASE_URL/notes/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Updated from Terminal 2","version":1}'
```

**Terminal 1 (continued):**
```bash
# Try to update with old version number
curl -X PUT $BASE_URL/notes/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Updated from Terminal 1","version":1}'

# Should receive 409 Conflict error
```

### Scenario 3: Test Full-Text Search

```bash
# Create notes with different content
curl -X POST $BASE_URL/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"JavaScript Guide","content":"Learn JavaScript programming language"}'

curl -X POST $BASE_URL/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Python Tutorial","content":"Learn Python programming language"}'

curl -X POST $BASE_URL/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Database Design","content":"MySQL and PostgreSQL database concepts"}'

# Search for "JavaScript"
curl -X GET "$BASE_URL/notes/search?q=JavaScript" \
  -H "Authorization: Bearer $TOKEN"

# Search for "programming"
curl -X GET "$BASE_URL/notes/search?q=programming" \
  -H "Authorization: Bearer $TOKEN"

# Search for "database"
curl -X GET "$BASE_URL/notes/search?q=database" \
  -H "Authorization: Bearer $TOKEN"
```

### Scenario 4: Test Caching

```bash
# First request (from database)
time curl -X GET $BASE_URL/notes \
  -H "Authorization: Bearer $TOKEN"

# Second request (from cache - should be faster)
time curl -X GET $BASE_URL/notes \
  -H "Authorization: Bearer $TOKEN"

# Update a note (invalidates cache)
curl -X PUT $BASE_URL/notes/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Cache Test","version":1}'

# Next request will be from database again
time curl -X GET $BASE_URL/notes \
  -H "Authorization: Bearer $TOKEN"
```

---

## Error Testing

### 1. Invalid Token

```bash
curl -X GET $BASE_URL/notes \
  -H "Authorization: Bearer invalid_token_here"
```

**Expected:** 401 Unauthorized

### 2. Missing Required Fields

```bash
curl -X POST $BASE_URL/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Note without content"}'
```

**Expected:** 400 Bad Request with validation errors

### 3. Version Mismatch

```bash
curl -X PUT $BASE_URL/notes/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Update","content":"Content","version":999}'
```

**Expected:** 409 Conflict

### 4. Access Other User's Note

Create a second user and try to access first user's notes:

```bash
# Register second user
curl -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"user2","email":"user2@example.com","password":"password123"}'

# Login as second user and save token
# Try to access first user's note
curl -X GET $BASE_URL/notes/1 \
  -H "Authorization: Bearer $NEW_USER_TOKEN"
```

**Expected:** 404 Not Found

---

## Performance Testing

### Test Cache Performance

```bash
# Install Apache Bench (if not already installed)
# Ubuntu: apt-get install apache2-utils
# Mac: brew install ab

# Test without cache (first run)
ab -n 100 -c 10 -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/notes

# Test with cache (subsequent runs)
ab -n 1000 -c 50 -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/notes
```

---

## Cleanup

```bash
# Delete all test notes
# First get all note IDs, then delete each one
curl -X GET $BASE_URL/notes \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.data.notes[].id' \
  | xargs -I {} curl -X DELETE $BASE_URL/notes/{} \
    -H "Authorization: Bearer $TOKEN"
```

---

## Tips

1. **Use jq for JSON parsing**: Install jq to easily parse JSON responses
2. **Save responses**: Use `-o output.json` to save responses to files
3. **Verbose output**: Add `-v` flag to see request/response headers
4. **Pretty print**: Pipe output to `| jq` for formatted JSON
5. **Silent mode**: Use `-s` flag to hide progress meter

Example with jq:
```bash
curl -s -X GET $BASE_URL/notes \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data.notes[] | {id, title, version}'
```

