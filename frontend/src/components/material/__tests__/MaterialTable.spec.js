import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { setupVuetify } from '/tests/setupVuetify.js'
import MaterialTable from '../MaterialTable.vue'
import MaterialListSelect from '../MaterialListSelect.vue'
import ApiSelect from '@/components/form/api/ApiSelect.vue'
import DialogForm from '@/components/dialog/DialogForm.vue'
import EForm from '@/components/form/base/EForm.vue'

setupVuetify()

let wrapper

afterEach(() => {
  wrapper?.unmount()
})

const DESKTOP_WIDTH = 1000
const MOBILE_WIDTH = 500

const sourceList = { _meta: { self: '/material_lists/1' }, name: 'Lagermaterial' }
const targetList = { _meta: { self: '/material_lists/2' }, name: 'Lebensmittel' }
const materialLists = {
  _meta: { self: '/material_lists?camp=%2Fcamps%2F1' },
  items: [sourceList, targetList],
}
const camp = { _meta: { self: '/camps/1' }, materialLists: () => materialLists }
const materialItem = {
  _meta: { self: '/material_items/1' },
  camp: () => camp,
  materialList: () => sourceList,
  materialNode: null,
  article: 'Seil',
  quantity: 2,
  unit: 'm',
  done: false,
}
const materialItemCollection = {
  _meta: { self: '/material_items?materialList=%2Fmaterial_lists%2F1' },
  items: [materialItem],
}
sourceList._meta.load = Promise.resolve(sourceList)

function loadedMaterialItem() {
  const loaded = { ...materialItem, _meta: { ...materialItem._meta } }
  loaded._meta.load = Promise.resolve(loaded)
  return loaded
}

const stubs = {
  EForm,
  ETextField: true,
  ENumberField: true,
  ApiCheckbox: true,
  ApiNumberField: true,
  ApiTextField: true,
  ApiSelect: true,
  MaterialCreateItem: true,
  DialogMaterialItemCreate: true,
  PromptEntityDelete: true,
  MaterialListSelect: {
    name: 'MaterialListSelect',
    template: '<div />',
    emits: ['update:modelValue'],
  },
  DialogForm: {
    props: ['submitAction'],
    template: '<div><slot /></div>',
  },
}

async function mountTable(width, props = {}) {
  const api = {
    get: vi.fn().mockImplementation(loadedMaterialItem),
    patch: vi.fn().mockResolvedValue(materialItem),
    reload: vi.fn().mockResolvedValue({}),
  }
  wrapper = mount(MaterialTable, {
    props: { camp, materialItemCollection, ...props },
    global: {
      stubs,
      mocks: { $t: (key) => key, api },
      provide: { isContributor: true },
      directives: { resizeobserver: {} },
    },
  })
  await wrapper.setData({ clientWidth: width })
  return api
}

async function moveItemInTableRow() {
  wrapper.findComponent(ApiSelect).vm.$emit('saved')
  await flushPromises()
}

async function moveItemInEditDialog() {
  wrapper.findComponent({ name: 'DialogMaterialItemEdit' }).vm.open()
  await flushPromises()
  wrapper
    .findComponent(MaterialListSelect)
    .vm.$emit('update:modelValue', targetList._meta.self)
  await wrapper.findComponent(DialogForm).props('submitAction')()
  await flushPromises()
}

describe.each([
  ['table row', DESKTOP_WIDTH, moveItemInTableRow],
  ['edit dialog', MOBILE_WIDTH, moveItemInEditDialog],
])('moving a material item to another list in the %s', (_, width, moveItem) => {
  it('reloads the items of the displayed material list', async () => {
    const api = await mountTable(width, { materialList: sourceList })

    await moveItem()

    expect(api.reload).toHaveBeenCalledWith(materialItemCollection)
  })

  it('does not reload the items when all material lists are displayed', async () => {
    const api = await mountTable(width)

    await moveItem()

    expect(api.reload).not.toHaveBeenCalledWith(materialItemCollection)
  })

  it.each([
    ['one material list is', { materialList: sourceList }],
    ['all material lists are', {}],
  ])('reloads the item counts when %s displayed', async (_, props) => {
    const api = await mountTable(width, props)

    await moveItem()

    expect(api.reload).toHaveBeenCalledWith(materialLists)
  })
})
