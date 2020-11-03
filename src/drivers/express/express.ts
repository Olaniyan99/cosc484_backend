import exp = require("express");
import cors from "cors";
import * as bodyParser from "body-parser";
import cookieParser = require("cookie-parser");
import { UserClass } from "../../users/UserClass";
import { PostClass } from "../../posts/PostClass";

export class ExpressDriver {
  static app = exp();

  static build() {
    return this.buildDriver();
  }

  private static buildDriver() {
    this.app.use(bodyParser.json());
    this.app.use(cors({ origin: true, credentials: true }));
    this.initServerHome();
    this.app.set("trust proxy", true);
    this.app.use(cookieParser());
    this.app.use(UserClass.buildRouter());
    this.app.use(PostClass.buildRouter());

    return this.app;
  }

  /**
   * Define the default home page and version of current app.
   */
  private static initServerHome() {
    this.app.get("/", (req, res) => {
      res.json({ message: `Welcome to the cosc484 backend !!` });
    });
  }
}
