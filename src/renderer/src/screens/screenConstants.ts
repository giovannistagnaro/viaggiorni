export const MIN_USERNAME_LENGTH = 3
export const MAX_USERNAME_LENGTH = 20
export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 75

export const WELCOME_SCREEN_PLACEHOLDER_TEXT = 'Enter your username.'
export const ENTER_YOUR_PASSWORD_PLACEHOLDER_TEXT = 'Enter your password.'
export const PASSWORD_SCREEN_CONFIRMATION_PLACEHOLDER_TEXT = 'Confirm your password.'

export const PASSWORD_SCREEN_HEADER_TEXT = 'Set your password.'
export const WELCOME_SCREEN_HEADER_TEXT = 'Welcome to Viaggiorni!'

export const PASSWORD_SUBMIT_BUTTON_TEXT = (submitting: boolean): string =>
  submitting ? 'Checking password...' : 'Submit'
export const USERNAME_SUBMIT_BUTTON_TEXT = (submitting: boolean): string =>
  submitting ? 'Checking username...' : 'Continue'

export const PASSWORD_RECOVERY_WARNING_TEXT =
  'Your password cannot be recovered. If you forget it, your journal is lost forever.'

export const ERROR_MESSAGE_USERNAME_TOO_SHORT = `Username needs to be at least ${MIN_USERNAME_LENGTH} characters.`
export const ERROR_MESSAGE_USERNAME_TOO_LONG = `Username needs to be at most ${MAX_USERNAME_LENGTH} characters.`

export const ERROR_MESSAGE_PASSWORD_TOO_SHORT = `Password needs to be at least ${MIN_PASSWORD_LENGTH} characters.`
export const ERROR_MESSAGE_PASSWORD_TOO_LONG = `Password needs to be at most ${MAX_PASSWORD_LENGTH} characters.`
export const ERROR_MESSAGE_PASSWORD_MISMATCH = 'Passwords do not match.'
