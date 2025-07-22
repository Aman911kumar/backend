import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"

function verifyOwner(userId, video_ownerId) {
    if (String(userId) !== String(video_ownerId)) {
        throw new apiError(401, "Unauthorized request")
    }
}

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId, username } = req.query
    const matchStage = {
        isPublished: true
    }
    const sortStage = {}
    sortStage[sortBy] = sortType === 'asc' ? 1 : -1;
    if (query) {
        matchStage.title = { $regex: query, $options: "i" }
    }
    if (userId) {
        matchStage.owner = new mongoose.Types.ObjectId(userId)
    }

    const aggregation = Video.aggregate([
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
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                },
            }
        },
        {
            $match: username ? { "owner.username": username } : {}
        },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                owner: 1,
                isPublished: 1,
                createdAt: 1,
                updatedAt: 1,
            }
        },
        {
            $sort: sortStage
        }
    ]);
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
    }

    const result = await Video.aggregatePaginate(aggregation, options)
    return res.status(200).json(
        new apiResponse(200, { result }, "Video fetched successfully")
    )
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {

    const { title, description } = req.body
    const owner = req.user?._id;
    if (!owner) {
        throw new apiError(401, "Unauthorized request please login")
    }

    if (!title || !description || title.trim() === "" || description.trim() === "") {
        throw new apiError(400, "title and description are required")
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0].path

    if (!videoLocalPath) {
        throw new apiError(400, "video is required")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    if (!videoFile || videoFile?.url === "") {
        throw new apiError(500, "Error while uploding video")
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    const video = await Video.create({
        videoFile,
        thumbnail,
        title,
        description,
        owner
    })

    return res.status(200).json(
        new apiResponse(201, video, "Video uploaded successfully")
    )
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new apiError(400, "required video id")
    }
    let video = await Video.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(videoId) }
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
                            avatar: 1,
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
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                owner: 1,
                isPublished: 1,
                createdAt: 1,
                updatedAt: 1,
            }
        }
    ])
    if (!video.length) {
        throw new apiError(404, "Video not found")
    }
    video = video[0]
    if (!video.isPublished) {
        const videoMetaData = {
            videoId: video._id,
            thumbnail: video.thumbnail,
            title: video.title,
            description: video.description,
            owner: video.owner,
            isPublished: video.isPublished,
            createdAt: video.createdAt
        }
        return res.status(200).json(
            new apiResponse(200, { videoMetaData }, "This video is private")
        )
    }
    return res.status(200).json(
        new apiResponse(200, { video }, "Video fetched successfully")
    )
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    const thumbnailLocalPath = req.file?.path
    const video = await Video.findById(videoId)
    const oldThumbnail = video.thumbnail?.public_id

    if (!video) {
        throw new apiError(404, "Video not found")
    }

    verifyOwner(req.user._id, video.owner)

    async function updateThumbnail() {
        let deleteOldThumbnail
        let newThumbnail
        try {
            if (!thumbnailLocalPath) return video.thumbnail
            newThumbnail = await uploadOnCloudinary(thumbnailLocalPath)
            if (newThumbnail.url) {
                deleteOldThumbnail = await deleteFromCloudinary(oldThumbnail)
            }

            return {
                ...newThumbnail,
                oldThumbnailMeta: {
                    public_id: oldThumbnail,
                    deleteStatus: deleteOldThumbnail
                }
            }

        } catch (error) {
            await deleteFromCloudinary(newThumbnail?.public_id)
            throw new apiError(500, "Error while uploding new thumbnail")
        }
    }

    const newThumbnail = await updateThumbnail()

    const updatedVideo = await Video.findByIdAndUpdate(video._id,
        {
            title: title || video.title,
            description: description || video.description,
            thumbnail: newThumbnail
        },
        {
            new: true
        }
    )

    return res.status(200).json(
        new apiResponse(200, { updatedVideo, }, "Video updated successfully")
    )
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new apiError(400, "videoid is required")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new apiError(404, "Video not found")
    }

    verifyOwner(req.user._id, video.owner)

    const vidResponce = await deleteFromCloudinary(video.videoFile?.public_id)
    const imgResponce = await deleteFromCloudinary(video.thumbnail?.public_id)
    if (!(vidResponce.result === "ok")) {
        throw new apiError(404, "Rsources not found")
    }

    await Video.findByIdAndDelete(video._id)

    return res.status(200).json(
        new apiResponse(200, { vidResponce, imgResponce }, "Video deleted successfully")
    )
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findById(videoId)
    if (!video) {
        throw new apiError(404, "Video not found")
    }
    verifyOwner(req.user._id, video.owner)

    const upDatedVideo = await Video.findByIdAndUpdate(
        video._id,
        {
            isPublished: !video.isPublished
        },
        {
            new: true
        }
    )

    if (!upDatedVideo) {
        throw new apiError(500, "Error while updating")
    }

    return res.status(200).json(
        new apiResponse(200, { upDatedVideo }, `Video ${upDatedVideo.isPublished ? "published" : "unpublished"} successfully`)
    )

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
