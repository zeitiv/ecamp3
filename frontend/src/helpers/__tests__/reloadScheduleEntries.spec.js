import { describe, expect, it, vi } from 'vitest'
import { reloadScheduleEntries } from '@/helpers/reloadScheduleEntries.js'

const periodEntries = (n) => ({ _meta: { self: `/periods/${n}/schedule_entries` } })
const period1 = { _meta: { self: '/periods/1' }, scheduleEntries: () => periodEntries(1) }
const period2 = { _meta: { self: '/periods/2' }, scheduleEntries: () => periodEntries(2) }

const createCamp = () => {
  const periods = { items: [period1, period2] }
  periods.$loadItems = () => Promise.resolve(periods)
  return { periods: () => periods }
}

const deferred = () => {
  let resolve, reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('reloadScheduleEntries', () => {
  it('reloads the schedule entries of every period of the camp', async () => {
    const camp = createCamp()
    const api = { reload: vi.fn(() => Promise.resolve()) }

    await reloadScheduleEntries(camp, api)

    expect(api.reload).toHaveBeenCalledTimes(2)
    expect(api.reload).toHaveBeenCalledWith(period1.scheduleEntries())
    expect(api.reload).toHaveBeenCalledWith(period2.scheduleEntries())
  })

  it('waits for the periods collection to load before reloading', async () => {
    // simulates a LoadingResource: items is empty until $loadItems resolves
    const loadedPeriods = { items: [period1, period2] }
    const loadingPeriods = { items: [], $loadItems: () => Promise.resolve(loadedPeriods) }
    const camp = { periods: () => loadingPeriods }
    const api = { reload: vi.fn(() => Promise.resolve()) }

    await reloadScheduleEntries(camp, api)

    expect(api.reload).toHaveBeenCalledTimes(2)
    expect(api.reload).toHaveBeenCalledWith(period1.scheduleEntries())
    expect(api.reload).toHaveBeenCalledWith(period2.scheduleEntries())
  })

  it('resolves only after all reloads have completed', async () => {
    const camp = createCamp()
    const reload1 = deferred()
    const reload2 = deferred()
    const api = {
      reload: vi
        .fn()
        .mockReturnValueOnce(reload1.promise)
        .mockReturnValueOnce(reload2.promise),
    }
    const onResolved = vi.fn()

    const result = reloadScheduleEntries(camp, api).then(onResolved)
    await vi.waitFor(() => expect(api.reload).toHaveBeenCalledTimes(2))

    reload2.resolve()
    await new Promise((resolve) => setTimeout(resolve))
    expect(onResolved).not.toHaveBeenCalled()

    reload1.resolve()
    await result
    expect(onResolved).toHaveBeenCalledTimes(1)
  })

  it('rejects if one of the reloads fails', async () => {
    const camp = createCamp()
    const reload1 = deferred()
    const reload2 = deferred()
    const api = {
      reload: vi
        .fn()
        .mockReturnValueOnce(reload1.promise)
        .mockReturnValueOnce(reload2.promise),
    }
    const error = new Error('reload failed')

    const result = reloadScheduleEntries(camp, api)
    await vi.waitFor(() => expect(api.reload).toHaveBeenCalledTimes(2))

    reload1.resolve()
    reload2.reject(error)
    await expect(result).rejects.toBe(error)
  })
})
