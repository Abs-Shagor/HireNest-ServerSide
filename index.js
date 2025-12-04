const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const app = express();
const multer = require('multer');
const path = require('path');
app.use(cors());
dotenv.config()
app.use(express.json());
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// Connecting mongodb securely with the help of dotenv
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@userhandling.g6xehje.mongodb.net/?retryWrites=true&w=majority&appName=userHandling`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

//// Testing wether the database connected or not
async function run() {
  try {
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

  } finally {
    // ....
  }
}
run().catch(console.dir);



let myCollection = client.db("HireNestDB").collection("Jobs");
let myUserCollection = client.db("HireNestDB").collection("users");

// checking the root route
app.get('/', (req, res) => {
  res.send('Hello from server side!!!')
})

//// creating/posting/inserting data and handling file upload with the help of multer
// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Create this folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Change from single() to fields() for multiple files
app.post('/addjob', upload.fields([
  { name: 'company_logo', maxCount: 1 },
  { name: 'pdf_file', maxCount: 1 }
]), async (req, res) => {
  const jobData = {
    ...req.body,
    company_logo: req.files.company_logo ? `/uploads/${req.files.company_logo[0].filename}` : null,
    pdf_file: req.files.pdf_file ? `/uploads/${req.files.pdf_file[0].filename}` : null,
    createdAt: new Date()
  };

  const result = await myCollection.insertOne(jobData);
  res.send(result);
});
app.use('/uploads', express.static('uploads'));

//// Read/get/find the data
app.get('/jobs', async (req, res) => {
  const result = await myCollection.find().toArray();
  res.send(result);
})

// Handling Users in database
app.post('/adduser', async (req, res) => {
  const userData = req.body;
  const result = await myUserCollection.insertOne(userData);
  res.send(result);
})
app.get('/users', async (req, res) => {
  const result = await myUserCollection.find().toArray();
  res.send(result);
})
app.put('/users/:id', async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;

  const result = await myUserCollection.updateOne(
    { email: id },
    { $set: updatedData },
    { upsert: true } // ← This creates if doesn't exist
  );

  res.send(result);
});

//// Delete a coffee
// app.delete('/coffees/:id', async (req, res) => {
//     const id = req.params.id;
//     const query = { _id: new ObjectId(id) }
//     const result = await myCollection.deleteOne(query);
//     res.send(result);
// })



app.listen(port, () => {
  console.log(`The server is running on port: ${port}`);
});
// module.exports = app;