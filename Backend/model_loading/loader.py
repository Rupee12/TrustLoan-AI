from pathlib import Path

import joblib
import shap
import streamlit as st


PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_DIR = PROJECT_ROOT / "models" / "v2"


@st.cache_resource
def load_artifacts():
    model = joblib.load(MODEL_DIR / "loan_eligibility_model_v2.pkl")
    config = joblib.load(MODEL_DIR / "model_config_v2.pkl")
    xai = joblib.load(MODEL_DIR / "xai_artifacts_v2.pkl")
    explainer = shap.TreeExplainer(
        model.named_steps["model"],
        data=xai["background_data"],
        feature_perturbation="interventional",
    )
    return model, config, xai, explainer
