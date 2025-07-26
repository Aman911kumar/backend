import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyOwner } from "../utils/verifyOwner.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    if (!name || !description) {
        throw new apiError(400, "name and description are required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })

    if (!playlist) {
        throw new apiError(500, "Error while creating playlist")
    }

    return res.status(201).json(
        new apiResponse(201, { playlist }, "Playlist successfully created")
    )
    //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new apiError(400, "Invalid userId")
    }

    const playlists = await Playlist.aggregate([
        {
            $match: { owner: new mongoose.Types.ObjectId(userId) }
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
                            email: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
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
                                        email: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind: "$owner"
                    }
                ]
            }
        }
    ])
    if (!playlists || playlists.length === 0) {
        throw new apiError(404, "No playlists found for this user")
    }

    return res.status(200).json(
        new apiResponse(200, { playlists }, "Playlist fetch successfully")
    )
    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new apiError(400, "Invalid PlaylistId")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(playlistId) }
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
                            email: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
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
                                        email: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind: "$owner"
                    }
                ]
            }
        }
    ])
    if (!playlist || playlist.length === 0) {
        throw new apiError(404, "Playlist not found")
    }

    return res.status(200).json(
        new apiResponse(200, { playlist: playlist[0] }, "Playlist fetch successfully")
    )
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {

    const { playlistId, videoId } = req.params
    if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new apiError(400, "Invalid PlaylistId or VideoId")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new apiError(404, "Video not found")
    }
    let playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new apiError(404, "Playlist not found")
    }

    verifyOwner(req.user._id, playlist.owner)
    const exists = await Playlist.findOne({
        _id: playlistId,
        videos: videoId,
    });

    if (exists) {
        throw new apiError(409, "Video already exists in playlist");
    }

    playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: { videos: video._id }
        },
        {
            new: true
        }
    )
    if (!playlist) {
        throw new apiError(500, "Error while adding video to playlist")
    }
    return res.status(200).json(
        new apiResponse(200, { playlist }, "Video is successfully added to playlist")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new apiError(400, "Invalid PlaylistId or VideoId")
    }

    let playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new apiError(404, "Playlist not found")
    }
    verifyOwner(req.user._id, playlist.owner)

    const videoExist = playlist.videos.includes(new mongoose.Types.ObjectId(videoId))

    if (!videoExist) {
        throw new apiError(404, "Video not found in playlist")
    }

    const deletedVideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            new: true
        }
    )

    if (!deletedVideo) {
        throw new apiError(500, "Error while deleting video from playlist")
    }

    return res.status(200).json(
        new apiResponse(200, { deletedVideo }, "Video deleted successfully from playlist")
    )

    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new apiError(400, "Invalid playlistId")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new apiError(404, "Playlist not found")
    }
    verifyOwner(req.user._id, playlist.owner)

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)

    if (!deletedPlaylist) {
        throw new apiError(500, "Error while deleting playlist")
    }

    return res.status(200).json(
        new apiResponse(200, { deletedPlaylist }, "Playlist deleted successfully")
    )

    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new apiError(400, "Invalid playlistId")
    }

    if (!name && !description) {
        throw new apiError(400, "Name or description is required")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new apiError(404, "Playlist not found")
    }
    verifyOwner(req.user._id, playlist.owner)

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            name: name || playlist.name,
            description: description || playlist.description
        },
        {
            new: true
        }
    )

    if (!updatedPlaylist) {
        throw new apiError(500, "Error while updating playlist")
    }

    return res.status(200).json(
        new apiResponse(200, { updatedPlaylist }, "Playlist updated successfully")
    )
    //TODO: update playlist
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
