const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ea93pzh.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//verify a user 
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('Unauthorized access');
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    })
}



async function run() {

    try {
        const brandCollection = client.db('alphaMobile').collection('brand')
        const phonesCollection = client.db('alphaMobile').collection('phones')
        const bookingsCollection = client.db('alphaMobile').collection('bookings')
        const usersCollection = client.db('alphaMobile').collection('users')
        const advertisesCollection = client.db('alphaMobile').collection('advertise')

        //create token and send to the uer if the user is available in data base
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { userEmail: email }
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' });
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: "" });
        })

        //save user in data base (when login , signup, and social log in)  public
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        //get brands data 
        app.get('/brand', async (req, res) => {
            const query = {};
            const brand = await brandCollection.find(query).toArray();
            res.send(brand);
        })

        //get phone under brand
        app.get('/brand/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { category_id: id };
            const result = await phonesCollection.find(filter).toArray();
            res.send(result)
        })

        //this will get a specific booking phone for user email  (my order) (user role) 
        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'Forbidden' });
            }

            const query = { buyerEmail: email }
            const result = await bookingsCollection.find(query).toArray()
            res.send(result)
        })

        //post all the booking phone in database
        app.post('/bookings', async (req, res) => {
            const bookingInfo = req.body;
            const result = await bookingsCollection.insertOne(bookingInfo);
            res.send(result);
        })


        //                             seller role start from here



        //add phones to the data base              (add a product page )         (seller role)
        app.post('/products', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const filter = { userEmail: decodedEmail };
            const user = await usersCollection.findOne(filter);
            if (user?.userRole !== "Seller") {
                res.status(403).send({ message: "Forbidden access" })
            }

            const phoneInfo = req.body;
            const result = await phonesCollection.insertOne(phoneInfo)
            res.send(result)
        })

        // the seller add a product             (my product page)                (seller role)
        app.get('/myproduct', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const filter = { userEmail: decodedEmail };
            const user = await usersCollection.findOne(filter);
            if (user?.userRole !== "Seller") {
                res.status(403).send({ message: "Forbidden access" })
            }

            const emil = req.query.email;
            const query = { sellerMail: emil }
            const result = await phonesCollection.find(query).toArray();
            res.send(result);
        })

        //seller can delete his product           (my product page)                (seller role)
        app.delete('/myproduct/:id', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const filter = { userEmail: decodedEmail };
            const user = await usersCollection.findOne(filter);
            if (user?.userRole !== "Seller") {
                res.status(403).send({ message: "Forbidden access" })
            }

            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            console.log(id);
            const result = await phonesCollection.deleteOne(query);
            res.send(result)
        })

        //thi sis the Advertise post req       (my product page)                  (seller role)
        app.post('/advertise', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const filter = { userEmail: decodedEmail };
            const user = await usersCollection.findOne(filter);
            if (user?.userRole !== "Seller") {
                res.status(403).send({ message: "Forbidden access" })
            }

            const phoneInfo = req.body;
            const result = await advertisesCollection.insertOne(phoneInfo);
            res.send(result)

        })



        //                              Admin role start from here




        //check is the person is admin or not (isAdmin Hooks)
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email };
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user.userRole === 'Admin' });
        })

        //this will get all buyers (all seller page) (admin role)
        app.get('/allbuyers', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const filter = { userEmail: decodedEmail };
            const user = await usersCollection.findOne(filter);
            if (user?.userRole !== "Admin") {
                res.status(403).send({ message: "Forbidden access" })
            }

            const email = req.query.email;
            const query = { userRole: 'Buyer' };
            const result = await usersCollection.find(query).toArray()
            res.send(result)
        })

        //this will get all sellers (all seller page) (admin role)
        app.get('/allsellers', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const filter = { userEmail: decodedEmail };
            const user = await usersCollection.findOne(filter);
            if (user?.userRole !== "Admin") {
                res.status(403).send({ message: "Forbidden access" })
            }

            const email = req.query.email;
            const query = { userRole: 'Seller' };
            const result = await usersCollection.find(query).toArray()
            res.send(result)
        })

        //this will verify the seller (all seller page) (admin role)  
        app.put('/allsellers/verify', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const filter = { userEmail: decodedEmail };
            const user = await usersCollection.findOne(filter);
            if (user?.userRole !== "Admin") {
                res.status(403).send({ message: "Forbidden access" })
            }

            const email = req.query.email;
            const query = { userEmail: email };
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    verified: true
                }
            }
            const result = await usersCollection.updateOne(query, updatedDoc, options);
            res.send(result);
        })

        //this will delete the user   (admin role)
        app.delete('/users', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const filter = { userEmail: decodedEmail };
            const user = await usersCollection.findOne(filter);
            if (user?.userRole !== "Admin") {
                res.status(403).send({ message: "Forbidden access" })
            }

            const email = req.query.email;
            const query = { userEmail: email };
            const result = await usersCollection.deleteOne(query);
            res.send(result)

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
