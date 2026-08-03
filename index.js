import express from "express";
import cors from "cors";
import 'dotenv/config';
import cookieParser from "cookie-parser";
import { pathToFileURL } from "url";
import connectDB from "./config/mongoDB.js";
import bookingRouter from "./routes/bookingRoute.js";
import flightRoute from "./routes/flightRoute.js";
import placeRoute from "./routes/placeRoute.js";
import SavedFlightRoute from "./routes/Savedflightroute.js";
import { clerkMiddleware } from '@clerk/express';
import paymentRoute from './routes/paymentRoute.js'

const app = express();
const port = process.env.PORT || 5000;

connectDB();
const allowedOrigins = [process.env.CLIENT_DOMAIN].filter(Boolean);
const corsOptions = {
  origin: ['http://localhost:5173', 'https://onefly.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}


app.use(clerkMiddleware());
app.use(cors(corsOptions))
app.options('/{*path}', cors(corsOptions))


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API ENDPOINTS
app.get("/", (req, res) => res.send("API FOR FLIGHT IS WORKING"));
app.use("/api/booking", bookingRouter);
app.use('/api/flights', flightRoute)
app.use('/api/places', placeRoute)
app.use('/api/saved-flights', SavedFlightRoute)
app.use('/api/payment', paymentRoute)


const isDirectRun = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectRun && !process.env.VERCEL) {
    app.listen(port, () => console.log(`Server started on PORT: ${port}`));
}
export default app;
