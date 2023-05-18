const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();
//middleWare
app.use(cors())
app.use(express.json());

app.get('/',async(req,res) =>{
    res.send('gentlemans server is running');
})

app.listen(port,() => 
    console.log(`gentlemans server is running ${5000}`)
)