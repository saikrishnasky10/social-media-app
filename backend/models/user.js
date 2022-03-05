const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")

const userSchema = new mongoose.Schema({
  name: {
      type: String,
      required: [true,"please enter the name"]
  },

  avatar:{
      public_id: String,
      url: String
  },

  email: {
      type: String,
      required: [true,"please enter a email"],
      unique: [true,"email already exists"]
  },
  password: {
      type: String,
      required: [true,"please enter a password"],
      minlength: [6,"password must be atleast 8 charcaters"],
      select: false,
  },

  posts: [
      {
          type: mongoose.Schema.Types.ObjectId,
          ref:"Post"
      }
  ],

  followers: [
      {
          type: mongoose.Schema.Types.ObjectId,
          ref:"User"
      }
  ],

  following: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
],

   resetPasswordToken: String,
   resetPasswordExpire: Date,

})

userSchema.pre("save", async function (next) {
    if(this.isModified("password")){
     this.password = await bcrypt.hash( this.password, 10);
    }
    next();
})

userSchema.methods.matchPassword = async function (password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateToken = function () {
      return jwt.sign({_id: this._id}, process.env.JWT_TOKEN)
}

userSchema.methods.getResetPasswordToken = function() {

    const resetToken = crypto.randomBytes(20).toString("hex");

    console.log(resetToken);

    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000 ;

    return resetToken;
}

module.exports = mongoose.model("User", userSchema)