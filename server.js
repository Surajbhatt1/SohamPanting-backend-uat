const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

const app = express();

/* =====================================================
   CONFIGURATION
===================================================== */

const PORT = process.env.PORT || 5000;

/* =====================================================
   LOG DIRECTORY
===================================================== */

const logsDirectory = path.join(__dirname, "logs");
const emailLogFile = path.join(logsDirectory, "email.log");

try {
  if (!fs.existsSync(logsDirectory)) {
    fs.mkdirSync(logsDirectory, {
      recursive: true
    });
  }

  if (!fs.existsSync(emailLogFile)) {
    fs.writeFileSync(
      emailLogFile,
      "========================================\n" +
        "SOHAM PAINTING SERVICES\n" +
        "EMAIL LOG\n" +
        "========================================\n\n",
      "utf8"
    );
  }
} catch (error) {
  console.error("Log initialization error:", error.message);
}

/* =====================================================
   CORS
===================================================== */

const allowedOrigins = [
  "http://localhost:5000",
  "http://localhost:3000",
  "https://sohampanting5.netlify.app",
  "https://soham-panting-frontend-uat.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without Origin
      // Example: Postman / server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked CORS origin:", origin);

      return callback(new Error("Not allowed by CORS"));
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS"
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization"
    ]
  })
);

/* =====================================================
   BODY PARSER
===================================================== */

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true
  })
);

/* =====================================================
   ENVIRONMENT CHECK
===================================================== */

console.log("------------------------------------------");
console.log("SOHAM PAINTING SERVICES API");
console.log("------------------------------------------");

console.log("PORT:", PORT);

console.log(
  "MONGODB_URI:",
  process.env.MONGODB_URI ? "Loaded" : "Missing"
);

console.log(
  "EMAIL_USER:",
  process.env.EMAIL_USER
    ? process.env.EMAIL_USER
    : "Missing"
);

console.log(
  "EMAIL_PASS:",
  process.env.EMAIL_PASS
    ? "Loaded"
    : "Missing"
);

console.log(
  "RECEIVER_EMAIL:",
  process.env.RECEIVER_EMAIL
    ? process.env.RECEIVER_EMAIL
    : "Missing"
);

console.log("------------------------------------------");

/* =====================================================
   MONGODB CONNECTION
===================================================== */

let mongoConnectionPromise = null;

const connectMongoDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose
      .connect(process.env.MONGODB_URI)
      .then(() => {
        console.log("------------------------------------------");
        console.log("MongoDB connected successfully");
        console.log("------------------------------------------");

        return mongoose.connection;
      })
      .catch((error) => {
        mongoConnectionPromise = null;

        console.error("------------------------------------------");
        console.error("MongoDB connection failed:");
        console.error(error.message);
        console.error("------------------------------------------");

        throw error;
      });
  }

  return mongoConnectionPromise;
};

/* =====================================================
   CONTACT ROUTES
===================================================== */

const contactRoutes = require("./routes/contact");

app.use("/api", contactRoutes);

/* =====================================================
   ROOT ROUTE
===================================================== */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Soham Painting API is running"
  });
});

/* =====================================================
   HEALTH CHECK
===================================================== */

app.get("/api/health", async (req, res) => {
  try {
    await connectMongoDB();

    res.status(200).json({
      success: true,
      message: "Soham Painting API is healthy",
      mongodb:
        mongoose.connection.readyState === 1
          ? "connected"
          : "not connected"
    });
  } catch (error) {
    console.error(
      "Health check MongoDB error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Soham Painting API is running but MongoDB is not connected",
      mongodb: "not connected"
    });
  }
});

/* =====================================================
   404 ROUTE
===================================================== */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

/* =====================================================
   GLOBAL ERROR HANDLER
===================================================== */

app.use((error, req, res, next) => {
  console.error("------------------------------------------");
  console.error("GLOBAL ERROR");
  console.error("------------------------------------------");
  console.error(error.message);
  console.error("------------------------------------------");

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

/* =====================================================
   LOCAL SERVER
===================================================== */

// Only start the server when running locally.
// Vercel will use the exported Express app.

if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log("------------------------------------------");
    console.log(`Server running on port ${PORT}`);
    console.log("------------------------------------------");
    console.log("Email log file:");
    console.log(emailLogFile);
    console.log("------------------------------------------");
  });
}

/* =====================================================
   EXPORT APP FOR VERCEL
===================================================== */

module.exports = app;