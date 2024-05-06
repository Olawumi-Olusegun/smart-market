import "dotenv/config";
import mongoose from "mongoose";
import currentENV from "src/constants/constants";


let connected: boolean = false;

const connectDB = async () => {

    if(!currentENV.MONGO_DB_URI) {
        throw new Error("Invalid database string");
    }

    if(connected) {
        return console.log("Already connected")
    }

    try {
        await mongoose.connect(currentENV.MONGO_DB_URI);
        connected = true;
    } catch (error) {
        console.log(error)
    }
}

export default connectDB