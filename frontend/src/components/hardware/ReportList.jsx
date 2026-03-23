import { useEffect, useState } from 'react';
import api from '../../services/api';
import ReportCard from '../community/ReportCard';
import Skeleton from '../ui/Skeleton';

/**
 * ReportList — paginated list of benchmark reports for a hardware component.
 *
 * Props:
 *   componentId  {number|string}
 *   pageSize     {number}  — items per page (default: 10)
 */
export default function ReportList({ componentId, pageSize = 10 }) {
  const [reports, setReports]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!componentId) return;
    let cancelled = false;

    async function fetchReports() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/benchmarks', {
          params: { componentId, page, limit: pageSize },
        });
        if (cancelled) return;
        const data = res.data;
        setReports(data.benchmarks || []);
        setTotal(data.pagination?.total || (data.benchmarks || []).length);
      } catch (err) {
        if (!cancelled) setError('Failed to load reports.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchReports();
    return () => { cancelled = true; };
  }, [componentId, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="surface p-5">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-6 w-9/12 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-8/12" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-muted text-sm">{error}</p>
      ) : reports.length === 0 ? (
        <p className="text-muted text-sm">No reports found for this component.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} showHardware />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '4px' }}>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ fontSize: '0.82rem' }}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-soft)' }}>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ fontSize: '0.82rem' }}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
