const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://sabuj-global-education.netlify.app",
    ],
    credentials: true,
  })
);
//middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(
  session({
    secret: "jhfjakaf20123aafjak",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // set to true if you're using HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);
const users = [
  {
    id: 1,
    email: "technology.division@shabujglobal.in",
    password: bcrypt.hashSync("password", 10),
  },
];

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.w7djr5h.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    //Database Collection
    const studentInformationCollection = client
      .db("sabujGlobalDB")
      .collection("studentInfo");
    const blogCollection = client.db("sabujGlobalDB").collection("blogs");

    app.post("/post-student-info", async (req, res) => {
      const studentInfo = req.body;
      const result = await studentInformationCollection.insertOne(studentInfo);
      res.send(result);
    });

    app.get("/all-blogs", async (req, res) => {
      const result = await blogCollection.find().toArray();
      res.send(result);
    });
    app.get("/blog-details/:slug", async (req, res) => {
      const slug = req.params.slug;
      const query = { slug: slug };
      const result = await blogCollection.findOne(query);
      res.send(result);
    });

    app.post("/login", (req, res) => {
      const { email, password } = req.body;
      const user = users.find((u) => u.email === email);
      if (user && bcrypt.compareSync(password, user.password)) {
        req.session.user = user;
        console.log("Session after login:", req.session);
        res.send({ loggedIn: true });
      } else {
        res.status(401).send({ error: "Invalid credentials" });
      }
    });
    app.get("/logout", (req, res) => {
      req.session.destroy();
      res.send({ loggedOut: true });
    });

    // Middleware to check if the user is logged in
    function checkAuth(req, res, next) {
      console.log("Session on request:", req.session);
      if (!req.session.user) {
        return res.status(403).send({ error: "Not authorized" });
      }
      next();
    }
    app.get("/admin/dashboard", checkAuth, (req, res) => {
      res.send("Welcome to the Admin Dashboard!");
    });
    app.get("/student-data/:blogId", async (req, res) => {
      const blogId = req.params.blogId;
      const query = { blogId: blogId };
      const result = await studentInformationCollection.find(query).toArray();
      res.send(result);
    });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Sabuj Global Server is available");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
