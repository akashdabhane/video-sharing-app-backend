import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const userId = req.user._id;
    // TODO: toggle subscription

    try {
        const channel = await User.findById(channelId)

        if (!channel) throw new ApiError(404, "Channel not found");

        const subscriptionStatus = await Subscription.findOne({
            $and: [{ channel: channelId }, { subscriber: userId }]
        });

        if (!subscriptionStatus) {
            const toggleSubscription = await Subscription.create({
                channel: channelId,
                subscriber: userId
            })

            return res
                .status(200)
                .json(
                    new ApiResponse(200, toggleSubscription, "Subscription status toggled")
                )
        }

        await Subscription.findOneAndDelete({ 
            $and: [{ channel: channelId }, { subscriber: userId }] 
        })

        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, "Subscription status toggled")
            )

    } catch (error) {
        throw new ApiError(500, "Failed to toggle subscription status")
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    try {
        const channel = await User.findById(channelId);

        if (!channel) throw new ApiError(404, "Channel not found");

        const allSubscribers = await Subscription.find({ channel: channelId })

        return res
            .status(200)
            .json(
                new ApiResponse(200, allSubscribers, "subscriber list")
            )

    } catch (error) {
        throw new ApiError(500, "Failed to retrieve subscribers")
    }
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);

        if (!user) throw new ApiError(404, "User not found");

        const allSubscribedChannels = await Subscription.find({ subscriber: userId })

        return res
            .status(200)
            .json(
                new ApiResponse(200, allSubscribedChannels, "Subscribed channels retrieved.")
            )
    } catch (error) {
        throw new ApiError(500, "Failed to get user subscribed channels")
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}