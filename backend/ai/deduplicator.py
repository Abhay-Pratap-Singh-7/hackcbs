import math
import numpy as np
import faiss

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the Great Circle distance between two points on the Earth in kilometers
    using the Haversine formula.
    """
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return float('inf')
        
    R = 6371.0  # Earth's radius in kilometers

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
         
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def is_same_location_text(loc1: dict, loc2: dict) -> bool:
    """
    Fallback location match check when GPS coordinates are unavailable or imprecise.
    Checks matching village, block, or ward within the same district & state.
    """
    if not loc1 or not loc2:
        return False
        
    district_match = loc1.get("district", "").strip().lower() == loc2.get("district", "").strip().lower()
    state_match = loc1.get("state", "").strip().lower() == loc2.get("state", "").strip().lower()
    
    if not (district_match and state_match):
        return False
        
    v1 = loc1.get("village", "").strip().lower()
    v2 = loc2.get("village", "").strip().lower()
    if v1 and v2 and v1 == v2:
        return True
        
    w1 = loc1.get("ward", "").strip().lower()
    w2 = loc2.get("ward", "").strip().lower()
    if w1 and w2 and w1 == w2:
        return True
        
    return False

def find_duplicate_with_faiss(
    new_embedding: list[float],
    new_location: dict,
    candidate_problems: list[dict],
    max_distance_km: float = 10.0,
    similarity_threshold: float = 0.88
) -> dict:
    """
    FAISS-powered vector similarity search and location rule verification.
    
    Order of execution:
    1. Geographically filter candidates (distance < max_distance_km OR matching village/location).
    2. Extract precomputed 1024-d embeddings of nearby candidates.
    3. Index candidate vectors into FAISS (IndexFlatIP).
    4. Compute Cosine Similarity between new embedding and candidate vectors.
    5. Evaluate combined rules (sim >= similarity_threshold & distance <= max_distance_km).
    """
    if not candidate_problems or not new_embedding:
        return {
            "is_duplicate": False,
            "matched_problem_id": None,
            "similarity_score": 0.0,
            "distance_km": None,
            "matched_problem": None
        }

    new_lat = None
    new_lon = None
    if new_location and "coordinates" in new_location and new_location["coordinates"]:
        new_lat = new_location["coordinates"].get("latitude")
        new_lon = new_location["coordinates"].get("longitude")
    elif new_location:
        new_lat = new_location.get("latitude")
        new_lon = new_location.get("longitude")

    nearby_candidates = []
    valid_vectors = []

    for item in candidate_problems:
        c_id = str(item.get("_id") or item.get("id"))
        c_loc = item.get("location", {})
        c_lat = None
        c_lon = None
        
        if isinstance(c_loc, dict):
            c_coords = c_loc.get("coordinates", {})
            if isinstance(c_coords, dict):
                c_lat = c_coords.get("latitude")
                c_lon = c_coords.get("longitude")
            if c_lat is None:
                c_lat = c_loc.get("latitude")
                c_lon = c_loc.get("longitude")

        # 1. Geographically nearby filter (distance < max_distance_km or same village/location)
        dist_km = float('inf')
        if new_lat is not None and new_lon is not None and c_lat is not None and c_lon is not None:
            dist_km = haversine_distance_km(new_lat, new_lon, c_lat, c_lon)
            
        same_loc = is_same_location_text(new_location, c_loc)

        if dist_km <= max_distance_km or same_loc or (new_lat is None and c_loc.get("district") == new_location.get("district")):
            embedding = item.get("embedding")
            if embedding and len(embedding) > 0:
                nearby_candidates.append({
                    "id": c_id,
                    "title": item.get("title") or item.get("description", "")[:60],
                    "summary": item.get("aiAnalysis", {}).get("summary", ""),
                    "masterTicketId": item.get("masterTicketId") or item.get("id") or item.get("_id"),
                    "distance_km": dist_km if dist_km != float('inf') else 0.0,
                    "location": c_loc,
                    "raw_doc": item
                })
                valid_vectors.append(embedding)

    if not nearby_candidates or not valid_vectors:
        return {
            "is_duplicate": False,
            "matched_problem_id": None,
            "similarity_score": 0.0,
            "distance_km": None,
            "matched_problem": None
        }

    # 2. Build FAISS index for candidate embeddings
    dimension = len(new_embedding)
    data_np = np.array(valid_vectors, dtype=np.float32)

    # Normalize vectors to unit length so Inner Product equals Cosine Similarity
    faiss.normalize_L2(data_np)
    query_np = np.array([new_embedding], dtype=np.float32)
    faiss.normalize_L2(query_np)

    index = faiss.IndexFlatIP(dimension)
    index.add(data_np)

    # Search top K matches
    k = min(5, len(nearby_candidates))
    similarities, indices = index.search(query_np, k)

    best_match = None
    best_sim = -1.0

    for i in range(k):
        idx = indices[0][i]
        if idx < 0:
            continue
        sim = float(similarities[0][idx])
        cand = nearby_candidates[idx]
        
        # Combined semantic + location rules
        if sim >= similarity_threshold and (cand["distance_km"] <= max_distance_km or is_same_location_text(new_location, cand["location"])):
            if sim > best_sim:
                best_sim = sim
                best_match = {
                    "matched_problem_id": cand["id"],
                    "similarity_score": round(sim, 4),
                    "distance_km": round(cand["distance_km"], 2),
                    "masterTicketId": cand["masterTicketId"],
                    "matched_title": cand["title"],
                    "matched_summary": cand["summary"]
                }

    if best_match:
        return {
            "is_duplicate": True,
            "matched_problem_id": best_match["matched_problem_id"],
            "similarity_score": best_match["similarity_score"],
            "distance_km": best_match["distance_km"],
            "master_ticket_id": str(best_match["masterTicketId"]),
            "matched_problem": best_match
        }

    return {
        "is_duplicate": False,
        "matched_problem_id": None,
        "similarity_score": round(float(similarities[0][0]), 4) if len(similarities[0]) > 0 else 0.0,
        "distance_km": round(nearby_candidates[indices[0][0]]["distance_km"], 2) if len(indices[0]) > 0 and indices[0][0] >= 0 else None,
        "matched_problem": None
    }
