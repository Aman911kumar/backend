import dotenv from 'dotenv'
dotenv.config()
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const mongoDB_uri = process.env.mongoDB_uri

const connectDB = async() =>{
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