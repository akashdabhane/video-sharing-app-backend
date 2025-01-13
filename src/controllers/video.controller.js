import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Like } from "../models/like.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    //TODO: get all videos based on query, sort, pagination

    // assuming sortBy = 'createdAt', sortType = 'desc' types of values
    const filter = {};
    if (query) {
        filter.title = { $regex: query, $options: 'i' }; // Case-insensitive regex search on the title
    }

    if (userId) {
        filter.userId = userId; // Filter by userId if provided
    }

    const sort = {};
    sort[sortBy] = sortType === 'desc' ? -1 : 1; // Sort by the provided field and type

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    try {
        // Fetch videos from the database with filtering, sorting, and pagination
        const videos = await Video.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit, 10))  // Ensure limit is an integer
            .populate({
                path: "owner",
                select: "-password -email -refreshToken -coverImage -watchHistory -createdAt -updatedAt" // Exclude 'password' and 'email' fields
            });

        res
            .status(200)
            .json(
                new ApiResponse(200, videos, "videos fetched successfully")
            )
    } catch (error) {
        throw new ApiError(500, "Failed to fetch videos");
    }
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, isPublished } = req.body;
    const userId = req.user._id;
    // TODO: get video, upload to cloudinary, create video
    if ([title, description].some((field) =>
        field?.trim() === ""
    )) {
        throw new ApiError(400, "title and description are required");
    }

    const videoLocalFile = req.files?.videoFile[0].path;
    const thumbnailLocalFile = req.files?.thumbnail[0].path;

    if (!videoLocalFile) {
        throw new ApiError(400, "Video file is required");
    }

    if (!thumbnailLocalFile) {
        throw new ApiError(400, "Thumbnail file is required");
    }

    try {
        const video = await uploadOnCloudinary(videoLocalFile);
        const thumbnail = await uploadOnCloudinary(thumbnailLocalFile);

        if (!video) {
            throw new ApiError(400, "Failed to upload video file");
        }

        if (!thumbnail) {
            throw new ApiError(400, "Failed to upload thumbnail file");
        }

        let newVideoObj = {
            title,
            description,
            owner: userId,
            duration: Math.round(video.duration),
            videoFile: video.url,
            thumbnail: thumbnail.url
        }

        if (isPublished === false) {
            newVideoObj.isPublished = false
        }

        const newVideo = await Video.create(newVideoObj)

        if (!newVideo) {
            throw new ApiError(400, "Failed to upload/create video");
        }

        return res
            .status(201)
            .json(
                new ApiResponse(200, newVideo, "Video published successfully")
            )

    } catch (error) {
        throw new ApiError(400, error?.message || "Failed to publish video");
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    try {
        const video = await Video.findById(videoId).populate({
            path: "owner",
            select: "-password -email -refreshToken -coverImage -watchHistory -createdAt -updatedAt" // Exclude 'password' and 'email' fields
        })

        if (!video) {
            throw new ApiError(404, "Video not found");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, video, "Video retrieved successfully")
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Failed to get video");
    }
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body;
    const userId = req.user._id;
    const thumbnailLocalFile = req.files?.thumbnail[0].path;
    //TODO: update video details like title, description, thumbnail

    if ([title, description, thumbnailLocalFile].every((field) =>
        field?.trim() === ""
    )) {
        throw new ApiError(400, "Can't update video details with empty fields");
    }

    let updatesObj = {}

    if (title) updatesObj.title = title;
    if (description) updatesObj.description = description;

    try {
        const video = await Video.findById(videoId)

        if (!userId.equals(video.owner)) {
            throw new ApiError(403, "Unauthorized to update this video details");
        }

        if (thumbnailLocalFile) {
            const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalFile)
            if (!uploadedThumbnail) {
                throw new ApiError(400, "Failed to upload thumbnail file");
            }
            updatesObj.thumbnail = uploadedThumbnail.url;
        }

        const updatedVideo = await Video.findByIdAndUpdate(videoId, updatesObj, { new: true });

        if (!updatedVideo) {
            throw new ApiError(404, "Video not found");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, updatedVideo, "Video details updated successfully")
            )

    } catch (error) {
        throw new ApiError(400, error?.message || "Failed to update video details");
    }
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user._id;
    //TODO: delete video

    // I think, we need to delete all the information related to the deleted video from database like likes, comments, tweets
    try {
        const video = await Video.findById(videoId);

        if (!userId.equals(video.owner)) {
            throw new ApiError(403, "Unauthorized to delete this video");
        }

        await Video.findByIdAndDelete(videoId);
        // await Comment.deleteMany({ video: videoId })
        // await Like.deleteMany({ video: videoId })

        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, "Video deleted successfully")
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Failed to delete video");
    }
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user._id;

    try {
        const video = await Video.findById(videoId);

        if (!video) {
            throw new ApiError(404, "Video not found");
        }

        if (!userId.equals(video.owner)) {
            throw new ApiError(403, "Unauthorized to toggle video publish status");
        }

        video.isPublished = !video.isPublished;
        await video.save();

        return res
            .status(200)
            .json(
                new ApiResponse(200, video, "Video publish status toggled successfully")
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Failed to toggle video publish status");
    }
})

const getAllChannelVideos = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    const allVideoOfChannel = await Video.find({ owner: channelId });

    if (!allVideoOfChannel) {
        throw new ApiError(404, "No videos found for this channel");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, allVideoOfChannel, "All videos for this channel fetched successfully")
        )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getAllChannelVideos
}