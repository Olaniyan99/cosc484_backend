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
    app.get("/users/:userId/posts", this.getPosts);
    app.get("/users/:userId/posts/:postId", this.getPost);
    app.post("/users/:userId/posts", this.createPost);
    app.patch("/users/:userId/posts/:postId", this.updatePost);
    app.delete("/users/:userId/posts/:postId", this.deletePost);

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
        const resource = await this.dbConnection()
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
        const findUser = await this.dbConnection()
          .collection(COLLECTION.POSTS)
          .findOne({ userId });
        if (findUser) {
          const createPost: IPost = {
            userID: req.params.userId,
            author: req.body.author,
            text: req.body.text,
            comment: req.body.comment,
            likes: req.body.likes,
            date_posted: new Date().getMilliseconds(),
          };
          validateNonNullFields(createPost);
          const insertPost = await this.dbConnection()
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
      const insertUpdate = await this.dbConnection()
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
        const deletePost = await this.dbConnection()
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
}

export function validateNonNullFields(info: any) {
  const keys = Object.keys(info);
  keys.map((key: string) => {
    const identifier = key;
    const element = info[identifier];
    if (!element) {
      throw console.error(` ${identifier} is invalid`);
    }
  });
}
