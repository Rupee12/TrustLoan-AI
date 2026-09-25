import time
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix
)


# ============================================================
# 1. LOAD DATA
# ============================================================

DATA_PATH = "Backend/data/loan_approval_dataset.csv"

df = pd.read_csv(DATA_PATH)

# Remove whitespace from column names
df.columns = df.columns.str.strip()

target = "loan_status"

features = [
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

X = df[features].copy()
y = df[target].str.strip()


# ============================================================
# 2. TRAIN / TEST SPLIT
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


# ============================================================
# 3. PREPROCESSING
# ============================================================

numeric_features = [
    "no_of_dependents",
    "income_annum",
    "loan_amount",
    "loan_term",
    "cibil_score",
    "residential_assets_value",
    "commercial_assets_value",
    "luxury_assets_value",
    "bank_asset_value",
]

categorical_features = [
    "education",
    "self_employed",
]

preprocessor = ColumnTransformer(
    transformers=[
        (
            "num",
            Pipeline([
                ("imputer", SimpleImputer(strategy="median"))
            ]),
            numeric_features,
        ),
        (
            "cat",
            Pipeline([
                ("imputer", SimpleImputer(strategy="most_frequent")),
                (
                    "onehot",
                    OneHotEncoder(
                        handle_unknown="ignore",
                        sparse_output=False
                    ),
                ),
            ]),
            categorical_features,
        ),
    ]
)


# ============================================================
# 4. MODELS
# ============================================================

models = {

    "Random Forest": RandomForestClassifier(
        n_estimators=300,
        min_samples_split=10,
        min_samples_leaf=1,
        max_features=None,
        max_depth=8,
        n_jobs=-1,
        random_state=42,
    ),

    "Gradient Boosting": GradientBoostingClassifier(
        n_estimators=500,
        min_samples_leaf=8,
        max_depth=2,
        learning_rate=0.04,
        random_state=42,
    ),
}


# ============================================================
# 5. TRAIN + EVALUATE
# ============================================================

results = []

for name, model in models.items():

    print("\n" + "=" * 70)
    print(name)
    print("=" * 70)

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("model", model),
    ])

    start = time.perf_counter()

    pipeline.fit(X_train, y_train)

    training_time = time.perf_counter() - start

    start = time.perf_counter()

    predictions = pipeline.predict(X_test)
    probabilities = pipeline.predict_proba(X_test)

    prediction_time = time.perf_counter() - start

    classes = pipeline.named_steps["model"].classes_

    approved_index = next(
        i
        for i, cls in enumerate(classes)
        if str(cls).strip().lower() == "approved"
    )

    approved_probability = probabilities[:, approved_index]

    accuracy = accuracy_score(y_test, predictions)

    precision = precision_score(
        y_test,
        predictions,
        pos_label="Approved"
    )

    recall = recall_score(
        y_test,
        predictions,
        pos_label="Approved"
    )

    f1 = f1_score(
        y_test,
        predictions,
        pos_label="Approved"
    )

    roc_auc = roc_auc_score(
        (y_test == "Approved").astype(int),
        approved_probability
    )

    cm = confusion_matrix(
        y_test,
        predictions,
        labels=["Approved", "Rejected"]
    )

    print(f"Accuracy      : {accuracy:.4f}")
    print(f"Precision     : {precision:.4f}")
    print(f"Recall        : {recall:.4f}")
    print(f"F1 Score      : {f1:.4f}")
    print(f"ROC-AUC       : {roc_auc:.4f}")
    print(f"Training time : {training_time:.4f}s")
    print(f"Prediction    : {prediction_time:.4f}s")

    print("\nConfusion Matrix:")
    print(cm)

    results.append({
        "Model": name,
        "Accuracy": accuracy,
        "Precision": precision,
        "Recall": recall,
        "F1": f1,
        "ROC-AUC": roc_auc,
        "Training Time": training_time,
        "Prediction Time": prediction_time,
    })


# ============================================================
# 6. COMPARISON TABLE
# ============================================================

results_df = pd.DataFrame(results)

print("\n\n")
print("=" * 100)
print("FINAL MODEL COMPARISON")
print("=" * 100)

print(
    results_df.to_string(
        index=False,
        float_format=lambda x: f"{x:.4f}"
    )
)

results_df.to_csv(
    "manual_model_comparison.csv",
    index=False
)

print("\nSaved:")
print("manual_model_comparison.csv")