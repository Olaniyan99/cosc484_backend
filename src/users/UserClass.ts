import { MongoDriver } from '../drivers/mongo/mongo';
import { Router, Response, Request } from 'express';
import { UserSchema } from './UserInterface';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { Db } from 'mongodb';
import 'dotenv/config';

enum COLLECTION {
    USERS = 'users'
}

export class UserClass {
    private static instance: UserClass;
    private static db: Db;

    public static buildRouter() {
        const app = Router();
        app.post  ('/signup', UserClass.signUp); //This route is responsible for signing up new users.
        app.post ('/login', UserClass.login) // This route is responsible for logining in exsiting users.
        
        app.route('/users')
        // .get(UserClass.getUsers)
        // .patch(UserClass.updateUser)
        // .post(UserClass.deleteUser)

        return app;
    }
 
    static dbConnection () {
        this.db = MongoDriver.getConnection();
        return this.db;
    }

    static getInstance(): UserClass {  // creates a new instance of the userclass if one doesnt already exists
        if(!this.instance) {
            this.instance = new UserClass();
        }
        return this.instance;
    }

    static signToken = (payload: any) => {
        return jwt.sign({payload}, 'secrete',{expiresIn: '24h'})
    }

    static async signUp(req: Request, res: Response) { //signing up
        try {
            const hashPassword = await bcrypt.hash(req.body.password, 12); //encrypts the password field passed in req.body.password
            const newUser = new UserSchema (req.body.name,req.body.username,req.body.email,hashPassword) //creates a new user and the encrypted passed is being asigned in the password field
            const insertUser = await UserClass.dbConnection().collection(COLLECTION.USERS) // inserts the new user into the db and returns the obj (payload)
            .insertOne(newUser).then(result => {
                return result.ops;
            }) .catch(err => {
                console.log(err);
            });
            const token = UserClass.signToken(insertUser) //create the user token which contains all the properties of the user
            // const token = jwt.sign({payload: insertUser}, process.env.SECRET_KEY,{expiresIn: '24h'}) //create the user token which contains all the properties of the user
            res.status(201).json({
                message: "Sucess!! A new user was created.",
                insertUser,
                token,
            });
            
        } catch (e) {
            res.send(e)
        }
    }

    static async login(req: Request, res: Response) { //logging in
        try {
            const email = req.body.email;
            const password = req.body.password;
            // step 1) check the email and password and makes sure its not blank;
            if(!email || !password) {
                return res.status(400).send("Please provide email and password");
            }
            // step 2) check is user exist and if passwoard is correct
            const user = await UserClass.dbConnection().collection(COLLECTION.USERS).findOne({$or:[{email: email},{password: password}]});
            //hashes the password being entered and compares with the encrypted ones in the db to find a match. if the email or password doesnt match any user in the db, throws a 401 (unauthorized).             
            if(!user || !(await bcrypt.compare(password, user.password))) { 
                return res.status(401).send('Incorrect email or password, Please enter a valid login!');
            }
            console.log(user);
            // step 3) if everything checks out, then a token is sent to the client
            const token = UserClass.signToken(user);

            res.status(200).json({
                status: 'Login Sucessfull!!',
                token
            });
            
        } catch (e) {
            res.send(e)
        }
    }
}