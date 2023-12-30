const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const fileUpload = require("express-fileupload");
const app = express()
const port = process.env.PORT || 3000

//midleware
app.use(cors());
// express req.body undefined
app.use(express.json());
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fqvfigl.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const database = client.db("SelzMart");
    const usersCollection = database.collection('Users');
    const categoriesCollection = database.collection('Categories');

    //Add User
    app.post('/users', async(req, res)=>{
        const user = req.body;
        // console.log(user);
        const result = await usersCollection.insertOne(user);
        res.send(result)
    })

    app.get('/users', async(req, res)=>{
      const query = {};
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    })

    //Add Category

    app.get('/addcategories', async(req, res)=>{
      const query = {};
      const result = await categoriesCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/categoryname', async(req, res)=>{
      const query = {};
      const result = await categoriesCollection.find(query).project({name:1}).toArray();
      res.send(result);
    })

    app.post('/addcategories', async(req, res)=>{
        const name = req.body.name;
        console.log(req.body);
        const image = req.files.image;
        const imgData = image.data;
        const encodeImg = imgData.toString('base64');
        const imgBuffer = Buffer.from(encodeImg, 'base64');
        // console.log(name, imgData);
        const category = {
            name,
            image: imgBuffer
        }

        console.log(category);

        const result = await categoriesCollection.insertOne(category);
        res.send(result);
    })

    //Add Products
    app.put('/addproducts', async(req, res)=>{
      const data = req.body;
      const name = data.name;
      const price = data.price;
      const condition = data.condition;
      const seller = data.seller;
      const email = data.email;
      const phone = data.phone;
      const location = data.location;
      const category = data.category;
      const description = data.description;
      const year = data.year;

      const image = req.files.image;
      const imgData = image.data;
      const encodeImg = imgData.toString('base64');
      const imgBuffer = Buffer.from(encodeImg, 'base64');

      const product = {
        name,
        price,
        condition,
        seller,
        email,
        phone,
        location,
        category,
        description,
        year,
        image: imgBuffer
      }
      console.log(product);
      const filter = {name: data.category};
      const option = {upsert: true};
      const updatedDoc = {
        $addToSet: {
          product: product
        }
      }

      const result = await categoriesCollection.updateOne(filter, updatedDoc, option);
      res.send(result);
    })

    app.get('/products/:id', async(req, res)=>{
      const id = req.params.id;
      // console.log(id);
      const filter = { _id: new ObjectId(id)};
      const result = await categoriesCollection.findOne(filter);
      const finalResult = result.product;
      res.send(finalResult)
    })

    // get products by specific seller

    app.get('/myproducts/:email', async(req, res)=>{
      const email = req.params.email;
      // console.log(email);
      const query = {};
      const result = await database.collection('Categories').aggregate([
        {
          $unwind:'$product'
        },
        {
          $match:{
            'product.email':email
          }
        }
      ]).toArray();

      // console.log(result);
      const productsArray = [];

      result.forEach(option => {
        const product = option.product;
        productsArray.push(product);
        // console.log(typeof(productsArray));
        // // productsArray.forEach(product => console.log(product))
      }) 

      console.log(productsArray);
      

      // console.log(result.product);

      res.json(productsArray);
    })
    
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Our Selz is Running')
})

app.listen(port, () => {
  console.log(`Our Selz Mart run on ${port}`)
})