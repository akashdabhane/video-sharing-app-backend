import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const userId = req.user._id;
    //TODO: create tweet

    if (!content || content === "") {
        throw new ApiError(400, "Content cannot be empty");
    }

    try {
        const tweet = await Tweet.create({ content, owner: userId });

        if (!tweet) {
            throw new ApiError(500, "Failed to create tweet");
        }

        return res
            .status(201)
            .json(
                new ApiResponse(200, tweet, "Tweet created successfully")
            )
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to create tweet");
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    // TODO: get user tweets

    try {
        const user = await User.findById(userId);

        if (!user) throw new ApiError(404, "User not found")

        // const allTweetOfUser = await Tweet.find({ owner: userId })
        const allTweetOfUser = await Tweet.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            }, 
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner"
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "tweet",
                    as: "likes"
                }
            },
            {
                $addFields: {
                    totalLikes: {
                        $size: "$likes"
                    },
                    isLiked: {
                        $in: [req.user._id, { $map: { input: "$likes", as: "like", in: "$$like.likedBy" } }]
                    },
                }
            },
            {
                $project: {
                    likes: 0,
                    owner: {
                        email: 0,
                        coverImage: 0,
                        watchHistory: 0,
                        password: 0,
                        createdAt: 0,
                        updatedAt: 0,
                        refreshToken: 0,
                    }
                }
            }
        ])

        if (!allTweetOfUser) {
            throw new ApiError(500, "Failed to get tweets")
        }

        return res.status(200).json(
            new ApiResponse(200, allTweetOfUser, "Tweets fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to get tweets");
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;
    //TODO: update tweet

    if (!content || content === "") {
        throw new ApiError(400, "Content cannot be empty");
    }

    try {
        const tweet = await Tweet.findById(tweetId);

        if (!tweet) {
            throw new ApiError(404, "Tweet not found")
        }

        if (!userId.equals(tweet.owner)) {
            throw new ApiError(403, "Unauthorized to update this tweet")
        }

        const updatedTweet = await Tweet.findByIdAndUpdate(tweetId,
            {
                $set: { content }
            },
            { new: true }
        )

        if (!updatedTweet) {
            throw new ApiError(500, "Failed to update tweet")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, updatedTweet, "Tweet updated successfully")
            )
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to update tweet");
    }
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId = req.user._id;
    //TODO: delete tweet
    // I think, we need to delete all likes and comments that are related to this tweet
    try {
        const tweet = await Tweet.findById(tweetId);

        if (!tweet) {
            throw new ApiError(404, "Tweet not found")
        }

        if (!userId.equals(tweet.owner)) {
            throw new ApiError(403, "Unauthorized to delete this tweet")
        }

        await Tweet.findByIdAndDelete(tweetId)

        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, "Tweet deleted successfully")
            )
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to delete tweet");
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}