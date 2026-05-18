import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { MongoClient, ServerApiVersion } from 'mongodb';

const app = express();
const port = process.env.PORT || 5000;


app.use(cors({
    origin: [process.env.NEXT_PUBLIC_APP_URL], 
    credentials: true
}));
app.use(express.json());


const uri = `mongodb+srv://${process.env.MONGODB_ADMIN_USERNAME}:${process.env.MONGODB_ADMIN_PASSWORD}@cluster0.izoxutw.mongodb.net/?appName=Cluster0`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
  
    await client.connect();
    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    
  } finally {
    
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('SlotsLib Server is running perfectly!');
});


app.listen(port, () => {
    console.log(`Server is moving on port: ${port}`);
});