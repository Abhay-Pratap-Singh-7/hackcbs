import os
from typing import Literal

try:
    from dotenv import load_dotenv
    load_dotenv()
    # Check parent directory for backend/.env
    parent_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
    if os.path.exists(parent_env):
        load_dotenv(parent_env)
except ImportError:
    pass  # In production (Render), env vars are injected directly, so dotenv is not needed

from groq import Groq
from pydantic import BaseModel

try:
    from .prompts import SYSTEM_PROMPT
except ImportError:
    from prompts import SYSTEM_PROMPT




# ---------------------------------------------------------
# Output schema
# ---------------------------------------------------------

class ProblemAnalysis(BaseModel):
    summary: str
    key_points: str
    problem_classification: Literal[
        "education",
        "healthcare",
        "agriculture",
        "water resources",
        "environment",
        "energy",
        "urban development",
        "accessibility",
        "public administration",
        "livelihood"
    ]
    severity: Literal[
        "low",
        "medium",
        "high",
        "critical"
    ]
    suggested_solution: str
    required_expertise: list[str]


# ---------------------------------------------------------
# Groq client
# ---------------------------------------------------------

client = None

def get_groq_client() -> Groq:
    global client
    if client is not None:
        return client

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError(
            "GROQ_API_KEY is not set in the environment variables."
        )
    client = Groq(api_key=api_key)
    return client


# ---------------------------------------------------------
# Main AI function
# ---------------------------------------------------------

def analyze_problem(problem_text: str) -> dict:

    if not problem_text or not problem_text.strip():
        raise ValueError(
            "Problem description cannot be empty."
        )

    problem_text = problem_text.strip()
    groq_client = get_groq_client()

    response = groq_client.chat.completions.create(

        model="openai/gpt-oss-120b",

        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": f"""
Analyze the following citizen problem:

--- START PROBLEM ---
{problem_text}
--- END PROBLEM ---
"""
            }
        ],

        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "problem_analysis",
                "strict": True,

                "schema": {
                    "type": "object",

                    "properties": {

                        "summary": {
                            "type": "string"
                        },

                        "key_points": {
                            "type": "string"
                        },

                        "problem_classification": {
                            "type": "string",
                            "enum": [
                                "education",
                                "healthcare",
                                "agriculture",
                                "water resources",
                                "environment",
                                "energy",
                                "urban development",
                                "accessibility",
                                "public administration",
                                "livelihood"
                            ]
                        },

                        "severity": {
                            "type": "string",
                            "enum": [
                                "low",
                                "medium",
                                "high",
                                "critical"
                            ]
                        },

                        "suggested_solution": {
                            "type": "string"
                        },

                        "required_expertise": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        }
                    },

                    "required": [
                        "summary",
                        "key_points",
                        "problem_classification",
                        "severity",
                        "suggested_solution",
                        "required_expertise"
                    ],

                    "additionalProperties": False
                }
            }
        },

        temperature=0.2
    )

    content = response.choices[0].message.content

    if not content:
        raise RuntimeError(
            "The AI returned an empty response."
        )

    analysis = ProblemAnalysis.model_validate_json(content)

    return analysis.model_dump()
