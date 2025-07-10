import { describe, expect, it } from "vitest"
import { isCellRef } from "../utils/match"
import { getCellsInRange, getIndexFromCellName } from "../utils/cells"
import { ALPHABET_WITH_FILLER } from "../../config/constants"

// =================================================
// # TEST DATA
// =================================================

// TODO: Test cases to add
// for cellValueProvider
// * "it fails when single cell is not a number" (formula: "1+A1" where A1.value === undefined), "it fails when cell in range is not a number (formula: "1+SUM(A0:B1)" where A1.value == undefined and rest of cells contains numbers); "it fails on circular cell ref in getCellValue", "it fails on circular cell ref in getRangeValues"
//
// for range parser:
// * handles forward range (A0:A3)
// * handles reverse range (A3:A0)
// * edge: handles single-cell range (A1:A1)
//
describe("cell utils", () => {
    describe("range parser", () => {
        it("extracts range", () => {
            const numOfCols = ALPHABET_WITH_FILLER.length - 1
            const rangeSimple: [number, number] = [0, 10]
            const rangeSingle: [number, number] = [0, 0]
            const rangeOverY: [number, number] = [1, 28]

            expect(getCellsInRange(...rangeSimple, numOfCols)).toEqual([
                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            ])
            expect(getCellsInRange(...rangeSingle, numOfCols)).toEqual([0])
            expect(getCellsInRange(...rangeOverY, numOfCols)).toEqual([
                1, 2, 27, 28,
            ])
        })
    })

    it("converts cell names to indices", () => {
        expect(getIndexFromCellName("A1")).toEqual(26)
        expect(getIndexFromCellName("B0")).toEqual(1)
    })

    it("matches cells", () => {
        expect(isCellRef("A1")).toEqual(true)
        expect(isCellRef("a01")).toEqual(true)
        expect(isCellRef("A001")).toEqual(false)
        expect(isCellRef("A999")).toEqual(false)
        expect(isCellRef("fA9")).toEqual(false)
    })
})
