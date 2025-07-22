import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

function verifyOwner(userId, ownerId) {
    if (String(userId) !== String(ownerId)) {
        throw new apiError(401, "Unauthorized request")
    }
}

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    if (!videoId) {
        throw new apiError(400, "videoId is required")
    }
    const { page = 1, limit = 10 } = req.query
    const matchStage = { video: videoId }
    const aggregation = Comment.aggregate([
        {
            $match: matchStage
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ])

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    }

    const result = await Comment.aggregatePaginate(aggregation, options)

    return res.status(200).json(
        new apiResponse(200, { result }, "Comments successfully fetched")
    )

})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { content } = req.body
    if (!content || !videoId) {
        throw new apiError(res, 400, "Content and video ID are required")
    }
    const comment = await Comment.create({
        content,
        video: new mongoose.Types.ObjectId(videoId),
        owner: new mongoose.Types.ObjectId(req.user._id)
    })

    if (!comment) {
        throw new apiError(res, 500, "Failed to add comment")
    }

    return res.status(201).json(
        new apiResponse(201, { comment }, "Comment added successfully")
    )
    // TODO: add a comment to a video
})

const updateComment = asyncHandler(async (req, res) => {
    const { videoId, commentId } = req.params
    const { content } = req.body
    if (!content || !commentId || !videoId) {
        throw new apiError(400, "content, commentId, and videoId are required")
    }

    const comment = await Comment.findOne({
        _id: commentId,
        video: videoId
    })
    if (!comment) {
        throw new apiError(404, "Comment not found")
    }

    verifyOwner(req.user._id, comment.owner)

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            content
        },
        {
            new: true
        }
    )

    if (!updateComment) {
        throw new apiError(500, "Somthing went wrong while updating comment")
    }

    return res.status(200).json(
        new apiResponse(200, { updatedComment }, "Comment updated successfully")
    )

    // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId, videoId } = req.params
    if (!(commentId || videoId)) {
        throw new apiError(400, "commentId and videoId is required")
    }

    const comment = await Comment.findOne({
        _id: commentId,
        video: videoId
    })

    if (!comment) {
        throw new apiError(400, "Comment not found")
    }

    verifyOwner(req.user._id, comment.owner)

    await Comment.findOneAndDelete({
        _id: commentId,
        video: videoId
    })

    res.status(200).json(
        new apiResponse(200, {}, "Comment deleted successfully")
    )
    // TODO: delete a comment
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}