import express from "express";

const app = express();
const PORT = 3000;

app.get("/",(req,res) => {
    res.send("Job Application API is running!");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

