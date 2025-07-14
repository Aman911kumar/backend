import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import dotenv from 'dotenv'
dotenv.config()

const mongoDB_uri = process.env.MONGODB_URI

const connectDB = async() =>{
    console.log(mongoDB_uri);
    
    try {
        const connectionInstance = await mongoose.connect(`${mongoDB_uri}/${DB_NAME}`)
        // console.log(connectionInstance)
        console.log(`\n MongoDB connected DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("Error",error)
        throw error
    }
}

export default connectDB


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