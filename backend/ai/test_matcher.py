import json
import os
import sys

# Ensure imports work from ai folder
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from college_matcher import match_colleges_for_problem

# Load from problem_post_response.json
json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "problem_post_response.json")

with open(json_path, "r", encoding="utf-8") as f:
    problem_data = json.load(f)

# Sample problem location (e.g. Dhanbad)
sample_location = {
    "latitude": 23.7957,
    "longitude": 86.4304,
    "district": "Dhanbad",
    "state": "Jharkhand"
}

print("\n--- Testing College Matcher with problem_post_response.json ---")
matches = match_colleges_for_problem(
    problem_input=problem_data,
    location_data=sample_location,
    top_k=5
)

output_response = {
    "success": True,
    "data": matches
}

# Save sample output to college_matcher_response.json
out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "college_matcher_response.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(output_response, f, indent=4)

print(f"\nSaved match results to {out_path}")
print(f"Top {len(matches)} Matched Colleges:\n" + "="*70)
for i, m in enumerate(matches, 1):
    print(f"{i}. {m['college_name']} ({m['district']})")
    print(f"   Match Score : {m['match_score']}% | Distance: {m['distance_km']} km | Domain: {m['domain']}")
    print(f"   Breakdown   : Geo={m['match_breakdown']['geo_score']}, Domain={m['match_breakdown']['domain_score']}, Semantic={m['match_breakdown']['semantic_score']}")
    print(f"   Facilities  : {m['infrastructure']}")
    print("-" * 70)
