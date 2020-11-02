import * as http from "http";
import { ExpressDriver } from './drivers/express/express';
import { MongoDriver } from "./drivers/mongo/mongo";
require("dotenv").config();

const app = ExpressDriver.build();
const server = http.createServer(app)
const connectionString = process.env.dbURI;
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Social Media backend is running on ${PORT}`);
});
MongoDriver.build(connectionString).then( () => {
    console.log('Connection to the database was successful 🟢');
});