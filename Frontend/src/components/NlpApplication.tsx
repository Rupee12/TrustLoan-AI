import { useState } from 'react';
import { extractNlp, nlpFieldLabels, type NlpFields, type NlpResponse } from '../utils/phase2';

interface NlpApplicationProps {
  onApply: (fields: NlpResponse) => void;
}

const fieldNames: (keyof NlpFields)[] = [
  'no_of_dependents',
  'education',
  'self_employed',
  'income_annum',
  'loan_amount',
  'loan_term',
  'cibil_score',
  'residential_assets_value',
  'commercial_assets_value',
  'luxury_assets_value',
  'bank_asset_value',
];

export default function NlpApplication({ onApply }: NlpApplicationProps) {
  const [text, setText] = useState('');
  const [extracted, setExtracted] = useState<NlpResponse | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleExtract = async () => {
    setIsExtracting(true);
    setError(null);
    setConfirmed(false);
    try {
      setExtracted(await extractNlp(text));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to extract fields.');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 mb-6 border border-cyan-500/20">
      <div className="mb-4">
        <p className="text-xs font-semibold text-cyan-300 uppercase tracking-widest">Natural-language application</p>
        <h2 className="text-white text-lg font-semibold mt-1">Describe your loan application</h2>
        <p className="text-xs text-slate-400 mt-1">
          Extracted values are suggestions only. Review them, then copy them into the existing form;
          information not stated in your description is not inferred.
        </p>
      </div>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={4000}
        placeholder="I earn ₹8 lakh annually, have a CIBIL score of 760 and need ₹20 lakh for 5 years."
        className="w-full min-h-24 bg-white/[0.04] border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-cyan-500/50"
      />
      <button onClick={() => void handleExtract()} disabled={!text.trim() || isExtracting} className="mt-3 bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
        {isExtracting ? 'Extracting...' : 'Extract fields'}
      </button>

      {extracted && (
        <>
          {extracted.income_monthly !== null && (
            <p className="text-xs text-cyan-200 mt-4">
              Explicit monthly income detected: ₹{extracted.income_monthly.toLocaleString('en-IN')} / month.
              Annual income was converted for the existing model and must be reviewed.
            </p>
          )}
          {extracted.loan_purpose && <p className="text-xs text-slate-400 mt-2">Detected purpose (not used by the model): {extracted.loan_purpose}</p>}

          <div className="grid sm:grid-cols-2 gap-2 mt-4">
            {fieldNames.filter((field) => extracted[field] !== null).map((field) => (
              <div key={field} className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                <p className="text-xs text-slate-400">{nlpFieldLabels[field]}</p>
                <p className="text-sm text-white mt-0.5">
                  {String(extracted[field])}
                  {extracted.confidence[field] !== undefined && (
                    <span className="text-xs text-slate-500 ml-2">{Math.round(extracted.confidence[field] * 100)}% extraction confidence</span>
                  )}
                </p>
              </div>
            ))}
            {fieldNames.every((field) => extracted[field] === null) && (
              <p className="text-xs text-slate-400">No model fields were confidently extracted.</p>
            )}
          </div>

          {extracted.ambiguous_fields.length > 0 && (
            <p className="text-xs text-amber-300 mt-3">
              Ambiguous values need clarification: {extracted.ambiguous_fields.map((field) => nlpFieldLabels[field as keyof NlpFields]).join(', ')}.
            </p>
          )}
          {extracted.validation_errors.map((message) => (
            <p key={message} className="text-xs text-red-300 mt-2">{message} Invalid values will not be copied.</p>
          ))}
          {extracted.missing_required_fields.length > 0 && (
            <p className="text-xs text-amber-300 mt-3">
              Not found in your description: {extracted.missing_required_fields.map((field) => nlpFieldLabels[field as keyof NlpFields]).join(', ')}.
              Review and complete these fields in the existing form below.
            </p>
          )}

          <label className="flex items-start gap-2 text-xs text-slate-300 mt-4">
            <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
            I confirm the extracted values shown above and want to apply them to the existing eligibility form.
          </label>
          <button
            onClick={() => onApply(extracted)}
            disabled={!confirmed}
            className="mt-4 bg-gradient-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            Apply to existing form
          </button>
        </>
      )}
      {error && <p role="alert" className="text-xs text-red-300 mt-3">{error}</p>}
    </div>
  );
}
