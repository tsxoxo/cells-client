export interface CleanToken {
  value: number,
  indexOfOriginCell: number
}

export interface Cell {
  // raw user input
  content: string,
  // only set when formula is successfully interpreted 
  value: number | undefined,
  // indices of cells used in formula
  dependencies: number[]
  // cells that reference this cell
  dependents: number[]
}

