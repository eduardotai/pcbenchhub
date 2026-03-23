import { useState } from 'react';
import { hardware as hardwareApi } from '../../services/api';
import api from '../../services/api';

const CATEGORY_COLORS = {
  cpu: '#60a5fa',
  gpu: '#fb923c',
  ram: '#a78bfa',
  storage: '#34d399',
};

function HardwareCard({ item, editable, onRemove, onSetPrimary }) {
  const catColor = CATEGORY_COLORS[item.component_category?.toLowerCase()] || '#8896b0';

  return (
    <div
      style={{
        background: '#0a1020',
        border: '1px solid rgba(148,115,255,0.15)',
        borderRadius: 12,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {/* Category dot */}
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: catColor,
            flexShrink: 0,
          }}
        />

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#eef2ff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.component_name}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: catColor,
              }}
            >
              {item.component_category}
            </span>

            {item.component_brand && (
              <span style={{ fontSize: 11, color: '#4d5d7a' }}>
                {item.component_brand}
              </span>
            )}

            {/* Primary badge */}
            {item.is_primary ? (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '1px 7px',
                  borderRadius: 9999,
                  backgroundColor: 'rgba(155,109,255,0.18)',
                  border: '1px solid rgba(155,109,255,0.4)',
                  color: '#b387ff',
                }}
              >
                Primary
              </span>
            ) : null}
          </div>

          {item.notes && (
            <div style={{ fontSize: 11, color: '#4d5d7a', marginTop: 2 }}>
              {item.notes}
            </div>
          )}
        </div>
      </div>

      {editable && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {!item.is_primary && (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: 11, padding: '4px 10px' }}
              onClick={() => onSetPrimary && onSetPrimary(item.component_id)}
            >
              Set Primary
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost"
            style={{ fontSize: 11, padding: '4px 10px', color: '#f43f5e' }}
            onClick={() => onRemove && onRemove(item.component_id)}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * UserHardwareList — displays a user's hardware components.
 *
 * Props:
 *   hardware      {array}    — array of hardware items from API
 *   editable      {boolean}  — show edit controls (default: false)
 *   onAdd         {function} — called with new hardware item after adding
 *   onRemove      {function} — called with componentId after removing
 *   onSetPrimary  {function} — called with componentId after setting primary
 *   username      {string}   — required when editable=true for API calls
 */
export default function UserHardwareList({
  hardware = [],
  editable = false,
  onAdd,
  onRemove,
  onSetPrimary,
  username,
}) {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState(null); // null = idle, object = resolved
  const [showAddForm, setShowAddForm] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');
  const [adding, setAdding] = useState(false);

  const handleResolve = async () => {
    if (!searchText.trim()) return;
    setResolving(true);
    setResolveError('');
    setSearchResults(null);

    try {
      const res = await hardwareApi.resolve(searchText.trim());
      setSearchResults(res.data.component);
    } catch {
      setResolveError('Could not resolve hardware. Try a more specific name.');
    } finally {
      setResolving(false);
    }
  };

  const handleAdd = async () => {
    if (!searchResults || !username) return;
    setAdding(true);
    setResolveError('');

    try {
      const res = await api.post(`/profiles/${username}/hardware`, {
        componentId: searchResults.id,
      });
      onAdd && onAdd(res.data.hardware);
      setShowAddForm(false);
      setSearchText('');
      setSearchResults(null);
    } catch (err) {
      setResolveError(err.response?.data?.error || 'Failed to add hardware.');
    } finally {
      setAdding(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setSearchText('');
    setSearchResults(null);
    setResolveError('');
  };

  return (
    <div className="space-y-3">
      {hardware.length === 0 && !showAddForm && (
        <p style={{ color: '#8896b0', fontSize: 14 }}>No hardware added yet.</p>
      )}

      {hardware.map((item) => (
        <HardwareCard
          key={item.id || item.component_id}
          item={item}
          editable={editable}
          onRemove={onRemove}
          onSetPrimary={onSetPrimary}
        />
      ))}

      {/* Add hardware form */}
      {editable && showAddForm && (
        <div
          style={{
            background: '#0a1020',
            border: '1px solid rgba(148,115,255,0.2)',
            borderRadius: 12,
            padding: '14px 16px',
          }}
          className="space-y-3"
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: '#eef2ff' }}>
            Add Hardware
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              className="field"
              placeholder="e.g. RTX 4090, Ryzen 9 7950X..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setSearchResults(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleResolve()}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResolve}
              disabled={resolving || !searchText.trim()}
            >
              {resolving ? 'Searching...' : 'Search'}
            </button>
          </div>

          {resolveError && (
            <div style={{ fontSize: 12, color: '#f43f5e' }}>{resolveError}</div>
          )}

          {searchResults && (
            <div
              style={{
                background: '#0e1628',
                border: '1px solid rgba(148,115,255,0.2)',
                borderRadius: 8,
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#eef2ff' }}>
                  {searchResults.name}
                </div>
                <div style={{ fontSize: 11, color: '#8896b0' }}>
                  {searchResults.category}
                  {searchResults.brand ? ` · ${searchResults.brand}` : ''}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAdd}
                disabled={adding}
                style={{ fontSize: 12 }}
              >
                {adding ? 'Adding...' : 'Add'}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleCancelAdd}
              style={{ fontSize: 12 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add button */}
      {editable && !showAddForm && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setShowAddForm(true)}
          style={{ fontSize: 13 }}
        >
          + Add Hardware
        </button>
      )}
    </div>
  );
}
