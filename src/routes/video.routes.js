import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";

const router = Router()

router.route("/").get(getAllVideos)
// router.route("/:videoId").get(getVideoById)
router.use(verifyJWT)

router.route("/")
    .get(getAllVideos)
    .post(upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]), publishAVideo)

router.route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"), updateVideo)

router.route("/togglepublishstatus/:videoId").get(togglePublishStatus)


export default router