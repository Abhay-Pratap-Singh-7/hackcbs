import sys
import json
import argparse
import os
from typing import Optional, List, Dict, Any

# Ensure the current directory is in sys.path so direct imports work
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    import problem_analyzer
    import embedder
    import deduplicator
except ImportError as e:
    print(f"PYTHON_ERROR: Failed to import internal modules: {e}", file=sys.stderr)
    sys.exit(1)

def process_problem_submission(
    description: str,
    location: Optional[Dict[str, Any]] = None,
    self_tags: Optional[Dict[str, Any]] = None,
    candidates: Optional[List[Dict[str, Any]]] = None,
    max_distance_km: float = 10.0,
    similarity_threshold: float = 0.88
) -> Dict[str, Any]:
    """
    Unified Pipeline:
    1. Groq Problem Analysis
    2. Dense Embedding Generation with multilingual-e5-large
    3. Geospatial candidates filter + FAISS vector similarity search
    """
    # Step 1: Groq AI Analysis
    ai_analysis = problem_analyzer.analyze_problem(description)
    
    # Step 2: Generate embedding vector
    embedding = embedder.generate_problem_embedding(ai_analysis, self_tags, location)
    
    # Step 3: FAISS Deduplication check
    dedup_result = deduplicator.find_duplicate_with_faiss(
        new_embedding=embedding,
        new_location=location or {},
        candidate_problems=candidates or [],
        max_distance_km=max_distance_km,
        similarity_threshold=similarity_threshold
    )
    
    return {
        "aiAnalysis": ai_analysis,
        "embedding": embedding,
        "deduplication": dedup_result
    }

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--json":
        try:
            # Process single JSON payload from stdin
            input_data = sys.stdin.read()
            payload = json.loads(input_data)
            result = process_problem_submission(
                description=payload.get("description"),
                location=payload.get("location"),
                self_tags=payload.get("selfTags"),
                candidates=payload.get("candidates", []),
                max_distance_km=payload.get("maxDistanceKm", 10.0),
                similarity_threshold=payload.get("similarityThreshold", 0.88)
            )
            print(json.dumps(result))
        except Exception as e:
            # Print error to stderr so Node.js can catch it
            print(f"PYTHON_ERROR: {str(e)}", file=sys.stderr)
            sys.exit(1)
    else:
        # Fallback to FastAPI if needed (imports happen only here)
        from fastapi import FastAPI, HTTPException
        from pydantic import BaseModel, Field
        import uvicorn
        
        app = FastAPI(title="HackCBS AI Problem Analyzer")
        
        class DeduplicationRequest(BaseModel):
            description: str = Field(..., min_length=10)
            location: Optional[Dict[str, Any]] = None
            selfTags: Optional[Dict[str, Any]] = None
            candidates: Optional[List[Dict[str, Any]]] = []
            maxDistanceKm: Optional[float] = 10.0
            similarityThreshold: Optional[float] = 0.88
            
        @app.post("/api/ai/analyze-and-deduplicate")
        def api_analyze_and_deduplicate(req: DeduplicationRequest):
            res = process_problem_submission(
                description=req.description,
                location=req.location,
                self_tags=req.selfTags,
                candidates=req.candidates,
                max_distance_km=req.maxDistanceKm or 10.0,
                similarity_threshold=req.similarityThreshold or 0.88
            )
            return {"success": True, "data": res}
            
        if __name__ == "__main__":
            uvicorn.run(app, host="127.0.0.1", port=8000)
