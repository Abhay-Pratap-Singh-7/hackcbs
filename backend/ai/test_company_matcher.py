import json
import os
import sys

# Ensure imports work from ai folder
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from company_matcher import match_companies_for_problem

# Load from problem_post_response.json if available
json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "problem_post_response.json")

if os.path.exists(json_path):
    with open(json_path, "r", encoding="utf-8") as f:
        problem_data = json.load(f)
else:
    problem_data = {
        "description": "Severe water contamination and industrial effluent disposal issues in urban waterways.",
        "aiAnalysis": {
            "summary": "Industrial effluent contamination in waterways",
            "problem_classification": "environment",
            "required_expertise": ["Industrial rubber mouldings", "Chemical treatment", "Effluent processing"]
        }
    }

# Sample problem location (e.g. Jamshedpur / Adityapur industrial hub area)
sample_location = {
    "latitude": 22.7845,
    "longitude": 86.1552,
    "district": "Purbi Singhbhum",
    "state": "Jharkhand"
}

# Sample registered companies from MongoDB database
sample_registered_db_companies = [
    {
        "id": "REG-COMP-999",
        "name": "EcoClean Technologies India Pvt Ltd",
        "domain": "environment",
        "expertise": "Industrial wastewater treatment, effluent recycling, and chemical anti-corrosive coatings",
        "location": {"latitude": 22.7910, "longitude": 86.1600},
        "is_verified": True
    }
]

print("\n--- Testing Company / Industry Matcher ---")
matches = match_companies_for_problem(
    problem_input=problem_data,
    location_data=sample_location,
    candidate_companies=sample_registered_db_companies,
    top_k=5
)

output_response = {
    "success": True,
    "data": matches
}

# Save sample output to company_matcher_response.json
out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "company_matcher_response.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(output_response, f, indent=4)

print(f"\nSaved match results to {out_path}")
print(f"Top {len(matches)} Matched Companies/Industries:\n" + "="*70)
for i, m in enumerate(matches, 1):
    print(f"{i}. {m['company_name']} [Source: {m['source']}]")
    print(f"   Match Score : {m['match_score']}% | Distance: {m['distance_km']} km | Domain: {m['domain']}")
    print(f"   Breakdown   : Geo={m['match_breakdown']['geo_score']}, Domain={m['match_breakdown']['domain_score']}, Semantic={m['match_breakdown']['semantic_score']}")
    print(f"   Expertise   : {m['expertise']}")
    print("-" * 70)
