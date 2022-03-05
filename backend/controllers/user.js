const Post = require("../models/post");
const User = require("../models/user");
const  { sendEmail }= require("../middlewares/sendEmail")
const crypto = require("crypto")

exports.register = async ( req, res) => {
    try{

        const {name,email,password} = req.body;
        let user = await User.findOne({ email })
        if(user){
        res.status(400).json({ success: false, message: "user already exists"})
        }

        user = await User.create({ 
            name,
             email,
              password,
               avatar:{public_id: "sample_id",url:"sampleUrl"}
            })

            const token = await user.generateToken();

            const options = {
                expires: new Date(Date.now() + 1*24*60*60*1000),//day*hours*minutes*seconds*milliseconds
                httpOnly: true 
           }
         
           res.status(201).cookie("token",token,options).json({
               success: true,
               user,
               token,
           })
    }catch(error){
        res.status(500).json({
            success: true,
            message: error.message,
        })
    }
}

exports.login = async (req,res) => {
    try{
       const { email , password} = req.body;

       const user = await User.findOne({ email }).select("+password")

       if(!user){
           return res.status(400).json({
               success: false,
               message: "user does not exist"
           })
       }
       const isMatch = await user.matchPassword(password);

       if(!isMatch){
           res.status(400).json({
               success: false,
               message: "incorrect password"
           })
       }

       const options = {
            expires: new Date(Date.now() + 1*24*60*60*1000),//day*hours*minutes*seconds*milliseconds
            httpOnly: true 
       }
       const token = await user.generateToken()
       res.status(201).cookie("token",token,options).json({
           success: true,
           user,
           token,
       })

    }catch(error){
       res.status(500).json({
           success: false,
           message: error.message
       })
    }
}

exports.logout = async (req, res) => {
    try{

        res.status(200)
            .cookie("token", null, { expires: new Date(Date.now()), httpOnly: true })
            .json({
                success: true,
                message: "logged Out",
            })

    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

exports.followUser = async (req, res) => {
    try{

     const userToFollow = await User.findById(req.params.id);
     const loggedInUser = await User.findById(req.user._id)

     if(!userToFollow){
         return res.status(404).json({
             success: false,
             message: "user not found"
         })
     }

     if(loggedInUser.following.includes(userToFollow._id)){

        const indexfollowing = loggedInUser.following.indexOf(userToFollow._id)
        const indexfollowers = userToFollow.followers.indexOf(loggedInUser._id)
        
        loggedInUser.following.splice(indexfollowing, 1);
        userToFollow.followers.splice(indexfollowers, 1);

        await loggedInUser.save();
        await userToFollow.save();

        res.status(200).json({
            success: true,
            message: "user unfollowed",
        })
     }
     else{
        loggedInUser.following.push(userToFollow._id);
        userToFollow.followers.push(loggedInUser._id);
   
        await loggedInUser.save();
        await userToFollow.save();
   
        res.status(200).json({
            success: true,
            message: "user followed",
        })
     }

    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

exports.updatePassword = async (req, res) => {
    try{
      
        const user = await User.findById(req.user._id).select("+password")

        const { oldPassword, newPassword } = req.body;

        if(!oldPassword || !newPassword){
            res.status(400).json({
                success: false,
                message: " please provide old and new password "
            }) 
        }

        const isMatch = await user.matchPassword(oldPassword)

        if(!isMatch){
            res.status(500).json({
                success: false,
                message: "incorrect old password"
            })
        }

         user.password = newPassword;
         await user.save();

         res.status(201).json({
             success: true,
             message: "password updated"
         })


    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

exports.updateProfile = async (req, res) => {
    try{

        const user = await User.findById(req.user._id)

        const { name, email } = req.body;

        if(name){
            user.name = name;
        }
        if(email){
            user.email = email;
        }

        await user.save();
        
        res.status(201).json({
            success: true,
            message: "profile updated",
        })
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

exports.deleteProfile = async (req, res) => {
    try{

        const user = await User.findById(req.user._id);
        const posts = user.posts; 
        const followers = user.followers;
        const following = user.following;
        const userId = user._id;

        user.remove();

        //logout user after deleting 
        res.cookie("token", null,
                   {expires: new Date(Date.now()),
                    httpOnly: true
                   })

        //deleting all posts of user
        for ( let i = 0; i < posts.length ; i++) {
            const post = await Post.findById(posts[i])
            await post.remove();
        }

        //removing user from followers.following
        for ( let i = 0; i < followers.length ; i++){
            const follower = await User.findById(followers[i])

            const index = follower.following.indexOf(userId);
            follower.following.splice(index, 1);
            await follower.save();
        }

        //removing user from following's follower
        for ( let i = 0; i < following.length ; i++){
            const follows = await User.findById(following[i])

            const index = follows.followers.indexOf(userId);
            follows.followers.splice(index, 1);
            await follows.save();
        }

        res.status(200).json({
            success: true,
            message: "profile deleted",
        })

    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

exports.myProfile = async (req, res) => {
    try{

        const user = await User.findById(req.user._id).populate("posts followers following");

        res.status(200).json({
            success: true,
            user,
        })

    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

exports.getMyProfile = async (req, res) => {
    try{

        const user = await User.findById(req.params.id).populate("posts followers following");

        if(!user){
            res.status(404).json({
                success: false,
                message: "user not found",
            })
        }

        res.status(201).json({
            success: true,
            user,
        })

    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

exports.getAllUsers = async (req, res) => {
    try{

        const users = await User.find({});

        res.status(201).json({
            success: true,
            users,
        })
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

exports.forgotPassword = async (req, res) => {
    try{

        const user = await User.findOne({ email: req.body.email})

        if(!user){
            res.status(404).json({
                success: false,
                message: "user not found"
            })
        }

        const resetPasswordToken = user.getResetPasswordToken(); 

        await user.save();

        const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetPasswordToken}`;

        const message = `Reset your password ny clicking on the link below: ${resetUrl}`;

        try{
         
         await sendEmail({email: user.email, subject: "reset password", message})

         res.status(200).json({
             success: true,
             message: `Email sent to ${user.email}`,
         })

        }catch(error){
         user.resetPasswordToken = undefined;
         user.resetPasswordExpire = undefined;

         await user.save();

         res.status(500).json({
             success: false,
             message: error.message,
         })
        }

    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

exports.resetPassword = async (req, res) => {
    try{

     const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

     const user = await User.findOne({
         resetPasswordToken,
         resetPasswordExpire: { $gt : Date.now() }
     })

     if(!user){
         return res.status(401).json({
             success: false,
             message: "token is invalid or has expired",
         })
     }

     user.password = req.body.password;

     user.resetPasswordToken = undefined;
     user.resetPasswordToken = undefined;

     await user.save();

     res.status(200).json({
         success: true,
         message: "password updated"
     })

    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

exports.getMyPosts = async (req, res) => {
    try{

        const user = await User.findById(req.user._id);

        const posts = [];

        for (let i = 0; i < user.posts.length; i++) {
            const post = await Post.findById(user.posts[i]).populate(
                "likes comments.user"
            );
            posts.push(post);
        }

        res.status(201).json({
            success: true,
            posts,
        })
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}