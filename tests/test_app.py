
import pytest
from streamlit.testing.v1 import AppTest
from pathlib import Path

APP = str(Path(__file__).resolve().parent.parent / "app.py")




def run_app():
    at = AppTest.from_file(
        APP,
        default_timeout=20,
    )
    at.run(timeout=20)
    return at


def click_button(at, label):
    matches = [b for b in at.button if b.label == label]
    assert matches, f"Button not found: {label!r}"
    matches[0].click().run()


def set_number(at, label, value):
    matches = [w for w in at.number_input if w.label == label]
    assert matches, f"Number input not found: {label!r}"
    matches[0].set_value(value).run()


def set_selectbox(at, label, value):
    matches = [w for w in at.selectbox if w.label == label]
    assert matches, f"Selectbox not found: {label!r}"
    matches[0].set_value(value).run()


def test_app_starts():
    at = run_app()

    assert not at.exception

    # Initial state should be Step 1.
    assert at.session_state["form_step"] == 1


def test_step_1_to_step_2():
    at = run_app()

    set_selectbox(at, "Number of Dependents", "2")
    set_selectbox(at, "Education", "graduate")

    click_button(at, "Continue to financial profile  →")

    assert not at.exception
    assert at.session_state["form_step"] == 2
    assert at.session_state["v2_dependents"] == "2"
    assert at.session_state["v2_education"] == "graduate"


def test_mandatory_financial_fields():
    at = run_app()

    click_button(at, "Continue to financial profile  →")

    # Step 2 is now visible. Leaving income and loan amount at 0
    # should prevent navigation to Step 3.
    click_button(at, "Continue to credit profile  →")

    assert not at.exception
    assert at.session_state["form_step"] == 2
    assert len(at.error) >= 1


def test_financial_values_persist():
    at = run_app()

    click_button(at, "Continue to financial profile  →")

    set_number(at, "Annual Income (₹) *", 350000)
    set_number(at, "Requested Loan Amount (₹) *", 1500000)
    set_selectbox(at, "Loan Term", "5 years")

    click_button(at, "Continue to credit profile  →")

    assert not at.exception
    assert at.session_state["form_step"] == 3

    assert at.session_state["v2_income"] == 350000
    assert at.session_state["v2_loan_amount"] == 1500000
    assert at.session_state["v2_loan_term"] == "5 years"


def test_cibil_600_does_not_revert_to_700():
    at = run_app()

    # Step 1 -> Step 2
    click_button(at, "Continue to financial profile  →")

    # Required financial values
    set_number(at, "Annual Income (₹) *", 350000)
    set_number(at, "Requested Loan Amount (₹) *", 1500000)
    set_selectbox(at, "Loan Term", "5 years")

    click_button(at, "Continue to credit profile  →")

    # Step 3
    set_number(at, "CIBIL Score", 600)

    click_button(at, "Review application  →")

    assert not at.exception
    assert at.session_state["form_step"] == 4

    # This is the regression test for the old 600 -> 700 bug.
    assert at.session_state["v2_cibil"] == 600

    # Go back and verify the widget itself still contains 600.
    click_button(at, "← Back")

    assert not at.exception
    cibil = [w for w in at.number_input if w.label == "CIBIL Score"]
    assert cibil
    assert cibil[0].value == 600


def test_all_asset_values_persist():
    at = run_app()

    click_button(at, "Continue to financial profile  →")

    set_number(at, "Annual Income (₹) *", 350000)
    set_number(at, "Requested Loan Amount (₹) *", 1500000)
    set_selectbox(at, "Loan Term", "5 years")

    click_button(at, "Continue to credit profile  →")

    set_number(at, "CIBIL Score", 600)
    set_number(at, "Residential Assets (₹)", 500000)
    set_number(at, "Commercial Assets (₹)", 200000)
    set_number(at, "Luxury Assets (₹)", 100000)
    set_number(at, "Bank Assets (₹)", 300000)

    click_button(at, "Review application  →")

    assert not at.exception

    assert at.session_state["v2_residential_assets"] == 500000
    assert at.session_state["v2_commercial_assets"] == 200000
    assert at.session_state["v2_luxury_assets"] == 100000
    assert at.session_state["v2_bank_assets"] == 300000


def test_full_analyze_workflow():
    at = run_app()

    # Step 1
    click_button(at, "Continue to financial profile  →")

    # Step 2
    set_number(at, "Annual Income (₹) *", 350000)
    set_number(at, "Requested Loan Amount (₹) *", 1500000)
    set_selectbox(at, "Loan Term", "5 years")
    click_button(at, "Continue to credit profile  →")

    # Step 3
    set_number(at, "CIBIL Score", 600)
    set_number(at, "Residential Assets (₹)", 500000)
    set_number(at, "Commercial Assets (₹)", 200000)
    set_number(at, "Luxury Assets (₹)", 100000)
    set_number(at, "Bank Assets (₹)", 300000)
    click_button(at, "Review application  →")

    # Step 4
    assert at.session_state["form_step"] == 4
    assert at.session_state["v2_cibil"] == 600
    assert at.session_state["v2_income"] == 350000
    assert at.session_state["v2_loan_amount"] == 1500000
    assert at.session_state["v2_loan_term"] == "5 years"

    click_button(at, "✦  Analyze my loan eligibility")

    # app.py should now have produced the model result.
    assert not at.exception

    # The application must have at least one rendered result section.
    page_text = " ".join(
        getattr(x, "value", "")
        for x in at.text
        if isinstance(getattr(x, "value", ""), str)
    )

    assert (
        "AI ASSESSMENT" in page_text
        or "APPROVAL PROBABILITY" in page_text
    )


@pytest.mark.parametrize("score", [300, 600, 700, 900])
def test_cibil_boundary_values(score):
    at = run_app()

    click_button(at, "Continue to financial profile  →")

    set_number(at, "Annual Income (₹) *", 350000)
    set_number(at, "Requested Loan Amount (₹) *", 1500000)
    set_selectbox(at, "Loan Term", "5 years")
    click_button(at, "Continue to credit profile  →")

    set_number(at, "CIBIL Score", score)
    click_button(at, "Review application  →")

    assert not at.exception
    assert at.session_state["v2_cibil"] == score
