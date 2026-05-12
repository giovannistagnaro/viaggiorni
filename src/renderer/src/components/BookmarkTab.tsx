import bookmarkUrl from '@renderer/assets/textures/BOOKMARK.png'

interface Props {
  label: string
  isBookmarked: boolean
  onClick: () => void
}

export default function BookmarkTab({ label, isBookmarked, onClick }: Props): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      aria-label={isBookmarked ? `Remove bookmark (${label})` : `Bookmark this page (${label})`}
      aria-pressed={isBookmarked}
      className={`block w-full h-full cursor-pointer pointer-events-auto hover:brightness-110 active:brightness-95 transition-all duration-500 ease-in-out ${
        isBookmarked ? 'translate-y-0' : '-translate-y-[46%] hover:-translate-y-[13%]'
      }`}
    >
      <img
        src={bookmarkUrl}
        alt=""
        aria-hidden
        draggable={false}
        className="block w-full h-full select-none pointer-events-none"
      />
    </button>
  )
}
