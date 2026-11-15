import { describe, expect, it } from 'vitest'
import {
  indexesOfPeriodsToOpen,
  toWorkbook,
} from '@/components/material/useMaterialViewHelper.js'

describe('toWorkBook', () => {
  it('replaces invalid characters', () => {
    const sheets = createSheets('s?h*e[]e/t:1:')

    const workbook = toWorkbook(sheets)

    expect(workbook.SheetNames).toEqual(['sheet1'])
  })

  it('shortens sheets names with more than 31 characters', () => {
    const sheetName = 'a'.repeat(32)
    const sheets = createSheets(sheetName)

    const workbook = toWorkbook(sheets)

    expect(workbook.SheetNames).toEqual([sheetName.slice(0, 31)])
  })

  it('does not overwrite sheets when shortening them makes them not unique anymore', () => {
    const sheets = [
      ...createSheets('a'.repeat(32)),
      ...createSheets('a'.repeat(33)),
      ...createSheets('a'.repeat(34)),
    ]
    const workbook = toWorkbook(sheets)

    expect(Object.entries(workbook.Sheets)).toHaveLength(sheets.length)
    expect(workbook.SheetNames.filter((name) => name.length > 31)).toEqual([])
  })

  it('does not overwrite sheets when they have the same name', () => {
    const sheets = [...createSheets('sheet1'), ...createSheets('sheet1')]
    const workbook = toWorkbook(sheets)

    expect(Object.entries(workbook.Sheets)).toHaveLength(sheets.length)
  })
})

describe('indexesOfPeriodsToOpen', () => {
  const now = Date.parse('2026-07-15')
  const ended = { end: '2026-07-14' }
  const running = { end: '2026-07-15' }
  const upcoming = { end: '2026-08-10' }

  it('opens the periods which have not ended', () => {
    expect(indexesOfPeriodsToOpen([ended, running, upcoming], now)).toEqual([1, 2])
  })

  it('opens all periods if all of them have ended', () => {
    expect(indexesOfPeriodsToOpen([ended, ended], now)).toEqual([0, 1])
  })

  it('opens nothing if there are no periods', () => {
    expect(indexesOfPeriodsToOpen([], now)).toEqual([])
  })
})

const data = [['row1']]

function createSheets(sheetName) {
  return [
    {
      sheetName: sheetName,
      data,
    },
  ]
}
