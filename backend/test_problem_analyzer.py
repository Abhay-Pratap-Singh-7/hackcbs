import sys
import os
import json

# Ensure UTF-8 output on Windows console
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except (AttributeError, io.UnsupportedOperation):
        pass

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ai.problem_analyzer import analyze_problem


problem = """
Our village has been facing a shortage of clean drinking water
for the last two years. The existing hand pumps frequently stop
working and there is no proper water supply during summer.
"""

print("[Test]: Running Groq Problem Analyzer...")
result = analyze_problem(problem)

print("\n[SUCCESS]: Groq AI Analysis Result:")
print(json.dumps(result, indent=2, ensure_ascii=False))
