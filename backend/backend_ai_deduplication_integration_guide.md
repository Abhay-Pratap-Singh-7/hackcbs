# 🚀 Complete Backend & AI Model Integration Guide
## Object Creation Matrix: Who Sends What to Whom, How Objects Are Generated, and Payload Contracts

This document provides a detailed breakdown of **Who sends What to Whom, HOW each object is created**, and exact Input/Output JSON payloads for every object in the system (`aiAnalysis`, `embedding`, `deduplication`, `MongoDB Document`, and `Frontend Response`).

---

## 🧩 Master Object Creation Matrix

| Object Name | Created By | Sender ➔ Receiver | Method / Protocol | What Data is Sent | What Object is Created |
|---|---|---|---|---|---|
| **`aiAnalysis`** | Groq AI Model | Python ML Service ➔ Groq API (`api.groq.com`) | HTTPS `POST` (`json_object` schema) | `description` string + `SYSTEM_PROMPT` | Structured JSON (`summary`, `key_points`, `problem_classification`, `severity`, `suggested_solution`, `required_expertise`) |
| **`embedding`** | Multilingual E5 Model | Python `embedder.py` ➔ Transformer Model | Local Python PyTorch / `SentenceTransformer` | String combining: `classification` + `summary` + `key_points` + `location` + `keywords` | 1024-dimensional normalized float array: `[0.04218, -0.01954, ...]` |
| **`deduplication`** | FAISS + Haversine Engine | Express Backend ➔ Python `deduplicator.py` | Python function call / HTTP RPC | New 1024-d embedding + GPS coordinates + MongoDB candidate embeddings | Match object (`is_duplicate`, `matched_problem_id`, `similarity_score`, `distance_km`, `master_ticket_id`) |
| **`MongoDB Document`** | Mongoose ORM | Express Controller ➔ MongoDB | Mongo Wire Protocol (`ProblemStatement.create()`) | User inputs + `aiAnalysis` + `embedding` + `deduplication` outputs | Database document record with `isDuplicate`, `duplicateOf`, `masterTicketId`, `status` |
| **`Frontend Response`** | Express Controller | Express Backend ➔ Frontend Client | HTTP `201 Created` JSON | Populated MongoDB document + status message | Final HTTP response payload for Web / Mobile app |

---

## 🔍 Detailed Object-by-Object Creation Breakdown

```
[Citizen Input Form]
        │
        │ 1. Sends: description, location, selfTags, images
        ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ OBJECT 1 CREATION: `aiAnalysis`                                                        │
│ • Who sends what to whom: Python ML Service (`problem_analyzer.py`) sends             │
│   `description` text to Groq AI API (`https://api.groq.com/openai/v1/chat/completions`) │
│ • How: HTTPS POST call with model `openai/gpt-oss-120b` and strict JSON schema.      │
│ • Output Created: `aiAnalysis` object containing summary, classification, severity.    │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ OBJECT 2 CREATION: `embedding` (1024-d dense vector)                                   │
│ • Who sends what to whom: Python `embedder.py` sends concatenated text to              │
│   `SentenceTransformer('intfloat/multilingual-e5-large')`                              │
│ • Text Constructed:                                                                    │
│   "passage: Classification: water... Summary: ... Key Points: ... Location: ... Keywords: ..." │
│ • How: In-memory PyTorch / Transformer execution (`model.encode(text)`).               │
│ • Output Created: 1024-dimensional float array: `[0.04218, -0.01954, ..., 0.05112]`     │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ OBJECT 3 CREATION: `deduplication` (FAISS + Haversine Match)                           │
│ • Who sends what to whom: Express Controller queries MongoDB for candidates in district│
│   and sends { new_embedding, GPS coords, candidate_embeddings } to `deduplicator.py`   │
│ • How:                                                                                 │
│   1. Haversine formula calculates distance in km between GPS coordinates.              │
│   2. Candidate 1024-d vectors are indexed into FAISS (`IndexFlatIP`).                   │
│   3. Calculates Cosine Similarity & evaluates Rule: Sim >= 0.85 & Distance <= 10 km   │
│ • Output Created: `deduplication` object (`is_duplicate`, `similarity_score`, etc.)    │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ OBJECT 4 & 5 CREATION: `MongoDB Document` & `Frontend Response`                         │
│ • Express receives { aiAnalysis, embedding, deduplication } from Python.               │
│ • Calls `ProblemStatement.create(...)` in MongoDB.                                     │
│ • Sends HTTP 201 Created JSON response to Frontend Client.                            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ OBJECT 1: `aiAnalysis` Creation Details

### 👤 Who Sends What to Whom?
- **Sender**: Python ML Service (`ai/problem_analyzer.py`)
- **Receiver**: Groq Cloud API (`https://api.groq.com/openai/v1/chat/completions`)
- **Transport Method**: HTTPS `POST` Request

### 📥 What is Sent to Groq AI:
```json
{
  "model": "openai/gpt-oss-120b",
  "messages": [
    { "role": "system", "content": "You are an AI problem analysis system... Return JSON." },
    { "role": "user", "content": "Analyze the following citizen problem:\n\n--- START PROBLEM ---\nDuring peak summer months, over 5,000 residents in Kosi Kalan face acute drinking water shortage. High TDS and fluoride levels in ground water lead to health complications for children and elderly. Urgent community filtration and rainwater harvesting required.\n--- END PROBLEM ---" }
  ],
  "temperature": 0.2,
  "response_format": { "type": "json_object" }
}
```

### 📤 Object Created (`aiAnalysis` JSON):
```json
{
  "summary": "5,000 residents of Kosi Kalan face acute drinking-water shortage in summer, with high TDS and fluoride causing health issues, requiring immediate filtration and rainwater harvesting solutions.",
  "key_points": "Peak-season water scarcity affecting >5,000 people; groundwater contaminated with high TDS and fluoride; children and elderly suffer health complications; community-level treatment and water capture needed urgently.",
  "problem_classification": "water resources",
  "severity": "high",
  "suggested_solution": "Install community-scale water-treatment units (e.g., RO or activated-alumina filters); set up rainwater harvesting on schools and public buildings; promote groundwater recharge through check-dams.",
  "required_expertise": [
    "Water Resources Engineering",
    "Environmental Science",
    "Public Health",
    "Civil Engineering",
    "Water Chemistry"
  ]
}
```

---

## 2️⃣ OBJECT 2: `embedding` (1024-d Dense Feature Vector) Creation Details

### 👤 Who Sends What to Whom?
- **Sender**: Python ML Service (`ai/embedder.py`)
- **Receiver**: Local HuggingFace Transformer Model (`intfloat/multilingual-e5-large`)
- **Transport Method**: In-Memory Python CPU/GPU execution via `sentence_transformers` library

### 📥 What Data is Formatted and Sent to the Embedder:
The embedder extracts fields from `aiAnalysis`, `location`, and `selfTags` and formats them into a standardized document string:

```text
passage: Classification: water resources. Summary: 5,000 residents of Kosi Kalan face acute drinking-water shortage in summer... Key Points: Peak-season water scarcity affecting >5,000 people... Location: Kosi Kalan, Chhata, Mathura, Uttar Pradesh. Keywords: water, TDS, fluoride, Kosi Kalan
```

### 📤 Object Created (`embedding` Array):
A 1024-dimensional normalized float array:
```json
[
  0.04218, -0.01954, 0.08123, -0.03411, 0.01298, ..., 0.05112
]
```
*(Saved directly in MongoDB document `embedding` field so old problems are never re-embedded).*

---

## 3️⃣ OBJECT 3: `deduplication` Match Object Creation Details

### 👤 Who Sends What to Whom?
- **Sender**: Express Controller (`problemController.js`) queries MongoDB for existing candidate problems in the district (`ProblemStatement.find({ 'location.district': district })`).
- **Receiver**: Python FAISS Deduplicator (`ai/deduplicator.py`).
- **Transport Method**: Inter-process JSON pipe (or HTTP microservice `POST /api/ai/analyze-and-deduplicate`).

### 📥 What Data is Sent to `deduplicator.py`:
```json
{
  "new_embedding": [0.04218, -0.01954, 0.08123, 0.05112],
  "new_location": {
    "district": "Mathura",
    "state": "Uttar Pradesh",
    "village": "Kosi Kalan",
    "coordinates": { "latitude": 27.4924, "longitude": 77.6737 }
  },
  "candidate_problems": [
    {
      "_id": "66d48291a1829e0123456789",
      "title": "Kosi Kalan Water Shortage",
      "location": { "coordinates": { "latitude": 27.4930, "longitude": 77.6740 } },
      "embedding": [0.04112, -0.01820, 0.07980, 0.04990],
      "masterTicketId": "66d48291a1829e0123456789"
    }
  ],
  "maxDistanceKm": 10.0,
  "similarityThreshold": 0.85
}
```

### ⚙️ How FAISS Computes the Result:
1. **Haversine Distance**: Calculates GPS distance between $(27.4924, 77.6737)$ and $(27.4930, 77.6740) \rightarrow \mathbf{0.07\text{ km}}$.
2. **FAISS Vector Search**: Loads candidate vectors into `faiss.IndexFlatIP` and computes Cosine Similarity $\rightarrow \mathbf{0.9626}$.
3. **Decision Rule**: $0.9626 \ge 0.85 \land 0.07\text{ km} \le 10\text{ km} \rightarrow \text{DUPLICATE MATCH!}$

### 📤 Object Created (`deduplication` Result JSON):
```json
{
  "is_duplicate": true,
  "matched_problem_id": "66d48291a1829e0123456789",
  "similarity_score": 0.9626,
  "distance_km": 0.07,
  "master_ticket_id": "66d48291a1829e0123456789",
  "matched_problem": {
    "matched_problem_id": "66d48291a1829e0123456789",
    "similarity_score": 0.9626,
    "distance_km": 0.07,
    "masterTicketId": "66d48291a1829e0123456789",
    "matched_title": "Kosi Kalan Water Shortage"
  }
}
```

---

## 4️⃣ OBJECT 4: MongoDB Stored Document Creation

### 👤 Who Sends What to Whom?
- **Sender**: Express Backend (`problemController.js`)
- **Receiver**: MongoDB Database Engine
- **Transport Method**: Mongoose ORM Wire Protocol (`ProblemStatement.create(...)`)

### 📥 Data Payload Written to MongoDB:

```json
{
  "_id": "66d48291a1829e0123456799",
  "title": "During peak summer months, over 5,000 residents in Kosi Kalan face...",
  "description": "During peak summer months, over 5,000 residents in Kosi Kalan face acute drinking water shortage...",
  "location": {
    "address": "Ward 12, Main Bazaar Road",
    "district": "Mathura",
    "state": "Uttar Pradesh",
    "village": "Kosi Kalan",
    "coordinates": { "latitude": 27.4924, "longitude": 77.6737 }
  },
  "imagesAndMedia": [{ "url": "https://your-cdn.com/uploads/water.jpg", "mediaType": "image" }],
  "desiredOutcome": "Setup of community solar RO filtration unit...",
  "supportingInfo": { "urgency": "HIGH", "affectedPopulation": "5000+" },
  "selfTags": { "keywords": ["water", "TDS", "fluoride"] },
  "aiAnalysis": {
    "summary": "5,000 residents of Kosi Kalan face acute drinking-water shortage...",
    "key_points": "Peak-season water scarcity affecting >5,000 people...",
    "problem_classification": "water resources",
    "severity": "high",
    "suggested_solution": "Install community-scale water-treatment units...",
    "required_expertise": ["Water Resources Engineering", "Public Health", "Civil Engineering"]
  },
  "embedding": [0.04218, -0.01954, 0.08123, 0.05112],
  "status": "DUPLICATE",
  "isDuplicate": true,
  "duplicateOf": {
    "problemId": "66d48291a1829e0123456789",
    "similarityScore": 0.9626,
    "distanceKm": 0.07
  },
  "masterTicketId": "66d48291a1829e0123456789",
  "submittedBy": "6a95e113c7629c0608188d97",
  "createdAt": "2026-09-02T20:50:00.000Z",
  "updatedAt": "2026-09-02T20:50:00.000Z"
}
```

---

## 5️⃣ OBJECT 5: Frontend HTTP Response Object Creation

### 👤 Who Sends What to Whom?
- **Sender**: Express Backend (`problemController.js`)
- **Receiver**: Frontend Client (Web Browser / Flutter Mobile App)
- **Transport Method**: HTTP `201 Created` Response Body

### 📤 Final JSON Sent to Frontend Client:

#### Case A: DUPLICATE Problem Response:
```json
{
  "success": true,
  "message": "Problem statement submitted! Similar duplicate problem detected in nearby area (0.07 km away, similarity: 96.3%). Linked to master ticket.",
  "isDuplicate": true,
  "data": {
    "_id": "66d48291a1829e0123456799",
    "title": "During peak summer months, over 5,000 residents in Kosi Kalan face...",
    "description": "During peak summer months...",
    "location": {
      "address": "Ward 12, Main Bazaar Road",
      "district": "Mathura",
      "state": "Uttar Pradesh",
      "village": "Kosi Kalan",
      "coordinates": { "latitude": 27.4924, "longitude": 77.6737 }
    },
    "aiAnalysis": {
      "summary": "5,000 residents of Kosi Kalan face acute drinking-water shortage...",
      "problem_classification": "water resources",
      "severity": "high"
    },
    "status": "DUPLICATE",
    "isDuplicate": true,
    "duplicateOf": {
      "problemId": "66d48291a1829e0123456789",
      "similarityScore": 0.9626,
      "distanceKm": 0.07
    },
    "masterTicketId": "66d48291a1829e0123456789",
    "submittedBy": {
      "_id": "6a95e113c7629c0608188d97",
      "name": "Dev Varshney",
      "email": "devdeveloper8838@gmail.com",
      "role": "INDIVIDUAL_CITIZEN"
    },
    "createdAt": "2026-09-02T20:50:00.000Z"
  }
}
```

#### Case B: UNIQUE Problem Response:
```json
{
  "success": true,
  "message": "Problem statement submitted and classified by Groq AI successfully!",
  "isDuplicate": false,
  "data": {
    "_id": "66d48291a1829e0123456789",
    "title": "During peak summer months, over 5,000 residents in Kosi Kalan face...",
    "description": "During peak summer months...",
    "location": {
      "district": "Mathura",
      "state": "Uttar Pradesh",
      "coordinates": { "latitude": 27.4924, "longitude": 77.6737 }
    },
    "aiAnalysis": {
      "summary": "5,000 residents of Kosi Kalan face acute drinking-water shortage...",
      "problem_classification": "water resources",
      "severity": "high"
    },
    "status": "CLASSIFIED",
    "isDuplicate": false,
    "masterTicketId": "66d48291a1829e0123456789",
    "submittedBy": {
      "_id": "6a95e113c7629c0608188d97",
      "name": "Dev Varshney",
      "email": "devdeveloper8838@gmail.com",
      "role": "INDIVIDUAL_CITIZEN"
    },
    "createdAt": "2026-09-02T20:50:00.000Z"
  }
}
```

---

## 📋 Quick Summary Table of Data Flow Dependencies

| Target Object | Input Dependencies Required | Internal Process | Output Result |
|---|---|---|---|
| **`aiAnalysis`** | `description` text | Groq API call (`openai/gpt-oss-120b`) | JSON summary, classification, severity, solution, expertise. |
| **`embedding`** | `aiAnalysis` + `location` + `keywords` | `multilingual-e5-large` sentence transformer | 1024-dimensional float array. |
| **`deduplication`** | New vector + GPS coords + MongoDB candidate embeddings | Haversine distance + FAISS `IndexFlatIP` inner product search | Match result (`is_duplicate`, `matched_problem_id`, `similarity_score`, `distance_km`). |
| **`MongoDB Doc`** | All user inputs + ML outputs | Mongoose ORM write (`ProblemStatement.create`) | Database record saved with pre-computed vector. |
| **`Frontend Response`** | Saved MongoDB document | Express controller HTTP response | HTTP 201 response JSON sent back to frontend user. |
