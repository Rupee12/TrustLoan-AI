import json
import os
from typing import Any

from dotenv import load_dotenv
from google import genai

load_dotenv()


LIMITATIONS = (
    "This is an educational Random Forest assessment on a public dataset. "
    "It is not a bank decision, a guarantee, or an official CIBIL score. "
    "SHAP values describe model contribution and are not causal evidence."
)


def explain(payload: dict[str, Any]) -> dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return {
            "configured": False,
            "message": "AI Advisor is not configured."
        }

    model = os.getenv(
        "GEMINI_MODEL",
        "gemini-3-flash-preview"
    )

    question = str(
        payload.get(
            "question",
            "Explain this assessment."
        )
    )

    evidence = {
        **payload,
        "limitations": LIMITATIONS
    }

    prompt = f"""
You are the AI Advisor component of TrustLoan AI.

TrustLoan AI is an educational machine-learning application
that uses a Random Forest model to estimate loan eligibility.

Your role is ONLY to explain the existing model assessment
in simple and understandable language.

IMPORTANT RULES:

1. Do NOT make or change the loan approval decision.
2. Do NOT recommend that a bank approve or reject the applicant.
3. Do NOT claim guaranteed approval or rejection.
4. Do NOT claim affiliation with any bank or financial institution.
5. Do NOT call the TrustLoan risk score a CIBIL score.
6. SHAP values represent model contribution, not causal evidence.
7. Clearly distinguish model output from real-world lending decisions.
8. If asked whether the applicant will definitely get a loan,
   explain that this system cannot guarantee that.
9. Use only the supplied model evidence.
10. Do not invent applicant information or financial facts.
11. Keep explanations clear and suitable for a general user.

User question:
{question}

Model evidence:
{json.dumps(evidence, indent=2, default=str)}

Answer the user's question using the model evidence above.
"""

    try:
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model=model,
            contents=prompt
        )

        explanation = response.text

        return {
            "configured": True,
            "explanation": str(explanation),
            "message": None
        }

    except Exception as exc:
        raise RuntimeError(
            "The AI Advisor provider is unavailable."
        ) from exc