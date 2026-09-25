import { useState } from 'react';
import type { FormData } from '../types';
import { extractNlp, nlpFieldLabels, nlpToFormData, type NlpFields, type NlpResponse } from '../utils/phase2';

interface NlpApplicationProps {
  onAnalyze: (data: FormData) => Promise<void>;
}

const initialFields: NlpFields = {
  no_of_dependents: null,
  education: null,
  self_employed: null,
  income_annum: null,
  loan_amount: null,
  loan_term: null,
  cibil_score: null,
  residential_assets_value: null,
  commercial_assets_value: null,
  luxury_assets_value: null,
  bank_asset_value: null,
};

const numericFields: (keyof NlpFields)[] = [
  'no_of_dependents', 'income_annum', 'loan_amount', 'loan_term', 'cibil_score',
  'residential_assets_value', 'commercial_assets_value', 'luxury_assets_value', 'bank_asset_value',
];

export default function NlpApplication({ onAnalyze }: NlpApplicationProps) {
  const [text, setText] = useState('');
  const [fields, setFields] = useState<NlpFields>(initialFields);
  const [missing, setMissing] = useState<string[]>(Object.keys(initialFields));
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const updateField = (field: keyof NlpFields, value: string) => {
    const nextValue = numericFields.includes(field) ? (value === '' ? null : Number(value)) : value || null;
    const nextFields = { ...fields, [field]: nextValue } as NlpFields;
    setFields(nextFields);
    setMissing(Object.keys(nextFields).filter((key) => nextFields[key as keyof NlpFields] === null));
  };

  const handleExtract = async () => {
    setIsExtracting(true);
    setError(null);
    try {
      const response: NlpResponse = await extractNlp(text);
      setFields(response);
      setMissing(response.missing_required_fields);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to extract fields.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAnalyze = async () => {
    if (missing.length) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      await onAnalyze(nlpToFormData(fields));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to analyze the application.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 mb-6 border border-cyan-500/20">
      <div className="mb-4">
        <p className="text-xs font-semibold text-cyan-300 uppercase tracking-widest">Natural-language application</p>
        <h2 className="text-white text-lg font-semibold mt-1">Describe your loan application</h2>
        <p className="text-xs text-slate-400 mt-1">Only values identified in your text are extracted. Missing values remain blank until you provide them.</p>
      </div>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="I earn ₹8 lakh annually, have a CIBIL score of 760 and need ₹20 lakh for 10 years."
        className="w-full min-h-24 bg-white/[0.04] border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-cyan-500/50"
      />
      <button onClick={() => void handleExtract()} disabled={!text.trim() || isExtracting} className="mt-3 bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
        {isExtracting ? 'Extracting...' : 'Extract fields'}
      </button>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
        {(Object.keys(nlpFieldLabels) as (keyof NlpFields)[]).map((field) => (
          <label key={field} className="text-xs text-slate-400">
            {nlpFieldLabels[field]}
            {field === 'education' || field === 'self_employed' ? (
              <select value={fields[field] ?? ''} onChange={(event) => updateField(field, event.target.value)} className="mt-1 w-full bg-[#0d1426] border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                <option value="">Not extracted</option>
                {field === 'education' ? <><option value="Graduate">Graduate</option><option value="Not Graduate">Not Graduate</option></> : <><option value="Yes">Self Employed</option><option value="No">Salaried / Other</option></>}
              </select>
            ) : (
              <input type="number" value={fields[field] ?? ''} onChange={(event) => updateField(field, event.target.value)} className="mt-1 w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            )}
          </label>
        ))}
      </div>

      {missing.length > 0 && <p className="text-xs text-amber-300 mt-4">Missing required fields: {missing.map((field) => nlpFieldLabels[field as keyof NlpFields]).join(', ')}</p>}
      {error && <p className="text-xs text-red-300 mt-3">{error}</p>}
      <button onClick={() => void handleAnalyze()} disabled={missing.length > 0 || isAnalyzing} className="mt-4 bg-gradient-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
        {isAnalyzing ? 'Analyzing application...' : 'Analyze Application'}
      </button>
    </div>
  );
}
