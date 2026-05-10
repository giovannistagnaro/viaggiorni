import { PostLoginScreen } from '@renderer/types'

export type ScreenConfig = {
  label: string | ((ctx: { entryDate?: string }) => string)
  parent?: PostLoginScreen
  isOverlay?: boolean
}

export const SCREEN_CONFIG: Record<PostLoginScreen, ScreenConfig> = {
  cover: { label: 'Cover' },
  index: { label: 'Index', parent: 'cover' },
  day: { label: ({ entryDate }) => entryDate ?? 'Day', parent: 'index' },
  settings: { label: 'Settings', isOverlay: true },
  template: { label: 'Template', isOverlay: true }
}
