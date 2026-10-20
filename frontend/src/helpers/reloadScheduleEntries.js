/**
 * Reloads the schedule entries of all periods of the given camp, e.g. after
 * schedule entries were moved to another period or renumbered.
 *
 * The periods collection must be awaited via $loadItems() before iterating:
 * on a not-yet-loaded collection, .items is a LoadingCollection which only
 * proxies find/map/flatMap/filter, so forEach would silently iterate nothing.
 *
 * @param camp hal-json-vuex camp resource
 * @param api  hal-json-vuex api object
 */
export async function reloadScheduleEntries(camp, api) {
  const periods = await camp.periods().$loadItems()
  periods.items.forEach((period) => {
    api.reload(period.scheduleEntries())
  })
}
