// default writing template options
export const WRITING_TYPES = [
  'daily_summary',
  'gratitude',
  'notable_moment',
  'writing_prompt',
  'custom'
] as const

// default widget template options
export const WIDGET_TYPES = [
  'habit_tracker',
  'todo_list',
  'mood_tracker',
  'word_of_day',
  'photo'
] as const

export const WRITING_TYPE_LABELS: Record<(typeof WRITING_TYPES)[number], string> = {
  daily_summary: 'Daily Summary',
  gratitude: 'Gratitude',
  notable_moment: 'Notable Moment',
  writing_prompt: 'Writing Prompt',
  custom: 'Custom'
}
