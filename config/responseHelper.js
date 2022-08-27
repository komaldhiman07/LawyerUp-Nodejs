/** function for return Success Response */
export const successResponse = async (msg, data, code) => {
    return {
        status: 1,
        message: msg,
        code: code,
        data: data ? data : ''
    }
}
/** function for return Error Response */
export const errorResponse = async (msg, data, code) => {
    return {
        status: 0,
        message: msg,
        code: code,
        data: data ? data : ''
    }
}

