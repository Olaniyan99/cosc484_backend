import * as http from "http";
import { ExpressDriver } from './drivers/express/express';

const app = ExpressDriver.build();
const server = http.createServer(app)
const PORT = 3000;

server.listen(PORT, () => {
    console.log(`Social Media backend is running on ${PORT}`)
});