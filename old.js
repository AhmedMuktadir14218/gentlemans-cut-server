// const express = require('express');
// const cors = require('cors');
// const port = process.env.PORT || 5000;
// const jwt = require('jsonwebtoken');
// const app = express();

// require('dotenv').config();

// const { MongoClient, ServerApiVersion } = require('mongodb');

//middleWare
// app.use(cors())
// app.use(express.json());
/*
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jgfdfab.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
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
   
   const usersCollection = client.db('gentlemans-cut').collection('users');

   function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}


   app.get('/appointmentOptions', async(req, res) => {
    const date =req.query.date;
    console.log(date);
    const query={};
    const options= await appointmentOptionCollection.find(query).toArray();


                const bookingQuery = { appointmentDate: date }
                const alreadyBooked = await bookingnsCollection.find(bookingQuery).toArray();
    
                options.map(option => {
                    const optionBooked = alreadyBooked.filter(book => book.service === option.name);
                    const bookedSlots = optionBooked.map(book => book.slot);
                    const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot))
                    
                    option.slots = remainingSlots;

                    console.log(date,option.name,remainingSlots.length);
                }
                )
    
    res.send(options)
  })  

  app.get('/bookings', verifyJWT, async (req, res) => {
    const email = req.query.email;
    const decodedEmail = req.decoded.email;

    if (email !== decodedEmail) {
        return res.status(403).send({ message: 'forbidden access' });
    }

    const query = { email: email };
    const bookings = await bookingnsCollection.find(query).toArray();
    res.send(bookings);
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



  app.get('/jwt', async (req, res) => {
    const email = req.query.email;
    const query = { email: email };
    const user = await usersCollection.findOne(query);
    if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
        return res.send({ accessToken: token });
    }
    res.status(403).send({ accessToken: '' })
    // console.log(user);
    // res.send({accessToken: 'done'})

  });

  app.get('/users', async (req, res) => {
    const query = {};
    const users = await usersCollection.find(query).toArray();
    res.send(users);
});

app.get('/users/admin/:email', async (req, res) => {
    const email = req.params.email;
    const query = { email }
    const user = await usersCollection.findOne(query);
    res.send({ isAdmin: user?.role === 'admin' });
})

app.post('/users', async (req, res) => {
    const user = req.body;
    console.log(user);
    const result = await usersCollection.insertOne(user);
    res.send(result);
});


app.put('/users/admin/:id', verifyJWT, async (req, res) => {
  const decodedEmail = req.decoded.email;
  const query = { email: decodedEmail };
  const user = await usersCollection.findOne(query);

  if (user?.role !== 'admin') {
      return res.status(403).send({ message: 'forbidden access' })
  }

  const id = req.params.id;
  const filter = { _id: ObjectId(id) }
  const options = { upsert: true };
  const updatedDoc = {
      $set: {
          role: 'admin'
      }
  }
  const result = await usersCollection.updateOne(filter, updatedDoc, options);
  res.send(result);
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

**/




// const express = require('express');
// const cors = require('cors');
// const port = process.env.PORT || 5000;
// const jwt = require('jsonwebtoken');
// const app = express();

// require('dotenv').config();

// const { MongoClient, ServerApiVersion } = require('mongodb');

//middleWare
// app.use(cors())
// app.use(express.json());
/*
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jgfdfab.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
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
   
   const usersCollection = client.db('gentlemans-cut').collection('users');

   function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}


   app.get('/appointmentOptions', async(req, res) => {
    const date =req.query.date;
    console.log(date);
    const query={};
    const options= await appointmentOptionCollection.find(query).toArray();


                const bookingQuery = { appointmentDate: date }
                const alreadyBooked = await bookingnsCollection.find(bookingQuery).toArray();
    
                options.map(option => {
                    const optionBooked = alreadyBooked.filter(book => book.service === option.name);
                    const bookedSlots = optionBooked.map(book => book.slot);
                    const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot))
                    
                    option.slots = remainingSlots;

                    console.log(date,option.name,remainingSlots.length);
                }
                )
    
    res.send(options)
  })  

  app.get('/bookings', verifyJWT, async (req, res) => {
    const email = req.query.email;
    const decodedEmail = req.decoded.email;

    if (email !== decodedEmail) {
        return res.status(403).send({ message: 'forbidden access' });
    }

    const query = { email: email };
    const bookings = await bookingnsCollection.find(query).toArray();
    res.send(bookings);
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



  app.get('/jwt', async (req, res) => {
    const email = req.query.email;
    const query = { email: email };
    const user = await usersCollection.findOne(query);
    if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
        return res.send({ accessToken: token });
    }
    res.status(403).send({ accessToken: '' })
    // console.log(user);
    // res.send({accessToken: 'done'})

  });

  app.get('/users', async (req, res) => {
    const query = {};
    const users = await usersCollection.find(query).toArray();
    res.send(users);
});

app.get('/users/admin/:email', async (req, res) => {
    const email = req.params.email;
    const query = { email }
    const user = await usersCollection.findOne(query);
    res.send({ isAdmin: user?.role === 'admin' });
})

app.post('/users', async (req, res) => {
    const user = req.body;
    console.log(user);
    const result = await usersCollection.insertOne(user);
    res.send(result);
});


app.put('/users/admin/:id', verifyJWT, async (req, res) => {
  const decodedEmail = req.decoded.email;
  const query = { email: decodedEmail };
  const user = await usersCollection.findOne(query);

  if (user?.role !== 'admin') {
      return res.status(403).send({ message: 'forbidden access' })
  }

  const id = req.params.id;
  const filter = { _id: ObjectId(id) }
  const options = { upsert: true };
  const updatedDoc = {
      $set: {
          role: 'admin'
      }
  }
  const result = await usersCollection.updateOne(filter, updatedDoc, options);
  res.send(result);
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

**/





  



