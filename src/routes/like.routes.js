import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getLikedVideos,
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike
} from "../controllers/like.controller.js";

const router = Router()
router.use(verifyJWT)

router.route("/video/:videoId").post(toggleVideoLike)
router.route("/videos").get(getLikedVideos)
router.route("/comment/:commentId").post(toggleCommentLike)
router.route("/tweet/:tweetId").post(toggleTweetLike)

export default router