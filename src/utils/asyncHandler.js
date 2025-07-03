/*
const asyncHandler = (func) => {

    const funcInAsyncHandler = () => {
        //higher order function that take funtion as an argument (func) and canbe return a funtion
    }
    funcInAsyncHandler = (fn) => () => { } //one liner for higher order function

    return funcInAsyncHandler
}
*/

const asyncHandler2 = (requesHandler) => {
    return (req, res, next) => {
        Promise.resolve(requesHandler(req, res, next)).catch(err => next(err))
    }
}

const asyncHandler = (fn) => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next)
        } catch (error) {
            res.status(error.code || 500).json({
                success: false,
                message: error.message
            })
        }
    }
}

export { asyncHandler }