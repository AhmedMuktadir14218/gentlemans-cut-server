const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());



// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.twtll.mongodb.net/?retryWrites=true&w=majority`;
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jgfdfab.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


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


async function run() {
    try {

        console.log('db connected');
        const appointmentOptionCollection = client.db('gentlemans-cut').collection('appointmentOptions');

        //  const bookingsCollection = client.db('gentlemans-cut').collection('bookings'); 
        const bookingsCollection = client.db('gentlemans-cut').collection('bookings');
        const usersCollection = client.db('gentlemans-cut').collection('users');        
        const bookingListCollection = client.db('gentlemans-cut').collection('bookings');
        const berbarsCollection = client.db('gentlemans-cut').collection('berbars');
        const newServiceCollection = client.db('gentlemans-cut').collection('newService');
        const paymentsCollection = client.db('gentlemans-cut').collection('payments');

        // NOTE: make sure you use verifyAdmin after verifyJWT
        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        }

        // Use Aggregate to query multiple collection and then merge data
        app.get('/appointmentOptions', async (req, res) => {
            const date = req.query.date;
            const query = {};
            const options = await appointmentOptionCollection.find(query).toArray();

            // get the bookings of the provided date
            const bookingQuery = { appointmentDate: date }
            const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();

            // code carefully :D
            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name);
                const bookedSlots = optionBooked.map(book => book.slot);
                const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot))
                option.slots = remainingSlots;
            })
            res.send(options);
        });
        
        app.post('/appointmentOptions',/**verifyJWT, verifyAdmin, */verifyJWT, verifyAdmin, async (req, res) => {
            const newservice = req.body;
            const result = await appointmentOptionCollection.insertOne(newservice);
            res.send(result);
        });


        app.get('/appointmentSpecialty', async (req, res) => {
            const query = {}
            const result = await appointmentOptionCollection.find(query).project({ name: 1 }).toArray();
            res.send(result);
        })

        /***
         * API Naming Convention 
         * app.get('/bookings')
         * app.get('/bookings/:id')
         * app.post('/bookings')
         * app.patch('/bookings/:id')
         * app.delete('/bookings/:id')
         * 
         * DB_USER=doctor-chamber-admin
DB_PASS=JQd4elfKc49qKEYU

ACCESS_TOKEN= 67bc1efde8237ad996077a04e1ad9e6305ccd183e90b8fd744f1ee6
f1bd7a9e2cc13763694869ea6bf692892f903013aeb0cf03cd285414
47c09a11ffca5caa1

# STRIPE_SECRET_KEY=pk_test_51MUtJ3HKWwYR1p914MU3zAdBG7ZbDXCCIziUD4iqEbbVPkt8lxTxQ5CN2ayx2QHPsbCQwj9vkh8BoniQzmLN4A6V003i593gT1
STRIPE_SECRET_KEY=sk_test_51MUtJ3HKWwYR1p91rpXCcZLN2xGubVwdNXLhYcDU1AAoWbpxsDy64FsWsRhGOCBknKm52up8lapp0VSiaA418K8q00bvHfiueo

# DB_USER=geniusUser
# DB_PASS=Rr39GninlzTMi6ry
        */

 
  app.get('/bookings',/* verifyJWT,*/  async (req, res) => {
    const email = req.query.email;
    // const decodedEmail = req.decoded.email;

    // if (email !== decodedEmail) {
    //     return res.status(403).send({ message: 'forbidden access' });
    // }

    const query = { email: email };
    const bookings = await bookingsCollection.find(query).toArray();
    res.send(bookings);
})

 
  app.get('/bookinglist', async(req, res) => {
     const query={};
    const options= await bookingListCollection.find(query).toArray();
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

  const alreadyBooked = await bookingsCollection.find(query).toArray();

  if (alreadyBooked.length) {
      const message = `You already have a booking on ${booking.appointmentDate}`
      return res.send({ acknowledged: false, message })
  }

    
    const result= await bookingsCollection.insertOne(booking);
    res.send(result);
  })
        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.post('/payments', async (req, res) =>{
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId
            const filter = {_id: ObjectId(id)}
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc)
            res.send(result);
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
        });

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
          
            if (!user || user.role !== 'admin') {
              return res.status(403).json({ message: 'Forbidden access' });
            }
          
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
              $set: {
                role: 'admin'
              }
            }; 
          
            try {
              const result = await usersCollection.updateOne(filter, updatedDoc);
              res.json(result);
            } catch (error) {
              res.status(500).json({ message: 'Failed to update user role' });
            }
          });
            

        // temporary to update price field on appointment options
        app.get('/addPrice', async (req, res) => {
            const filter = {}
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    price: 99
                }
            }
            const result = await appointmentOptionCollection.updateMany(filter, updatedDoc, options);
            res.send(result);
        })


      

        app.get('/berbars',/** */verifyJWT, verifyAdmin,  async (req, res) => {
            const query = {};
            const berbars = await berbarsCollection.find(query).toArray();
            res.send(berbars);
        })

        app.post('/berbars',/**verifyJWT, verifyAdmin, */verifyJWT, verifyAdmin, async (req, res) => {
            const doctor = req.body;
            const result = await berbarsCollection.insertOne(doctor);
            res.send(result);
        });
  
        app.delete('/berbars/:id', /** verifyJWT, verifyAdmin, */verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await berbarsCollection.deleteOne(filter);
            res.send(result);
        })
    


    }
    finally {

    }
}
run().catch(console.log);

app.get('/', async (req, res) => {
    res.send('berbars portal server is running');
})
app.listen(port, () => console.log(`berbars portal running on ${port}`))






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





  



