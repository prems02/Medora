const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://medora:medora@cluster0.ys8bf76.mongodb.net/moderaDB")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ Connection error:", err));

const userSchema = new mongoose.Schema({
  username: String,
  password: String
});

const User = mongoose.model("User", userSchema);

async function testInsert() {
  const newUser = new User({ username: "testUser", password: "12345" });
  await newUser.save();
  console.log("✅ Inserted test user successfully!");
  process.exit();
}

testInsert();
