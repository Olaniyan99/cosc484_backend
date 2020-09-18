import { MongoClient, Db } from "mongodb";

export class MongoDriver {
    static db: Db;
    static mongoClient: MongoClient;

    private constructor() {}

    private async connect(dbURI: string, dbName?: string): Promise<void> {
        try {
            MongoDriver.mongoClient = await MongoClient.connect(dbURI);
            MongoDriver.db = MongoDriver.mongoClient.db(dbName);
        } catch (error) {
            return Promise.reject('There was a problem connecting to the Mongodb')
        }
    }

    static async build(dbUri: any): Promise<void> {
        if(!MongoDriver.mongoClient) {
            const driver = new MongoDriver();
            await driver.connect(dbUri);
        } else {
            return Promise.reject ('There already is an instance running');
        }
    }

    static getConnection () {
        return this.db;
    }

    static disconnect (): void {
        MongoDriver.mongoClient.close();
    }
    
}