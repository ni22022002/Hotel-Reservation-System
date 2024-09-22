const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const Review=require("./review.js")

const listingSchema=new Schema({
    title:{
        type:String,
    },
    description:String,
    image:{
        type:String,
        default:"https://unsplash.com/photos/person-holding-light-bulb-fIq0tET6llw",
        set:(v)=>v===""?"https://unsplash.com/photos/person-holding-light-bulb-fIq0tET6llw":v,
    },
    price:Number,
    location:String,
    country:String,
    reviews:[
        {
            type:Schema.Types.ObjectId,
            ref:"Review",
        }
    ]
});


// if koi listing delete kre toh uske saare reviews bhi delete hojaye from database
listingSchema.post("findOneAndDelete",async(listing)=>{
    if(listing){
        await Review.deleteMany({_id:{$in:listing.reviews}});
    }
    
})
const Listing=mongoose.model("Listing",listingSchema);

module.exports=Listing;  