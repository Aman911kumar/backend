import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.controller.js";

const router = Router()
router.use(verifyJWT)

router.route("/channel/:channelId")
    .post(toggleSubscription)
    .get(getUserChannelSubscribers)
router.route("/user/:subscriberId").get(getSubscribedChannels)

export default router