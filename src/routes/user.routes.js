import { Router } from "express";
import { loginUser, registerUser, logoutUser, deleteUser, validateAndUpdateRefreshAccessToken, updateUserAvatar, updateCoverImage,getCurrentUser } from "../controllers/user.controller.js";
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
router.route("/current-user").post(verifyJWT,getCurrentUser)
router.route("/update-avatar").post(upload.single("avatar"), verifyJWT, updateUserAvatar)
router.route("/update-coverImage").post(upload.single("coverImage"), verifyJWT, updateCoverImage)


//secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("refresh-token").post(validateAndUpdateRefreshAccessToken)
router.route("/delete-account").post(deleteUser)

export default router