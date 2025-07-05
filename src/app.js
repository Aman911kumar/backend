import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const CORS_ORIGIN = process.env.CORS_ORIGIN

const app = express()
app.use(cors({
    origin: CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"20kb"}))
app.use(express.urlencoded({extended:true,limit:"20kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes
import userRouter from './routes/user.routes.js'

//routes declration
app.use("/api/v1/users",userRouter)

export { app }