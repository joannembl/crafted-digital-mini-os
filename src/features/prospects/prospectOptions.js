export const prospectStatuses = [
  { value: 'research', label: 'Research' },
  { value: 'demo_ready', label: 'Demo Ready' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
]

export const demoStatuses = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'building', label: 'Building' },
  { value: 'ready', label: 'Ready' },
  { value: 'sent', label: 'Sent' },
  { value: 'live', label: 'Live' },
]

export function labelFor(options, value) {
  return options.find((option) => option.value === value)?.label || value || '—'
}
