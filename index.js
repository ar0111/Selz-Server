const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId, ReturnDocument } = require('mongodb');
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
    const bookingsCollection = database.collection('Bookings');

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

    app.get('/users/:email', async(req, res)=>{
      const email = req.params.email;
      const query = {email};
      const user = await usersCollection.findOne(query);
      res.send(user)

    })

    app.get('/desieruser/:email', async(req, res)=>{
      const email = req.params.email;
      const query = {email};
      const user = await usersCollection.findOne(query);
      console.log(user);
      res.send(user)

    })

    app.put('/users/:email', async(req, res)=>{
      const email = req.params.email;
      const emailVerifiedValue = req.body.user.emailVerified;
      console.log(email, emailVerifiedValue);
      const query = {email};
      const user = await usersCollection.findOne(query);
      const filter = {_id: new ObjectId(user._id)};
      const option = {upsert: true};
      const updatedDoc = {
        $set: {
          emailVerified: emailVerifiedValue
        }
      }

      const result = await usersCollection.updateOne(filter, updatedDoc, option);
      res.send(result)
    })

    //Make Admin

    app.put('/users/admin/:id', async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const option = {upsert: true};
      const updatedDoc = {
        $set:{
          primaryRole : 'admin'
        }
      }

      const result = await usersCollection.updateOne(filter, updatedDoc, option);
      res.send(result);
    })

    //Check User is Admin/Not
    app.get('/users/admin/:email', async(req, res)=>{
      const email = req.params.email;
      const query = {email};
      const user = await usersCollection.findOne(query);
      res.send({isAdmin: user?.primaryRole === 'admin'})
    })

    app.delete('/users/admin/:id', async(req, res)=>{
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id)};
      const result = await usersCollection.deleteOne(filter);
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
      const id = data.id;
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
      const quantity = data.quantity

      const image = req.files.image;
      const imgData = image.data;
      const encodeImg = imgData.toString('base64');
      const imgBuffer = Buffer.from(encodeImg, 'base64');

      const product = {
        id,
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
        quantity,
        image: imgBuffer
      }
      console.log(product);
      const filter = {name: data.category};
      const option = {upsert: true};
      const updatedDoc = {
        $addToSet: {
          products: product
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
      const finalResult = result.products;
      res.send(finalResult)
    })

    // get products by specific seller

    app.get('/myproducts/:email', async(req, res)=>{
      const email = req.params.email;
      // console.log(email);
      const query = {};
      const result = await database.collection('Categories').aggregate([
        {
          $unwind:'$products'
        },
        {
          $match:{
            'products.email':email
          }
        }
      ]).toArray();

      // console.log(result);
      const productsArray = [];

      result.forEach(option => {
        const product = option.products;
        productsArray.push(product);
      }) 

      res.json(productsArray);
    })

    app.delete('/myproducts/:category/:id', async(req, res)=>{
      const category = req.params.category;
      const id = req.params.id;
      // console.log(category, id);

      const desireCategory = await categoriesCollection.findOne({name: category});

      const productIndex = desireCategory.products.findIndex(product => product.id === id);
      
      desireCategory.products.splice(productIndex, 1);
      const result = await categoriesCollection.updateOne({name: category}, { $set: { products: desireCategory.products } });
      
      console.log(result);
      res.send(result);
    })

    //Update A Product
    app.get('/update/:category/:id', async(req, res)=>{
      const category = req.params.category;
      const id = req.params.id;
      // console.log(category, id);

      const desireCategory = await categoriesCollection.findOne({name: category});

      const productIndex = desireCategory.products.findIndex(product => product.id === id);
      
      const result = desireCategory.products.splice(productIndex, 1);

      res.send(result)
    })

    app.put('/update/:category/:id', async(req, res)=>{
      const category = req.params.category;
      const id = req.params.id;
      const price = req.body.price;
      const quantity = req.body.quantity;

      const desireCategory = await categoriesCollection.findOne({name: category});
      // console.log(desireCategory._id);

      const productIndex = desireCategory.products.findIndex(product => product.id === id);

      const result = await categoriesCollection.updateOne(
        {_id: new ObjectId(desireCategory._id), 'products.id': id},
        {
          $set: {
            'products.$[elem].price': price,
            'products.$[elem].quantity': quantity,
          },
        },
        { arrayFilters: [{ 'elem.id': id }] }
      )

      res.send(result);
    })

    //Booking Post
    app.post('/bookings', async(req, res)=>{
      const booking = req.body;
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    })

    app.get('/bookings', async(req, res)=>{
      const email = req.query.email;
      // console.log(email);
      const filter = {buyerEmail:email};
      const result = await bookingsCollection.find(filter).toArray();
      res.send(result);
    })

    app.delete('/bookings/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await bookingsCollection.deleteOne(query);
      res.send(result);
    })

    app.put('/bookings/:category/:id', async(req, res)=>{
      const category = req.params.category;
      const id = req.params.id;
      // const quantity = (req.body.quantity + 1).toString();

      const desireCategory = await categoriesCollection.findOne({name: category});

      const productIndex = desireCategory.products.findIndex(product => product.id === id);

      const quantity = desireCategory.products[productIndex].quantity;
      const finalQuantity = (parseInt(quantity) + 1).toString();

      const result = await categoriesCollection.updateOne(
        {_id: new ObjectId(desireCategory._id), 'products.id': id},
        {
          $set: {
            'products.$[elem].quantity': finalQuantity,
          },
        },
        { arrayFilters: [{ 'elem.id': id }] }
      )

      res.send(result);
    })

    //Update Product

    app.put('/updateproduct/:category/:id', async(req, res)=>{
      const category = req.params.category;
      const id = req.params.id;
      const quantity = (parseInt(req.body.quantity) - 1).toString();

      const desireCategory = await categoriesCollection.findOne({name: category});

      const productIndex = desireCategory.products.findIndex(product => product.id === id);

      const result = await categoriesCollection.updateOne(
        {_id: new ObjectId(desireCategory._id), 'products.id': id},
        {
          $set: {
            'products.$[elem].quantity': quantity,
          },
        },
        { arrayFilters: [{ 'elem.id': id }] }
      )

      res.send(result);
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