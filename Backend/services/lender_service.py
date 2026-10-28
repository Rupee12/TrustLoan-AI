from typing import Any


LAST_VERIFIED = "2026-10-27"
LENDERS: list[dict[str, Any]] = [
    {
        "id": "hdfc-personal-loan",
        "name": "HDFC Bank",
        "category": "personal_loan",
        "product_url": "https://www.hdfc.bank.in/personal-loan",
        "application_url": "https://applyonline.hdfc.bank.in/personal-loans",
        "last_verified": LAST_VERIFIED,
        "criteria": [
            {
                "id": "loan_amount",
                "label": "Loan amount",
                "minimum": 25_000,
                "maximum": 10_000_000,
                "source_url": "https://www.hdfc.bank.in/personal-loan",
                "source_note": "Official product page lists ₹25,000 to ₹1 crore.",
            },
            {
                "id": "loan_term_years",
                "label": "Loan tenure (years)",
                "minimum": 1,
                "maximum": 7,
                "source_url": "https://www.hdfc.bank.in/personal-loan",
                "source_note": "Official page's personal-loan calculator lists 1 to 7 years.",
            },
        ],
        "unknown_criteria": [
            "Minimum age is not established by the reviewed product page.",
            "Minimum income is not established by the reviewed product page.",
            "Credit-score eligibility threshold is not established by the reviewed product page.",
        ],
        "caveat": "The bank states that disbursal is at its sole discretion and terms apply.",
    },
    {
        "id": "sbi-personal-loan",
        "name": "State Bank of India",
        "category": "personal_loan",
        "product_url": "https://sbi.bank.in/web/personal-banking/loans/personal-loans/sbi-personal-loan",
        "application_url": "https://onlineapply.sbi.bank.in/personal-banking/personal-loan",
        "last_verified": LAST_VERIFIED,
        "criteria": [
            {
                "id": "employment_and_salary_account",
                "label": "Employment and salary account",
                "requirement": "Salaried employees having a salary account with SBI",
                "source_url": "https://sbi.bank.in/web/personal-banking/loans/personal-loans/sbi-personal-loan",
                "source_note": "Official product page describes this product for salaried employees having an SBI salary account.",
            },
        ],
        "unknown_criteria": [
            "Loan amount range is not established by the reviewed product page.",
            "Tenure range is not established by the reviewed product page.",
            "Minimum age, income, and credit-score criteria are not established by the reviewed product page.",
        ],
        "caveat": "The product page directs applicants to the bank for further information.",
    },
]


def list_lenders() -> list[dict[str, Any]]:
    return LENDERS.copy()


def _range_result(criterion: dict[str, Any], value: float | None) -> dict[str, Any]:
    if value is None:
        status = "unknown"
        explanation = "This applicant value was not provided, so it cannot be evaluated."
    elif value < criterion["minimum"] or value > criterion["maximum"]:
        status = "mismatch"
        explanation = (
            f"The provided value is outside the published range "
            f"{criterion['minimum']}–{criterion['maximum']}."
        )
    else:
        status = "match"
        explanation = "The provided value falls within the published range only; this is not an approval."
    return {
        "criterion": criterion["label"],
        "status": status,
        "explanation": explanation,
        "source_url": criterion["source_url"],
    }


def match_lenders(profile: dict[str, Any]) -> list[dict[str, Any]]:
    results = []
    for lender in LENDERS:
        evaluations: list[dict[str, Any]] = []
        if lender["id"] == "hdfc-personal-loan":
            amount_rule = lender["criteria"][0]
            term_rule = lender["criteria"][1]
            evaluations.append(
                _range_result(amount_rule, profile.get("loan_amount"))
            )
            evaluations.append(
                _range_result(term_rule, profile.get("loan_term"))
            )
        else:
            employment_type = profile.get("employment_type")
            has_salary_account = profile.get("has_sbi_salary_account")
            self_employed = profile.get("self_employed")
            if employment_type == "self_employed" or (
                employment_type is None and self_employed is True
            ):
                status = "mismatch"
                explanation = "The published product page describes salaried employees."
            elif employment_type == "salaried" and self_employed is not True and has_salary_account is True:
                status = "match"
                explanation = "The supplied employment and salary-account details align with the page description."
            elif employment_type == "salaried" and self_employed is True:
                status = "unknown"
                explanation = "Supplied employment fields conflict and need user clarification."
            else:
                status = "unknown"
                explanation = "Salaried status and an SBI salary account have not both been confirmed."
            evaluations.append(
                {
                    "criterion": lender["criteria"][0]["label"],
                    "status": status,
                    "explanation": explanation,
                    "source_url": lender["criteria"][0]["source_url"],
                }
            )

        statuses = {item["status"] for item in evaluations}
        if "mismatch" in statuses:
            status = "Potential mismatch with published criteria"
        elif "unknown" in statuses or lender["unknown_criteria"]:
            status = "Insufficient information"
        else:
            status = "Published criteria appear compatible"
        results.append(
            {
                "lender_id": lender["id"],
                "lender_name": lender["name"],
                "category": lender["category"],
                "status": status,
                "criteria": evaluations,
                "unknown_criteria": lender["unknown_criteria"],
                "product_url": lender["product_url"],
                "application_url": lender["application_url"],
                "last_verified": lender["last_verified"],
                "caveat": lender["caveat"],
            }
        )
    return results
