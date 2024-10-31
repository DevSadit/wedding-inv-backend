const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://ahsan-tumpa.netlify.app"],
    credentials: true,
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.irm8dks.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // verify admin middleware
    const verifyAdmin = async (req, res, next) => {
      const user = req.user;
      const query = { email: user?.email };
      const result = await usersCollection.findOne(query);
      console.log(result?.role);
      if (!result || result?.role !== "admin")
        return res.status(401).send({ message: "unauthorized access!!" });

      next();
    };

    const userCollection = client.db(`Wedding`).collection(`Users`);
    const adminCollection = client.db(`Wedding`).collection(`Admin`);
    const wishesCollection = client.db(`Wedding`).collection(`Wishes`);

    // send user data to the database
    app.post("/user", async (req, res) => {
      const userDetails = req.body;
      // console.log(userDetails);
      const result = await userCollection.insertOne(userDetails);
      res.send(result);
    });

    // get user data from db
    app.get("/users", async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // get the wishes by the users
    app.get("/wishes", async (req, res) => {
      const cursor = wishesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // post the wishes by the users
    app.post("/wishes", async (req, res) => {
      const wishDetails = req.body;
      // console.log(wishDetails);
      const result = await wishesCollection.insertOne(wishDetails);
      res.send(result);
    });

    // admin
    app.post("/adm-login", async (req, res) => {
      const { email, password } = req.body;
      // console.log(email, password);

      try {
        // Find user by email
        const user = await adminCollection.findOne({ email });
        // console.log(user);
        if (!user) {
          return res.status(400).json({ message: "User not found" });
        }

        // Check password
        if (password !== user.password) {
          // console.log(`not matching`);
          return res.status(400).json({ message: "Invalid credentials" });
        }

        // If everything is correct, send the role
        res.send({ role: user.role });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
      }
    });

    // /////////////////////////////////////////////////
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
