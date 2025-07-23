import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function verifyOwner(userId, ownerId) {
    if (String(userId) !== String(ownerId)) {
        throw new apiError(401, "Unauthorized request")
    }
}

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new apiError(400, "videoId is required")
    }

    const likeDetails = await Like.findOne({
        likedBy: req.user._id,
        video: new mongoose.Types.ObjectId(videoId)
    })

    let like

    if (!likeDetails) {
        like = await Like.create({
            video: new mongoose.Types.ObjectId(videoId),
            likedBy: new mongoose.Types.ObjectId(req.user._id)
        })
        if (!like) {
            throw new apiError(500, "Error while creating like")
        }
    }
    else {
        verifyOwner(likeDetails.likedBy, req.user._id)
        await Like.findOneAndDelete({
            likedBy: new mongoose.Types.ObjectId(req.user._id)
        })
    }

    like = like ? like : "Unliked the video"

    return res.status(200).json(
        new apiResponse(200, { like }, `${like ? "Liked" : "Unlike"} successfully`)
    )
    //TODO: toggle like on video
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new apiError(400, "videoId is required")
    }

    const likeDetails = await Like.findOne({
        likedBy: req.user._id,
        comment: new mongoose.Types.ObjectId(commentId)
    })

    let like

    if (!likeDetails) {
        like = await Like.create({
            comment: new mongoose.Types.ObjectId(commentId),
            likedBy: new mongoose.Types.ObjectId(req.user._id)
        })
        if (!like) {
            throw new apiError(500, "Error while creating like")
        }
    }
    else {
        verifyOwner(likeDetails.likedBy, req.user._id)
        await Like.findOneAndDelete({
            likedBy: new mongoose.Types.ObjectId(req.user._id)
        })
    }

    like = like ? like : "Unliked the comment"

    return res.status(200).json(
        new apiResponse(200, { like }, `${like ? "Liked" : "Unlike"} successfully`)
    )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new apiError(400, "videoId is required")
    }

    const likeDetails = await Like.findOne({
        likedBy: req.user._id,
        tweet: new mongoose.Types.ObjectId(tweetId)
    })

    let like

    if (!likeDetails) {
        like = await Like.create({
            likedBy: new mongoose.Types.ObjectId(req.user._id),
            tweet: new mongoose.Types.ObjectId(videoId),
        })
        if (!like) {
            throw new apiError(500, "Error while creating like")
        }
    }
    else {
        verifyOwner(likeDetails.likedBy, req.user._id)
        await Like.findOneAndDelete({
            likedBy: new mongoose.Types.ObjectId(req.user._id)
        })
    }
    like = like ? like : "Unliked the tweet"

    return res.status(200).json(
        new apiResponse(200, { like }, `${like ? "Liked" : "Unlike"} successfully`)
    )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType } = req.query
    const userId = req.user._id
    const matchStage = {}
    const sortStage = {}
    sortStage[sortBy] = sortType === "asc" ? 1 : -1

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    }
    if (query) {
        matchStage.title = { $regex: query, $options: "i" }
    }
    else {
        matchStage.title = { $exists: true, $ne: null }
    }

    const aggregation = Like.aggregate([
        {
            $match: {
                likedBy: userId,
                video: { $exists: true, $ne: null }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
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
                        $unwind:"$owner"
                    }
                ]
            }
        },
        {
            $unwind:"$video"
        },
        {
            $match: {
                video: { $exists: true, $ne: null }
            }
        },
        {
            $sort: sortStage
        }
    ])

    const result = await Like.aggregatePaginate(aggregation, options)
    if (!result) {
        throw new apiError(500, "Error while fetching the reslut")
    }

    return res.status(200).json(
        new apiResponse(200, { ...result }, "All liked video fetched successfully")
    )
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}