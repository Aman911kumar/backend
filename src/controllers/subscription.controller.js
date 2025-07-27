import mongoose from "mongoose";
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Subscription } from "../models/subscription.model.js"
import { verifyOwner } from "../utils/verifyOwner.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new apiError(400, "Invalid channelId");
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    });

    let isSubscribed;

    if (existingSubscription) {
        verifyOwner(existingSubscription.subscriber, req.user._id)
        await existingSubscription.deleteOne();
        isSubscribed = false;
    } else {
        await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        });
        isSubscribed = true;
    }

    return res.status(isSubscribed ? 201 : 200).json(
        new apiResponse(
            isSubscribed ? 201 : 200,
            { isSubscribed },
            isSubscribed ? "Subscribed successfully" : "Unsubscribed successfully"
        )
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new apiError(400, "Invalid channelId")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: { channel: new mongoose.Types.ObjectId(channelId) }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
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
            $unwind: "$subscriber"
        }
    ])
    if (!subscribers) {
        throw new apiError(400, "Error while fetching subsribers")
    }

    const subsCount = subscribers.length

    return res.status(200).json(
        new apiResponse(
            200,
            { subscribers, subsCount },
            subsCount === 0 ? "You don't have any suscribers" : "Subscribers fetched successfully"
        )
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
        throw new apiError(400, "Invalid subscriberId")
    }

    const channels = await Subscription.aggregate([
        {
            $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
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
            $unwind: "$channel"
        }
    ])
    if (!channels) {
        throw new apiError(400, "Error while fetching subsribers")
    }

    const channelCount = channels.length

    return res.status(200).json(
        new apiResponse(
            200,
            { channels, channelCount },
            channelCount === 0 ? "You don't have any subscribed channel" : "Channel fetched successfully"
        )
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}