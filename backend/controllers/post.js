const Post = require("../models/post");
const User = require("../models/user")

exports.createPost = async (req,res) => {

    try{
        const newPostData = {
            caption: req.body.caption,
            image:{
                public_id: "req.body.public_id",
                url: "req.body.url"
            },
            owner: req.user._id
        }

        const newPost = await Post.create(newPostData);

        const user = await User.findById(req.user._id);

        user.posts.push(newPost._id);

        await user.save();

        res.status(201).json({
            success: true,
            post: newPost,
        })

    } catch(error){
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.likeAndUnlikePost = async (req,res) => {
    try{

    const post = await Post.findById(req.params.id)

    if(!post){
        return res.status(404).json({
            success: false,
            message: " post not found "
        })
    }

    if(post.likes.includes(req.user._id)){
        const index = post.likes.indexOf(req.user._id)

        post.likes.splice(index, 1);

        await post.save();

        return res.status(200).json({

            success: true,
            message: "post Unliked",
        })
    }
    else{
        post.likes.push(req.user._id)

        await post.save();

        return res.status(200).json({
            success: true,
            message: "post liked",
        })

    }

    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

exports.deletePost = async (req, res ) => {
    try{

        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({
                success: false,
                message: "Post not found"
            })
        }

        if(post.owner.toString() !== req.user._id.toString()){
            res.status(401).json({
                success: false,
                message: "unauthorized"
            })
        }

        await post.remove();

        const user = await User.findById(req.user._id);

        const index = user.posts.indexOf(req.user._id);

        user.posts.splice(index, 1);

        await user.save();

        res.status(201).json({
            success: true,
            message: "post deleted",
        })

    }catch(error){
      return  res.status(400).json({
            success: false,
            message: error.message,
        })
    }
}

exports.getPostOfFollowing = async (req, res) => {
    try{
        const user = await User.findById(req.user._id)

        const posts = await Post.find({
            owner: {
                $in: user.following,
            },
        }).populate("owner likes comments.user");

        res.status(200).json({
            success: true,
            posts:posts.reverse(),
        })

    } catch(error){
       return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

exports.updateCaption = async (req, res) => {
    try{

        const post = await Post.findById(req.params.id);

        if(!post){
           return res.status(404).json({
                success: false,
                message: "post not found"
            })
        }

        if(post.owner.toString() !== req.user._id.toString()){
          return  res.status(401).json({
                success: true,
                message: "unauthorized"
            })
        }

        post.caption = req.body.caption;
        await post.save();
        res.status(201).json({
            success: true,
            message: "caption updated"
        })

    }catch(error){
       return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

exports.commentOnPost = async (req, res) => {
    try{

        const post = await Post.findById(req.params.id);

        if(!post){
            res.status(404).json({
                success: false,
                message: "post not found"
            })
        }

        let commentIndex = -1;

        //checking if comment already exists
        // arr = [1,2,3,4,5]; //example of comments in the form of array
        post.comments.forEach((item,index) => {
           if(item.user.toString() === req.user._id.toString()){
               commentIndex = index;
           }
        })
        if(commentIndex !== -1){
            post.comments[commentIndex].comment = req.body.comment;

            await post.save();

            res.status(200).json({
                success: true,
                message: "comment updated"
            })
        }
        else{
            post.comments.push({
                user: req.user._id,
                comment: req.body.comment
            })
        }
       
        await post.save();
        res.status(200).json({
             success: true,
             message: "comment added"
        })

    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

exports.deleteComment = async (req, res) => {
    try{

        const post = await Post.findById(req.params.id);

        if(!post){
            res.status(200).json({
                success: false,
                message: "post not found"
            })
        }

        if(post.owner.toString() === req.user._id.toString()){

            if(req.body.commentId == undefined) {
                return res.status(404).json({
                    success: false,
                    message: "Comment Id id required"
                })
            }

            post.comments.forEach((item,index) => {
                if(item._id.toString() === req.body.commentId.toString()) {
                    return post.comments.splice(index, 1)
                }
            })

            await post.save();

            return res.status(200).json({
                success: true,
                message: "selected comment has deleted",
            })
        }
        else{
         post.comments.forEach((item,index) => {
             return post.comments.splice(index, 1);
         })
        }

        await post.save();
        res.status(201).json({
            success: true,
            message: "Your comment has deleted",
        })

    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}