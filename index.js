import express from 'express';
import dotenv from 'dotenv';
import connectDb from './db.js';
import productRouter from './routes/productRoutes.js';
import userRouter from './routes/userRoutes.js';
import cookieParser from 'cookie-parser';
import orderRouter from './routes/orderRoutes.js';
import { isAuth } from './middleware/auth.js';
import cloudinary from 'cloudinary';
import cors from 'cors';
import fileUpload from 'express-fileupload';

dotenv.config();

// variables
const app = express();
const port = process.env.PORT || 8000;
const mongoUrl = process.env.MONGO_URL;

// cloudinary
cloudinary.config({
    cloud_name: process.env.CN_CLOUD_NAME,
    api_key: process.env.CN_API_KEY,
    api_secret: process.env.CN_API_SECRET,
    secure: true,
})
// middlewares
app.use(cors({
    origin: ["https://prokart-seven.vercel.app", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    exposedHeaders: ["set-cookie"],
    credentials: true
}));

app.use(express.json());
app.use(fileUpload({ useTempFiles: true }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
    res.send('hii');
});

//routes
app.use('/product', productRouter);
app.use('/user', userRouter);
app.use('/order', isAuth, orderRouter);

// db connect
connectDb(mongoUrl);
//listening
app.listen(port, () => console.log('Server running on port:', port));
