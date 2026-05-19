import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import { createRemoteJWKSet, jwtVerify } from 'jose-cjs'; 

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: [
      "https://ph-a-9-slots-lib.vercel.app", 
      process.env.NEXT_PUBLIC_APP_URL
    ].filter(Boolean),
    credentials: true
}));
app.use(express.json());


const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
);


const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Forbidden" });
  }
};

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
    // await client.connect();
    
    const db = client.db("slotslibDB");
    const facilitiesCollection = db.collection("facilities");
    const bookingsCollection = db.collection("bookings");

    
    app.post('/facilities', verifyToken, async (req, res) => {
        try {
            const newFacility = req.body;
            const result = await facilitiesCollection.insertOne(newFacility);
            res.status(201).send(result);
        } catch (error) {
            res.status(500).send({ message: "Failed to add facility data", error });
        }
    });

    
    app.get('/facilities', async (req, res) => {
        try {
            const search = req.query.search || "";
            const sport = req.query.sport || "";
            const query = {};
            if (search) {
                query.facility_name = { $regex: search, $options: "i" };
            }
            if (sport && sport !== "all") {
                query.facility_type = { $in: [sport] };
            }
            const result = await facilitiesCollection.find(query).toArray();
            res.send(result);
        } catch (error) {
            res.status(500).send({ message: "All facilities fetching failed", error });
        }
    });

    
    app.get('/facilities/:id', verifyToken, async (req, res) => {
        try {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await facilitiesCollection.findOne(query);
            if (!result) {
                return res.status(404).send({ message: "Facility not found" });
            }
            res.send(result);
        } catch (error) {
            res.status(500).send({ message: "Single facility fetching failed", error });
        }
    });

   
  app.delete('/facilities/:id', verifyToken, async (req, res) => {
    try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };

        const facility = await facilitiesCollection.findOne(query);
        if (!facility) {
            return res.status(404).send({ message: "Facility not found" });
        }

        const facilityResult = await facilitiesCollection.deleteOne(query);
        await bookingsCollection.deleteMany({ facility_id: id });

        res.send({ 
            facilityDeleted: facilityResult,
            message: "Facility and related bookings deleted successfully" 
        });
    } catch (error) {
        res.status(500).send({ message: "Failed to delete facility", error });
    }
});

    
    app.put('/facilities/:id', verifyToken, async (req, res) => {
        try {
            const id = req.params.id;
            const updatedData = req.body;
            const query = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    facility_name: updatedData.facility_name,
                    facility_type: updatedData.facility_type,
                    imageUrl: updatedData.imageUrl,
                    location: updatedData.location,
                    price_per_hour: updatedData.price_per_hour,
                    capacity: updatedData.capacity,
                    available_slots: updatedData.available_slots,
                    description: updatedData.description
                }
            };
            const result = await facilitiesCollection.updateOne(query, updateDoc);
            res.send(result);
        } catch (error) {
            res.status(500).send({ message: "Failed to update facility data", error });
        }
    });

    
    app.get('/my-facilities', verifyToken, async (req, res) => {
        try {
            const email = req.query.email;
            if (!email) {
                return res.status(400).send({ message: "Owner email is required" });
            }
            const query = { owner_email: email };
            const result = await facilitiesCollection.find(query).toArray();
            res.send(result);
        } catch (error) {
            res.status(500).send({ message: "Failed to load owner facilities", error });
        }
    });

  
    app.post('/bookings', verifyToken, async (req, res) => {
        try {
            const bookingData = req.body;
            const result = await bookingsCollection.insertOne(bookingData);
            res.status(201).send(result);
        } catch (error) {
            res.status(500).send({ message: "Failed to process booking", error });
        }
    });

    
    app.get('/my-bookings', verifyToken, async (req, res) => {
        try {
            const email = req.query.email;
            if (!email) {
                return res.status(400).send({ message: "Email query parameter is required" });
            }
            const query = { user_email: email };
            const result = await bookingsCollection.find(query).toArray();
            res.send(result);
        } catch (error) {
            res.status(500).send({ message: "Failed to load bookings", error });
        }
    });

   
    app.delete('/bookings/:id', verifyToken, async (req, res) => {
        try {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingsCollection.deleteOne(query);
            res.send(result);
        } catch (error) {
            res.status(500).send({ message: "Failed to cancel booking", error });
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

    // await client.db("admin").command({ ping: 1 });
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
    console.log(`Server is running on port: ${port}`);
});