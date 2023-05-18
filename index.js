const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();

require('dotenv').config();

const { MongoClient, ServerApiVersion } = require('mongodb');

//middleWare
app.use(cors())
app.use(express.json());


// const uri = `mongodb+srv://gentlemans-cut:${process.env.DB_PASS}@cluster0.jgfdfab.mongodb.net/?retryWrites=true&w=majority`;



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jgfdfab.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
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
    console.log('db connected');
   const appointmentOptionCollection = client.db('gentlemans-cut').collection('appointmentOptions');
   const bookingnsCollection = client.db('gentlemans-cut').collection('bookings');
   const bookingListCollection = client.db('gentlemans-cut').collection('bookings');

  //  const appointmentOptionCollection = client.db('doctors-chamber').collection('service');



   app.get('/appointmentOptions', async(req, res) => {
    const date =req.query.date;
    console.log(date);
    const query={};
    const options= await appointmentOptionCollection.find(query).toArray();
    res.send(options)
  })  



   app.post('/bookings', async(req, res) => {
      
    const booking=req.body;
    console.log(booking);
    
    const result= await bookingnsCollection.insertOne(booking);
    res.send(result);
  })


  app.get('/bookinglist', async(req, res) => {
     const query={};
    const options= await bookingListCollection.find(query).toArray();
    res.send(options)
  })  
    
  } 
  
  
  finally {

  }
}
run().catch(console.dir);




app.get('/',async(req,res) =>{
    res.send('gentlemans server is running');
})

app.listen(port,() => 
    console.log(`gentlemans server is running ${5000}`)
)




// console.log("Pinged your deployment. You successfully connected to MongoDB!");