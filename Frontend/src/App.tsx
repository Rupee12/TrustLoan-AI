import { useState } from 'react';
import type { Page, FormData, PredictionResult, WhatIfComparison } from './types';
import { defaultFormData } from './types';
import { runPrediction } from './utils/predict';

import Nav from './components/Nav';
import Home from './pages/Home';
import Eligibility from './pages/Eligibility';
import Result from './pages/Result';
import SHAP from './pages/SHAP';
import AIAdvisor from './pages/AIAdvisor';
import WhatIf from './pages/WhatIf';
import ModelInsights from './pages/ModelInsights';
import ResponsibleAI from './pages/ResponsibleAI';
import Report from './pages/Report';
import About from './pages/About';

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [whatIfResult, setWhatIfResult] = useState<WhatIfComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = (p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleComplete = async (application: FormData = formData) => {
    setIsLoading(true);
    setError(null);
    try {
      const r = await runPrediction(application);
      setResult(r);
      navigate('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate a prediction.');
    } finally {
      setIsLoading(false);
    }
  };

  // AI advisor page uses flex layout, so exclude padding wrapper
  const isFullHeight = page === 'advisor';

  return (
    <div className="flex min-h-screen bg-[#070b18]">
      <Nav currentPage={page} onNavigate={navigate} />

      <main className={`flex-1 min-w-0 ${isFullHeight ? 'flex flex-col' : ''} lg:ml-0`} style={{ paddingTop: page !== 'home' ? undefined : undefined }}>
        {/* Mobile offset for fixed top bar */}
        <div className="lg:hidden h-14 shrink-0" />

        {page === 'home' && <Home onNavigate={navigate} />}
        {page === 'eligibility' && (
          <Eligibility
            formData={formData}
            setFormData={setFormData}
            onComplete={handleComplete}
            onNavigate={navigate}
            isLoading={isLoading}
            error={error}
          />
        )}
        {page === 'result' && result && (
          <Result result={result} formData={formData} onNavigate={navigate} />
        )}
        {page === 'result' && !result && (
          <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center glass rounded-2xl p-12 max-w-md">
              <p className="text-5xl mb-4">🔍</p>
              <h2 className="text-white font-bold text-xl mb-2">No Assessment Yet</h2>
              <p className="text-slate-400 text-sm mb-6">Complete an eligibility assessment to see your prediction result.</p>
              <button
                onClick={() => navigate('eligibility')}
                className="bg-gradient-primary text-white px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
              >
                Start Assessment →
              </button>
            </div>
          </div>
        )}
        {page === 'shap' && result && <SHAP result={result} onNavigate={navigate} />}
        {page === 'shap' && !result && (
          <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center glass rounded-2xl p-12 max-w-md">
              <p className="text-5xl mb-4">🔍</p>
              <h2 className="text-white font-bold text-xl mb-2">Assessment Required</h2>
              <p className="text-slate-400 text-sm mb-6">Complete an eligibility assessment to view SHAP explanations.</p>
              <button onClick={() => navigate('eligibility')} className="bg-gradient-primary text-white px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-all">
                Start Assessment →
              </button>
            </div>
          </div>
        )}
        {page === 'advisor' && (
          <AIAdvisor result={result} formData={formData} whatIf={whatIfResult} onNavigate={navigate} />
        )}
        {page === 'whatif' && (
          <WhatIf result={result} formData={formData} onNavigate={navigate} onSimulationComplete={setWhatIfResult} />
        )}
        {page === 'insights' && <ModelInsights onNavigate={navigate} />}
        {page === 'responsible' && <ResponsibleAI onNavigate={navigate} />}
        {page === 'report' && <Report result={result} formData={formData} whatIf={whatIfResult} onNavigate={navigate} />}
        {page === 'about' && <About onNavigate={navigate} />}
      </main>
    </div>
  );
}
