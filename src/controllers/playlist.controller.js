import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    //TODO: create playlist

    if ([name, description].some((field) =>
        field?.trim() === ""
    )) {
        throw new ApiError(400, "name and description are required");
    }

    try {
        const playlist = await Playlist.create({
            name,
            description,
            owner: req.user._id,
        });

        if (!playlist) {
            throw new ApiError(500, "Failed to create playlist")
        }

        return res
            .status(201)
            .json(
                new ApiResponse(201, playlist, "playlist created successfully")
            )

    } catch (error) {
        throw new ApiError(500, "Failed to create playlist")
    }
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists

    try {
        const user = await User.findById(userId)

        if (!user) throw new ApiError(404, "User not found");

        //TODO: use of populate function
        const playlists = await Playlist.find({ owner: userId }).select("-videos")

        if (!playlists) {
            throw new ApiError(404, "failed to retrieve user playlist");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, playlists, "User playlists retrieved successfully")
            )
    } catch (error) {
        throw new ApiError(500, "Failed to get user playlists")
    }
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id

    try {
        const playlist = await Playlist.findById(playlistId)

        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, playlist, "Playlist retrieved successfully")
            )
    } catch (error) {
        throw new ApiError(500, "Failed to retrieve playlist")
    }
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    const userId = req.user._id;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video id");
    }

    try {
        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        if (!userId.equals(playlist.owner)) {
            throw new ApiError(403, "Unauthorized to add video to this playlist");
        }

        const addVideoPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            { $push: { videos: videoId } },
            { new: true }
        );

        if (!addVideoPlaylist) {
            throw new ApiError(500, "Failed to add video to playlist")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, addVideoPlaylist, "Video added to playlist successfully")
            )

    } catch (error) {
        throw new ApiError(500, "Failed to add video to playlist")
    }
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    const userId = req.user._id;
    // TODO: remove video from playlist

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video id");
    }

    try {
        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        if (!userId.equals(playlist.owner)) {
            throw new ApiError(403, "Unauthorized to remove video from this playlist");
        }

        const removeVideoPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            { $pull: { videos: videoId } },
            { new: true }
        );

        if (!removeVideoPlaylist) {
            throw new ApiError(500, "Failed to remove video from playlist")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, removeVideoPlaylist, "Video removed from playlist successfully")
            )

    } catch (error) {
        throw new ApiError(500, "Failed to remove video from playlist")
    }
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist
    // I think, we need to delete all videos from cloud too.

    try {
        const playlist = await Playlist.findById(playlistId)

        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        if (!req.user._id.equals(playlist.owner)) {
            throw new ApiError(403, "Unauthorized to delete this playlist");
        }

        await Playlist.findByIdAndDelete(playlistId);

        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, "Playlist deleted successfully")
            )
    } catch (error) {
        throw new ApiError(500, "Failed to delete playlist")
    }
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    const userId = req.user._id;
    //TODO: update playlist

    if ([name, description].every((field) =>
        field?.trim() === ""
    )) {
        throw new ApiError(400, "name or description are required");
    }

    try {
        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        if (!userId.equals(playlist.owner)) {
            throw new ApiError(403, "Unauthorized to update this playlist");
        }

        if (name) playlist.name = name;
        if (description) playlist.description = description;

        const updatedPlaylist = await playlist.save();

        return res
            .status(200)
            .json(
                new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
            )

    } catch (error) {
        throw new ApiError(500, "Failed to update playlist")
    }
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
