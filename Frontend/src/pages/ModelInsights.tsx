import { useEffect, useState } from 'react';
import type { Page } from '../types';

interface ModelInsightsProps {
  onNavigate: (page: Page) => void;
}

interface BenchmarkRow {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
}

interface Insights {
  deployed_model: string;
  held_out_test: {
    dataset_rows: number;
    training_rows: number;
    testing_rows: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    roc_auc: number;
  };
  cross_validation: BenchmarkRow[];
}

interface HeldOutComparisonRow {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
  training_time: number;
  prediction_time: number;
  deployed?: boolean;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

const percentage = (value: number) =>
  `${(value * 100).toFixed(2)}%`;

function MetricPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-xs text-slate-500 mb-1.5">{label}</p>

      <p
        className={`text-3xl font-bold ${color}`}
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        {value}
      </p>
    </div>
  );
}

export default function ModelInsights({
  onNavigate,
}: ModelInsightsProps) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch(`${API_BASE_URL}/api/insights`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Unable to load model metrics.');
        }

        return response.json() as Promise<Insights>;
      })
      .then((data) => {
        if (active) {
          setInsights(data);
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : 'Unable to load model metrics.',
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-red-300">
        {error}
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-slate-400">
        Loading model metrics...
      </div>
    );
  }

  const test = insights.held_out_test;

  /*
   * These are the manually evaluated held-out test results
   * using the SAME 80/20 stratified split and Random Forest
   * configuration used for the current deployed model.
   *
   * Gradient Boosting was evaluated separately on the same
   * untouched 854-record test set.
   *
   * Metrics shown here use weighted averaging for consistency
   * with metrics_v2.json.
   */
  const heldOutComparison: HeldOutComparisonRow[] = [
    {
      model: 'Random Forest',
      accuracy: 0.9813,
      precision: 0.9814,
      recall: 0.9813,
      f1: 0.9812,
      roc_auc: 0.9983,
      training_time: 0.6595,
      prediction_time: 0.1503,
      deployed: true,
    },
    {
      model: 'Gradient Boosting',
      accuracy: 0.9766,
      precision: 0.9766,
      recall: 0.9766,
      f1: 0.9765,
      roc_auc: 0.9980,
      training_time: 1.7716,
      prediction_time: 0.0191,
      deployed: false,
    },
  ];

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">
            Model Insights & Analytics
          </h1>

          <p className="text-slate-400 text-sm">
            Metrics loaded from the saved project artifacts.
            The deployed model is {insights.deployed_model}.
          </p>
        </div>

        {/* DEPLOYED MODEL INFORMATION */}
        <div className="glass border border-emerald-500/20 rounded-2xl p-5 mb-6">
          <p className="text-xs font-semibold text-emerald-300 uppercase tracking-widest mb-2">
            Final deployed model · held-out test set
          </p>

          <p className="text-sm text-slate-300">
            These metrics describe the final Random Forest evaluation
            on {test.testing_rows} unseen test records. They are
            separate from cross-validation results and are not
            real-world guarantees.
          </p>
        </div>

        {/* FINAL RANDOM FOREST METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <MetricPill
            label="Accuracy"
            value={percentage(test.accuracy)}
            color="text-emerald-400"
          />

          <MetricPill
            label="Precision"
            value={percentage(test.precision)}
            color="text-blue-400"
          />

          <MetricPill
            label="Recall"
            value={percentage(test.recall)}
            color="text-violet-400"
          />

          <MetricPill
            label="F1 Score"
            value={percentage(test.f1)}
            color="text-cyan-400"
          />

          <MetricPill
            label="ROC-AUC"
            value={percentage(test.roc_auc)}
            color="text-amber-400"
          />
        </div>

        {/* =====================================================
            NEW: FINAL HELD-OUT MODEL COMPARISON
        ====================================================== */}
        <div className="glass rounded-2xl overflow-hidden mb-8">

          <div className="p-6 border-b border-white/[0.06]">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

              <div>
                <h2 className="text-white font-semibold">
                  Final held-out test comparison
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Random Forest and Gradient Boosting evaluated on
                  the same unseen 854-record test set.
                </p>
              </div>

              <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Model selection evidence
              </span>

            </div>

            <div className="mt-4 rounded-xl bg-white/[0.025] border border-white/[0.05] p-4">

              <p className="text-xs leading-5 text-slate-400">
                Gradient Boosting achieved a higher cross-validation
                benchmark, but Random Forest performed better on the
                same unseen held-out test set. Random Forest was
                therefore retained as the deployed model.
              </p>

            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>
                <tr className="border-b border-white/[0.06]">

                  {[
                    'Model',
                    'Accuracy',
                    'Precision',
                    'Recall',
                    'F1 Score',
                    'ROC-AUC',
                    'Train Time',
                    'Prediction',
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 whitespace-nowrap"
                    >
                      {heading}
                    </th>
                  ))}

                </tr>
              </thead>

              <tbody>

                {heldOutComparison.map((model) => (
                  <tr
                    key={model.model}
                    className={`border-b border-white/[0.04] ${
                      model.deployed
                        ? 'bg-indigo-500/[0.08]'
                        : ''
                    }`}
                  >

                    <td className="px-5 py-4 font-medium text-white whitespace-nowrap">

                      {model.model}

                      {model.deployed && (
                        <span className="ml-2 text-xs text-indigo-300">
                          Deployed
                        </span>
                      )}

                    </td>

                    <td className="px-5 py-4 font-mono text-emerald-400">
                      {percentage(model.accuracy)}
                    </td>

                    <td className="px-5 py-4 font-mono text-blue-400">
                      {percentage(model.precision)}
                    </td>

                    <td className="px-5 py-4 font-mono text-violet-400">
                      {percentage(model.recall)}
                    </td>

                    <td className="px-5 py-4 font-mono text-cyan-400">
                      {percentage(model.f1)}
                    </td>

                    <td className="px-5 py-4 font-mono text-amber-400">
                      {percentage(model.roc_auc)}
                    </td>

                    <td className="px-5 py-4 font-mono text-slate-300">
                      {model.training_time.toFixed(2)}s
                    </td>

                    <td className="px-5 py-4 font-mono text-slate-300">
                      {model.prediction_time.toFixed(3)}s
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

          <div className="px-6 py-4 border-t border-white/[0.05]">

            <p className="text-xs text-slate-500 leading-5">
              Test-set comparison uses the same dataset split and
              feature pipeline. Metrics shown for classification
              performance use weighted averaging. Training and
              prediction times are measured locally and may vary by
              hardware and environment.
            </p>

          </div>

        </div>

        {/* =====================================================
            CROSS VALIDATION
        ====================================================== */}
        <div className="glass rounded-2xl overflow-hidden mb-6">

          <div className="p-6 border-b border-white/[0.06]">

            <h2 className="text-white font-semibold">
              5-fold cross-validation benchmark
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              These values come from benchmark_results.csv.
              They are separate from the final held-out test
              comparison above.
            </p>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>
                <tr className="border-b border-white/[0.06]">

                  {[
                    'Model',
                    'Accuracy',
                    'Precision',
                    'Recall',
                    'F1 Score',
                    'ROC-AUC',
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3"
                    >
                      {heading}
                    </th>
                  ))}

                </tr>
              </thead>

              <tbody>

                {insights.cross_validation.map((model) => (
                  <tr
                    key={model.model}
                    className={`border-b border-white/[0.04] ${
                      model.model === insights.deployed_model
                        ? 'bg-indigo-500/[0.08]'
                        : ''
                    }`}
                  >

                    <td className="px-5 py-3.5 font-medium text-white">

                      {model.model}

                      {model.model === insights.deployed_model && (
                        <span className="ml-2 text-xs text-indigo-300">
                          Deployed
                        </span>
                      )}

                    </td>

                    <td className="px-5 py-3.5 font-mono text-emerald-400">
                      {percentage(model.accuracy)}
                    </td>

                    <td className="px-5 py-3.5 font-mono text-blue-400">
                      {percentage(model.precision)}
                    </td>

                    <td className="px-5 py-3.5 font-mono text-violet-400">
                      {percentage(model.recall)}
                    </td>

                    <td className="px-5 py-3.5 font-mono text-cyan-400">
                      {percentage(model.f1)}
                    </td>

                    <td className="px-5 py-3.5 font-mono text-amber-400">
                      {percentage(model.roc_auc)}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </div>

        {/* =====================================================
            DATASET
        ====================================================== */}
        <div className="grid md:grid-cols-3 gap-4">

          <MetricPill
            label="Dataset records"
            value={test.dataset_rows}
            color="text-white"
          />

          <MetricPill
            label="Training records"
            value={test.training_rows}
            color="text-white"
          />

          <MetricPill
            label="Test records"
            value={test.testing_rows}
            color="text-white"
          />

        </div>

      </div>
    </div>
  );
}