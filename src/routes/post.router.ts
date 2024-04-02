import express, { Request, Response, Router } from "express";
import * as dotenv from "dotenv";
import mongoose, { Types } from "mongoose";
import { z } from "zod";
import { validate } from "../middlewares/req-validator.middleware";
import { requireAuth } from "../middlewares/require-auth.middleware";
import { RequestWithUser } from "../types/request-with-user.type";
dotenv.config();

const Post = mongoose.model("Post");

export const postRouter = express.Router();
const postSchema1 = z.object({
  content: z.string(),
  images: z.array(z.object({ url: z.string() })),
});
const postSchema = z.object({
  body: postSchema1,
});

postRouter.post(
  "/content",
  requireAuth,
  validate(postSchema),
  async (req: RequestWithUser, res: Response) => {
    try {
      const { content, images } = req.body;

      if (content === undefined || images === undefined) {
        return res.status(400).send({ message: "Invalid request payload" });
      }

      const user = req.user;

      if (!user) {
        return res.status(400).send({ message: "User not authorized" });
      }

      const newPost = new Post({
        user: user._id,
        content,
        images,
        comments: [],
      });

      await newPost.save();

      res.status(200).send({ status: "success" });
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).send({ message: "Something went wrong" });
    }
  }
);



// Add this route for posting a comment
postRouter.post(
  "/comment/:postId",
  requireAuth,
  async (req: RequestWithUser, res: Response) => {
    try {
      const { postId } = req.params;
      const { content } = req.body;

      if (content === undefined) {
        return res.status(400).send({ message: "Invalid request payload" });
      }

      const user = req.user;

      if (!user) {
        return res.status(400).send({ message: "User not authorized" });
      }

      // Fetch other user details as needed (firstName, lastName, profilePic)
      const userDetails = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePic: user.profilePic
      };

      const post = await Post.findById(postId);

      if (!post) {
        return res.status(404).send({ message: "Post not found" });
      }

      const newComment = {
        user: userDetails,
        content,
        replies: [],
      };

      post.comments.push(newComment);
      await post.save();

      res.status(200).send({ status: "success" });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).send({ message: "Something went wrong" });
    }
  }
);

// Add this route for posting a reply to a comment
postRouter.post(
  "/reply/:postId/:commentId",
  requireAuth,
  async (req: RequestWithUser, res: Response) => {
    try {
      const { postId, commentId } = req.params;
      const { content } = req.body;

      if (content === undefined) {
        return res.status(400).send({ message: "Invalid request payload" });
      }

      const user = req.user;

      if (!user) {
        return res.status(400).send({ message: "User not authorized" });
      }

      // Fetch other user details as needed (firstName, lastName, profilePic)
      const userDetails = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePic: user.profilePic
      };

      const post = await Post.findById(postId);

      if (!post) {
        return res.status(404).send({ message: "Post not found" });
      }

      const comment = post.comments.id(commentId);

      if (!comment) {
        return res.status(404).send({ message: "Comment not found" });
      }

      const newReply = {
        user: userDetails,
        content,
      };

      comment.replies.push(newReply);
      await post.save();

      res.status(200).send({ status: "success" });
    } catch (error) {
      console.error("Error adding reply:", error);
      res.status(500).send({ message: "Something went wrong" });
    }
  }
);




postRouter.get(
  '/posts',
  requireAuth,
  async (req: RequestWithUser, res: Response) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(400).send({ message: 'User not authorized' });
      }

    
      const posts = await Post.aggregate([
        {
          $match: {},
        },
        {
          $lookup: {
            from: 'users', 
            localField: 'user',
            foreignField: '_id',
            as: 'userDetails',
          },
        },
       
        {
          $project: {
            _id: 1,
            content: 1,
            images: 1,
            comments:1,
            replies:1,
            createdAt: 1,
            likes:1,
            'userDetails.firstName': 1,
            'userDetails.profilePic': 1,
            'userDetails.lastName': 1,
          },
        },
      ]);

      res.status(200).send({ status: 'success', posts });
    } catch (error) {
      console.error('Error retrieving posts:', error);
      res.status(500).send({ message: 'Something went wrong' });
    }
  }
); 

postRouter.get(
  "/myposts",
  requireAuth,
  async (req: RequestWithUser, res: Response) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(400).send({ message: "User not authorized" });
      }

      // Use $lookup to fetch posts with user details
      const userPosts = await Post.aggregate([
        {
          $match: { user: new Types.ObjectId(user._id) },
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: "$userDetails",
        },
        {
          $project: {
            _id: 1,
            content: 1,
            images: 1,
            createdAt: 1,
           likes:1,
            "userDetails.firstName": 1,
            "userDetails.profilePic": 1,
            "userDetails.lastName": 1,
          },
        },
      ]);

      res.status(200).send({ status: "success", posts: userPosts });
    } catch (error) {
      console.error("Error retrieving user posts:", error);
      res.status(500).send({ message: "Something went wrong" });
    }
  }
);


postRouter.post(
  '/like/:postId',
  requireAuth,
  async (req: RequestWithUser, res: Response) => {
    try {
      const { postId } = req.params;

      const user = req.user;

      if (!user) {
        return res.status(400).send({ message: 'User not authorized' });
      }

      const post = await Post.findById(postId);

      if (!post) {
        return res.status(404).send({ message: 'Post not found' });
      }

      // Check if the user has already liked the post
      const existingLike = post.likes && post.likes.find((like: { user: { _id: string } }) => like.user._id.toString() === user._id.toString());

      if (existingLike) {
        return res.status(400).send({ message: 'Post already liked' });
      }

      // Add a new like with user data
      const newLike = {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePic: user.profilePic,
        },

      };

      post.likes.push(newLike);
      await post.save();
     
      res.status(200).send({ status: 'success' });
    } catch (error) {
      console.error('Error liking post:', error);
      res.status(500).send({ message: 'Something went wrong' });
    }
  }
);

postRouter.post(
  '/unlike/:postId',
  requireAuth,
  async (req: RequestWithUser, res: Response) => {
    try {
      const { postId } = req.params;

      const user = req.user;

      if (!user) {
        return res.status(400).send({ message: 'User not authorized' });
      }

      const post = await Post.findById(postId);

      if (!post) {
        return res.status(404).send({ message: 'Post not found' });
      }

      // Find the index of the like to be removed
      const likeIndex = post.likes.findIndex(
        (like: { user: { _id: string } }) => like.user._id.toString() === user._id.toString()
      );

      if (likeIndex === -1) {
        return res.status(400).send({ message: 'Post not liked' });
      }

      // Remove the like
      post.likes.splice(likeIndex, 1);
      await post.save();

      res.status(200).send({ status: 'success' });
    } catch (error) {
      console.error('Error unliking post:', error);
      res.status(500).send({ message: 'Something went wrong' });
    }
  }
);

// postRouter.post(
//   '/view/:postId',
//   async (req: Request, res: Response) => {
//     try {
//       const { postId } = req.params;

//       const post = await Post.findById(postId);

//       if (!post) {
//         return res.status(404).send({ message: 'Post not found' });
//       }

//       // Increment the view count
//       post.viewCount += 1;
//       await post.save();

//       res.status(200).send({ status: 'success', viewCount: post.viewCount });
//     } catch (error) {
//       console.error('Error counting views:', error);
//       res.status(500).send({ message: 'Something went wrong' });
//     }
//   }
// );


