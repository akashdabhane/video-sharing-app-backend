import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Tweet } from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user._id;
    //TODO: toggle like on video

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    try {
        const video = await Video.findById(videoId);

        if (!video) throw new ApiError(404, "Video not found")

        const userLike = await Like.findOne({ video: videoId, likedBy: userId })

        if (userLike) {
            if (!userId.equals(userLike.likedBy)) {
                throw new ApiError(400, "You can't unlike this video")
            }

            await Like.findOneAndDelete({ video: videoId, likedBy: userId })

            return res
                .status(200)
                .json(
                    new ApiResponse(200, {}, "toggled like to video")
                )
        }

        const newLike = await Like.create({
            video: videoId,
            likedBy: userId
        })

        if (!newLike) throw new ApiError(400, "Failed to make like")

        return res
            .status(201)
            .json(
                new ApiResponse(201, newLike, "liked video")
            )

    } catch (error) {
        throw new ApiResponse(500, error?.message || "Server error")
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const userId = req.user._id;
    //TODO: toggle like on comment

    if (!commentId) {
        throw new ApiError(400, "comment ID is required");
    }

    try {
        const comment = await Comment.findById(commentId);

        if (!comment) throw new ApiError(404, "Comment not found")

        const userLike = await Like.findOne({ comment: commentId, likedBy: userId })

        if (userLike) {
            if (!userId.equals(userLike.likedBy)) {
                throw new ApiError(400, "You can't unlike this comment")
            }

            await Comment.findOneAndDelete({ video: commentId, likedBy: userId })

            return res
                .status(200)
                .json(
                    new ApiResponse(200, {}, "toggled like to comment")
                )
        }

        const newLike = await Like.create({
            comment: commentId,
            likedBy: userId
        })

        if (!newLike) throw new ApiError(400, "Failed to make like")

        return res
            .status(201)
            .json(
                new ApiResponse(201, newLike, "liked comment")
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Server error")
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const userId = req.user._id;
    //TODO: toggle like on tweet

    if (!tweetId) {
        throw new ApiError(400, "Video ID is required");
    }

    try {
        const tweet = await Tweet.findById(tweetId);

        if (!tweet) throw new ApiError(404, "Video not found")

        const userLike = await Like.findOne({ tweet: tweetId, likedBy: userId })

        if (userLike) {
            if (!userId.equals(userLike.likedBy)) {
                throw new ApiError(400, "You can't unlike this tweet")
            }

            await Tweet.findOneAndDelete({ video: tweetId, likedBy: userId })

            return res
                .status(200)
                .json(
                    new ApiResponse(200, {}, "toggled like to video")
                )
        }

        const newLike = await Like.create({
            tweet: tweetId,
            likedBy: userId
        })

        if (!newLike) throw new ApiError(400, "Failed to make like")

        return res
            .status(201)
            .json(
                new ApiResponse(201, newLike, "liked tweet")
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Server error")
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    //TODO: get all liked videos
    // need to implement aggregation pipeline

    try {
        const allLikedVideos = await Like.find({ likedBy: userId })

        const a = allLikedVideos.filter((doc) => { doc.video !== "" })
        return res.
            status(200)
            .json(
                new ApiResponse(200, a, "all liked videos fetched successfully")
            )
    } catch (error) {
        throw new ApiError(500, error?.message || "Server error")
    }
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}