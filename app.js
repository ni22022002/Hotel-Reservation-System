const express=require('express')
const app=express();
const mongoose=require("mongoose");
const Listing=require("./models/listing.js")
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require('ejs-mate');
// const wrapAsync=require("./utils/wrapAsync.js");
// const ExpressError=require("./utils/ExpressError.js");
const {listingSchema}=require("./schema.js");
const Review=require("./models/review.js")
const cookieParser=require("cookie-parser");
const session=require("express-session");
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");



main()
    .then(()=>{
        console.log("connected to DB")
    }).catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/Airbnb');
 
};

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,"/public")));



const sessionOptions={
    secret:"mysupersecretcode",
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now()+7*24*60*60*1000,  //itne din baad cookie m stored info delete hojaega
        maxAge:7*24*60*60*1000,
        httpOnly:true,
    }
};



app.use(session(sessionOptions));
app.use(flash());


// authentication using passport
app.use(passport.initialize());
app.use(passport.session());


// yaha pe localstrategy ki help se user ko authenticate kr skte hai
passport.use(new LocalStrategy(User.authenticate))

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



// demosuer

// app.get("/demouser",async (req,res)=>{
//     let fakeUser=new User({
//         email:"student@gmail.com",
//         username:"delta-student",
//     })

//     let registeredUser=await User.register(fakeUser,"helloworld")
//     res.send(registeredUser)
// })


// this middleware is for handling flash
app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    next();
})

app.get("/",(req,res)=>{
    res.send("Hi i am root");
});


// index route
app.get("/listings",async (req,res)=>{
    const allListings=await Listing.find({});
    res.render("listings/index.ejs",{allListings});    
});


// New ROute
app.get("/listings/new",(req,res)=>{
    res.render("listings/new.ejs"); 
});


// show route(read the data)
app.get("/listings/:id",async (req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id).populate("reviews"); 
    // here populate is used to display the contents from its id
    res.render("listings/show.ejs",{listing})
});


// Create route
app.post("/listings",
   

// custom wrapAsync(error handler)
    async(req,res,next)=>{
    // let {title,description,image,price,country,location}=req.body;

       let result= listingSchema.validate(req.body);
       console.log(result);
        const newListing=new Listing(req.body.listing);
        
        await newListing.save();
        req.flash("success","New Listing created")
        res.redirect("/listings");
   
    
    // console.log(listing);
});


// EDIT ROUTE
app.get("/listings/:id/edit",async (req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id);
    res.render("listings/edit.ejs",{listing})
}); 


// update route
app.put("/listings/:id",async (req,res)=>{
    let {id}=req.params;
    await Listing.findByIdAndUpdate(id,{...req.body.listing})
    res.redirect("/listings");
});

// DELETE ROUTE
app.delete("/listings/:id",async(req,res)=>{
    let{id}=req.params;
    let deletedListing=await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
});


// reviews
// post reviews
app.post("/listings/:id/reviews",async(req,res)=>{
    let listing=await Listing.findById(req.params.id)
    let newReview=new Review(req.body.review);

    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();

    // console.log("new review saved");
    // res.send("new review saved");
    res.redirect(`/listings/${listing._id}`);
});

// delete reviews
app.delete("/listings/:id/reviews/:reviewId",async(req,res)=>{
    let {id,reviewId}=req.params;

    // used pull operator to pull the reviewId from reviews array and then delete it
    await Listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}})
    await Review.findByIdAndDelete(reviewId);

    res.redirect(`/listings/${id}`);
});

// for signup router
app.get("/signup",(req,res)=>{
    res.render("users/signup.ejs");
})

app.post("/signup",async(req,res)=>{

    try{
        let {username,email,password}=req.body;
        const newUser=new User({email,username});
        const registeredUser=await User.register(newUser,password)
        console.log(registeredUser);
        req.flash("User registered successfully")
        res.redirect("/listings");
    }catch (e){
        console.log("error","Already exists")
        res.redirect("/signup");
    }
    
})


// login
app.get("/login",(req,res)=>{
    res.render("users/login.ejs");
})

app.post("/login", passport.authenticate("local",{
    failureRedirect: "/login",
    failureFlash: true,
}),async (req,res)=>{
    // req.flash("success","Welcome back")
    res.redirect("/listings")
    res.send("done")

})

// PARSNIG A COOKIE
app.use(cookieParser("secretcode"));


// perform the signed cookies to check whether apna cookie ke sath tampering na hui ho
app.get("getsignedcookie",(req,res)=>{
    res.cookie("made-in","India",{signed:true});
    res.send("signed cookie sent");
});

// sending COOKIES
app.get("/getcookies",(req,res)=>{
    res.cookie("greet","hello");
    res.send("sent you some cookies");
});




app.get("/greet",(req,res)=>{
    let {name="anonymous"}=req.cookies;
    res.send(`Hi, ${name}`)
})
app.get("/",(req,res)=>{
    console.dir(req.cookies);
    res.send("hi ,i am root")
})




// connect-flash: flash is a special are of session used for storing messages.messages are written to the flash and cleared after being displayed.....flash messages are stored in session



// handling all the errors (err handling middlewares)
app.use((err,req,res,next)=>{
    // console.log("----------------error---------");
    next(err); //calling error hanlding middlewares,to prevent 404
})



// app.get("/testListing",async (req,res)=>{
//     let sampleListing=new Listing({
//         title:"My New Home",
//         description:"BeachSide View",
//         price:1200,
//         location:"Gujarat",
//         country:"India"
//     });
//     await sampleListing.save()
//     console.log("Sample was saved")
//     res.send("successful")
// });


// ye voh route h ,if upr ke saare routes mai se koi bhi match nhi hua toh ye wala route use hoga
app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"page not found"));
})

// error handling middleware
app.use((err,req,res,next)=>{
    // res.send("Something went wrong")
    let {statusCode=500,message="Something went wrong"}=err;
    res.status(statusCode).render("error.ejs",{err});
    // res.status(statusCode).send(message);

})


app.listen(8000,()=>{
    console.log("server is listening to port 8000")
})

