# 📘 HackCBS Backend — Complete API Documentation
**Base URL:** `https://hackcbs-cjno.onrender.com`  
**Auth:** All protected routes require `Authorization: Bearer <access_token>`

---

## 🔑 1. AUTH APIs

### 1.1 Signup — `POST /api/auth/signup`
**Access:** Public

**Request Body:**
```json
{
  "name": "Dev Varshney",
  "email": "dev@university.edu.in",
  "password": "Test@12345",
  "confirmPassword": "Test@12345",
  "phone": "9876543210",
  "role": "INSTITUTE_ADMIN",
  "profileDetails": {
    "institutionName": "DORANDA COLLEGE RANCHI",
    "aisheCode": "C-12345",
    "institutionType": "State",
    "authorizedContactPersonName": "Dr. Ramesh Kumar",
    "designation": "Principal",
    "officialInstituteEmail": "principal@doranda.edu.in",
    "website": "https://doranda.edu.in",
    "campusCity": "Ranchi",
    "district": "Ranchi",
    "state": "Delhi",
    "pincode": "834002"
  }
}
```
> **Roles:** `INDIVIDUAL_CITIZEN`, `NGO_COMMUNITY`, `LOCAL_BODY`, `GOVT_OFFICER`, `INSTITUTE_ADMIN`, `FACULTY_MENTOR`, `STUDENT_INNOVATOR`, `INDUSTRY_PARTNER`

**Response (201):**
```json
{
  "success": true,
  "message": "Signup initiated successfully! Please check your email for the OTP.",
  "data": { "userId": "...", "email": "dev@university.edu.in", "isEmailVerified": false }
}
```

---

### 1.2 Verify Signup OTP — `POST /api/auth/verify-signup-otp`
**Request Body:**
```json
{ "email": "dev@university.edu.in", "otp": "847291" }
```
**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully! Your account is now active.",
  "data": { "accessToken": "eyJ...", "user": { "_id": "...", "name": "Dev", "role": "INSTITUTE_ADMIN" } }
}
```

---

### 1.3 Login — `POST /api/auth/login`
**Request Body:**
```json
{ "email": "dev@university.edu.in", "password": "Test@12345" }
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "65f0a1b2c3d4e5f6a7b8c9d0",
      "name": "Dev Varshney",
      "email": "dev@university.edu.in",
      "role": "INSTITUTE_ADMIN",
      "profileDetails": { "institutionName": "DORANDA COLLEGE RANCHI", ... }
    }
  }
}
```

---

### 1.4 Verify Login OTP — `POST /api/auth/verify-login-otp`
```json
{ "email": "dev@university.edu.in", "otp": "391827" }
```

### 1.5 Refresh Token — `POST /api/auth/refresh-token`
```json
{ "refreshToken": "eyJ..." }
```

### 1.6 Logout — `POST /api/auth/logout`
```json
{ "refreshToken": "eyJ..." }
```

### 1.7 Forgot Password — `POST /api/auth/forgot-password`
```json
{ "email": "dev@university.edu.in" }
```

### 1.8 Reset Password — `POST /api/auth/reset-password`
```json
{
  "email": "dev@university.edu.in",
  "otp": "839201",
  "newPassword": "NewPassword@123",
  "confirmPassword": "NewPassword@123"
}
```

---

## 📝 2. PROBLEM STATEMENT APIs

### 2.1 Submit Problem — `POST /api/problems`
**Access:** 🔐 JWT Required  
**Backend Flow:**
1. Validates request → resolves GPS coordinates
2. Fetches existing problems in same district (MongoDB)
3. Sends to Hugging Face `abhay958/TeamSetu` via `@gradio/client`
4. HF runs: **Groq Classify** → **FAISS Dedup** → **College Matcher**
5. Saves result + returns response

**Request Body:**
```json
{
  "title": "Severe water contamination in Doranda",
  "description": "Severe water logging and contaminated drinking water supply reported near Doranda Colony, Ranchi. Over 500 households affected. Pipeline leakages and blocked drains causing waterborne diseases.",
  "location": {
    "address": "Doranda Colony Main Road",
    "village": "Doranda",
    "ward": "Ward 12",
    "block": "Kanke",
    "district": "Ranchi",
    "state": "Delhi",
    "pincode": "834002",
    "coordinates": { "latitude": 23.3441, "longitude": 85.3096 }
  },
  "imagesAndMedia": [
    { "url": "https://storage.r2.dev/image1.jpg", "mediaType": "image", "name": "flooding_pic" }
  ],
  "desiredOutcome": "Clean water supply restoration and drainage clearing.",
  "supportingInfo": { "affectedPeopleCount": 500 },
  "selfTags": { "keywords": ["water", "sewage", "health"] }
}
```

**Response (201) — Unique Problem:**
```json
{
  "success": true,
  "isDuplicate": false,
  "message": "Problem statement submitted and classified by Groq AI successfully!",
  "data": {
    "_id": "65f2c3d4e5f6a7b8c9d0e1f2",
    "title": "Severe water contamination in Doranda",
    "description": "...",
    "location": { "district": "Ranchi", "state": "Delhi", "coordinates": { "latitude": 23.3441, "longitude": 85.3096 } },
    "aiAnalysis": {
      "summary": "Water logging and contamination affecting 500+ households in Doranda, Ranchi.",
      "key_points": "Waterborne disease risk; pipeline leakage; blocked drainage",
      "problem_classification": "water resources",
      "severity": "high",
      "suggested_solution": "Pipeline audit, smart flow valves, water testing kits",
      "required_expertise": ["Wastewater Treatment", "Environmental Hydrology", "Civil Engineering"],
      "analyzedAt": "2026-09-03T19:00:00.000Z"
    },
    "status": "CLASSIFIED",
    "isDuplicate": false,
    "masterTicketId": "65f2c3d4e5f6a7b8c9d0e1f2",
    "collegeSuggestions": [
      {
        "college_name": "DORANDA COLLEGE RANCHI",
        "district": "Ranchi",
        "distance_km": 1.13,
        "domain": "water resources",
        "faculty_expertise": "Wastewater Treatment, Environmental Hydrology, River Basin Modeling",
        "infrastructure": "Environmental Engineering Lab, Water Sampling & Analysis Unit",
        "match_score": 92.97,
        "match_breakdown": { "domain_score": 1.0, "geo_score": 0.98, "semantic_score": 0.79 }
      }
    ],
    "submittedBy": { "_id": "...", "name": "Dev", "email": "citizen@gmail.com", "role": "INDIVIDUAL_CITIZEN" },
    "createdAt": "2026-09-03T19:00:01.120Z"
  }
}
```

**Response (201) — Duplicate Problem:**
```json
{
  "success": true,
  "isDuplicate": true,
  "message": "Problem submitted! A similar problem already exists in your area (1.13 km away, 93.5% similarity). Your submission has been linked to the existing master ticket.",
  "data": {
    "_id": "...",
    "status": "DUPLICATE",
    "isDuplicate": true,
    "duplicateOf": { "problemId": "65f2c3d4e5f6a7b8c9d0e1f2", "similarityScore": 0.935, "distanceKm": 1.13 },
    "masterTicketId": "65f2c3d4e5f6a7b8c9d0e1f2",
    "deduplicationDetails": { "similarity_score": 0.935, "distance_km": 1.13, "matched_title": "Severe water contamination in Doranda" },
    "collegeSuggestions": [ { "college_name": "DORANDA COLLEGE RANCHI", "match_score": 92.97 } ]
  }
}
```

---

### 2.2 Get All Problems — `GET /api/problems`
**Access:** 🔐 JWT Required

**Query Params:**
| Param | Type | Example |
|---|---|---|
| `my` | boolean | `?my=true` — only my submissions |
| `category` | string | `?category=water resources` |
| `district` | string | `?district=Ranchi` |
| `state` | string | `?state=Delhi` |
| `status` | string | `?status=CLASSIFIED` |
| `duplicate` | boolean | `?duplicate=false` |
| `page` | number | `?page=1` |
| `limit` | number | `?limit=10` |

**Response (200):**
```json
{
  "success": true,
  "count": 10,
  "pagination": { "total": 47, "page": 1, "limit": 10, "pages": 5 },
  "data": [ { "_id": "...", "title": "...", "aiAnalysis": {...}, "status": "CLASSIFIED" } ]
}
```

---

### 2.3 Get Problem by ID — `GET /api/problems/:id`
```json
{ "success": true, "data": { "_id": "...", "title": "...", "collegeSuggestions": [...] } }
```

### 2.4 Update Problem — `PUT /api/problems/:id`
**Access:** 🔐 Owner only  
Body: Same fields as submit (partial update supported)

### 2.5 Delete Problem — `DELETE /api/problems/:id`
**Access:** 🔐 Owner only

### 2.6 Upvote Problem — `POST /api/problems/:id/upvote`
```json
{ "success": true, "data": { "upvotesCount": 12, "hasUpvoted": true } }
```

### 2.7 Add Comment — `POST /api/problems/:id/comments`
```json
{ "text": "This is a serious issue!", "images": ["https://..."] }
```

### 2.8 Get Comments — `GET /api/problems/:id/comments`

---

### 2.9 Match Companies for Problem (Raw AI Test) — `POST /api/problems/match-companies`
**Access:** 🔐 JWT Required

**How it works:**
- Takes a raw problem AI analysis object and location to return matched companies using the Hugging Face Company Matcher model.
- Useful for testing the 4th ML model directly without querying an existing problem ID.

**Request Body:**
```json
{
  "problemData": {
    "summary": "Severe industrial effluent contamination and water drainage overflow",
    "problem_classification": "water resources",
    "required_expertise": [
      "Wastewater Treatment",
      "Chemical Processing",
      "Effluent Filtration"
    ]
  },
  "location": {
    "latitude": 22.7845,
    "longitude": 86.1552,
    "district": "Purbi Singhbhum"
  },
  "topK": 3
}
```

**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "JB-IND-115",
      "company_name": "Adityapur Common Effluent Pre-Treatment",
      "domain": "water resources",
      "expertise": "Coagulation, flocculation & primary clarifier dosing skids",
      "latitude": 22.78451,
      "longitude": 86.15521,
      "distance_km": 0.0,
      "is_verified": true,
      "source": "dataset_csv",
      "match_score": 94.35,
      "match_breakdown": {
        "domain_score": 1.0,
        "geo_score": 1.0,
        "semantic_score": 0.81
      }
    }
  ]
}
```

---

## 🏛️ 3. UNIVERSITY DASHBOARD APIs ⭐ NEW

> These APIs are for `INSTITUTE_ADMIN` role only. After login, university dashboard loads using these two endpoints.

### 3.1 University Dashboard Summary — `GET /api/university/dashboard`
**Access:** 🔐 JWT + `INSTITUTE_ADMIN` role  

**How it works:**
- Reads `institutionName` from the logged-in user's `profileDetails`
- Matches against `colleges.csv` dataset (from AI folder)
- Returns aggregated stats of all problems allocated to this university via third model

**Response (200):**
```json
{
  "success": true,
  "university": {
    "name": "DORANDA COLLEGE RANCHI",
    "email": "principal@doranda.edu.in",
    "profileDetails": { "institutionName": "DORANDA COLLEGE RANCHI", "district": "Ranchi", ... },
    "matchedCollegeRecord": {
      "college_name": "DORANDA COLLEGE RANCHI",
      "district": "Ranchi",
      "domain": "water resources",
      "faculty_expertise": "Wastewater Treatment, Environmental Hydrology, River Basin Modeling",
      "infrastructure": "Environmental Engineering Lab, Water Sampling & Analysis Unit"
    }
  },
  "stats": {
    "totalAllocatedProblems": 7,
    "byCategory": [
      { "_id": "water resources", "count": 5 },
      { "_id": "environment", "count": 2 }
    ],
    "bySeverity": [
      { "_id": "high", "count": 4 },
      { "_id": "medium", "count": 3 }
    ]
  }
}
```

---

### 3.2 University Allocated Problems List — `GET /api/university/allocated-problems`
**Access:** 🔐 JWT + `INSTITUTE_ADMIN` role

**How it works:**
1. Logged-in university's `institutionName` is extracted from profile
2. Searches all `ProblemStatement` documents where:
   - `isDuplicate: false` ✅ (only non-duplicate problems)
   - `collegeSuggestions.college_name` matches this university
3. Returns paginated list with this university's specific match score

**Query Params:** `?page=1&limit=10`

**Response (200):**
```json
{
  "success": true,
  "university": {
    "institutionName": "DORANDA COLLEGE RANCHI",
    "matchedCollegeRecord": { "college_name": "DORANDA COLLEGE RANCHI", "district": "Ranchi", "domain": "water resources" }
  },
  "pagination": { "total": 7, "page": 1, "limit": 10, "pages": 1 },
  "count": 7,
  "data": [
    {
      "_id": "65f2c3d4e5f6a7b8c9d0e1f2",
      "title": "Severe water contamination in Doranda",
      "description": "...",
      "location": { "district": "Ranchi", "state": "Delhi", "coordinates": { "latitude": 23.3441, "longitude": 85.3096 } },
      "imagesAndMedia": [
        {
          "url": "https://res.cloudinary.com/dxaww50be/image/upload/v12345/sih_problems/image1.jpg",
          "mediaType": "image",
          "name": "flooding_pic.jpg"
        }
      ],
      "aiAnalysis": {
        "summary": "Water logging and contamination in Doranda Colony.",
        "problem_classification": "water resources",
        "severity": "high",
        "required_expertise": ["Wastewater Treatment", "Environmental Hydrology"],
        "suggested_solution": "Pipeline audit and water testing kits."
      },
      "status": "CLASSIFIED",
      "isDuplicate": false,
      "upvotesCount": 12,
      "commentsCount": 3,
      "submittedBy": { "name": "Rahul Sharma", "email": "rahul@gmail.com", "role": "INDIVIDUAL_CITIZEN" },
      "createdAt": "2026-09-03T19:00:01.120Z",
      "allocationDetails": {
        "college_name": "DORANDA COLLEGE RANCHI",
        "match_score": 92.97,
        "distance_km": 1.13,
        "domain": "water resources",
        "faculty_expertise": "Wastewater Treatment, Environmental Hydrology, River Basin Modeling",
        "infrastructure": "Environmental Engineering Lab, Water Sampling & Analysis Unit",
        "match_breakdown": { "domain_score": 1.0, "geo_score": 0.98, "semantic_score": 0.79 }
      }
    }
  ]
}
```

---

### 3.3 Accept or Reject Allocated Problem — `PUT /api/university/problems/:id/status`
**Access:** 🔐 JWT + `INSTITUTE_ADMIN` role

**How it works:**
- Lets a university Accept or Reject a problem that was allocated to them.
- If accepted, changes the problem status to `ACCEPTED` and stores the university's ID and Name on the problem.
- If rejected, adds the university's ID to a `rejectedBy` array (problem remains `CLASSIFIED`).

**Request Body:**
```json
{
  "action": "accept" // or "reject"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Problem successfully accepted.",
  "data": {
    "_id": "65f2c3d4e5f6a7b8c9d0e1f2",
    "status": "ACCEPTED",
    "acceptedByUniversityName": "DORANDA COLLEGE RANCHI"
  }
}
```

---

### 3.4 Get Accepted Problems List — `GET /api/university/accepted-problems`
**Access:** 🔐 JWT + `INSTITUTE_ADMIN` role

**How it works:**
- Returns a paginated list of all problems that this university has **accepted**.

**Query Params:** `?page=1&limit=10`

**Response (200):**
```json
{
  "success": true,
  "pagination": { "total": 1, "page": 1, "limit": 10, "pages": 1 },
  "count": 1,
  "data": [
    {
      "_id": "65f2c3d4e5f6a7b8c9d0e1f2",
      "title": "Severe water contamination in Doranda",
      "status": "ACCEPTED",
      "imagesAndMedia": [
        {
          "url": "https://res.cloudinary.com/dxaww50be/image/upload/v12345/sih_problems/image1.jpg",
          "mediaType": "image"
        }
      ],
      "acceptedBy": "65f0a1b2c3...",
      "acceptedByUniversityName": "DORANDA COLLEGE RANCHI",
      "submittedBy": { "name": "Rahul Sharma", "email": "rahul@gmail.com", "role": "INDIVIDUAL_CITIZEN" },
      "createdAt": "2026-09-03T19:00:01.120Z"
    }
  ]
}
```

---

### 3.5 Register a University Team — `POST /api/university/teams`
**Access:** 🔐 JWT + `INSTITUTE_ADMIN` role

**How it works:**
- Registers a team of students to work on a problem that the university has **ACCEPTED**.
- Enforces team size limits: Total members (Leader + Members) must be between **4 and 6**.
- Enforces gender diversity: At least **1 female** member is mandatory.

**Request Body:**
```json
{
  "problemStatementId": "65f2c3d4e5f6a7b8c9d0e1f2",
  "teamName": "EcoWarriors 2026",
  "leaderName": "Rahul Sharma",
  "leaderGender": "Male",
  "mentorName": "Dr. Anita Desai",
  "members": [
    { "name": "Vikram Singh", "gender": "Male" },
    { "name": "Priya Verma", "gender": "Female" },
    { "name": "Karan Johar", "gender": "Male" }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Team registered successfully.",
  "data": {
    "_id": "65f2d4e5f6a7b8c9d0e1f3a1",
    "teamName": "EcoWarriors 2026",
    ...
  }
}
```

---

### 3.6 Get Registered Teams — `GET /api/university/teams`
**Access:** 🔐 JWT + `INSTITUTE_ADMIN` role

**How it works:**
- Lists all teams registered by this university, including the populated `problemStatement` details.

**Query Params:** `?page=1&limit=10`

**Response (200):**
```json
{
  "success": true,
  "pagination": { "total": 1, "page": 1, "limit": 10, "pages": 1 },
  "count": 1,
  "data": [
    {
      "_id": "65f2d4e5f6...",
      "teamName": "EcoWarriors 2026",
      "problemStatement": {
        "_id": "65f2c3d4e...",
        "title": "Severe water contamination in Doranda",
        "location": { "district": "Ranchi" },
        "aiAnalysis": { "problem_classification": "water resources" }
      },
      "members": [ ... ],
      "solution": null
    }
  ]
}
```

---

### 3.7 Submit Solution for a Team — `POST /api/university/teams/:id/solution`
**Access:** 🔐 JWT + `INSTITUTE_ADMIN` role

**How it works:**
- Submits the final solution for a specific team.
- Changes the problem statement status from `ACCEPTED` to `IN_PROGRESS`.

**Request Body:**
```json
{
  "docxLink": "https://storage.r2.dev/solution_doc_123.docx",
  "demoVideoLink": "https://youtube.com/watch?v=abcd123",
  "prototypeLink": "https://github.com/ecowarriors/sih-26-solution",
  "description": "We have designed a smart drainage flow monitoring system using IoT sensors."
}
```
> Note: `docxLink` and `description` are required. `demoVideoLink` and `prototypeLink` are optional.

**Response (200):**
```json
{
  "success": true,
  "message": "Solution submitted successfully.",
  "data": {
    "_id": "65f2d4e5f6...",
    "solution": {
      "docxLink": "https://storage.r2.dev/solution_doc_123.docx",
      ...
    }
  }
}
```

---

## 📤 4. FILE UPLOAD API

### 4.1 Upload Image/Media — `POST /api/upload/media`
**Access:** 🔐 JWT Required  
**Content-Type:** `multipart/form-data`

**How it works:**
- You upload file(s) here first.
- The backend uploads them directly to **Cloudinary** and returns the public URLs.
- You then pass these URLs in the `imagesAndMedia` array when calling `POST /api/problems`.

**Form Field:** `files` (image/video/document, up to 5 files at once)

**Response (200):**
```json
{
  "success": true,
  "message": "Files uploaded successfully to Cloudinary",
  "data": [
    {
      "url": "https://res.cloudinary.com/dxaww50be/image/upload/v12345/sih_problems/image1.jpg",
      "mediaType": "image",
      "name": "flooding_pic.jpg"
    }
  ]
}
```

---

## 🏥 5. HEALTH CHECK

### `GET /api/health`
```json
{
  "status": "UP",
  "message": "HackCBS Backend API is operational",
  "timestamp": "2026-09-03T19:00:00.000Z"
}
```

---

## 🧠 How Backend + ML + Frontend Work Together

```
[Frontend / Mobile App]
        │
        │  POST /api/problems (JWT Token)
        ▼
[Express Backend (Render)]
        │
        ├─ Validate Input
        ├─ MongoDB: Fetch existing district problems
        │
        │  @gradio/client → abhay958/TeamSetu (Hugging Face)
        ▼
[HuggingFace AI Pipeline]
        │
        ├─ Model 1: Groq AI (openai/gpt-oss-120b)
        │   └─ Classifies problem → category, severity, solution
        │
        ├─ Model 2: E5-Large + FAISS Deduplication
        │   └─ Checks similarity against district candidates
        │   └─ Returns isDuplicate + similarity score
        │
        └─ Model 3: College Matcher (colleges.csv)
            └─ Scores 259 colleges: 35% domain + 35% geo + 30% semantic
            └─ Returns top-5 matched colleges (matchedColleges)
        │
        ▼
[Express Backend]
        │
        ├─ Saves full document to MongoDB
        │   (aiAnalysis + embedding + isDuplicate + collegeSuggestions)
        │
        └─ Returns HTTP 201 to Frontend
        │
        ▼
[Frontend — Citizen App]
        └─ Shows: category, severity, matched colleges, duplicate status

[Frontend — University Dashboard]
        │
        │  GET /api/university/dashboard (INSTITUTE_ADMIN JWT)
        │  GET /api/university/allocated-problems
        ▼
[Express Backend]
        └─ Filters problems where collegeSuggestions.college_name = this university
        └─ Returns: allocated problem list with match_score, distance_km, breakdown
```

---

## 🔐 Role-to-Dashboard Mapping

| Role | Dashboard URL | Key APIs |
|---|---|---|
| `INDIVIDUAL_CITIZEN` | `/dashboard` | `POST /api/problems`, `GET /api/problems?my=true` |
| `INSTITUTE_ADMIN` | `/university/dashboard` | `GET /api/university/dashboard`, `GET /api/university/allocated-problems` |
| `FACULTY_MENTOR` | `/dashboard` | `GET /api/dashboard/me` |
| `GOVT_OFFICER` | `/dashboard` | `GET /api/problems?district=...` |
| `NGO_COMMUNITY` | `/dashboard` | `GET /api/problems?category=...` |
| `STUDENT_INNOVATOR` | `/dashboard` | `GET /api/dashboard/me` |

---

## ⚠️ Error Responses

| Code | Message |
|---|---|
| 400 | Validation error — missing/invalid fields |
| 401 | Invalid access token / Token expired |
| 403 | Role not authorized to access this resource |
| 404 | Resource not found |
| 429 | Rate limit exceeded — too many requests |
| 500 | Internal server error |

---

## 🏭 4. INDUSTRY DASHBOARD APIs ⭐ NEW

> These APIs are for the `INDUSTRY_PARTNER` role only.

### 4.1 Get Allocated Solutions (Pending) — `GET /api/industry/allocated-solutions`
**Access:** 🔐 JWT + `INDUSTRY_PARTNER` role
**Description:** Fetches all team solutions allocated to the logged-in industry that are pending review.

### 4.2 Accept/Reject Solution — `PUT /api/industry/solutions/:teamId/status`
**Access:** 🔐 JWT + `INDUSTRY_PARTNER` role
**Body:** `{ "status": "ACCEPTED" }` (or `"REJECTED"`)
**Description:** Updates the decision of the industry for a specific team's solution.

### 4.3 Get Accepted Solutions — `GET /api/industry/accepted-solutions`
**Access:** 🔐 JWT + `INDUSTRY_PARTNER` role
**Description:** Fetches all team solutions that the industry has accepted.

---

## ⚖️ 5. GOVERNMENT DASHBOARD APIs ⭐ NEW

> These APIs are for the `GOVT_OFFICER` role only.

### 5.1 Government Master Dashboard — `GET /api/govt/dashboard`
**Access:** 🔐 JWT + `GOVT_OFFICER` role
**Description:** Fetches a massive aggregated JSON containing ALL classified non-duplicate problems. For each problem, it includes full tracking data:
- Which universities it was allocated to.
- Which university accepted it.
- Which teams registered under that university (and leader info).
- Which teams submitted a solution (and doc links).
- Which industry was allocated by the 4th ML model.
- Whether the industry accepted or rejected the solution.

