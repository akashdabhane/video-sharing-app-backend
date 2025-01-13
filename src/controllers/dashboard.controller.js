import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;    // userId === channelId // getting information for channel
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    try {
        const channelStats = await Video.aggregate([
            {
                $match: { owner: userId },
            },
            {
                $group: {
                    _id: null,
                    totalVideos: {
                        $sum: 1
                    },
                    totalViews: {
                        $sum: "$views"
                    },
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes"
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "owner",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },
            {
                $addFields: {
                    totalLikes: {
                        $size: "$likes"
                    },
                    totalSubscribers: {
                        $size: "$subscribers"
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    likes: 0,
                    subscribers: 0,
                }
            },
        ])

        if (!channelStats) {
            throw new ApiError(500, "Failed to get channel stats")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, channelStats[0], "Channel stats retrieved successfully")
            )
    } catch (error) {
        throw new ApiError(500, "Failed to get channel stats");
    }
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    // TODO: Get all the videos uploaded by the channel

    try {
        const allVideos = await Video.find({ owner: userId })

        if (!allVideos) {
            throw new ApiError(404, "No videos found")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, allVideos, "Videos retrieved successfully")
            )
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to get videos")
    }
})

// get all the user info, videos, playlist, tweets uploaded by the channel
const getChannelsAllContent = asyncHandler(async (req, res) => {
    const { id } = req.params; // channel id
    const channelAllContent = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos"
            }
        },
        {
            $lookup: {
                from: "playlists",
                localField: "_id",
                foreignField: "owner",
                as: "playlists"
            }
        },
        {
            $lookup: {
                from: "tweets",
                localField: "_id",
                foreignField: "owner",
                as: "tweets"
            }
        },
        {
            $project: {
                password: 0,
                refreshToken: 0,
            }
        }
    ])

    if (!channelAllContent) {
        throw new ApiError(404, "No channel found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channelAllContent, "Full channel content retrieved successfully")
        )
})

export {
    getChannelStats,
    getChannelVideos,
    getChannelsAllContent
}