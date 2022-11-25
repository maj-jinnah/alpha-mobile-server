const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
// const jwt = require('jsonwebtoken');
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
