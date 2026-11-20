import { beforeEach, describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import DialogActivityEdit from '../DialogActivityEdit.vue'

vi.mock('@/router.js', () => ({ firstActivityScheduleEntryRoute: vi.fn() }))

function period(self) {
  const scheduleEntries = { collectionOf: self }
  return { _meta: { self }, scheduleEntries: () => scheduleEntries }
}

const oldPeriod = period('/periods/old')
const newPeriod = period('/periods/new')
const activity = { _meta: { self: '/activities/1' } }

let api

function mountDialog() {
  const scheduleEntry = {
    _meta: { self: '/schedule_entries/1' },
    activity: () => activity,
    period: () => oldPeriod,
  }
  const wrapper = shallowMount(DialogActivityEdit, {
    props: { scheduleEntry },
    global: { mocks: { api, $t: (key) => key, $router: { push: vi.fn() } } },
  })
  wrapper.vm.entityUri = activity._meta.self
  wrapper.vm.entityData = {
    title: 'Title',
    location: '',
    category: '/categories/1',
    scheduleEntries: [
      {
        self: '/schedule_entries/1',
        deleted: false,
        start: 'start',
        end: 'end',
        originalPeriod: () => oldPeriod,
        period: () => oldPeriod,
      },
    ],
  }
  return wrapper
}

// the user picks another period in the form, the server confirms it on save
function moveEntryToNewPeriod(wrapper) {
  wrapper.vm.entityData.scheduleEntries[0].period = () => newPeriod
  api.patch.mockImplementation((uri) =>
    Promise.resolve(
      uri === '/schedule_entries/1'
        ? { start: 'start', end: 'end', period: () => newPeriod }
        : {}
    )
  )
}

describe('DialogActivityEdit', () => {
  beforeEach(() => {
    api = { patch: vi.fn().mockResolvedValue({}), reload: vi.fn().mockResolvedValue() }
  })

  it('reloads schedule entries of old and destination period after moving an entry', async () => {
    const wrapper = mountDialog()
    moveEntryToNewPeriod(wrapper)

    await wrapper.vm.updateActivity()

    expect(api.reload).toHaveBeenCalledWith(activity)
    expect(api.reload).toHaveBeenCalledWith(oldPeriod.scheduleEntries())
    expect(api.reload).toHaveBeenCalledWith(newPeriod.scheduleEntries())
    expect(api.reload).toHaveBeenCalledTimes(3)
    expect(wrapper.emitted('activityUpdated')).toHaveLength(1)
  })

  it('does not reload anything if saving fails', async () => {
    const wrapper = mountDialog()
    moveEntryToNewPeriod(wrapper)
    api.patch.mockRejectedValue(new Error('save failed'))

    await wrapper.vm.updateActivity()

    expect(api.reload).not.toHaveBeenCalled()
    expect(wrapper.emitted('activityUpdated')).toBeUndefined()
    expect(wrapper.vm.error).toBe('save failed')
  })

  it('emits activityUpdated only after the reloads completed', async () => {
    const wrapper = mountDialog()
    moveEntryToNewPeriod(wrapper)
    const finishers = []
    api.reload.mockImplementation(() => new Promise((resolve) => finishers.push(resolve)))

    const promise = wrapper.vm.updateActivity()
    await vi.waitFor(() => expect(finishers).toHaveLength(3))
    expect(wrapper.emitted('activityUpdated')).toBeUndefined()

    finishers.forEach((finish) => finish())
    await promise
    expect(wrapper.emitted('activityUpdated')).toHaveLength(1)
  })

  it('shows an error and does not emit if a reload fails', async () => {
    const wrapper = mountDialog()
    moveEntryToNewPeriod(wrapper)
    api.reload.mockRejectedValue(new Error('reload failed'))

    await wrapper.vm.updateActivity()

    expect(wrapper.emitted('activityUpdated')).toBeUndefined()
    expect(wrapper.vm.error).toBe('reload failed')
  })
})
