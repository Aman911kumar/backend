import { apiError } from "./apiError.js"

const verifyOwner = (userId, ownerId) => {
    if (String(userId) !== String(ownerId)) {
        throw new apiError(401, "Unauthorized request")
    }
}

export { verifyOwner }