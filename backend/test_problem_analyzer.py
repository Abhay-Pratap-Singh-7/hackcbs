from ai.problem_analyzer import analyze_problem


problem = """
Our village has been facing a shortage of clean drinking water
for the last two years. The existing hand pumps frequently stop
working and there is no proper water supply during summer.
"""


result = analyze_problem(problem)

print(result)