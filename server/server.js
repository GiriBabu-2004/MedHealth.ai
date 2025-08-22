require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { ClerkExpressRequireAuth } = require("@clerk/clerk-sdk-node");

const app = express();
app.use(express.json());

// Enable CORS for frontend at localhost:3000
app.use(cors("*"));

mongoose.connect("mongodb://localhost:27017/medhealth", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("error", console.error.bind(console, "MongoDB connection error:"));

app.get("/api/protected", ClerkExpressRequireAuth({ secretKey: process.env.CLERK_SECRET_KEY }), (req, res) => {
  res.json({
    message: "You are authenticated!",
    clerkUserId: req.auth.userId,
  });
});

const User = mongoose.model("User", new mongoose.Schema({
  clerkId: String,
  name: String,
  email: String,
}));

app.post("/api/users", ClerkExpressRequireAuth({ secretKey: process.env.CLERK_SECRET_KEY }), async (req, res) => {
  const { name, email } = req.body;
  const clerkId = req.auth.userId;

  let user = await User.findOne({ clerkId });
  if (!user) {
    user = new User({ clerkId, name, email });
    await user.save();
  }
  res.json(user);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
