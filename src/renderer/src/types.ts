export type Screen = 'loading' | 'onboarding' | 'login' | PostLoginScreen
export type PostLoginScreen = 'cover' | 'index' | 'day' | TopLevelScreen
export type TopLevelScreen = 'settings' | 'template'
export type NonOverlayScreen = Exclude<PostLoginScreen, TopLevelScreen>
