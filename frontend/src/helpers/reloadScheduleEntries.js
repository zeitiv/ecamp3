/**
 * Reloads the schedule entry collections of the given periods (each period only once),
 * so that cached collections do not keep stale data after schedule entries were
 * moved between, added to or removed from periods.
 *
 * @param api the hal-json-vuex api
 * @param periods period resources (falsy values are ignored)
 * @returns {Promise} resolves when all collections are reloaded, rejects if any reload fails
 */
export function reloadScheduleEntries(api, periods) {
  const uniquePeriods = new Map()
  for (const period of periods) {
    if (period) uniquePeriods.set(period._meta.self, period)
  }
  return Promise.all(
    [...uniquePeriods.values()].map((period) => api.reload(period.scheduleEntries()))
  )
}
