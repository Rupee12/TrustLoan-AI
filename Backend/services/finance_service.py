import re
from typing import Any

from services.nlp_service import extract

def calculate_emi(principal: float, annual_interest_rate: float, tenure_months: int) -> dict[str, float]:
    monthly_rate = annual_interest_rate / 12 / 100
    if monthly_rate == 0:
        installment = principal / tenure_months
    else:
        factor = (1 + monthly_rate) ** tenure_months
        installment = principal * monthly_rate * factor / (factor - 1)
    total_payment = installment * tenure_months
    return {
        "monthly_emi": round(installment, 2),
        "total_payment": round(total_payment, 2),
        "total_interest": round(total_payment - principal, 2),
    }


INTENTS = (
    "CHECK_ELIGIBILITY",
    "EXPLAIN_PREDICTION",
    "FIND_LENDERS",
    "CALCULATE_EMI",
    "ASK_DOCUMENTS",
    "ASK_CIBIL",
    "ASK_LOAN_PROCESS",
    "COMPARE_LENDERS",
)

PROFILE_QUESTIONS = {
    "no_of_dependents": "How many dependents should I include?",
    "education": "Are you a graduate or not a graduate?",
    "self_employed": "Are you self-employed?",
    "income_annum": "What is your annual income in rupees?",
    "loan_amount": "What loan amount are you requesting, in rupees?",
    "loan_term": "What loan tenure are you considering, in years?",
    "cibil_score": "What is your CIBIL score? I will not infer it.",
    "residential_assets_value": "What is the value of your residential assets in rupees?",
    "commercial_assets_value": "What is the value of your commercial assets in rupees?",
    "luxury_assets_value": "What is the value of your luxury assets in rupees?",
    "bank_asset_value": "What is the value of your bank assets in rupees?",
}

MODEL_FIELDS = tuple(PROFILE_QUESTIONS)


def _question_field(message: str) -> str | None:
    text = message.lower()
    return next(
        (
            field
            for field, marker in (
                ("no_of_dependents", "dependents"),
                ("education", "graduate"),
                ("self_employed", "self-employed"),
                ("income_annum", "annual income"),
                ("loan_amount", "loan amount"),
                ("loan_term", "loan tenure"),
                ("cibil_score", "cibil score"),
                ("residential_assets_value", "residential assets"),
                ("commercial_assets_value", "commercial assets"),
                ("luxury_assets_value", "luxury assets"),
                ("bank_asset_value", "bank assets"),
            )
            if marker in text
        ),
        None,
    )


def _parse_answer(field: str, message: str) -> tuple[Any, str | None]:
    text = message.strip()
    normalized = text.lower()
    if field == "no_of_dependents":
        match = re.search(r"\b\d+\b", text)
        if match:
            return int(match.group()), None
    elif field == "education":
        if "not graduate" in normalized or "non-graduate" in normalized:
            return "Not Graduate", None
        if "graduate" in normalized:
            return "Graduate", None
    elif field == "self_employed":
        if re.search(r"\b(yes|self[- ]employed|business owner)\b", normalized):
            return "Yes", None
        if re.search(r"\b(no|salaried|employed)\b", normalized):
            return "No", None
    else:
        prompts = {
            "income_annum": f"My annual income is {text} annually",
            "loan_amount": f"I need {text} loan",
            "loan_term": f"loan tenure is {text}",
            "cibil_score": f"CIBIL score is {text}",
            "residential_assets_value": f"residential assets worth {text}",
            "commercial_assets_value": f"commercial assets worth {text}",
            "luxury_assets_value": f"luxury assets worth {text}",
            "bank_asset_value": f"bank assets worth {text}",
        }
        extracted = extract(prompts[field])
        value = extracted.get(field)
        if value is not None:
            if field == "cibil_score" and not 300 <= value <= 900:
                return None, "CIBIL score must be between 300 and 900."
            return value, None
    return None, "I could not validate that value. Please provide the requested information clearly."


def detect_intent(message: str) -> str:
    text = message.lower()
    if any(term in text for term in ("emi", "monthly instalment", "monthly installment")):
        return "CALCULATE_EMI"
    if any(term in text for term in ("compare lender", "compare bank", "which bank")):
        return "COMPARE_LENDERS"
    if any(term in text for term in ("lender", "bank recommendation", "find bank", "find lender")):
        return "FIND_LENDERS"
    if any(
        term in text
        for term in ("explain", "why was", "prediction", "shap", "my result", "factor", "influence", "what happens if")
    ) or ("improve" in text and "eligibility" in text):
        return "EXPLAIN_PREDICTION"
    if any(term in text for term in ("document", "paperwork", "proof required")):
        return "ASK_DOCUMENTS"
    if any(term in text for term in ("cibil", "credit score", "credit history")):
        return "ASK_CIBIL"
    if any(term in text for term in ("process", "how to apply", "application steps")):
        return "ASK_LOAN_PROCESS"
    if any(term in text for term in ("eligibility", "eligible", "check my loan")):
        return "CHECK_ELIGIBILITY"
    return "ASK_LOAN_PROCESS"


def respond(
    message: str,
    profile: dict[str, Any] | None = None,
    prediction: dict[str, Any] | None = None,
    conversation: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    intent = detect_intent(message)
    profile = dict(profile or {})
    expected_field = None
    invalid_answer = None
    for turn in conversation or []:
        if turn.get("role") == "assistant":
            expected_field = _question_field(turn.get("content", ""))
        elif turn.get("role") == "user" and expected_field:
            value, error = _parse_answer(expected_field, turn.get("content", ""))
            if value is not None:
                profile[expected_field] = value
            expected_field = None

    looks_like_question = "?" in message or re.search(
        r"\b(what|how|why|can you|tell me|explain)\b", message.lower()
    )
    if expected_field and not looks_like_question and intent in {
        "ASK_LOAN_PROCESS",
        "ASK_CIBIL",
        "CHECK_ELIGIBILITY",
    }:
        intent = "CHECK_ELIGIBILITY"
    if expected_field and intent == "CHECK_ELIGIBILITY":
        value, invalid_answer = _parse_answer(expected_field, message)
        if value is not None:
            profile[expected_field] = value
    answer: str
    follow_up: str | None = None

    if intent == "CHECK_ELIGIBILITY":
        if invalid_answer and expected_field:
            answer = f"{invalid_answer} {PROFILE_QUESTIONS[expected_field]}"
            follow_up = PROFILE_QUESTIONS[expected_field]
        else:
            missing = next(
                (field for field in MODEL_FIELDS if profile.get(field) is None), None
            )
            if missing:
                answer = "I can collect the model inputs one at a time. " + PROFILE_QUESTIONS[missing]
                follow_up = PROFILE_QUESTIONS[missing]
            else:
                answer = (
                    "The profile fields are present. Review and submit them on the Eligibility "
                    "page to run the existing Random Forest assessment."
                )
    elif intent == "EXPLAIN_PREDICTION":
        if prediction and prediction.get("prediction") in {"Approved", "Rejected"}:
            base_answer = (
                f"The Random Forest predicted {prediction['prediction']} with an approval "
                f"probability of {float(prediction['probability']):.1%}. This is a dataset-trained "
                "model output, not a lender decision or guarantee. Review the SHAP view for "
                "the supplied feature contributions."
            )
            question = message.lower()
            if any(term in question for term in ("improve", "what happens if", "what if")):
                answer = (
                    base_answer
                    + " A What-If comparison can show how the saved model responds to changed inputs, "
                    "but changing a value does not guarantee a lender decision."
                )
            else:
                answer = base_answer
        else:
            answer = "Complete an assessment first; I can explain only the returned model result and SHAP evidence."
    elif intent == "FIND_LENDERS" or intent == "COMPARE_LENDERS":
        answer = (
            "I can compare only published criteria we have verified. Open Find Potential "
            "Lenders to see each criterion, its source, and any information that remains unknown. "
            "A lender makes its own final decision."
        )
    elif intent == "CALCULATE_EMI":
        answer = "Use the EMI calculator with a principal, annual interest rate, and tenure. Its result is mathematical and is not a lender quote."
    elif intent == "ASK_DOCUMENTS":
        answer = "Required documents depend on the lender and product. Check the lender's official product or application page; this prototype does not submit applications."
    elif intent == "ASK_CIBIL":
        answer = "TrustLoan requires a CIBIL score supplied by you (300–900) and does not infer or retrieve it. Contact the credit bureau for your own report and dispute process."
    else:
        answer = "Loan terms and application steps vary by lender. Use the lender's official information and do not share passwords, PINs, or OTPs with this application."

    return {
        "intent": intent,
        "response": answer,
        "follow_up_question": follow_up,
        "requires_user_input": follow_up is not None,
        "configured": False,
        "profile": profile,
    }
