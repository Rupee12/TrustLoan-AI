import csv
import json
from functools import lru_cache
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[2]
METRICS_PATH = PROJECT_ROOT / "models" / "v2" / "metrics_v2.json"
BENCHMARK_PATH = PROJECT_ROOT / "models" / "v2" / "benchmark_results.csv"


@lru_cache(maxsize=1)
def get_insights() -> dict[str, Any]:
    metrics = json.loads(METRICS_PATH.read_text(encoding="utf-8"))
    with BENCHMARK_PATH.open(newline="", encoding="utf-8") as file:
        benchmark = list(csv.DictReader(file))

    return {
        "deployed_model": metrics["model"],
        "held_out_test": {
            "dataset_rows": metrics["dataset_rows"],
            "training_rows": metrics["training_rows"],
            "testing_rows": metrics["testing_rows"],
            "accuracy": metrics["accuracy"],
            "precision": metrics["precision_weighted"],
            "recall": metrics["recall_weighted"],
            "f1": metrics["f1_weighted"],
            "roc_auc": metrics["roc_auc"],
        },
        "cross_validation": [
            {
                "model": row["model"],
                "accuracy": float(row["cv_accuracy"]),
                "precision": float(row["cv_precision"]),
                "recall": float(row["cv_recall"]),
                "f1": float(row["cv_f1"]),
                "roc_auc": float(row["cv_roc_auc"]),
            }
            for row in benchmark
        ],
    }
