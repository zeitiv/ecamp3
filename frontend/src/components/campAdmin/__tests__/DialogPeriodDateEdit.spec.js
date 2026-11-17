import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setupVuetify } from '/tests/setupVuetify.js'
import DialogPeriodDateEdit from '@/components/campAdmin/DialogPeriodDateEdit.vue'

setupVuetify()

const scheduleEntries = { _meta: { self: '/periods/1/schedule_entries' } }
const days = { _meta: { self: '/periods/1/days' } }
const dayResponsibles = { _meta: { self: '/periods/1/day_responsibles' } }
const period = {
  _meta: { self: '/periods/1' },
  scheduleEntries: () => scheduleEntries,
  days: () => days,
  dayResponsibles: () => dayResponsibles,
}

let api

function mountDialog() {
  api = { patch: vi.fn().mockResolvedValue({}), reload: vi.fn() }
  const wrapper = mount(DialogPeriodDateEdit, {
    props: { period, mode: 'move' },
    global: {
      mocks: { $t: (key) => key, api },
      stubs: { DialogForm: true },
    },
  })
  wrapper.vm.entityUri = period._meta.self
  wrapper.vm.entityData = {
    start: '2036-08-13',
    end: '2036-08-20',
    moveScheduleEntries: true,
  }
  return wrapper
}

describe('DialogPeriodDateEdit', () => {
  beforeEach(() => {
    api = undefined
  })

  it('reloads schedule entries, days and day responsibles after saving the new dates', async () => {
    const wrapper = mountDialog()

    await wrapper.vm.update()

    expect(api.patch).toHaveBeenCalledWith('/periods/1', {
      start: '2036-08-13',
      end: '2036-08-20',
      moveScheduleEntries: true,
    })
    expect(api.reload).toHaveBeenCalledWith(scheduleEntries)
    expect(api.reload).toHaveBeenCalledWith(days)
    expect(api.reload).toHaveBeenCalledWith(dayResponsibles)
  })

  it('propagates a failed reload to the caller instead of rejecting unhandled', async () => {
    const wrapper = mountDialog()
    api.reload.mockRejectedValue(new Error('reload failed'))

    await expect(wrapper.vm.update()).rejects.toThrow('reload failed')
  })

  it('does not reload anything if saving fails', async () => {
    const wrapper = mountDialog()
    api.patch.mockRejectedValue(new Error('network error'))

    await wrapper.vm.update()

    expect(api.reload).not.toHaveBeenCalled()
  })
})
