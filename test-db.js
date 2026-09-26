require("dotenv").config();
const mongoose = require("mongoose");
 
const runTest = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  console.log("------------------------------------------");
  console.log("Testing MongoDB Connection...");
  console.log("URI Name Found:", process.env.MONGODB_URI ? "MONGODB_URI" : process.env.MONGO_URI ? "MONGO_URI" : "NONE");
  console.log("------------------------------------------");
 
  if (!mongoUri) {
    console.error("❌ ERROR: No MongoDB URI found in your .env file!");
    process.exit(1);
  }
 
  try {
    console.log("Connecting...");
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log("✅ SUCCESS! MongoDB connected successfully.");
    // Try a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("✅ Collections found:", collections.map(c => c.name));
    process.exit(0);
  } catch (error) {
    console.error("❌ FAILED TO CONNECT:");
    console.error(error.message);
    process.exit(1);
  }
};
 
runTest();