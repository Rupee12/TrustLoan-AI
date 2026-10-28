import pytest

from services.finance_service import calculate_emi, detect_intent, respond
from services.knowledge_service import search_knowledge
from services.lender_service import LENDERS, match_lenders
from services.nlp_service import extract


def test_extracts_indian_amounts_and_annual_income():
    result = extract("I earn ₹9,00,000 annually and need 12 lakhs for 5 years.")
    assert result["income_annum"] == 900_000
    assert result["loan_amount"] == 1_200_000
    assert result["loan_term"] == 5
    assert result["loan_purpose"] is None


def test_monthly_income_is_retained_and_annualized():
    result = extract("My income is 75k per month.")
    assert result["income_monthly"] == 75_000
    assert result["income_annum"] == 900_000


def test_conflicting_monthly_and_annual_income_is_not_silently_resolved():
    result = extract("I earn 75k per month and earn 10 lakh annually.")
    assert result["income_monthly"] == 75_000
    assert result["income_annum"] is None
    assert "income_annum" in result["ambiguous_fields"]
    assert result["validation_errors"]


def test_ambiguous_income_is_not_assumed_annual():
    result = extract("I earn 9 lakh and need a loan.")
    assert result["income_annum"] is None
    assert "income_annum" in result["ambiguous_fields"]


def test_month_tenure_is_normalized_to_years():
    result = extract("I need a 2 lakh loan with a tenure of 18 months.")
    assert result["loan_amount"] == 200_000
    assert result["loan_term"] == 1.5


def test_missing_values_are_not_invented_and_confirmation_is_required():
    result = extract("I need a loan.")
    assert len(result["missing_required_fields"]) == 11
    assert result["cibil_score"] is None
    assert result["bank_asset_value"] is None
    assert result["requires_confirmation"] is True


def test_invalid_cibil_is_returned_with_validation_error():
    result = extract("My CIBIL score is 950.")
    assert result["cibil_score"] == 950
    assert result["validation_errors"] == ["cibil_score must be between 300 and 900."]


def test_emi_calculation_handles_zero_interest_and_standard_rate():
    assert calculate_emi(120_000, 0, 12) == {
        "monthly_emi": 10_000,
        "total_payment": 120_000,
        "total_interest": 0,
    }
    result = calculate_emi(1_000_000, 12, 12)
    assert result["monthly_emi"] == pytest.approx(88_848.79)
    assert result["total_payment"] > 1_000_000


def test_lender_rules_do_not_claim_approval_for_unknown_criteria():
    matches = match_lenders({"loan_amount": 200_000, "loan_term": 5})
    hdfc = next(item for item in matches if item["lender_id"] == "hdfc-personal-loan")
    assert hdfc["criteria"][0]["status"] == "match"
    assert hdfc["status"] == "Insufficient information"
    assert hdfc["unknown_criteria"]
    assert all(item["product_url"].startswith("https://") for item in matches)
    assert all(item["application_url"].startswith("https://") for item in matches)


def test_lender_mismatch_and_unconfirmed_salary_account():
    sbi = next(
        item
        for item in match_lenders({"self_employed": True})
        if item["lender_id"] == "sbi-personal-loan"
    )
    assert sbi["status"] == "Potential mismatch with published criteria"
    unknown_sbi = next(
        item
        for item in match_lenders({"self_employed": False})
        if item["lender_id"] == "sbi-personal-loan"
    )
    assert unknown_sbi["criteria"][0]["status"] == "unknown"
    assert unknown_sbi["status"] == "Insufficient information"
    matched_sbi = next(
        item
        for item in match_lenders(
            {"employment_type": "salaried", "has_sbi_salary_account": True}
        )
        if item["lender_id"] == "sbi-personal-loan"
    )
    assert matched_sbi["criteria"][0]["status"] == "match"
    assert matched_sbi["status"] == "Insufficient information"


def test_lender_catalogue_is_personal_loan_only_with_official_sources():
    assert LENDERS
    assert {lender["category"] for lender in LENDERS} == {"personal_loan"}
    for lender in LENDERS:
        assert lender["product_url"].startswith("https://")
        for criterion in lender["criteria"]:
            assert criterion["source_url"].startswith("https://")


def test_knowledge_search_cites_retrieved_evidence_or_reports_insufficient():
    found = search_knowledge("HDFC loan amount and tenure")
    assert found["results"]
    assert found["results"][0]["source_url"].startswith("https://")
    assert found["results"][0]["verified_at"]
    absent = search_knowledge("cryptocurrency tax returns")
    assert absent["results"] == []
    assert "not contain enough information" in absent["answer"]


def test_intent_detection_and_one_question_at_a_time_flow():
    assert detect_intent("What will my EMI be?") == "CALCULATE_EMI"
    assert detect_intent("Compare lenders") == "COMPARE_LENDERS"
    response = respond("Check my eligibility")
    assert response["intent"] == "CHECK_ELIGIBILITY"
    assert response["requires_user_input"] is True
    assert response["follow_up_question"] == "How many dependents should I include?"
    assert response["configured"] is False
