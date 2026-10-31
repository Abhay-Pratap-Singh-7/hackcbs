import os
import numpy as np
from sentence_transformers import SentenceTransformer

# Primary requested model: multilingual-e5-large
DEFAULT_MODELS = [
    os.getenv("EMBEDDING_MODEL", "intfloat/multilingual-e5-large"),
    "intfloat/multilingual-e5-small",
    "all-MiniLM-L6-v2"
]

_model = None

def get_model():
    global _model
    if _model is None:
        for model_name in DEFAULT_MODELS:
            try:
                print(f"Attempting to load embedding model: {model_name}...")
                _model = SentenceTransformer(model_name)
                print(f"Successfully loaded embedding model: {model_name}")
                break
            except Exception as err:
                print(f"Could not load model '{model_name}': {err}")
        if _model is None:
            raise RuntimeError("Failed to load any multilingual embedding transformer model.")
    return _model

def generate_problem_embedding(analysis_data: dict, self_tags: dict = None, location_data: dict = None) -> list[float]:
    """
    Generates a dense feature vector for a problem statement.
    Combines: problem_classification, summary, key_points, keywords, village/district location context.
    """
    classification = analysis_data.get("problem_classification", "")
    summary = analysis_data.get("summary", "")
    key_points = analysis_data.get("key_points", "")
    
    keywords = []
    if self_tags and "keywords" in self_tags:
        keywords = self_tags.get("keywords", [])
    keywords_str = ", ".join(keywords) if isinstance(keywords, list) else str(keywords)

    loc_context = ""
    if location_data:
        village = location_data.get("village", "")
        block = location_data.get("block", "")
        district = location_data.get("district", "")
        state = location_data.get("state", "")
        loc_parts = [p for p in [village, block, district, state] if p]
        if loc_parts:
            loc_context = ", ".join(loc_parts)

    # e5 models use 'passage: ' prefix for document representations
    text_content = f"passage: Classification: {classification}. Summary: {summary}. Key Points: {key_points}. Location: {loc_context}. Keywords: {keywords_str}"

    model = get_model()
    # Output float32 numpy vector, normalized to unit length so inner product = cosine similarity
    vector = model.encode(text_content, normalize_embeddings=True)
    return vector.tolist()
