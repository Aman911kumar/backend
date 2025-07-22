import { Router } from "express";
import {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()
router.use(verifyJWT)

router.route("/:videoId",)
    .post(addComment)
    .get(getVideoComments)

router.route("/:videoId/:commentId")
    .patch(updateComment)
    .delete(deleteComment)

export default router