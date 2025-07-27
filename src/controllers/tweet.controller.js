import mongoose from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { verifyOwner } from "../utils/verifyOwner.js"


const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body
    if (!content) {
        throw new apiError(400, "content is required")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    })

    if (!tweet) {
        throw new apiError(500, "Error while creating tweet")
    }

    return res.status(201).json(
        new apiResponse(201, { tweet }, "Tweet created succesfully")
    )
    //TODO: create tweet
})

const getUserTweets = asyncHandler(async (req, res) => {

    const userId = req.user._id
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new apiError(400, "Invalid userId")
    }

    const tweets = await Tweet.aggregate([
        {
            $match: { owner: userId }
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
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$owner"
        }
    ])

    if (!tweets || tweets.length === 0) {
        throw new apiError(404, "No tweets found")
    }

    return res.status(200).json(
        new apiResponse(200, { tweets }, "Tweets fetched succesfully")
    )

    // TODO: get user tweets
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const { content } = req.body
    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new apiError(400, "Invalid tweetId")
    }
    if (!content) {
        throw new apiError(400, "content is required")
    }

    let tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new apiError(404, "Tweet not found")
    }

    verifyOwner(req.user._id, tweet.owner)

    tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            content
        },
        {
            new: true
        }
    )

    if (!tweet) {
        throw new apiError(500, "Error while updating tweet")
    }

    return res.status(201).json(
        new apiResponse(201, { tweet }, "Tweet updated succesfully")
    )
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new apiError(400, "Invalid tweetId")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new apiError(404, "Tweet not found")
    }

    verifyOwner(req.user._id, tweet.owner)

    await tweet.deleteOne();

    return res.status(201).json(
        new apiResponse(201, { tweet }, "Tweet deleted succesfully")
    )
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}