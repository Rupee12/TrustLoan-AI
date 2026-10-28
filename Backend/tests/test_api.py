from fastapi.testclient import TestClient

from main import app
from schemas.loan import LoanApplication
from services.model_service import ModelService


client = TestClient(app)


VALID_APPLICATION = {
    "no_of_dependents": 2,
    "education": "Graduate",
    "self_employed": "No",
    "income_annum": 900000,
    "loan_amount": 1500000,
    "loan_term": 1,
    "cibil_score": 720,
    "residential_assets_value": 2500000,
    "commercial_assets_value": 0,
    "luxury_assets_value": 500000,
    "bank_asset_value": 800000,
}

MODEL_FEATURES = {
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
}


def test_root_and_health():
    assert client.get("/").json() == {
        "name": "TrustLoan AI",
        "status": "running",
        "version": "1.0.0",
    }
    assert client.get("/health").json() == {"status": "healthy"}


def test_model_input_schema_has_exactly_the_eleven_trained_features():
    application = LoanApplication.model_validate(VALID_APPLICATION)
    assert set(application.model_dump()) == MODEL_FEATURES
    assert "loan_id" not in application.model_dump()


def test_approved_probability_uses_matching_model_class_column():
    class FakeModel:
        classes_ = ["Rejected", "Approved"]

    class FakePipeline:
        named_steps = {"model": FakeModel()}

        def predict(self, _):
            return ["Rejected"]

        def predict_proba(self, _):
            return [[0.8, 0.2]]

    service = ModelService.__new__(ModelService)
    service.pipeline = FakePipeline()
    result = service.predict(LoanApplication.model_validate(VALID_APPLICATION))
    assert result["prediction"] == "Rejected"
    assert result["probability"] == 0.2


def test_predict_uses_saved_model_response_shape():
    response = client.post("/api/predict", json=VALID_APPLICATION)
    assert response.status_code == 200
    body = response.json()
    assert body["prediction"] in {"Approved", "Rejected"}
    assert isinstance(body["eligible"], bool)
    assert 0 <= body["probability"] <= 1
    assert 0 <= body["risk_score"] <= 100
    assert body["risk_category"] in {"Low", "Medium", "High", "Very High"}


def test_invalid_cibil_is_rejected():
    payload = {**VALID_APPLICATION, "cibil_score": 901}
    assert client.post("/api/predict", json=payload).status_code == 422


def test_negative_loan_amount_is_rejected():
    payload = {**VALID_APPLICATION, "loan_amount": -1}
    assert client.post("/api/predict", json=payload).status_code == 422


def test_missing_field_is_rejected():
    payload = {key: value for key, value in VALID_APPLICATION.items() if key != "loan_amount"}
    assert client.post("/api/predict", json=payload).status_code == 422
