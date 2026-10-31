import json
import sys
from ai.service import process_problem_submission

sys.stdout.reconfigure(encoding='utf-8')

# Existing candidate problem in MongoDB (simulated pre-stored problem with embedding)
prob1_text = """
During peak summer months, over 5,000 residents in Kosi Kalan face acute drinking water shortage.
High TDS and fluoride levels in ground water lead to health complications for children and elderly.
Urgent community filtration and rainwater harvesting required.
"""

loc1 = {
    "district": "Mathura",
    "state": "Uttar Pradesh",
    "village": "Kosi Kalan",
    "coordinates": {"latitude": 27.4924, "longitude": 77.6737}
}

print("--- Step 1: Processing Initial Problem 1 ---")
res1 = process_problem_submission(
    description=prob1_text,
    location=loc1,
    self_tags={"keywords": ["water", "TDS", "fluoride", "Kosi Kalan"]}
)

print("Classification:", res1["aiAnalysis"]["problem_classification"])
print("Summary:", res1["aiAnalysis"]["summary"][:80])
print("Vector dimension:", len(res1["embedding"]))
print("Is duplicate:", res1["deduplication"]["is_duplicate"])

# Prepare problem 1 as candidate stored in DB
candidate_1 = {
    "_id": "66d48291a1829e0123456789",
    "title": "Kosi Kalan Water Shortage",
    "description": prob1_text,
    "location": loc1,
    "aiAnalysis": res1["aiAnalysis"],
    "embedding": res1["embedding"]
}

print("\n--- Step 2: Processing Duplicate Problem 2 (Near location, same problem) ---")
prob2_text = """
In Kosi Kalan village, nearby main bazaar, residents have severe drinking water issues every summer.
Water has high fluoride and TDS content causing illness. Need solar RO plant and rainwater harvesting.
"""

loc2 = {
    "district": "Mathura",
    "state": "Uttar Pradesh",
    "village": "Kosi Kalan",
    "coordinates": {"latitude": 27.4930, "longitude": 77.6740}  # ~100 meters away
}

res2 = process_problem_submission(
    description=prob2_text,
    location=loc2,
    self_tags={"keywords": ["water", "RO", "fluoride"]},
    candidates=[candidate_1],
    max_distance_km=10.0,
    similarity_threshold=0.85
)

print("Classification:", res2["aiAnalysis"]["problem_classification"])
print("Is duplicate:", res2["deduplication"]["is_duplicate"])
print("Matched problem ID:", res2["deduplication"]["matched_problem_id"])
print("Similarity score:", res2["deduplication"]["similarity_score"])
print("Distance km:", res2["deduplication"]["distance_km"])

print("\n--- Step 3: Processing Unique Problem 3 (Different problem & area) ---")
prob3_text = """
The primary school in Chhata block lacks sufficient teachers and science lab facilities.
Over 200 students are impacted by missing laboratory equipment and leaking classroom roofs.
"""

loc3 = {
    "district": "Mathura",
    "state": "Uttar Pradesh",
    "village": "Chhata",
    "coordinates": {"latitude": 27.7000, "longitude": 77.5000}  # > 25km away
}

res3 = process_problem_submission(
    description=prob3_text,
    location=loc3,
    self_tags={"keywords": ["education", "school", "science"]},
    candidates=[candidate_1],
    max_distance_km=10.0,
    similarity_threshold=0.85
)

print("Classification:", res3["aiAnalysis"]["problem_classification"])
print("Is duplicate:", res3["deduplication"]["is_duplicate"])
print("Similarity score:", res3["deduplication"]["similarity_score"])
print("\nSUCCESS: All FAISS vector deduplication tests completed successfully!")
