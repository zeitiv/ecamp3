import { describe, expect, it, vi } from 'vitest'
import { reloadScheduleEntries } from '@/helpers/reloadScheduleEntries.js'

const periodEntries = (n) => ({ _meta: { self: `/periods/${n}/schedule_entries` } })
const period1 = { _meta: { self: '/periods/1' }, scheduleEntries: () => periodEntries(1) }
const period2 = { _meta: { self: '/periods/2' }, scheduleEntries: () => periodEntries(2) }

describe('reloadScheduleEntries', () => {
  it('reloads the schedule entries of every period of the camp', async () => {
    const periods = { items: [period1, period2] }
    periods.$loadItems = () => Promise.resolve(periods)
    const camp = { periods: () => periods }
    const api = { reload: vi.fn() }

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
    const api = { reload: vi.fn() }

    await reloadScheduleEntries(camp, api)

    expect(api.reload).toHaveBeenCalledTimes(2)
    expect(api.reload).toHaveBeenCalledWith(period1.scheduleEntries())
    expect(api.reload).toHaveBeenCalledWith(period2.scheduleEntries())
  })
})
