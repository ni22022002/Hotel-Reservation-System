const mongoose= require("mongoose");
const initdata = require("./data.js");
const listing= require("../models/listing.js");

const mongo_url="mongodb://127.0.0.1:27017/Airbnb"


main()
.then(()=>{
    console.log("connected to db");
})
.catch((err)=>{
    console.log(err);
})
async function main(){
    await mongoose.connect(mongo_url);
}

const initdb = async ()=>{
    await listing.deleteMany({});
    console.log("data was initialized");
    await listing.insertMany(initdata.data);
    console.log("data was initialized");

}

initdb();