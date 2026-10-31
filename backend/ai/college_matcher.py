import os
import math
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Union

try:
    from embedder import get_model
except ImportError:
    try:
        from .embedder import get_model
    except ImportError:
        import embedder
        get_model = embedder.get_model

_colleges_df = None
_college_embeddings = None

CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "colleges.csv")

def _init_colleges_cache():
    global _colleges_df, _college_embeddings
    if _colleges_df is None:
        if not os.path.exists(CSV_PATH):
            raise FileNotFoundError(f"Colleges dataset not found at {CSV_PATH}")
        
        _colleges_df = pd.read_csv(CSV_PATH)
        
        # Build dense textual representations for each college
        profile_texts = []
        for _, row in _colleges_df.iterrows():
            domain = str(row.get("Domain", "")).strip()
            faculty = str(row.get("Faculty Expertise", "")).strip()
            infra = str(row.get("Infrastructure", "")).strip()
            profile_texts.append(f"passage: Domain: {domain}. Expertise: {faculty}. Infrastructure: {infra}")
        
        model = get_model()
        # Precompute and normalize embeddings (shape: [N, D])
        _college_embeddings = model.encode(profile_texts, normalize_embeddings=True)

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    return 2 * R * math.asin(math.sqrt(a))

def match_colleges_for_problem(
    ai_analysis: Optional[Dict[str, Any]] = None,
    problem_input: Optional[Dict[str, Any]] = None,
    location_data: Optional[Dict[str, Any]] = None,
    top_k: int = 5,
    w_domain: float = 0.35,
    w_geo: float = 0.35,
    w_semantic: float = 0.30,
    **kwargs
) -> List[Dict[str, Any]]:
    """
    Finds the best matching colleges for a problem.
    Accepts both `ai_analysis` or `problem_input` (including full problem_post_response dicts).
    """
    _init_colleges_cache()
    
    # 1. Unpack input from either argument
    raw_input = ai_analysis if ai_analysis is not None else (problem_input if problem_input is not None else kwargs.get("data", {}))
    if not isinstance(raw_input, dict):
        raw_input = {}
        
    data_dict = raw_input.get("data", raw_input) if isinstance(raw_input, dict) else {}
    analysis = data_dict.get("aiAnalysis", data_dict)
    
    # 2. Extract Location
    p_lat, p_lon = None, None
    loc = location_data or (raw_input.get("location") if isinstance(raw_input, dict) else None) or data_dict.get("location")
    if loc and isinstance(loc, dict):
        coords = loc.get("coordinates")
        if isinstance(coords, (list, tuple)) and len(coords) == 2:
            p_lat, p_lon = float(coords[0]), float(coords[1])
        else:
            lat_val = loc.get("latitude") or loc.get("lat")
            lon_val = loc.get("longitude") or loc.get("lng") or loc.get("lon")
            if lat_val is not None and lon_val is not None:
                p_lat, p_lon = float(lat_val), float(lon_val)
                
    # Fallback to Ranchi center coordinates if not provided
    if p_lat is None or p_lon is None:
        p_lat, p_lon = 23.3441, 85.3096

    # 3. Extract Domain & Problem Attributes
    p_domain = str(analysis.get("problem_classification", "")).strip().lower()
    
    # 4. Dense Vector (use pre-computed embedding if available, otherwise compute)
    existing_embedding = data_dict.get("embedding") or (raw_input.get("embedding") if isinstance(raw_input, dict) else None)
    if existing_embedding and isinstance(existing_embedding, list) and len(existing_embedding) > 0:
        p_vector = np.array(existing_embedding, dtype=np.float32)
        norm = np.linalg.norm(p_vector)
        if norm > 0:
            p_vector = p_vector / norm
    else:
        req_exp = analysis.get("required_expertise", [])
        req_exp_str = ", ".join(req_exp) if isinstance(req_exp, list) else str(req_exp)
        summary = analysis.get("summary", "")
        query_text = f"query: Category: {p_domain}. Required: {req_exp_str}. {summary}"
        model = get_model()
        p_vector = model.encode([query_text], normalize_embeddings=True)[0]

    # 5. Cosine similarity against precomputed college embeddings
    semantic_scores = np.dot(_college_embeddings, p_vector)
    
    matches = []
    for idx, row in _colleges_df.iterrows():
        c_name = row.get("College Name", "")
        c_district = row.get("District", "")
        c_lat = float(row.get("Latitude", 0.0))
        c_lon = float(row.get("Longitude", 0.0))
        c_domain = str(row.get("Domain", "")).strip().lower()
        c_faculty = row.get("Faculty Expertise", "")
        c_infra = row.get("Infrastructure", "")
        
        # Domain match score
        domain_score = 1.0 if c_domain == p_domain else 0.2
        
        # Geospatial proximity score
        dist_km = haversine_distance(p_lat, p_lon, c_lat, c_lon)
        geo_score = math.exp(-dist_km / 50.0)
        
        # Semantic score
        sem_score = max(0.0, float(semantic_scores[idx]))
        
        # Combined weighted score (0 - 100%)
        final_score = (w_domain * domain_score) + (w_geo * geo_score) + (w_semantic * sem_score)
        
        matches.append({
            "college_name": c_name,
            "district": c_district,
            "latitude": c_lat,
            "longitude": c_lon,
            "distance_km": round(dist_km, 2),
            "domain": row.get("Domain", ""),
            "faculty_expertise": c_faculty,
            "infrastructure": c_infra,
            "match_score": round(final_score * 100, 2),
            "match_breakdown": {
                "domain_score": round(domain_score, 2),
                "geo_score": round(geo_score, 2),
                "semantic_score": round(sem_score, 2)
            }
        })
        
    matches.sort(key=lambda x: x["match_score"], reverse=True)
    return matches[:top_k]
