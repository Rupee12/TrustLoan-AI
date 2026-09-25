import os

from fastapi.testclient import TestClient

from main import app
from services import advisor_service


client = TestClient(app)

VALID_APPLICATION = {
    "no_of_dependents": 2,
    "education": "Graduate",
    "self_employed": "Yes",
    "income_annum": 800000,
    "loan_amount": 2000000,
    "loan_term": 10,
    "cibil_score": 760,
    "residential_assets_value": 0,
    "commercial_assets_value": 0,
    "luxury_assets_value": 0,
    "bank_asset_value": 0,
}


def test_insights_use_saved_artifacts():
    body = client.get("/api/insights").json()
    assert body["deployed_model"] == "Random Forest"
    assert body["held_out_test"]["testing_rows"] == 854
    assert len(body["cross_validation"]) == 5
    assert {row["model"] for row in body["cross_validation"]} == {
        "Logistic Regression",
        "Random Forest",
        "Extra Trees",
        "Gradient Boosting",
        "XGBoost",
    }


def test_nlp_extracts_only_identifiable_values():
    response = client.post(
        "/api/nlp/extract",
        json={"text": "I earn 8 lakh per year, my CIBIL is 760, I need a 20 lakh loan for 10 years. I am a graduate and self employed."},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["income_annum"] == 800000
    assert body["loan_amount"] == 2000000
    assert body["loan_term"] == 10
    assert body["cibil_score"] == 760
    assert body["education"] == "Graduate"
    assert body["self_employed"] == "Yes"
    assert body["no_of_dependents"] is None
    assert "no_of_dependents" in body["missing_required_fields"]


def test_nlp_reports_missing_fields_without_defaults():
    body = client.post("/api/nlp/extract", json={"text": "I need a loan."}).json()
    assert body["income_annum"] is None
    assert body["cibil_score"] is None
    assert len(body["missing_required_fields"]) == 11


def test_shap_endpoint_returns_real_values():
    response = client.post("/api/shap", json=VALID_APPLICATION)
    assert response.status_code == 200
    values = response.json()["shap_values"]
    assert values
    assert {"feature", "value", "raw_value", "direction"} <= values[0].keys()


def test_whatif_runs_both_saved_model_predictions():
    modified = {**VALID_APPLICATION, "cibil_score": 800}
    response = client.post("/api/whatif", json={"original": VALID_APPLICATION, "modified": modified})
    assert response.status_code == 200
    body = response.json()
    assert "probability" in body["original"]
    assert "probability" in body["modified"]
    assert "cibil_score" in body["changed_features"]


def test_advisor_without_api_key_is_graceful(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    response = client.post(
        "/api/advisor",
        json={"question": "Explain this result.", "prediction": "Approved", "probability": 0.8, "risk_score": 80, "applicant": VALID_APPLICATION, "shap_values": []},
    )
    assert response.status_code == 200
    assert response.json() == {"configured": False, "message": "AI Advisor is not configured."}


def test_advisor_with_mocked_llm(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(advisor_service, "explain", lambda payload: {"configured": True, "explanation": "Evidence-based explanation.", "message": None})
    response = client.post(
        "/api/advisor",
        json={"question": "Explain this result.", "prediction": "Approved", "probability": 0.8, "risk_score": 80, "applicant": VALID_APPLICATION, "shap_values": []},
    )
    assert response.status_code == 200
    assert response.json()["explanation"] == "Evidence-based explanation."


def test_report_generates_pdf():
    response = client.post(
        "/api/report",
        json={
            "applicant": VALID_APPLICATION,
            "prediction": "Approved",
            "probability": 0.8,
            "risk_score": 80,
            "risk_category": "Low",
            "shap_values": [],
            "generated_at": "2026-09-25T12:00:00Z",
        },
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")
