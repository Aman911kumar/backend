import { Router } from "express";
import { loginUser, registerUser, logoutUser, deleteUser, validateAndUpdateRefreshAccessToken, updateUserAvatar, updateCoverImage, getCurrentUser, getUserChannelProfile, getWatchHistoryusername } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)


//secured routes
router.route("/delete-account").post(deleteUser)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/current-user").post(verifyJWT, getCurrentUser)
router.route("refresh-token").post(validateAndUpdateRefreshAccessToken)
router.route("/update-avatar").patch(upload.single("avatar"), verifyJWT, updateUserAvatar)
router.route("/update-coverImage").patch(upload.single("coverImage"), verifyJWT, updateCoverImage)
//patch for updating some user details because post recreate the whole object
router.route("/channel/:username").get(verifyJWT, getUserChannelProfile)
router.route("/channel/:username").get(verifyJWT, getWatchHistory)

export default router