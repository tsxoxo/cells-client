//############################################################
// PROPERTY TESTS
//############################################################
// Integration tests for parsing pipeline.
// These are property tests, meaning they
// automagically run with a slew of random values.
//
// NB: We leave out 0 from all formulas here, and test related edgecases (1/0, etc.) through examples.
// WARN: !!! Test can still occasionally fail on formulas like 1/(E2-E2)
//
// --- SETUP ---
// Test infrastructure
import * as fc from "fast-check"
import { it, expect } from "vitest"
import { assertIsFail, assertIsSuccess } from "../types/errors"
import { createCellValueProvider, getIndexFromCellName } from "../cellUtils"
import { Cell } from "../../types/types.ts"

// Cells data (fake spreadsheets)
import {
    createNumericSpreadsheet,
    createEmptySpreadsheet,
    createStringSpreadsheet,
} from "./_cellsFactories.ts"

// Arbitraries
import {
    createFormulaNumericNoBrackets,
    createFormulaNumericWithBrackets,
    createFormulaWithFunctions,
    createFormulaWithSingleCells,
} from "./_formulaFactories.ts"

// TEST SUBJECTS
import { interpret } from "../interpret"
import { parseToAST } from "../main"
import { NUM_OF_COLS } from "../../config/constants.ts"

// --- HELPERS ---
// Can't use the one from match.ts as we need this unanchored to match all cells
const cellPattern = /[a-zA-Z]{1}[0-9]{1,2}/g

// Fills in numeric values for cell refs
// IN: "A2+1"
// OUT: "99+1"
// (Gets A2's value from a given cells array)
function replaceCellRefsWithValues(formula: string, cells: Cell[]): string {
    let numericFormula = formula
    const matches = [...formula.matchAll(cellPattern)]

    // Loop through all cell refs matches (data type: regex iterable)
    // Start from the back to prevent index shifting.
    for (let i = matches.length - 1; i >= 0; i--) {
        const match = matches[i]
        const cellName = match[0]
        const cellStartIndex = match.index // Returned array has additional 'index' property

        if (cellStartIndex === undefined) {
            throw new Error(
                "[prop.test.ts, replaceCellRefsWithValues]: cellStartIndex undefined",
            )
        }

        // Convert cellName to index
        const cellIndex = getIndexFromCellName(cellName)
        // Get cell value
        const cellValue = cells[cellIndex].value

        if (typeof cellValue !== "number") {
            throw new Error(
                "[prop.test.ts, replaceCellRefsWithValues]: cellValue not a number",
            )
        }

        // Splice in value
        numericFormula =
            numericFormula.slice(0, cellStartIndex) +
            String(cellValue) +
            numericFormula.slice(cellStartIndex + cellName.length)
    }

    return numericFormula
}

// --- TESTS ---
//############################################################
// NUMERIC
//############################################################
// Test valid formulas with only numeric values (no cell refs)

// Numeric formula, no brackets.
it("respects operator precedence", () => {
    fc.assert(
        fc.property(createFormulaNumericNoBrackets(), (expr) => {
            // Step 1: Make an AST
            const ast = parseToAST(expr)
            assertIsSuccess(ast)

            // Step 2: Evaluate formula
            const ourResult = interpret(ast.value)
            assertIsSuccess(ourResult)

            // Should be equal to eval()
            const jsResult = eval(expr)
            expect(ourResult.value.res).toEqual(jsResult)
            // Should be finite
            expect(Number.isFinite(ourResult.value.res)).toEqual(true)
        }),
    )
})

// No cell refs, no nested brackets.
it("parses numeric expressions with brackets", () => {
    fc.assert(
        fc.property(createFormulaNumericWithBrackets(), (expr) => {
            // Make AST.
            const ast = parseToAST(expr)
            assertIsSuccess(ast)

            // Evaluate formula.
            const ourResult = interpret(ast.value)
            assertIsSuccess(ourResult)

            // Should be equal to eval()
            const jsResult = eval(expr)
            expect(ourResult.value.res).toEqual(jsResult)
            // Should be finite
            expect(Number.isFinite(ourResult.value.res)).toEqual(true)
        }),
    )
})

//############################################################
// CELLS
//############################################################
// Tests valid formulas using cell refs

// Single cell refs, excluding func arguments like SUM(A1:A2)
it("processes single cell refs", () => {
    fc.assert(
        fc.property(createFormulaWithSingleCells(), (expr) => {
            // Create AST.
            const ast = parseToAST(expr)
            assertIsSuccess(ast)

            // Create cellValueProvider to pass to interpreter.
            const cells = createNumericSpreadsheet()
            const cellValueProvider = createCellValueProvider(
                cells,
                NUM_OF_COLS,
            )

            const ourResult = interpret(ast.value, cellValueProvider)
            assertIsSuccess(ourResult)

            // HACK: We can't use eval() on formulas with cell refs,
            // so we substitute their numeric values first.
            const formulaWithCellRefsResolved = replaceCellRefsWithValues(
                expr,
                cells,
            )

            // Should be equal to eval()
            const jsResult = eval(formulaWithCellRefsResolved)
            expect(ourResult.value.res).toEqual(jsResult)
            // Should be finite
            expect(Number.isFinite(ourResult.value.res)).toEqual(true)
        }),
    )
})

it("tracks cell dependencies", () => {
    fc.assert(
        fc.property(createFormulaWithSingleCells(), (expr) => {
            const ast = parseToAST(expr)
            assertIsSuccess(ast)

            // Create cellValueProvider to pass to interpreter.
            const cells = createNumericSpreadsheet()
            const cellValueProvider = createCellValueProvider(
                cells,
                NUM_OF_COLS,
            )

            const ourResult = interpret(ast.value, cellValueProvider)
            assertIsSuccess(ourResult)

            // deps is an array of cell indices
            const deps = ourResult.value.deps
            // Extract cell indices indices by hand
            const extractedCellIndices = expr
                .match(cellPattern)!
                .map((cellName) => getIndexFromCellName(cellName))

            expect(deps).toEqual(extractedCellIndices)
        }),
    )
})

// Functions with cell ranges as arguments like SUM(A1:A2)
it("processes functions", () => {
    fc.assert(
        fc.property(createFormulaWithFunctions(), (expr) => {
            // Create AST.
            const ast = parseToAST(expr)
            assertIsSuccess(ast)

            // Create cellValueProvider to pass to interpreter.
            const cells = createNumericSpreadsheet()
            const cellValueProvider = createCellValueProvider(
                cells,
                NUM_OF_COLS,
            )

            const ourResult = interpret(ast.value, cellValueProvider)
            assertIsSuccess(ourResult)

            // NOTE: can we get the result in a simple way?
            // const formulaWithCellRefsResolved = replaceCellRefsWithValues(expr, cells)
            // const jsResult = eval(formulaWithCellRefsResolved)
            //
            // expect(ourResult.value.res).toEqual(jsResult)
        }),
    )
})

// ############################################################
// ERRORS
// ############################################################
// Test for correct error generation

// When cell is undefined or non-numeric, return error type: CELL_NOT_A_NUMBER
it("returns correct error when cell is undefined", () => {
    fc.assert(
        fc.property(createFormulaWithSingleCells(), (expr) => {
            // Create AST.
            const ast = parseToAST(expr)
            assertIsSuccess(ast)

            // Create cellValueProvider with undefined cells to pass to interpreter.
            const cellsEmpty = createEmptySpreadsheet()
            const cellValueProviderEmpty = createCellValueProvider(
                cellsEmpty,
                NUM_OF_COLS,
            )

            const resultFromEmpty = interpret(ast.value, cellValueProviderEmpty)
            assertIsFail(resultFromEmpty)

            // Create cellValueProvider with non-numeric cells to pass to interpreter.
            const cellsStrings = createStringSpreadsheet()
            const cellValueProviderStrings = createCellValueProvider(
                cellsStrings,
                NUM_OF_COLS,
            )

            const resultFromStrings = interpret(
                ast.value,
                cellValueProviderStrings,
            )
            assertIsFail(resultFromStrings)
        }),
    )
})

// When range contains undefined or non-numeric cells, return error type: CELL_NOT_A_NUMBER
it("returns correct error when cell in range contains string", () => {
    fc.assert(
        fc.property(createFormulaWithFunctions(), (expr) => {
            // Create AST.
            const ast = parseToAST(expr)
            assertIsSuccess(ast)

            // Create cellValueProvider with undefined cells to pass to interpreter.
            const cellsEmpty = createEmptySpreadsheet()
            const cellValueProviderEmpty = createCellValueProvider(
                cellsEmpty,
                NUM_OF_COLS,
            )

            const resultFromEmpty = interpret(ast.value, cellValueProviderEmpty)
            assertIsFail(resultFromEmpty)

            // Create cellValueProvider with non-numeric cells to pass to interpreter.
            const cellsStrings = createStringSpreadsheet()
            const cellValueProviderStrings = createCellValueProvider(
                cellsStrings,
                NUM_OF_COLS,
            )

            const resultFromStrings = interpret(
                ast.value,
                cellValueProviderStrings,
            )
            assertIsFail(resultFromStrings)

            // NOTE: Can we test for anything else to improve specifity for this behavior?
            // We can't, for example, test on which cells it fails in a non trivial way,
            // due to the complexity of the generated formulas.
        }),
    )
})
