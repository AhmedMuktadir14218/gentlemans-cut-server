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


                // get the bookings of the provided date
                const bookingQuery = { appointmentDate: date }
                const alreadyBooked = await bookingnsCollection.find(bookingQuery).toArray();
    
                // code carefully :D
                options.forEach(option => {
                    const optionBooked = alreadyBooked.filter(book => book.service === option.name);
                    const bookedSlots = optionBooked.map(book => book.slot);
                    const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot))
                    
                    option.slots = remainingSlots;

                    console.log(date,option.name,remainingSlots.length);
                }
                )
    
    res.send(options)
  })  



   app.post('/bookings', async(req, res) => {
      
    const booking=req.body;
    console.log(booking);

    const query = {
      appointmentDate: booking.appointmentDate,
      email: booking.email,
      service: booking.service
  }

  const alreadyBooked = await bookingnsCollection.find(query).toArray();

  if (alreadyBooked.length) {
      const message = `You already have a booking on ${booking.appointmentDate}`
      return res.send({ acknowledged: false, message })
  }

    
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