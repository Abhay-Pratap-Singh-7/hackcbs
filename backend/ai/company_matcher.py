import os
import re
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

_companies_df = None
_company_embeddings = None

CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "jharkhand_industry_dataset_merged_updated.csv")

def _parse_coordinates(coord_str: Any) -> tuple:
    """Extracts (latitude, longitude) floats from strings like '(22.784512, 86.155210)' or dicts/lists."""
    if isinstance(coord_str, (list, tuple)) and len(coord_str) >= 2:
        try:
            return float(coord_str[0]), float(coord_str[1])
        except (ValueError, TypeError):
            return 0.0, 0.0
    if isinstance(coord_str, str):
        match = re.search(r'\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)', coord_str)
        if match:
            try:
                return float(match.group(1)), float(match.group(2))
            except ValueError:
                pass
        parts = coord_str.replace("(", "").replace(")", "").split(",")
        if len(parts) >= 2:
            try:
                return float(parts[0].strip()), float(parts[1].strip())
            except ValueError:
                pass
    return 0.0, 0.0

def _init_companies_cache():
    global _companies_df, _company_embeddings
    if _companies_df is None:
        if not os.path.exists(CSV_PATH):
            raise FileNotFoundError(f"Industry dataset not found at {CSV_PATH}")
        
        try:
            _companies_df = pd.read_csv(CSV_PATH)
        except Exception:
            _companies_df = pd.read_csv(CSV_PATH, on_bad_lines='skip')
        
        # Build dense textual representations for each company passage

        profile_texts = []
        parsed_lats = []
        parsed_lons = []
        
        for _, row in _companies_df.iterrows():
            name = str(row.get("name", "")).strip()
            domain = str(row.get("domain", "")).strip()
            expertise = str(row.get("expertise", "")).strip()
            loc_raw = row.get("location", "")
            lat, lon = _parse_coordinates(loc_raw)
            
            parsed_lats.append(lat)
            parsed_lons.append(lon)
            profile_texts.append(f"passage: Industry: {name}. Domain: {domain}. Technical Expertise: {expertise}")
        
        _companies_df["parsed_lat"] = parsed_lats
        _companies_df["parsed_lon"] = parsed_lons
        
        model = get_model()
        # Precompute and normalize embeddings (shape: [N, D])
        _company_embeddings = model.encode(profile_texts, normalize_embeddings=True)

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates Haversine distance in kilometers between two lat/lon points."""
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    return 2 * R * math.asin(math.sqrt(a))

def match_companies_for_problem(
    ai_analysis: Optional[Dict[str, Any]] = None,
    problem_input: Optional[Dict[str, Any]] = None,
    location_data: Optional[Dict[str, Any]] = None,
    candidate_companies: Optional[List[Dict[str, Any]]] = None,
    top_k: int = 5,
    w_domain: float = 0.35,
    w_geo: float = 0.35,
    w_semantic: float = 0.30,
    only_verified: bool = False,
    **kwargs
) -> List[Dict[str, Any]]:
    """
    Finds the best matching companies/industries for a problem statement.
    Supports dual data resolution:
      - MongoDB registered companies passed via `candidate_companies`
      - Seed dataset from `jharkhand_industry_dataset_merged_updated.csv`
    """
    _init_companies_cache()
    
    # 1. Unpack problem input data
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
                
    # Fallback to Ranchi center coordinates if location not provided
    if p_lat is None or p_lon is None:
        p_lat, p_lon = 23.3441, 85.3096

    # 3. Extract Domain & Required Expertise
    p_domain = str(analysis.get("problem_classification", "")).strip().lower()
    
    # 4. Dense Vector Representation (multilingual-e5-large query text)
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

    # 5. Cosine similarity against precomputed CSV company embeddings
    csv_semantic_scores = np.dot(_company_embeddings, p_vector)
    
    matches = []
    seen_ids = set()

    # A. Process registered MongoDB companies first if provided
    if candidate_companies and isinstance(candidate_companies, list):
        for candidate in candidate_companies:
            if not isinstance(candidate, dict):
                continue
            
            c_id = str(candidate.get("id") or candidate.get("_id") or candidate.get("name", ""))
            seen_ids.add(c_id.lower())
            
            c_name = candidate.get("name") or candidate.get("company_name", "Unknown Company")
            c_domain_raw = str(candidate.get("domain", "")).strip()
            c_domain = c_domain_raw.lower()
            c_expertise = candidate.get("expertise") or candidate.get("technical_expertise", "")
            is_verified = bool(candidate.get("is_verified", True))
            
            if only_verified and not is_verified:
                continue

            # Extract company location
            c_lat, c_lon = 0.0, 0.0
            c_loc = candidate.get("location")
            if isinstance(c_loc, dict):
                coords = c_loc.get("coordinates")
                if isinstance(coords, (list, tuple)) and len(coords) == 2:
                    c_lat, c_lon = float(coords[0]), float(coords[1])
                else:
                    c_lat = float(c_loc.get("latitude") or c_loc.get("lat") or 0.0)
                    c_lon = float(c_loc.get("longitude") or c_loc.get("lng") or 0.0)
            elif isinstance(c_loc, str):
                c_lat, c_lon = _parse_coordinates(c_loc)

            # Compute scores
            domain_score = 1.0 if c_domain == p_domain else 0.2
            dist_km = haversine_distance(p_lat, p_lon, c_lat, c_lon) if (c_lat != 0.0 and c_lon != 0.0) else 50.0
            geo_score = math.exp(-dist_km / 50.0)

            # Candidate embedding cosine similarity
            if candidate.get("embedding") and isinstance(candidate["embedding"], list):
                cand_vec = np.array(candidate["embedding"], dtype=np.float32)
                c_norm = np.linalg.norm(cand_vec)
                if c_norm > 0:
                    cand_vec = cand_vec / c_norm
                sem_score = max(0.0, float(np.dot(cand_vec, p_vector)))
            else:
                cand_text = f"passage: Industry: {c_name}. Domain: {c_domain_raw}. Technical Expertise: {c_expertise}"
                model = get_model()
                cand_vec = model.encode([cand_text], normalize_embeddings=True)[0]
                sem_score = max(0.0, float(np.dot(cand_vec, p_vector)))

            final_score = (w_domain * domain_score) + (w_geo * geo_score) + (w_semantic * sem_score)

            matches.append({
                "id": c_id,
                "company_name": c_name,
                "domain": c_domain_raw,
                "expertise": c_expertise,
                "latitude": c_lat,
                "longitude": c_lon,
                "distance_km": round(dist_km, 2),
                "is_verified": is_verified,
                "source": "registered_db",
                "match_score": round(final_score * 100, 2),
                "match_breakdown": {
                    "domain_score": round(domain_score, 2),
                    "geo_score": round(geo_score, 2),
                    "semantic_score": round(sem_score, 2)
                }
            })

    # B. Process dataset CSV companies
    for idx, row in _companies_df.iterrows():
        c_id = str(row.get("id", f"JH-IND-{idx+1:03d}")).strip()
        c_name = str(row.get("name", "")).strip()
        
        if c_id.lower() in seen_ids or c_name.lower() in seen_ids:
            continue
            
        c_domain_raw = str(row.get("domain", "")).strip()
        c_domain = c_domain_raw.lower()
        c_expertise = str(row.get("expertise", "")).strip()
        c_lat = float(row.get("parsed_lat", 0.0))
        c_lon = float(row.get("parsed_lon", 0.0))
        is_verified = str(row.get("is_verified", "TRUE")).strip().upper() == "TRUE"
        
        if only_verified and not is_verified:
            continue

        # Domain score
        domain_score = 1.0 if c_domain == p_domain else 0.2
        
        # Geospatial score
        dist_km = haversine_distance(p_lat, p_lon, c_lat, c_lon) if (c_lat != 0.0 and c_lon != 0.0) else 50.0
        geo_score = math.exp(-dist_km / 50.0)
        
        # Semantic score
        sem_score = max(0.0, float(csv_semantic_scores[idx]))
        
        # Final combined weighted score
        final_score = (w_domain * domain_score) + (w_geo * geo_score) + (w_semantic * sem_score)
        
        matches.append({
            "id": c_id,
            "company_name": c_name,
            "domain": c_domain_raw,
            "expertise": c_expertise,
            "latitude": c_lat,
            "longitude": c_lon,
            "distance_km": round(dist_km, 2),
            "is_verified": is_verified,
            "source": "dataset_csv",
            "match_score": round(final_score * 100, 2),
            "match_breakdown": {
                "domain_score": round(domain_score, 2),
                "geo_score": round(geo_score, 2),
                "semantic_score": round(sem_score, 2)
            }
        })

    # Sort matches by match_score in descending order
    matches.sort(key=lambda x: x["match_score"], reverse=True)
    return matches[:top_k]
