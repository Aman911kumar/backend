import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import connectDB from './db/index.js'
const app = express()
const port = process.env.port || 3000


connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(` 🏃‍♂️ Server is listning on port ${port}`);
    })
    app.on("error", (err) => {
      console.log("DB not working properly !!", err);
    })
  })
  .catch((err) => {
    console.log("Error connection failed: ", err);
  })































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