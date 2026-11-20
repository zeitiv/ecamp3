import { describe, expect, it, vi } from 'vitest'
import { reloadScheduleEntries } from '@/helpers/reloadScheduleEntries.js'

function period(self) {
  const scheduleEntries = { collectionOf: self }
  return { _meta: { self }, scheduleEntries: () => scheduleEntries }
}

describe('reloadScheduleEntries', () => {
  it('reloads the schedule entries of every period once', async () => {
    const a = period('/periods/a')
    const b = period('/periods/b')
    const api = { reload: vi.fn().mockResolvedValue() }

    await reloadScheduleEntries(api, [a, b, a, undefined])

    expect(api.reload).toHaveBeenCalledTimes(2)
    expect(api.reload).toHaveBeenCalledWith(a.scheduleEntries())
    expect(api.reload).toHaveBeenCalledWith(b.scheduleEntries())
  })

  it('only resolves after all reloads completed', async () => {
    let finish
    const api = { reload: vi.fn(() => new Promise((resolve) => (finish = resolve))) }
    let done = false

    const promise = reloadScheduleEntries(api, [period('/periods/a')]).then(
      () => (done = true)
    )
    await Promise.resolve()
    expect(done).toBe(false)

    finish()
    await promise
    expect(done).toBe(true)
  })

  it('rejects if a reload fails', async () => {
    const error = new Error('reload failed')
    const api = { reload: vi.fn().mockRejectedValue(error) }

    await expect(reloadScheduleEntries(api, [period('/periods/a')])).rejects.toBe(error)
  })
})
