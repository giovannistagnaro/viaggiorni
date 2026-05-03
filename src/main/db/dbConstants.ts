export const SALT_BYTES = 32
export const SALT_FILE_NAME = 'salt.bin'
export const DB_FILE_NAME = 'viaggiorni.db'
export const USERNAME_FILE_NAME = 'username.txt'
export const DEFAULT_USERNAME = ''

// default mood options
export const DEFAULT_MOOD_TAGS = [
  'Calm',
  'Grateful',
  'Anxious',
  'Energized',
  'Melancholy',
  'Restless',
  'Content',
  'Overwhelmed',
  'Focused',
  'Tired',
  'Hopeful',
  'Stressed'
]

// default writing template options
export const writingTypes = [
  'daily_summary',
  'gratitude',
  'notable_moment',
  'writing_prompt',
  'custom'
] as const

// default widget template options
export const widgetTypes = [
  'habit_tracker',
  'todo_list',
  'mood_tracker',
  'word_of_day',
  'photo'
] as const
