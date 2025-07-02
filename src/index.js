import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import mongoose from 'mongoose'
import connectDB from './db/index.js'
const app = express()
const port = process.env.port || 3000
const mongoDB_uri = process.env.mongoDB_uri


connectDB()































/*
  ; (async () => {
    try {
      await mongoose.connect(`${mongoDB_uri}/${DB_NAME}`)
      app.on('error', (error) => {
        console.log("Error:", error);
        throw error
      })
      app.listen(port, () => {
        console.log(`Listining on port ${port}`)
      })

    } catch (error) {
      console.log("Error", error);
      throw error
    }
  })()
    */