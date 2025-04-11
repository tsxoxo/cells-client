import { describe, expect, it } from "vitest";
import { isOp } from "../matchers";

// =================================================
// # TEST DATA
// =================================================

describe('Matchers', () => {
  it('matches ops', () => {
    expect(isOp('+')).toEqual(true)
  })
})
