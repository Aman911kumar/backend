class apiResponse {
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode
        this.data = data
        this.success = statusCode < 400
    }
}

export {apiResponse}