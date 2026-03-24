export const DEFAULT_PAGE = {
  title:          '',
  roamers:        [{ id: 1, name: '' }],
  dealer:         '',
  firstAdventure: '',
  upgrades:       [],
  manufacturerId: '',
  modelId:        '',
  mfgLogoUrl:     '',
  bgImageUrl:     '',
  theme:          '',
};

export const THEMES = {
  ember:   { name: 'Ember',   p: '#E87722', bg: '#080809', surface: 'rgba(10,10,14,.82)',  accent: '#ff9a44', text: '#f0ece6' },
  arctic:  { name: 'Arctic',  p: '#4da6ff', bg: '#060810', surface: 'rgba(8,12,20,.84)',   accent: '#7ec8ff', text: '#e8f0f8' },
  forge:   { name: 'Forge',   p: '#b8f040', bg: '#070908', surface: 'rgba(8,12,8,.84)',    accent: '#d4ff70', text: '#eef5e8' },
  crimson: { name: 'Crimson', p: '#e83838', bg: '#090608', surface: 'rgba(14,8,8,.84)',    accent: '#ff6060', text: '#f5e8e8' },
  gold:    { name: 'Gold',    p: '#d4a017', bg: '#090806', surface: 'rgba(14,12,6,.84)',   accent: '#f0c840', text: '#f5f0e0' },
};
