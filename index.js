import cors from "cors";
import express from "express";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();

const port = process.env.PORT || 5501;
const app = express();

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://b12a10-nahiyan-ieh.netlify.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_ACCESS}@cluster0.bfqzn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );

    // Database
    const database = client.db(process.env.DB_NAME);
    // Collections
    const usersCollection = database.collection("users");
    const exportCollection = database.collection("export");
    const importCollection = database.collection("import");

    // Home Products
    // Get latest 6 products
    app.get("/products/home/latest", async (req, res) => {
      try {
        const products = await exportCollection
          .find({})
          .sort({ createdAt: -1 })
          .limit(6)
          .toArray();

        res.send({
          success: true,
          data: products,
        });
      } catch (err) {
        res.status(500).send({
          success: false,
          message: "Failed to fetch products",
          error: err.message,
        });
      }
    });

    // Get all products with optional search
    app.get("/products", async (req, res) => {
      try {
        const search = req.query.search || "";
        const query = search ? { name: { $regex: search, $options: "i" } } : {};

        const products = await exportCollection.find(query).toArray();

        res.send({
          success: true,
          data: products,
        });
      } catch (err) {
        res.status(500).send({
          success: false,
          message: "Failed to fetch products",
          error: err.message,
        });
      }
    });

    // Product Details
    app.get("/products/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const product = await exportCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!product) {
          return res.send({
            success: false,
            message: "Product not found",
          });
        }

        res.send({
          success: true,
          data: product,
        });
      } catch (err) {
        console.log(err);
        return res.send({
          success: false,
          message: "Server error",
        });
      }
    });

    // GET Imports
    app.get("/imports", async (req, res) => {
      try {
        const userEmail = req.query.user;
        const search = req.query.search || "";

        if (!userEmail) {
          return res
            .status(400)
            .send({ success: false, message: "User not provided" });
        }

        const query = {
          importer: userEmail,
          ...(search && {
            "fullProduct.name": { $regex: search, $options: "i" },
          }),
        };

        const imports = await importCollection.find(query).toArray();

        res.send({ success: true, data: imports });
      } catch (err) {
        console.log(err);
        res.status(500).send({ success: false, message: "Server error" });
      }
    });

    // GET Exports
    app.get("/exports", async (req, res) => {
      const { user, search } = req.query;
      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "User email required" });

      try {
        const query = { createdBy: user };
        if (search) {
          query.name = { $regex: search, $options: "i" }; // case-insensitive search
        }

        const exportsData = await exportCollection.find(query).toArray(); // <-- .toArray() is required
        res.json({ success: true, data: exportsData });
      } catch (err) {
        res.status(500).json({ success: false, message: err.message });
      }
    });

    // Product
    // Postting
    app.post("/products", async (req, res) => {
      try {
        const product = req.body;

        if (
          !product ||
          !product.name ||
          !product.image ||
          !product.price ||
          !product.origin ||
          !product.rating ||
          !product.quantity ||
          !product.createdAt ||
          !product.createdBy
        ) {
          return res.status(400).send({ message: "Invalid product data" });
        }
        // dont add directly
        const newProduct = {
          name: product.name,
          image: product.image,
          price: product.price,
          origin: product.origin,
          rating: product.rating,
          quantity: Number(product.quantity),
          createdAt: product.createdAt,
          createdBy: product.createdBy,
        };

        const result = await exportCollection.insertOne(newProduct);

        res.send({
          success: true,
          message: "Product added successfully",
          insertedId: result.insertedId,
        });
      } catch (err) {
        res.status(500).send({
          success: false,
          message: "Failed to add product",
          error: err.message,
        });
      }
    });

    // Import Product
    app.post("/products/import", async (req, res) => {
      try {
        const { productId, quantity, importer } = req.body;

        if (!productId || !quantity || !importer) {
          return res.send({
            success: false,
            message: "Missing fields",
          });
        }

        // find product
        const product = await exportCollection.findOne({
          _id: new ObjectId(productId),
        });

        if (!product) {
          return res.send({
            success: false,
            message: "Product not found",
          });
        }

        // check quantity
        if (quantity > product.quantity) {
          return res.send({
            success: false,
            message: "Import quantity exceeds available stock",
          });
        }

        // prepare full product snapshot
        const fullProduct = {
          p_id: product._id,
          name: product.name,
          image: product.image,
          origin: product.origin,
          rating: product.rating,
          price: product.price,
          quantityAtImport: Number(product.quantity),
          createdAt: product.createdAt,
          createdBy: product.createdBy,
        };

        // save import entry
        const importData = {
          productId: productId,
          importer,
          quantity: Number(quantity),
          fullProduct,
          importedAt: new Date(),
        };

        await importCollection.insertOne(importData);

        // reduce main product quantity
        await exportCollection.updateOne(
          { _id: new ObjectId(productId) },
          { $inc: { quantity: -quantity } }
        );

        res.send({
          success: true,
          message: "Product imported successfully",
        });
      } catch (err) {
        console.log(err);
        res.send({
          success: false,
          message: "Server error",
        });
      }
    });

    // UPDATE
    // UPDATE Export Product
    app.put("/products/:id", async (req, res) => {
      const { id } = req.params;
      const updateData = req.body;

      try {
        const result = await exportCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Product not found" });
        }

        const updatedProduct = await exportCollection.findOne({
          _id: new ObjectId(id),
        });

        res.json({
          success: true,
          message: "Product updated",
          data: updatedProduct,
        });
      } catch (err) {
        res.status(500).json({ success: false, message: err.message });
      }
    });

    // Delete
    // DELETE Import
    app.delete("/imports/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!id) {
          return res
            .status(400)
            .send({ success: false, message: "Import ID missing" });
        }

        const result = await importCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res
            .status(404)
            .send({ success: false, message: "Import not found" });
        }

        res.send({ success: true, message: "Import removed successfully" });
      } catch (err) {
        console.log(err);
        res.status(500).send({ success: false, message: "Server error" });
      }
    });

    // DELETE Export Product
    app.delete("/products/:id", async (req, res) => {
      const { id } = req.params;

      try {
        const result = await exportCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Product not found" });
        }

        res.json({ success: true, message: "Product deleted" });
      } catch (err) {
        res.status(500).json({ success: false, message: err.message });
      }
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Import Export Hub server");
});

app.listen(port, () => {
  console.log(`Import Export Hub server listening on port ${port}`);
});
