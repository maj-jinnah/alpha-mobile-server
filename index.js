const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ea93pzh.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {

    try {
        const phonesCollection = client.db('alphaMobile').collection('phones')
        const usersCollection = client.db('alphaMobile').collection('users')
        const brandCollection = client.db('alphaMobile').collection('brand')

        //save user and generate jwt token
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email
            const user = req.body
            const filter = { email: email }
            const option = { upsert: true }
            const updateDoc = {
                $set: user,
            }
            const result = await usersCollection.updateOne(filter, updateDoc, option)
            // console.log(result);

            const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
                expiresIn: '1d',
            })
            console.log(token)
            // res.send({ result, token })
        })

        //get brand data 
        app.get('/brand', async (req, res) => {
            const query = {};
            const brand = await brandCollection.find(query).toArray();
            res.send(brand);
        })

        
    }

    finally {

    }
}
run().catch(console.log)




app.get("/", (req, res) => {
    res.send("Now server is running!");
});

app.listen(port, () => {
    console.log(`server is running, ${port}`);
});
