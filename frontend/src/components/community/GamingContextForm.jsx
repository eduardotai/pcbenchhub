import { useTranslation } from 'react-i18next';

const SETTINGS_OPTIONS = ['Low', 'Medium', 'High', 'Ultra', 'Custom'];
const RESOLUTION_OPTIONS = ['1080p', '1440p', '4K', 'Custom'];

export default function GamingContextForm({ value = {}, onChange }) {
  const { t } = useTranslation();

  const handleChange = (field, fieldValue) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="label">{t('community.gaming.games', 'Games Tested')}</label>
        <textarea
          className="field"
          rows={3}
          placeholder={t('community.gaming.gamesPlaceholder', 'e.g. Cyberpunk 2077, The Witcher 3, Elden Ring')}
          value={value.games || ''}
          onChange={(e) => handleChange('games', e.target.value)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">{t('community.gaming.settings', 'Quality Settings')}</label>
          <select
            className="field"
            value={value.settings || ''}
            onChange={(e) => handleChange('settings', e.target.value)}
          >
            <option value="">{t('community.gaming.selectSettings', 'Select settings...')}</option>
            {SETTINGS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">{t('community.gaming.resolution', 'Resolution')}</label>
          <select
            className="field"
            value={value.resolution || ''}
            onChange={(e) => handleChange('resolution', e.target.value)}
          >
            <option value="">{t('community.gaming.selectResolution', 'Select resolution...')}</option>
            {RESOLUTION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">{t('community.gaming.avgFps', 'Avg FPS')}</label>
          <input
            type="number"
            className="field mono"
            min={0}
            placeholder="0"
            value={value.avgFps ?? ''}
            onChange={(e) => handleChange('avgFps', e.target.value === '' ? '' : Number(e.target.value))}
          />
        </div>

        <div>
          <label className="label">{t('community.gaming.minFps', 'Min FPS (1% Low)')}</label>
          <input
            type="number"
            className="field mono"
            min={0}
            placeholder="0"
            value={value.minFps ?? ''}
            onChange={(e) => handleChange('minFps', e.target.value === '' ? '' : Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
