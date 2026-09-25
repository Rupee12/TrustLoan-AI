from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import pandas as pd

from schemas.loan import LoanApplication


PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = PROJECT_ROOT / "models" / "v2" / "loan_eligibility_model_v2.pkl"


class ModelService:
    def __init__(self, model_path: Path = MODEL_PATH) -> None:
        self.model_path = model_path
        self.pipeline = joblib.load(model_path)

    def predict(self, application: LoanApplication) -> dict[str, Any]:
        input_data = pd.DataFrame([application.model_dump()])
        prediction = self.pipeline.predict(input_data)[0]
        probabilities = self.pipeline.predict_proba(input_data)[0]
        classes = self.pipeline.named_steps["model"].classes_

        approved_index = next(
            (
                index
                for index, class_name in enumerate(classes)
                if str(class_name).strip().lower() == "approved"
            ),
            None,
        )
        if approved_index is None:
            raise RuntimeError("Approved class was not found in the saved model.")

        eligible = str(prediction).strip().lower() == "approved"
        probability = float(probabilities[approved_index])
        risk_score = round(probability * 100)

        if probability >= 0.75:
            risk_category = "Low"
        elif probability >= 0.55:
            risk_category = "Medium"
        elif probability >= 0.40:
            risk_category = "High"
        else:
            risk_category = "Very High"

        return {
            "prediction": "Approved" if eligible else "Rejected",
            "eligible": eligible,
            "probability": probability,
            "risk_score": risk_score,
            "risk_category": risk_category,
        }


@lru_cache(maxsize=1)
def get_model_service() -> ModelService:
    return ModelService()
