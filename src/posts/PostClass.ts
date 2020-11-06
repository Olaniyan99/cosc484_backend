import { MongoDriver } from "../drivers/mongo/mongo";
import { Router, Response, Request } from "express";
import { Db, ObjectID } from "mongodb";
import { IPost } from "./postInterface";

enum COLLECTION {
  POSTS = "posts",
}

export class PostClass {
  private static instance: PostClass;
  private static db: Db;

  public static buildRouter() {
    const app = Router();
    app.get("/posts", this.getPosts);
    app.get("/users/:userId/posts/:postId", this.getPost);
    app.post("/users/:userId/post", PostClass.createPost);
    app.patch("/users/:userId/posts/:postId", this.updatePost);
    app.delete("/users/:userId/posts/:postId", this.deletePost);
    app.post('/users/:userId/post/:postId/like', this.likePost);
    app.delete('/users/:userId/post/:postId/like', this.UnLikePost);
    app.post('/users/:userId/post/:postId/comment', this.leaveComment);
    app.delete('/users/:userId/post/:postId/comment', this.removeComment);
    app.post('/users/:userId/post/postId/likeComment',         this.likeComment);
    return app;
  }

  static dbConnection() {
    this.db = MongoDriver.getConnection();
    return this.db;
  }

  static getInstance(): PostClass {
    if (!this.instance) {
      this.instance = new PostClass();
    }
    return this.instance;
  }

  static async getPosts(req: Request, res: Response) {
    try {
      const resources = await PostClass.dbConnection()
        .collection(COLLECTION.POSTS)
        .find()
        .toArray();
      res.status(200).json({
        message: "ok",
        resources
      });
    } catch (e) {
      throw e;
    }
  }

  static async getPost(req: Request, res: Response) {
    try {
      const id = req.params.userId;
      if (ObjectID.isValid(id)) {
        const resource = await PostClass.dbConnection()
          .collection(COLLECTION.POSTS)
          .findOne({ _id: new ObjectID(id) });
        res.status(200).json({
          resource,
        });
      }
      throw console.error("invalid object ID");
    } catch (e) {
      throw e;
    }
  }

  static async createPost(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      if (ObjectID.isValid(userId)) {
        const user = await PostClass.dbConnection()
          .collection('users')
          .findOne({ _id: new ObjectID(userId) });

        if (user) {
          const createPost: IPost = {
            userID: req.params.userId,
            author: user.name,
            text: req.body.text,
            comment: req.body.comment,
            likes: req.body.likes,
            // date_posted: new Date().getMilliseconds(),
          };
          validateNonNullFields(createPost);
          const insertPost = await PostClass.dbConnection()
            .collection(COLLECTION.POSTS)
            .insertOne(createPost);

          res.status(201).json({
            message: "Sucess!! A new post was created.",
            insertPost,
          });
        }
      }

      throw console.error("User not found");
    } catch (e) {
      throw e;
    }
  }

  static async updatePost(req: Request, res: Response) {
    try {
      if (
        !ObjectID.isValid(req.params.userId) ||
        !ObjectID.isValid(req.params.postId)
      ) {
        throw console.error("invalid object ID");
      }
      const postId = req.params.postId;
      const update = req.body;
      const insertUpdate = await PostClass.dbConnection()
        .collection(COLLECTION.POSTS)
        .findOneAndUpdate({ _id: new ObjectID(postId) }, { $set: { update } });

      res.status(200).json({
        message: `post with id: ${postId} has been updated`,
        insertUpdate,
      });
    } catch (e) {
      throw e;
    }
  }

  static async deletePost(req: Request, res: Response) {
    try {
      const postId = req.params.postId;
      if (ObjectID.isValid(postId)) {
        const deletePost = await PostClass.dbConnection()
          .collection(COLLECTION.POSTS)
          .deleteOne({ _id: new ObjectID(postId) });

        res.status(204).json({
          messege: `post with id: ${postId} has been deleted`,
          deletePost,
        });
      }
      else {
        throw console.error("Post with the given ID doesnt not exist");
      }
    } catch (e) {
      throw e;
    }
  }

  static async likePost(req: Request, res: Response) {
    try {
      const postId = req.params.postId;
      const userId = req.params.userId;
      const likeObj = {
        userID: req.params.userId,
        like: req.body.like 
      }
      //make sure the user trying to like the post does exist
      const user = await PostClass.dbConnection()
      .collection("users").findOne({_id: new ObjectID(userId)})
      if(!user) {
        throw console.error("The specified user ID doesnt exist or is Invalid")
      }
      //make sure the posts exists first
      const post = await PostClass.dbConnection()
      .collection(COLLECTION.POSTS).findOne({_id: new ObjectID(postId)})
      if(!post) {
        throw console.error("The specified post either doesnt exist or is Invalid")
      }
      //using $addToSet operator to check exist before append element into array.
      const updateLike = await PostClass.dbConnection()
      .collection(COLLECTION.POSTS).updateOne({_id: new ObjectID(postId)}, { $addToSet: {likes: likeObj}})

      res.status(200).json({
        message: `Likes on post with id: ${postId} has been liked`,
        updateLike
      })

    } catch (e) {
      throw e;
    }
  }

  static async UnLikePost(req: Request, res: Response) {
    try {
      const postId = req.params.postId;
      const userId = req.params.userId;
      const likeObj = {
        userID: req.params.userId,
      }
      //make sure the user trying to like the post does exist
      const user = await PostClass.dbConnection()
      .collection("users").findOne({_id: new ObjectID(userId)})
      if(!user) {
        throw console.error("The specified user ID doesnt exist or is Invalid")
      }
      //make sure the posts exists first
      const post = await PostClass.dbConnection()
      .collection(COLLECTION.POSTS).findOne({_id: new ObjectID(postId)})
      if(!post) {
        throw console.error("The specified post either doesnt exist or is Invalid")
      }
      const removeLike = await PostClass.dbConnection()
      .collection(COLLECTION.POSTS).updateOne({_id: new ObjectID(postId)}, { $pull: {likes: likeObj}})

      res.status(200).json({
        message: `post with id: ${postId} has been unliked`,
        removeLike
      })

    } catch (e) {
      throw e;
    }
  }

  static async leaveComment(req: Request, res: Response) {
    try {
      try {
        const postId = req.params.postId;
        const userId = req.params.userId;
        const commentObj = {
          userID: req.params.userId,
          text: req.body.text 
        }
        //make sure the user trying to like the post does exist
        const user = await PostClass.dbConnection()
        .collection("users").findOne({_id: new ObjectID(userId)})
        if(!user) {
          throw console.error("The specified user ID doesnt exist or is Invalid")
        }
        //make sure the posts exists first
        const post = await PostClass.dbConnection()
        .collection(COLLECTION.POSTS).findOne({_id: new ObjectID(postId)})
        if(!post) {
          throw console.error("The specified post either doesnt exist or is Invalid")
        }
        //using $addToSet operator to check exist before append element into array.
        const addComment = await PostClass.dbConnection()
        .collection(COLLECTION.POSTS).updateOne({_id: new ObjectID(postId)}, { $addToSet: {comment: commentObj}})
  
        res.status(200).json({
          message: `Comment has been left on post with id: ${postId} by ${user.name}`,
          addComment
        })
  
      } catch (e) {
        throw e;
      }

    } catch (e) {
      throw e;
    }
  }

  static async removeComment(req: Request, res: Response) {
    try {
      const postId = req.params.postId;
      const userId = req.params.userId;
      const commentObj = {
        userID: req.params.userId,
      }
      //make sure the user trying to like the post does exist
      const user = await PostClass.dbConnection()
      .collection("users").findOne({_id: new ObjectID(userId)})
      if(!user) {
        throw console.error("The specified user ID doesnt exist or is Invalid")
      }
      //make sure the posts exists first
      const post = await PostClass.dbConnection()
      .collection(COLLECTION.POSTS).findOne({_id: new ObjectID(postId)})
      if(!post) {
        throw console.error("The specified post either doesnt exist or is Invalid")
      }
      const removeComment = await PostClass.dbConnection()
      .collection(COLLECTION.POSTS).updateOne({_id: new ObjectID(postId)}, { $pull: {comment: commentObj}})
      res.status(200).json({
        message: `${user.name} has removed comment under post with id: ${postId}`,
        removeComment
      })
    } catch (e) {
      throw e;
    }
  }

  static async likeComment(req: Request, res: Response){
    try{
        const postId = req.params.postId;
        const userId = req.params.userId;
        const likeObj = {
            userID: req.params.userId,
            like: req.body.like,
        }
        //Checks to see user liking the comment exists
        const user = await PostClass.dbConnection()
        .collection("users").findOne({_id: new ObjectID(userId)})
        if(!user){
            throw console.error("The specified user ID doesnt exist or is Invalid")
        }
        //Make sure comment exists
        const post = await PostClass.dbConnection()
        .collection(COLLECTION.POSTS).findOne({_id: new ObjectID(postId)})
        if(!post){
            throw console.error("The specified post either doesnt exist or is Invalid")
        }
        //using $addToSet operator to check exist before append the element ino the array
        const updateLike = await PostClass.dbConnection()
        .collection(COLLECTION.POSTS).updateOne({_id: new ObjectID(postId)}, {$addToSet: {likeComment: likeObj}})

        res.status(200).json({
            message: `Like on comment with id: ${postId} by ${user.name} has been liked`,
            updateLike
})
    }catch (e){
        throw e;
    }
}

}

export function validateNonNullFields(info: any) {
  const keys = Object.keys(info);
  keys.map((key: any) => {
    const identifier = key;
    const element = info[identifier];
    if (!element) {
      throw console.error(` ${identifier} is invalid`);
    }
  });
}
