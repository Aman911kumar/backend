import { asyncHandler } from '../utils/asyncHandler.js'
import { apiError } from '../utils/apiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js'
import { apiResponse } from '../utils/apiResponse.js'
import jwt from "jsonwebtoken"
import dotenv from 'dotenv'
import mongoose from 'mongoose'
dotenv.config({
    path: "../.env"
})

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new apiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    /*
    get user details from frontend
    validation - not empty
    check if user already exists: username, email
    check for images, check for avatar
    upload them to cloudinary, avatar
    crate user object - create entry in bd 
    remove password and refresh token field from response 
    check for user creation return responce or error
    */

    const { fullName, email, username, password } = req.body
    console.log(req.body)

    if ([fullName, email, username, password].some((field) => (field?.trim() === ""))) {
        throw new apiError(400, "all fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new apiError(409, "user already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path

    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new apiError(400, "error while uploading avatar")
    }

    const user = await User.create({
        username: username.toLowerCase(),
        fullName,
        avatar,
        coverImage,
        email,
        password: password.trim(),
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new apiError(500, "somthing went wrong while register")
    }

    return res.status(201).json(
        new apiResponse(200, createdUser, "User registered successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    /* 
    req body -> data
    username or email
    find the user 
    password check 
    access and refresh token
    send cookie
     */

    const { email, username, password } = req.body
    console.log(req.body)


    if (!username && !email) {
        throw new apiError(400, "username or email is required")
    }

    if (!password || password.trim() === "") {
        throw new apiError(400, "password is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new apiError(404, "User not found")
    }

    if (!(await user.isPasswordCorrect(password))) {
        throw new apiError(401, "Incorrect password")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new apiResponse(200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged In successfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new apiResponse(200, {}, "User logged out Successfully"))
})

const deleteUser = asyncHandler(async (req, res) => {

    /*
    get user data 
    verify required field 
    check if userExist
    check password
    delete user
    */

    const { username, email, password } = req.body

    if (!username && !email) {
        throw new apiError(400, "Username or email is required")
    }
    if (!password || password.trim === "") {
        throw new apiError(400, "Password is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new apiError(404, "User not found")
    }
    const userPass = await user.isPasswordCorrect(password)
    if (!userPass) {
        throw new apiError(401, "Incorrect password")
    }

    await deleteFromCloudinary(user.avatar?.public_id)
    await deleteFromCloudinary(user.coverImage?.public_id)

    const deletedUser = await User.findByIdAndDelete(user._id).select("-password -refreshToken")

    return res
        .status(200)
        .json(new apiResponse(200, { deletedUser }, "User Delete Successfully"))
})

const validateAndUpdateRefreshAccessToken = asyncHandler(async (req, res) => {
    /*
    get tokens from user 
    decode refresh token
    check if refresh token is = user.refreshToken
    if correct than update it
    */
    const clienSideRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!clienSideRefreshToken) {
        throw new apiError(401, "Refresh token not avalible Please login again")
    }

    try {
        const decodedClientRefreshToken = jwt.verify(clienSideRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedClientRefreshToken?._id)

        if (!user) {
            throw new apiError(404, "User not found")
        }

        if (clienSideRefreshToken !== user.refreshToken) {
            throw new apiError(401, "Refresh token is expired")
        }
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new apiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token generated"
                )
            )
    } catch (error) {
        throw new apiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async () => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new apiError(400, "Wrong password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            apiResponse(200, {}, "Password changes successfully")
        )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new apiError(404, "User not found")
    }
    return res.status(200).json(
        new apiResponse(200, req.user, "Current user fetched successfully")
    )
})

const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar image is required")
    }

    const oldAvatar = req.user.avatar
    const newAvatar = await uploadOnCloudinary(avatarLocalPath)

    if (!newAvatar.public_id) {
        throw new apiError(400, "Error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { avatar: newAvatar }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    if (newAvatar?.public_id) {
        await deleteFromCloudinary(oldAvatar?.public_id)
    }
    return res.status(200).json(
        new apiResponse(200, { user }, "Avatar updated successfully")
    )
})

const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new apiError(400, "Cover image is required")
    }
    const oldCoverImage = req.user.coverImage
    const newCoverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!newCoverImage.public_id) {
        throw new apiError(400, "Error while uploading cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { coverImage: newCoverImage }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    if (newCoverImage?.public_id) {
        await deleteFromCloudinary(oldCoverImage?.public_id)
    }

    return res.status(200).json(
        new apiResponse(200, user, "Cover Image updated successfully")
    )

})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params

    if (!username || username.trim() === "") {
        throw new apiError(400, "Username is required")
    }

    const channel = await User.aggregate([
        {
            $match: { username: username.toLowerCase() }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" },
                channelSubscribedtoCount: { $size: "$subscribedTo" },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                _id: 1,
                username: 1,
                fullName: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: { $size: "$subscribers" },
                channelSubscribedtoCount: { $size: "$subscribedTo" },
                isSubscribed: 1,
            }
        }
    ])
    console.log(channel);

    if (!channel || channel.length === 0) {
        throw new apiError(404, "Channel not found")
    }

    return res.status(200).json(
        new apiResponse(200, channel, "Channel profile fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(req.user._id) }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
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
                    }
                ]
            }
        }
    ])

    if (!user) {
        throw new apiError(404, "User not found")
    }

    return res.status(200).json(
        new apiResponse(200, user, "Watch history fetched successfully")
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    deleteUser,
    validateAndUpdateRefreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserAvatar,
    updateCoverImage,
    getWatchHistory,
    getUserChannelProfile
}