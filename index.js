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

// Cloudinary setup for images & file upload
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hirenest',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }] // For images
  }
});
const upload = multer({ storage });


// mongoDB setup
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
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");

  } finally {
    // ....
  }
}
run().catch(/* console.dir */);



let myCollection = client.db("HireNestDB").collection("Jobs");
let myUserCollection = client.db("HireNestDB").collection("users");

// checking the root route
app.get('/', (req, res) => {
  res.send('Hello from server side!!!')
})

//// creating/posting/inserting data and handling file upload with the help of multer

app.post('/addjob', upload.fields([
  { name: 'company_logo', maxCount: 1 },
  { name: 'pdf_file', maxCount: 1 }
]), async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      company_logo: req.files.company_logo ? req.files.company_logo[0].path : null,
      pdf_file: req.files.pdf_file ? req.files.pdf_file[0].path : null,
      createdAt: new Date()
    };

    const result = await myCollection.insertOne(jobData);
    res.send(result);
  } catch (error) {
    // console.error('Job creation error:', error);
    res.status(500).send({ error: 'Failed to create job' });
  }
});


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

//// Delete method
// app.delete('/coffees/:id', async (req, res) => {
//     const id = req.params.id;
//     const query = { _id: new ObjectId(id) }
//     const result = await myCollection.deleteOne(query);
//     res.send(result);
// })



// app.listen(port, () => {
//   // console.log(`The server is running on port: ${port}`);
// });
module.exports = app;