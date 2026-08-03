import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {

    res.json({

        status: "WebBag Backend Running 🚀"

    });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`✅ WebBag Server Started On Port ${PORT}`);

});
