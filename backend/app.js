const express = require("express")
const app = express()
const cookieParser = require("cookie-parser")

if (process.env.NODE_ENV !== "production") {
    require("dotenv").config({ path:"backend/config/config.env"});
}


//using middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

//importing routes
const post_route = require("./routes/post");
const user_route = require("./routes/user");

//using routes
app.use("/api/v1", post_route);
app.use("/api/v1", user_route);

module.exports = app;