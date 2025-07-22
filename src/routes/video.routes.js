import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";

const router = Router()
router.use(verifyJWT)

router.route("/publish").post(upload.fields([
    {
        name: "videoFile",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]), publishAVideo)
router.route("/:videoId").get(getVideoById)
router.route("/delete/:videoId").post(deleteVideo)
router.route("/update/:videoId").post(upload.single("thumbnail"), updateVideo)
router.route("/togglepublishstatus/:videoId").get(togglePublishStatus)
router.route("/").get(getAllVideos)

export default router