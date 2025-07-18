import { Result, fail, success } from "../parse/types/result"
import { Payload } from "../types/io"
import { Cell } from "../types/types"

export async function submit(
    payload: Payload[],
): Promise<Result<Cell[], Error>> {
    const url = `http://localhost:3000/cells`
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            // NOTE: Do we need to stringify with content-type==json?
            body: JSON.stringify({
                payload,
            }),
        })

        if (!res.ok) {
            throw new Error(`Response status: ${res.status}`)
        }
        const json = await res.json()

        return success(json.data)
    } catch (e) {
        return fail(e as Error)
    }
}
