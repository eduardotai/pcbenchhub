import { useTranslation } from 'react-i18next';
import DataCard from '../ui/DataCard';
import ScorePill from '../ui/ScorePill';
import { getMainScore, formatMetricLabel } from '../../viewmodels/benchmarkViewModel';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function parseSafe(val) {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return null; }
}

export default function ReportCard({ report, onVote, showHardware = false }) {
  const { t } = useTranslation();

  if (!report) return null;

  const scores = parseSafe(report.scores) || {};
  const hardwareSpecs = parseSafe(report.hardware_specs) || report.hardwareSpecs || {};
  const gamingContext = parseSafe(report.gaming_context);
  const tags = parseSafe(report.tags) || [];
  const mainScore = getMainScore({ scores });

  const reportTypeLabel = {
    benchmark: t('community.reportType.benchmark', 'Benchmark'),
    gaming: t('community.reportType.gaming', 'Gaming'),
    stability: t('community.reportType.stability', 'Stability'),
    thermal: t('community.reportType.thermal', 'Thermal')
  }[report.report_type || 'benchmark'];

  return (
    <DataCard className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="chip text-xs">{report.category?.toUpperCase()}</span>
            <span className="chip text-xs">{reportTypeLabel}</span>
          </div>
          <h3 className="font-display font-semibold text-slate-100 truncate">{report.title}</h3>
          {report.test_tool && (
            <p className="text-xs text-muted mt-0.5">{report.test_tool}</p>
          )}
        </div>

        {mainScore && (
          <div className="shrink-0">
            <ScorePill
              value={mainScore.value}
              label={formatMetricLabel(mainScore.key)}
              tone="high"
            />
          </div>
        )}
      </div>

      {showHardware && Object.keys(hardwareSpecs).length > 0 && (
        <div className="rounded-md bg-white/5 px-3 py-2 text-xs space-y-0.5">
          {Object.entries(hardwareSpecs).map(([key, val]) => val ? (
            <div key={key} className="flex gap-2">
              <span className="text-muted shrink-0">{formatMetricLabel(key)}:</span>
              <span className="text-slate-300 truncate">{val}</span>
            </div>
          ) : null)}
        </div>
      )}

      {gamingContext && (
        <div className="rounded-md bg-white/5 px-3 py-2 text-xs space-y-1">
          <div className="font-semibold text-slate-300 mb-1">{t('community.gaming.context', 'Gaming Context')}</div>
          {gamingContext.games && (
            <p className="text-slate-400 line-clamp-2">{gamingContext.games}</p>
          )}
          <div className="flex flex-wrap gap-3 mt-1">
            {gamingContext.settings && (
              <span className="text-muted">{t('community.gaming.settings', 'Settings')}: <span className="text-slate-300">{gamingContext.settings}</span></span>
            )}
            {gamingContext.resolution && (
              <span className="text-muted">{t('community.gaming.resolution', 'Resolution')}: <span className="text-slate-300">{gamingContext.resolution}</span></span>
            )}
            {gamingContext.avgFps != null && gamingContext.avgFps !== '' && (
              <span className="text-muted">{t('community.gaming.avgFps', 'Avg FPS')}: <span className="text-slate-300 font-mono">{gamingContext.avgFps}</span></span>
            )}
            {gamingContext.minFps != null && gamingContext.minFps !== '' && (
              <span className="text-muted">{t('community.gaming.minFps', 'Min FPS')}: <span className="text-slate-300 font-mono">{gamingContext.minFps}</span></span>
            )}
          </div>
        </div>
      )}

      {report.user_notes && (
        <p className="text-sm text-slate-400 italic line-clamp-3">{report.user_notes}</p>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="chip text-xs">{tag}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <div className="flex items-center gap-2 text-xs text-muted">
          {report.username && (
            <span className="font-medium text-slate-400">{report.username}</span>
          )}
          {report.created_at && (
            <span>{formatDate(report.created_at)}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {report.helpfulness_score != null && (
            <span className="text-xs text-muted">
              {t('community.helpfulness', 'Helpful')}: <span className="text-slate-300">{report.helpfulness_score}</span>
            </span>
          )}
          {/* VoteButtons placeholder — Sistema 3 */}
          {onVote && (
            <div className="text-xs text-muted italic">{t('community.voteComingSoon', '')}</div>
          )}
        </div>
      </div>
    </DataCard>
  );
}
