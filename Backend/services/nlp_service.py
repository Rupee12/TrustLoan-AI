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


def _amount(number: str, unit: str | None) -> float:
    value = float(number.replace(",", ""))
    normalized = (unit or "").lower()
    if normalized in {"lakh", "lakhs", "l"}:
        return value * 100_000
    if normalized in {"crore", "crores", "cr"}:
        return value * 10_000_000
    return value


def _find_amount(text: str, patterns: list[str]) -> float | None:
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return _amount(match.group("number"), match.groupdict().get("unit"))
    return None


def extract(text: str) -> dict[str, Any]:
    normalized = text.lower().replace("₹", " rs ")
    result: dict[str, Any] = {field: None for field in FIELDS}

    match = re.search(r"(?P<number>\d+(?:\.\d+)?)\s*(?P<unit>lakh|lakhs|crore|crores|l|cr)?\s*(?:per\s+year|annually|annual|a\s+year)", normalized)
    if match:
        result["income_annum"] = _amount(match.group("number"), match.group("unit"))

    result["loan_amount"] = _find_amount(normalized, [
        r"(?:need|want|require|loan\s+of)\s*(?:a\s+)?(?:rs\s*)?(?P<number>\d+(?:\.\d+)?)\s*(?P<unit>lakh|lakhs|crore|crores|l|cr)?",
    ])

    match = re.search(r"(?:cibil|credit\s+score)\s*(?:is|of|score)?\s*(?P<number>\d{3})", normalized)
    if match:
        result["cibil_score"] = int(match.group("number"))

    match = re.search(r"(?P<number>\d+)\s*(?:dependents?|people\s+dependent)", normalized)
    if match:
        result["no_of_dependents"] = int(match.group("number"))

    match = re.search(r"(?P<number>\d+(?:\.\d+)?)\s*(?P<unit>years?|months?)", normalized)
    if match and any(word in normalized for word in ("loan", "term", "repay", "repayment")):
        result["loan_term"] = float(match.group("number"))
        if match.group("unit").startswith("month"):
            result["loan_term"] = result["loan_term"] / 12

    if re.search(r"not\s+(?:a\s+)?graduate|non[- ]graduate", normalized):
        result["education"] = "Not Graduate"
    elif re.search(r"\bgraduate\b", normalized):
        result["education"] = "Graduate"

    if re.search(r"self[- ]employed|own\s+(?:a\s+)?business|business\s+owner", normalized):
        result["self_employed"] = "Yes"
    elif re.search(r"salaried|employed\s+by|not\s+self[- ]employed", normalized):
        result["self_employed"] = "No"

    asset_patterns = {
        "residential_assets_value": [r"(?:residential|house|home)\s+assets?\s*(?:of|worth|valued at)?\s*(?:rs\s*)?(?P<number>\d+(?:\.\d+)?)\s*(?P<unit>lakh|lakhs|crore|crores|l|cr)?"],
        "commercial_assets_value": [r"commercial\s+assets?\s*(?:of|worth|valued at)?\s*(?:rs\s*)?(?P<number>\d+(?:\.\d+)?)\s*(?P<unit>lakh|lakhs|crore|crores|l|cr)?"],
        "luxury_assets_value": [r"luxury\s+assets?\s*(?:of|worth|valued at)?\s*(?:rs\s*)?(?P<number>\d+(?:\.\d+)?)\s*(?P<unit>lakh|lakhs|crore|crores|l|cr)?"],
        "bank_asset_value": [r"bank\s+assets?\s*(?:of|worth|valued at)?\s*(?:rs\s*)?(?P<number>\d+(?:\.\d+)?)\s*(?P<unit>lakh|lakhs|crore|crores|l|cr)?"],
    }
    for field, patterns in asset_patterns.items():
        result[field] = _find_amount(normalized, patterns)

    result["missing_required_fields"] = [field for field in FIELDS if result[field] is None]
    return result
