import { describe, expect, it } from "vitest";
import { isCellRef, isOp } from "../match";

// =================================================
// # TEST DATA
// =================================================

describe('Matchers', () => {
  it('matches ops', () => {
    expect(isOp('+')).toEqual(true)
    expect(isOp('=')).toEqual(false)
    expect(isOp('f+')).toEqual(false)
  })

  it('matches cells', () => {
    expect(isCellRef('A1')).toEqual(true)
    expect(isCellRef('a01')).toEqual(true)
    expect(isCellRef('A001')).toEqual(false)
    expect(isCellRef('A999')).toEqual(false)
    expect(isCellRef('fA9')).toEqual(false)
  })
})
