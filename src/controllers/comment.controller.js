import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!videoId) {
        throw new ApiError(400, "videoId is required");
    }

    try {
        // const allComment = await Comment.find({ video: videoId })
        // .skip((page - 1) * limit)
        // .limit(page * limit)
        // .populate({
        //     path: "owner",
        //     select: "-password -email -refreshToken -coverImage -watchHistory -createdAt -updatedAt" // Exclude 'password' and 'email' fields
        // })
        const allComment = await Comment.aggregate([
            {
                $match: {
                    video: new mongoose.Types.ObjectId(videoId)
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                },
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "comment",
                    as: "likes",
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

        if (!allComment) {
            throw new ApiError(404, "No comments found for this video");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, allComment, "Comments retrieved successfully")
            );

    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to get comments");
    }

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    const { content } = req.body;

    if ([videoId, content].every((field) =>
        field?.trim() === ""
    )) {
        throw new ApiError(400, "videoId and content field can't be empty");
    }

    try {
        const video = await Video.findById(videoId);

        if (!video) {
            throw new ApiError(404, "Video not found");
        }

        const newComment = await Comment.create({
            video: videoId,
            owner: req.user._id,
            content,
        });

        if (!newComment) {
            throw new ApiError(500, "Comment not created");
        }

        return res
            .status(201)
            .json(
                new ApiResponse(201, newComment, "Comment created")
            );

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong");
    }
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const userId = req.user._id;
    const { commentId } = req.params;
    const { content } = req.body;

    if (!commentId) {
        throw new ApiError(400, "Comment ID is required");
    }

    if (!content || content === "") {
        throw new ApiError(400, "Content field can't be empty");
    }

    try {
        const comment = await Comment.findById(commentId);

        if (!comment) {
            throw new ApiError(404, "Comment not found");
        }

        if (!userId.equals(comment.owner)) {
            throw new ApiError(403, "Unauthorized to update this comment");
        }

        const updatedComment = await Comment.findByIdAndUpdate(commentId,
            {
                $set: {
                    content
                }
            },
            { new: true }
        );

        if (!updatedComment) {
            throw new ApiError(500, "Comment not updated");
        }

        return res.status(200).json(
            new ApiResponse(200, updatedComment, "Comment updated")
        );

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong");
    }
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    const userId = req.user._id;

    if (!commentId) {
        throw new ApiError(400, "Comment ID is required");
    }

    try {
        const comment = await Comment.findById(commentId);

        if (!comment) {
            throw new ApiError(404, "Comment not found");
        }

        if (!userId.equals(comment.owner)) {
            throw new ApiError(403, "Unauthorized to delete this comment");
        }

        const deletedComment = await Comment.findByIdAndDelete(commentId);

        if (!deletedComment) {
            throw new ApiError(500, "Comment not deleted");
        }

        return res.status(200).json(
            new ApiResponse(200, {}, "Comment deleted")
        );

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong");
    }
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
