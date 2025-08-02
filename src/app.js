import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
dotenv.config()


const CORS_ORIGIN = process.env.CORS_ORIGIN

const app = express()
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}))

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))
app.use(express.static("public"))
app.use(cookieParser())

// not good practice
// app.use(
//     express.json({ limit: '20kb' }),
//     express.urlencoded({ extended: true, limit: '20kb' }),
//     express.static("public"),
//     cookieParser()
// )

//routes
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import commentRouter from './routes/comment.routes.js'
import likeRouter from './routes/like.routes.js'
import playlistRouter from './routes/playlist.routes.js'
import subscriptionRouter from './routes/subscription.routes.js'
import tweetRouter from './routes/tweet.routes.js'

//routes declration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/video", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/like", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/subscription", subscriptionRouter)
app.use("/api/v1/tweet", tweetRouter)

//error handler

import errorHandler from './middlewares/errorHandler.middleware.js'

app.use(errorHandler)

export { app }