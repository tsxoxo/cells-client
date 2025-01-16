export interface Circle {
    coordinates: { x: number, y: number },
    radius: number,
    id: number;
}

export type State = Circle[]