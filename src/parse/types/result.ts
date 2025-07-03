// ########################################################################
// RESULT PATTERN
// ########################################################################
export type Result<T, E> = Success<T> | Failure<E>
export type Success<T> = { ok: true; value: T }
export type Failure<E> = { ok: false; error: E }

export function success<T>(value: T): Success<T> {
    return { ok: true, value }
}

export function fail<E>(error: E): Failure<E> {
    return { ok: false, error }
}

// Type guards
export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
    return result.ok === true
}

export function assertNever(
    module: string,
    context: string,
    obj: never,
): never {
    throw new Error(
        `Module [${module}] encountered unknown [${context}]: ${JSON.stringify(obj, null, 2)}`,
    )
}

export function assertIsSuccess<T, E>(
    result: Result<T, E>,
): asserts result is Success<T> {
    if (!result.ok) {
        throw new Error(
            `result is not a success! error: ${JSON.stringify(result.error, null, 2)}`,
        )
    }
}

export function assertIsFail<T, E>(
    result: Result<T, E>,
): asserts result is Failure<E> {
    if (result.ok) {
        throw new Error(
            `result is not a fail! value: ${JSON.stringify(result.value, null, 2)}`,
        )
    }
}
