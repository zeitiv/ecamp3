import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setupVuetify } from '/tests/setupVuetify.js'
import DialogActivityEdit from '@/components/activity/dialog/DialogActivityEdit.vue'

setupVuetify()

vi.mock('@/router.js', () => ({ firstActivityScheduleEntryRoute: () => '/somewhere' }))

const periodEntries = (n) => ({ _meta: { self: `/periods/${n}/schedule_entries` } })
const period1 = { _meta: { self: '/periods/1' }, scheduleEntries: () => periodEntries(1) }
const period2 = { _meta: { self: '/periods/2' }, scheduleEntries: () => periodEntries(2) }
const periods = { items: [period1, period2] }
periods.$loadItems = () => Promise.resolve(periods)
const camp = { periods: () => periods }
period1.camp = () => camp
period2.camp = () => camp

const activity = {
  _meta: { self: '/activities/1' },
  scheduleEntries: () => ({ items: [] }),
}
const scheduleEntry = {
  _meta: { self: '/schedule_entries/1' },
  period: () => period1,
  activity: () => activity,
}

let api

function mountDialog() {
  api = {
    patch: vi.fn().mockResolvedValue({
      start: '2036-08-09T13:30:00+00:00',
      end: '2036-08-09T15:15:00+00:00',
      period: () => period2,
    }),
    reload: vi.fn(),
  }
  const wrapper = mount(DialogActivityEdit, {
    props: { scheduleEntry },
    global: {
      mocks: { $t: (key) => key, api },
      stubs: { DialogForm: true, DialogActivityForm: true },
    },
  })
  wrapper.vm.entityUri = activity._meta.self
  wrapper.vm.entityData = {
    title: 'Besuch bei Hagrid',
    category: '/categories/1',
    location: '',
    scheduleEntries: [
      {
        self: scheduleEntry._meta.self,
        period: () => period2,
        start: '2036-08-09T13:30:00+00:00',
        end: '2036-08-09T15:15:00+00:00',
        deleted: false,
      },
    ],
  }
  return wrapper
}

describe('DialogActivityEdit', () => {
  beforeEach(() => {
    api = undefined
  })

  it('reloads the schedule entries of all periods after an entry was moved to another period', async () => {
    const wrapper = mountDialog()

    await wrapper.vm.updateActivity()

    expect(api.reload).toHaveBeenCalledWith(period1.scheduleEntries())
    expect(api.reload).toHaveBeenCalledWith(period2.scheduleEntries())
    expect(wrapper.emitted('activityUpdated')).toHaveLength(1)
  })

  it('does not reload anything if saving fails', async () => {
    const wrapper = mountDialog()
    api.patch.mockRejectedValue({ message: 'network error' })

    await wrapper.vm.updateActivity()

    expect(api.reload).not.toHaveBeenCalled()
    expect(wrapper.emitted('activityUpdated')).toBeUndefined()
  })
})
