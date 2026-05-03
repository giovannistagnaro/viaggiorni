import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebouncedCallback } from './useDebouncedCallback'

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not call the callback before the delay elapses', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 500))

    act(() => result.current('arg'))

    expect(callback).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(499)
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it('calls the callback once after the delay elapses', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 500))

    act(() => result.current('arg'))

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('arg')
  })

  it('only fires once for a burst of calls within the delay window', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 500))

    act(() => {
      result.current('first')
      result.current('second')
      result.current('third')
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('third')
  })

  it('resets the delay when called again before timeout', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 500))

    act(() => result.current('first'))

    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(callback).not.toHaveBeenCalled()

    act(() => result.current('second'))

    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(callback).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('second')
  })

  it('cancels the pending callback on unmount', () => {
    const callback = vi.fn()
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 500))

    act(() => result.current('arg'))

    unmount()

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(callback).not.toHaveBeenCalled()
  })
})
