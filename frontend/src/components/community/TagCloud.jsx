import { cn } from '../../utils/cn';

function getFontLevel(usageCount, max) {
  if (max === 0) return 'sm';
  const ratio = usageCount / max;
  if (ratio >= 0.66) return 'lg';
  if (ratio >= 0.33) return 'md';
  return 'sm';
}

const FONT_CLASSES = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base font-semibold',
};

export default function TagCloud({ tags = [], onSelect, selectedTag }) {
  if (!tags.length) {
    return <p className="text-sm text-muted italic">No tags available.</p>;
  }

  const max = Math.max(...tags.map((t) => t.usage_count || 0));

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const level = getFontLevel(tag.usage_count || 0, max);
        const isSelected = selectedTag === tag.name;

        return (
          <button
            key={tag.name}
            type="button"
            onClick={() => onSelect && onSelect(isSelected ? null : tag.name)}
            className={cn(
              'chip transition-colors',
              FONT_CLASSES[level],
              isSelected && 'chip-active'
            )}
            title={`${tag.usage_count || 0} report${tag.usage_count !== 1 ? 's' : ''}`}
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
