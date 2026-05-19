import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { MongoClient, ServerApiVersion } from 'mongodb';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: [
      "http://localhost:3000", 
      process.env.NEXT_PUBLIC_APP_URL
    ].filter(Boolean),
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
    
    const db = client.db("slotslibDB");
    const facilitiesCollection = db.collection("facilities");

  
    app.post('/facilities', async (req, res) => {
        try {
            const newFacility = req.body;
            
           
            const result = await facilitiesCollection.insertOne(newFacility);
            
            res.status(201).send(result);
        } catch (error) {
            console.error("Error inserting facility:", error);
            res.status(500).send({ message: "Failed to add facility data", error });
        }
    });

   
    app.get('/featured-facilities', async (req, res) => {
        try {
            const result = await facilitiesCollection.find().limit(6).toArray();
            res.send(result);
        } catch (error) {
            res.status(500).send({ message: "Featured Data fetching failed", error });
        }
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

  } catch (error) {
     console.error("Database connection error:", error);
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('SlotsLib Server is running perfectly!');
});

app.listen(port, () => {
    console.log(`Server is moving on port: ${port}`);
});