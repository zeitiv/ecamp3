/**
 * Reloads the schedule entries of all periods of the given camp, e.g. after
 * schedule entries were moved to another period or renumbered.
 *
 * The periods collection must be awaited via $loadItems() before iterating:
 * on a not-yet-loaded collection, .items is a LoadingCollection which only
 * proxies find/map/flatMap/filter, so forEach would silently iterate nothing.
 *
 * Resolves once all schedule entry collections are reloaded and rejects if
 * any of the reloads fails.
 *
 * @param camp hal-json-vuex camp resource
 * @param api  hal-json-vuex api object
 */
export async function reloadScheduleEntries(camp, api) {
  const periods = await camp.periods().$loadItems()
  await Promise.all(periods.items.map((period) => api.reload(period.scheduleEntries())))
}
