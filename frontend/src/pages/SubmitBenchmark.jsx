import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DataCard from '../components/ui/DataCard';
import EmptyState from '../components/ui/EmptyState';
import FilterChip from '../components/ui/FilterChip';
import ScorePill from '../components/ui/ScorePill';
import SectionHeader from '../components/ui/SectionHeader';
import GamingContextForm from '../components/community/GamingContextForm';
import TagSelector from '../components/community/TagSelector';
import { benchmarks } from '../services/api';
import api from '../services/api';
import {
  buildTrustMeta,
  formatMetricLabel,
  getMainScore
} from '../viewmodels/benchmarkViewModel';

const categoryToolDefaults = {
  cpu: { tool: 'Cinebench R23', scores: { single_core: '', multi_core: '' } },
  gpu: { tool: '3DMark Time Spy', scores: { graphics_score: '', combined_score: '' } },
  ram: { tool: 'AIDA64', scores: { read: '', write: '', copy: '', latency: '' } },
  storage: { tool: 'CrystalDiskMark', scores: { seq_read: '', seq_write: '', random_read: '', random_write: '' } }
};

const categories = ['cpu', 'gpu', 'ram', 'storage'];

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : '';
}

export default function SubmitBenchmark() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: 'cpu',
    hardwareSpecs: {
      cpu: '',
      gpu: '',
      ram: '',
      motherboard: '',
      storage: ''
    },
    software: {
      os: 'Windows 11',
      driver: '',
      bios: '',
      notes: ''
    },
    testTool: categoryToolDefaults.cpu.tool,
    scores: { ...categoryToolDefaults.cpu.scores }
  });

  // Community step state
  const [componentSearch, setComponentSearch] = useState('');
  const [componentSearchLoading, setComponentSearchLoading] = useState(false);
  const [linkedComponents, setLinkedComponents] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [gamingEnabled, setGamingEnabled] = useState(false);
  const [gamingContext, setGamingContext] = useState({});
  const [userNotes, setUserNotes] = useState('');

  const scoreFields = useMemo(
    () => Object.keys(categoryToolDefaults[formData.category]?.scores || {}),
    [formData.category]
  );

  const completion = useMemo(() => {
    const basic = formData.title.trim().length >= 3 && !!formData.category && !!formData.testTool.trim();
    const hardwareFilled = Object.values(formData.hardwareSpecs).filter(Boolean).length;
    const softwareFilled = Object.values(formData.software).filter(Boolean).length;
    const hasScores = Object.values(formData.scores).some((value) => value !== '' && value !== null);

    return {
      basic,
      env: hardwareFilled >= 2 && softwareFilled >= 1,
      scores: hasScores
    };
  }, [formData]);

  const trustPreview = useMemo(
    () => buildTrustMeta({ ...formData, scores: formData.scores }),
    [formData]
  );

  const mainScorePreview = useMemo(
    () => getMainScore({ scores: formData.scores }),
    [formData.scores]
  );

  const steps = [
    { id: 1, key: 'basic', done: completion.basic },
    { id: 2, key: 'hardware', done: completion.env },
    { id: 3, key: 'scores', done: completion.scores },
    { id: 4, key: 'community', done: true },
    { id: 5, key: 'review', done: completion.basic && completion.env && completion.scores }
  ];

  const canProceed = (targetStep = step) => {
    if (targetStep === 1) return true;
    if (targetStep === 2) return completion.basic;
    if (targetStep === 3) return completion.basic && completion.env;
    if (targetStep === 4) return completion.basic && completion.env && completion.scores;
    if (targetStep === 5) return completion.basic && completion.env && completion.scores;
    return false;
  };

  const handleAddComponent = async () => {
    const query = componentSearch.trim();
    if (!query) return;
    setComponentSearchLoading(true);
    try {
      const res = await api.get('/hardware/resolve', { params: { q: query } });
      const component = res.data?.hardware || res.data;
      if (component && component.id) {
        if (!linkedComponents.find((c) => c.id === component.id)) {
          setLinkedComponents((prev) => [...prev, component]);
        }
      }
    } catch {
      // If resolve fails, add as a plain entry with the query as name
      const fallback = { id: `custom-${Date.now()}`, name: query };
      setLinkedComponents((prev) => [...prev, fallback]);
    } finally {
      setComponentSearchLoading(false);
      setComponentSearch('');
    }
  };

  const handleRemoveComponent = (id) => {
    setLinkedComponents((prev) => prev.filter((c) => c.id !== id));
  };

  const handleCategoryChange = (category) => {
    const defaults = categoryToolDefaults[category];
    setFormData((prev) => ({
      ...prev,
      category,
      testTool: defaults.tool,
      scores: { ...defaults.scores }
    }));
  };

  const handleScoreChange = (metric, value) => {
    setFormData((prev) => ({
      ...prev,
      scores: {
        ...prev.scores,
        [metric]: value === '' ? '' : toNumber(value)
      }
    }));
  };

  const buildPayload = () => ({
    ...formData,
    hardwareSpecs: Object.fromEntries(Object.entries(formData.hardwareSpecs).filter(([, value]) => value)),
    software: Object.fromEntries(Object.entries(formData.software).filter(([, value]) => value)),
    scores: Object.fromEntries(Object.entries(formData.scores).filter(([, value]) => value !== '' && value !== null)),
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    component_ids: linkedComponents.length > 0 ? linkedComponents.map((c) => c.id) : undefined,
    gaming_context: gamingEnabled && Object.keys(gamingContext).length > 0 ? gamingContext : undefined,
    user_notes: userNotes.trim() || undefined,
    report_type: gamingEnabled ? 'gaming' : 'benchmark'
  });

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const payload = buildPayload();
      await benchmarks.submit(payload);
      navigate('/dashboard');
    } catch (submitError) {
      setError(submitError.response?.data?.error || t('benchmark.submitError'));
    } finally {
      setLoading(false);
    }
  };

  const stepProgress = Math.round((steps.filter((item) => item.done).length / steps.length) * 100);

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow={t('benchmark.submitBadge')}
        title={t('benchmark.submit')}
        subtitle={t('benchmark.submitSubtitle')}
      />

      <DataCard className="!p-4 sm:!p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip active={!advancedMode} onClick={() => setAdvancedMode(false)}>
              {t('benchmark.wizardMode')}
            </FilterChip>
            <FilterChip active={advancedMode} onClick={() => setAdvancedMode(true)}>
              {t('benchmark.advancedMode')}
            </FilterChip>
          </div>
          <ScorePill value={`${stepProgress}%`} label={t('benchmark.completion')} tone={stepProgress >= 75 ? 'high' : 'mid'} />
        </div>

        <div className="mt-4 metric-track">
          <span style={{ width: `${stepProgress}%` }} />
        </div>
      </DataCard>

      {error ? (
        <DataCard className="!border-red-300/35 !bg-red-500/10 !p-4 text-sm text-red-100">
          {error}
        </DataCard>
      ) : null}

      {!advancedMode ? (
        <DataCard>
          <div className="flex flex-wrap gap-2">
            {steps.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => canProceed(item.id) && setStep(item.id)}
                className={`chip ${step === item.id ? 'chip-active' : ''}`}
                disabled={!canProceed(item.id)}
              >
                {item.id}. {t(`benchmark.steps.${item.key}`)}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            {(step === 4 || advancedMode) && (
              <section className="space-y-4">
                <h3 className="font-display text-lg font-semibold text-slate-100">{t('benchmark.steps.community', 'Community')}</h3>

                <div>
                  <h4 className="font-semibold text-slate-200 mb-2">{t('community.hardware.title', 'Hardware Components')}</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="field flex-1"
                      placeholder={t('community.hardware.searchPlaceholder', 'Search hardware to link...')}
                      value={componentSearch}
                      onChange={(e) => setComponentSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComponent()}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary shrink-0"
                      disabled={componentSearchLoading || !componentSearch.trim()}
                      onClick={handleAddComponent}
                    >
                      {componentSearchLoading ? t('common.loading', 'Loading...') : t('common.add', 'Add')}
                    </button>
                  </div>
                  {linkedComponents.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {linkedComponents.map((comp) => (
                        <span key={comp.id} className="chip chip-active flex items-center gap-1">
                          {comp.name || comp.id}
                          <button
                            type="button"
                            className="ml-0.5 text-slate-400 hover:text-slate-200"
                            onClick={() => handleRemoveComponent(comp.id)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-slate-200 mb-2">{t('community.tags.title', 'Tags')}</h4>
                  <TagSelector selectedTags={selectedTags} onChange={setSelectedTags} maxTags={5} />
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-slate-200">{t('community.gaming.title', 'Gaming Context')}</h4>
                    <button
                      type="button"
                      className={`chip ${gamingEnabled ? 'chip-active' : ''}`}
                      onClick={() => setGamingEnabled((v) => !v)}
                    >
                      {gamingEnabled ? t('common.enabled', 'Enabled') : t('common.disabled', 'Disabled')}
                    </button>
                  </div>
                  {gamingEnabled && (
                    <GamingContextForm value={gamingContext} onChange={setGamingContext} />
                  )}
                </div>

                <div>
                  <label className="label">{t('community.notes.label', 'Notes')}</label>
                  <textarea
                    className="field"
                    rows={3}
                    maxLength={500}
                    placeholder={t('community.notes.placeholder', 'Any additional notes about this benchmark...')}
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                  />
                  <div className="mt-1 text-xs text-muted text-right">{userNotes.length}/500</div>
                </div>
              </section>
            )}

            {(step === 1 || advancedMode) && (
              <section className="space-y-3">
                <h3 className="font-display text-lg font-semibold text-slate-100">{t('benchmark.steps.basic')}</h3>
                <div>
                  <label className="label">{t('benchmark.title')}</label>
                  <input
                    type="text"
                    className="field"
                    value={formData.title}
                    onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder={t('benchmark.titlePlaceholder')}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label">{t('benchmark.category')}</label>
                    <select
                      className="field"
                      value={formData.category}
                      onChange={(event) => handleCategoryChange(event.target.value)}
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>{t(`benchmark.categories.${category}`)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">{t('benchmark.testTool')}</label>
                    <input
                      type="text"
                      className="field"
                      value={formData.testTool}
                      onChange={(event) => setFormData((prev) => ({ ...prev, testTool: event.target.value }))}
                    />
                  </div>
                </div>
              </section>
            )}

            {(step === 2 || advancedMode) && (
              <section className="space-y-3">
                <h3 className="font-display text-lg font-semibold text-slate-100">{t('benchmark.steps.hardware')}</h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(formData.hardwareSpecs).map(([key, value]) => (
                    <div key={key}>
                      <label className="label">{formatMetricLabel(key)}</label>
                      <input
                        type="text"
                        className="field"
                        value={value}
                        onChange={(event) => setFormData((prev) => ({
                          ...prev,
                          hardwareSpecs: {
                            ...prev.hardwareSpecs,
                            [key]: event.target.value
                          }
                        }))}
                      />
                    </div>
                  ))}
                </div>

                <h4 className="pt-2 font-semibold text-slate-100">{t('benchmark.software')}</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(formData.software).map(([key, value]) => (
                    <div key={key} className={key === 'notes' ? 'sm:col-span-2' : ''}>
                      <label className="label">{formatMetricLabel(key)}</label>
                      {key === 'notes' ? (
                        <textarea
                          className="field"
                          rows={3}
                          value={value}
                          onChange={(event) => setFormData((prev) => ({
                            ...prev,
                            software: {
                              ...prev.software,
                              [key]: event.target.value
                            }
                          }))}
                        />
                      ) : (
                        <input
                          type="text"
                          className="field"
                          value={value}
                          onChange={(event) => setFormData((prev) => ({
                            ...prev,
                            software: {
                              ...prev.software,
                              [key]: event.target.value
                            }
                          }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(step === 3 || advancedMode) && (
              <section className="space-y-3">
                <h3 className="font-display text-lg font-semibold text-slate-100">{t('benchmark.steps.scores')}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {scoreFields.map((field) => (
                    <div key={field}>
                      <label className="label">{formatMetricLabel(field)}</label>
                      <input
                        type="number"
                        className="field mono"
                        value={formData.scores[field] ?? ''}
                        onChange={(event) => handleScoreChange(field, event.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(step === 5 || advancedMode) && (
              <section className="space-y-3">
                <h3 className="font-display text-lg font-semibold text-slate-100">{t('benchmark.steps.review')}</h3>
                {completion.basic && completion.env && completion.scores ? (
                  <div className="grid gap-3 md:grid-cols-3">
                    <DataCard className="!p-3">
                      <div className="text-xs uppercase tracking-wider text-muted">{t('benchmark.trustIndex')}</div>
                      <div className="mt-2 font-display text-2xl font-semibold text-slate-100">{trustPreview.score}%</div>
                      <div className="text-xs text-soft">{trustPreview.label}</div>
                    </DataCard>

                    <DataCard className="!p-3">
                      <div className="text-xs uppercase tracking-wider text-muted">{t('benchmark.mainMetric')}</div>
                      <div className="mt-2 mono text-xl text-slate-100">{mainScorePreview ? mainScorePreview.value : '-'}</div>
                      <div className="text-xs text-soft">{mainScorePreview ? formatMetricLabel(mainScorePreview.key) : t('benchmark.score')}</div>
                    </DataCard>

                    <DataCard className="!p-3">
                      <div className="text-xs uppercase tracking-wider text-muted">{t('benchmark.category')}</div>
                      <div className="mt-2 font-semibold text-slate-100">{t(`benchmark.categories.${formData.category}`)}</div>
                      <div className="text-xs text-soft">{formData.testTool}</div>
                    </DataCard>
                  </div>
                ) : (
                  <EmptyState
                    title={t('benchmark.reviewIncompleteTitle')}
                    description={t('benchmark.reviewIncompleteDesc')}
                  />
                )}
              </section>
            )}
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={step <= 1}
              onClick={() => setStep((prev) => Math.max(1, prev - 1))}
            >
              {t('common.previous')}
            </button>

            {step < 5 ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={!canProceed(step + 1)}
                onClick={() => setStep((prev) => Math.min(5, prev + 1))}
              >
                {t('common.next')}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={loading || !completion.basic || !completion.env || !completion.scores}
              >
                {loading ? t('common.loading') : t('benchmark.submitBtn')}
              </button>
            )}
          </div>
        </DataCard>
      ) : (
        <DataCard>
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">{t('benchmark.title')}</label>
                <input
                  type="text"
                  className="field"
                  value={formData.title}
                  onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                />
              </div>

              <div>
                <label className="label">{t('benchmark.testTool')}</label>
                <input
                  type="text"
                  className="field"
                  value={formData.testTool}
                  onChange={(event) => setFormData((prev) => ({ ...prev, testTool: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              {categories.map((category) => (
                <FilterChip
                  key={category}
                  active={formData.category === category}
                  onClick={() => handleCategoryChange(category)}
                >
                  {t(`benchmark.categories.${category}`)}
                </FilterChip>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(formData.hardwareSpecs).map(([key, value]) => (
                <div key={key}>
                  <label className="label">{formatMetricLabel(key)}</label>
                  <input
                    type="text"
                    className="field"
                    value={value}
                    onChange={(event) => setFormData((prev) => ({
                      ...prev,
                      hardwareSpecs: {
                        ...prev.hardwareSpecs,
                        [key]: event.target.value
                      }
                    }))}
                  />
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {scoreFields.map((field) => (
                <div key={field}>
                  <label className="label">{formatMetricLabel(field)}</label>
                  <input
                    type="number"
                    className="field mono"
                    value={formData.scores[field] ?? ''}
                    onChange={(event) => handleScoreChange(field, event.target.value)}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={loading || !completion.basic || !completion.scores}
              >
                {loading ? t('common.loading') : t('benchmark.submitBtn')}
              </button>
            </div>
          </div>
        </DataCard>
      )}
    </div>
  );
}

