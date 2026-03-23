import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function TagSelector({ selectedTags = [], onChange, maxTags = 10 }) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const debouncedQuery = useDebounce(inputValue, 300);

  const fetchSuggestions = useCallback(async (query) => {
    setLoading(true);
    try {
      const res = await api.get('/benchmarks/tags/search', { params: { q: query } });
      const tags = res.data?.tags || [];
      setSuggestions(tags.filter((t) => !selectedTags.includes(t.name)));
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTags]);

  useEffect(() => {
    if (showDropdown) {
      fetchSuggestions(debouncedQuery);
    }
  }, [debouncedQuery, showDropdown, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (tagName) => {
    const normalized = tagName.trim().toLowerCase();
    if (!normalized) return;
    if (selectedTags.includes(normalized)) return;
    if (selectedTags.length >= maxTags) return;
    onChange([...selectedTags, normalized]);
    setInputValue('');
    setShowDropdown(false);
  };

  const removeTag = (tagName) => {
    onChange(selectedTags.filter((t) => t !== tagName));
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    }
    if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  };

  const atLimit = selectedTags.length >= maxTags;

  return (
    <div ref={containerRef} className="relative">
      <div className="field flex flex-wrap gap-1.5 min-h-[2.5rem] cursor-text p-1.5"
        onClick={() => !atLimit && document.getElementById('tag-input')?.focus()}>
        {selectedTags.map((tag) => (
          <span key={tag} className="chip chip-active flex items-center gap-1">
            {tag}
            <button
              type="button"
              className="ml-0.5 text-slate-400 hover:text-slate-200 leading-none"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              aria-label={t('community.tags.remove', 'Remove tag')}
            >
              ×
            </button>
          </span>
        ))}

        {!atLimit && (
          <input
            id="tag-input"
            type="text"
            className="flex-1 min-w-[120px] bg-transparent outline-none text-slate-100 placeholder:text-slate-500 text-sm"
            value={inputValue}
            placeholder={selectedTags.length === 0 ? t('community.tags.placeholder', 'Type to search tags...') : ''}
            onChange={(e) => { setInputValue(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
          />
        )}
      </div>

      <div className="mt-1 text-xs text-muted">
        {selectedTags.length}/{maxTags} {t('community.tags.tagsUsed', 'tags')}
        {atLimit && <span className="ml-2 text-amber-400">{t('community.tags.limitReached', 'Limit reached')}</span>}
      </div>

      {showDropdown && !atLimit && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-white/10 bg-slate-900 shadow-xl">
          {loading && (
            <div className="px-3 py-2 text-sm text-muted">{t('common.loading', 'Loading...')}</div>
          )}
          {!loading && suggestions.length === 0 && inputValue.trim() && (
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5"
              onClick={() => addTag(inputValue)}
            >
              {t('community.tags.createNew', 'Create')} &ldquo;{inputValue.trim()}&rdquo;
            </button>
          )}
          {!loading && suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center justify-between"
              onClick={() => addTag(tag.name)}
            >
              <span>{tag.name}</span>
              {tag.usage_count > 0 && (
                <span className="text-xs text-muted">{tag.usage_count}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
