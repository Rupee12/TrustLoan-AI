import re
from typing import Any


FIELDS = [
    "no_of_dependents",
    "education",
    "self_employed",
    "income_annum",
    "loan_amount",
    "loan_term",
    "cibil_score",
    "residential_assets_value",
    "commercial_assets_value",
    "luxury_assets_value",
    "bank_asset_value",
]

NUMBER = r"(?:\d{1,3}(?:,\d{2})*,\d{3}|\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?"
UNIT = r"(?:lakhs?|lacs?|crores?|cr|l|k)?"
AMOUNT = rf"(?P<number>{NUMBER})\s*(?P<unit>{UNIT})"


def _amount(number: str, unit: str | None) -> float:
    value = float(number.replace(",", ""))
    normalized = (unit or "").lower()
    if normalized in {"lakh", "lakhs", "lac", "lacs", "l"}:
        return value * 100_000
    if normalized in {"crore", "crores", "cr"}:
        return value * 10_000_000
    if normalized == "k":
        return value * 1_000
    return value


def _amount_match(pattern: str, text: str) -> float | None:
    match = re.search(pattern, text, flags=re.IGNORECASE)
    if not match:
        return None
    return _amount(match.group("number"), match.groupdict().get("unit"))


def _set_confidence(
    result: dict[str, Any],
    confidence: dict[str, float],
    field: str,
    value: Any,
    score: float = 0.95,
) -> None:
    result[field] = value
    confidence[field] = score


def extract(text: str) -> dict[str, Any]:
    normalized = text.lower().replace("₹", " rs ")
    result: dict[str, Any] = {field: None for field in FIELDS}
    result.update({"income_monthly": None, "loan_purpose": None})
    confidence: dict[str, float] = {}
    ambiguous_fields: list[str] = []
    validation_errors: list[str] = []

    income_expression = rf"(?:income(?:\s+is|\s+of)?|earn(?:ing|s)?(?:\s+about|\s+around)?)\s*(?:rs\s*)?{AMOUNT}"
    monthly_patterns = [
        rf"{income_expression}\s*(?:per\s+month|monthly|a\s+month|/month)",
        rf"(?:monthly|per[- ]month)\s+income\s*(?:of|is)?\s*(?:rs\s*)?{AMOUNT}",
        rf"(?:rs\s*)?{AMOUNT}\s*(?:per\s+month|monthly|a\s+month|/month)",
    ]
    monthly_match = next(
        (
            match
            for pattern in monthly_patterns
            if (match := re.search(pattern, normalized, flags=re.IGNORECASE))
        ),
        None,
    )
    annual_patterns = [
        rf"{income_expression}\s*(?:per\s+year|annually|annual|a\s+year|yearly)",
        rf"(?:annual|yearly)\s+income\s*(?:of|is)?\s*(?:rs\s*)?{AMOUNT}",
        rf"(?:rs\s*)?{AMOUNT}\s*(?:per\s+year|annually|annual|a\s+year|yearly)",
    ]
    annual_income = next(
        (
            value
            for pattern in annual_patterns
            if (value := _amount_match(pattern, normalized)) is not None
        ),
        None,
    )
    if monthly_match:
        monthly_income = _amount(
            monthly_match.group("number"), monthly_match.groupdict().get("unit")
        )
        _set_confidence(result, confidence, "income_monthly", monthly_income)
        converted_annual = monthly_income * 12
        if annual_income is not None and abs(annual_income - converted_annual) > max(1, annual_income * 0.001):
            ambiguous_fields.append("income_annum")
            validation_errors.append(
                "Conflicting annual and monthly income values were provided."
            )
        else:
            _set_confidence(
                result,
                confidence,
                "income_annum",
                annual_income if annual_income is not None else converted_annual,
                0.95 if annual_income is not None else 0.9,
            )
    elif annual_income is not None:
        _set_confidence(result, confidence, "income_annum", annual_income)
    else:
        if _amount_match(income_expression, normalized) is not None:
            ambiguous_fields.append("income_annum")

    loan_amount = _amount_match(
        rf"(?:need|want|require|borrow|loan\s+(?:of|amount(?:\s+of)?))\s*(?:a\s+)?(?:rs\s*)?{AMOUNT}",
        normalized,
    )
    if loan_amount is None:
        loan_amount = _amount_match(
            rf"(?:rs\s*)?{AMOUNT}\s*(?:loan|for\s+the\s+loan)\b", normalized
        )
    if loan_amount is not None:
        _set_confidence(result, confidence, "loan_amount", loan_amount)

    score_match = re.search(
        r"(?:cibil|credit\s+score)\s*(?:score\s*)?(?:is|of|around)?\s*(\d{2,4})",
        normalized,
    )
    if score_match:
        score = int(score_match.group(1))
        _set_confidence(result, confidence, "cibil_score", score, 0.98)
        if not 300 <= score <= 900:
            validation_errors.append("cibil_score must be between 300 and 900.")

    dependent_match = re.search(
        r"(\d+)\s*(?:dependents?|people\s+dependent|family\s+members?\s+dependent)",
        normalized,
    )
    if dependent_match:
        _set_confidence(
            result, confidence, "no_of_dependents", int(dependent_match.group(1))
        )

    tenure_match = re.search(
        r"(?:loan\s+)?(?:tenure|term|repay(?:ment)?\s+period|for|over)\s*(?:of\s*)?"
        r"(\d+(?:\.\d+)?)\s*(years?|yrs?|months?|mos?)\b",
        normalized,
    )
    if not tenure_match:
        tenure_match = re.search(
            r"\bfor\s+(\d+(?:\.\d+)?)\s*(years?|yrs?|months?|mos?)\b", normalized
        )
    if tenure_match and any(
        word in normalized
        for word in ("loan", "term", "tenure", "repay", "borrow", "need", "want", "require")
    ):
        term = float(tenure_match.group(1))
        unit = tenure_match.group(2)
        if unit.startswith(("month", "mo")):
            term /= 12
        _set_confidence(result, confidence, "loan_term", term)

    if re.search(r"not\s+(?:a\s+)?graduate|non[- ]graduate", normalized):
        _set_confidence(result, confidence, "education", "Not Graduate")
    elif re.search(r"\bgraduate\b", normalized):
        _set_confidence(result, confidence, "education", "Graduate")

    if re.search(r"self[- ]employed|own\s+(?:a\s+)?business|business\s+owner", normalized):
        _set_confidence(result, confidence, "self_employed", "Yes")
    elif re.search(r"salaried|employed\s+by|not\s+self[- ]employed", normalized):
        _set_confidence(result, confidence, "self_employed", "No")

    asset_terms = {
        "residential_assets_value": r"(?:residential|house|home)\s+assets?",
        "commercial_assets_value": r"commercial\s+assets?",
        "luxury_assets_value": r"luxury\s+assets?",
        "bank_asset_value": r"bank\s+assets?",
    }
    for field, asset_term in asset_terms.items():
        value = _amount_match(
            rf"{asset_term}\s*(?:of|worth|valued\s+at|are|is)?\s*(?:rs\s*)?{AMOUNT}",
            normalized,
        )
        if value is not None:
            _set_confidence(result, confidence, field, value)

    purpose_match = re.search(
        r"\bfor\s+(wedding|marriage|medical(?:\s+emergency)?|travel|education|"
        r"home\s+renovation|debt\s+consolidation|business)\b",
        normalized,
    )
    if purpose_match:
        _set_confidence(result, confidence, "loan_purpose", purpose_match.group(1), 0.85)

    missing = [field for field in FIELDS if result[field] is None]
    return {
        **result,
        "confidence": confidence,
        "ambiguous_fields": sorted(set(ambiguous_fields)),
        "validation_errors": validation_errors,
        "missing_required_fields": missing,
        "requires_confirmation": True,
    }
