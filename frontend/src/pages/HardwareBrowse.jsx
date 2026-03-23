/**
 * HardwareBrowse.jsx — Community hardware browse & listing page.
 *
 * Features:
 * - Fetch /api/hardware with category/search/sort filters
 * - FilterChip row for category
 * - Search input and sort select
 * - Grid of HardwareCard components
 * - Simple pagination
 * - URL param sync via useSearchParams
 */
import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { hardware } from '../services/api';
import HardwareCard from '../components/hardware/HardwareCard';
import FilterChip from '../components/ui/FilterChip';
import SectionHeader from '../components/ui/SectionHeader';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const CATEGORIES = ['All', 'CPU', 'GPU', 'RAM', 'Storage'];
const SORT_OPTIONS = [
  { value: 'rating',  label: 'Top Rated' },
  { value: 'reports', label: 'Most Reports' },
  { value: 'score',   label: 'Highest Score' },
];
const PAGE_SIZE = 18;

export default function HardwareBrowse() {
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryParam = searchParams.get('category') || 'All';
  const searchParam   = searchParams.get('search')   || '';
  const sortParam     = searchParams.get('sort')     || 'rating';
  const pageParam     = parseInt(searchParams.get('page') || '1', 10);

  const [components, setComponents] = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  // Local search input state (debounced into URL)
  const [searchInput, setSearchInput] = useState(searchParam);

  const updateParams = useCallback((updates) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) => {
        if (v == null || v === '' || v === 'All' || (k === 'page' && v === 1)) {
          next.delete(k);
        } else {
          next.set(k, String(v));
        }
      });
      return next;
    });
  }, [setSearchParams]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      updateParams({ search: searchInput, page: 1 });
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, updateParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = { limit: PAGE_SIZE, page: pageParam, sort: sortParam };
    if (categoryParam && categoryParam !== 'All') params.category = categoryParam;
    if (searchParam) params.search = searchParam;

    hardware.getAll(params)
      .then((res) => {
        if (cancelled) return;
        setComponents(res.data.components || res.data.hardware || []);
        setTotal(res.data.pagination?.total ?? (res.data.components || res.data.hardware || []).length);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load hardware.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [categoryParam, searchParam, sortParam, pageParam]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-8 pb-4">
      <SectionHeader
        eyebrow="Community Hardware"
        title="Browse Hardware"
        subtitle="Explore community-rated CPUs, GPUs, RAM, and storage components."
      />

      {/* Filters bar */}
      <div className="space-y-3">
        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <FilterChip
              key={cat}
              active={categoryParam === cat}
              onClick={() => updateParams({ category: cat, page: 1 })}
            >
              {cat}
            </FilterChip>
          ))}
        </div>

        {/* Search + Sort row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search components..."
            className="field"
            style={{ flex: '1 1 220px', maxWidth: '380px' }}
          />
          <select
            value={sortParam}
            onChange={(e) => updateParams({ sort: e.target.value, page: 1 })}
            className="field"
            style={{ flex: '0 0 auto' }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="surface p-5">
              <Skeleton className="h-4 w-16 mb-3" />
              <Skeleton className="h-6 w-10/12 mb-2" />
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-3 w-8/12" />
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState title="Error" description={error} />
      ) : components.length === 0 ? (
        <EmptyState
          title="No components found"
          description="Try adjusting your filters or search query."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {components.map((comp) => (
            <HardwareCard key={comp.id} component={comp} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '4px' }}>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={pageParam <= 1}
            onClick={() => updateParams({ page: pageParam - 1 })}
          >
            Previous
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-soft)' }}>
            Page {pageParam} of {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={pageParam >= totalPages}
            onClick={() => updateParams({ page: pageParam + 1 })}
          >
            Next
          </button>
        </div>
      )}

      {/* Footer link */}
      <div style={{ paddingTop: '8px' }}>
        <Link to="/submit" className="btn btn-primary" style={{ fontSize: '0.9rem' }}>
          + Submit Benchmark
        </Link>
      </div>
    </div>
  );
}
