import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "./db.js";
import "dotenv/config";


export const authRouter = express.Router();

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
}

authRouter.post("/register", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }
    if (typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({
            message: "Invalid email address"
        });
    }
    if (typeof password !== "string" || password.length < 8) {
        return res.status(400).json({
            message: "Password must be at least 8 characters"
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Password hashed successfully");

        console.log("Attempting to insert user:", email);
        const result = await pool.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
            [email, hashedPassword]
        );

        return res.status(201).json({
            message: "User registered successfully",
            user: result.rows[0]
        });
    } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : String(error)
    });
}
});
authRouter.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }
    if (typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({
        message: "Invalid email address"
    });
}
if (typeof password !== "string") {
    return res.status(400).json({
        message: "Invalid password"
    });
}
try {
    const result = await pool.query(
        "SELECT id, email, password FROM users WHERE email = $1",
        [email]
    );
    if (result.rows.length === 0) {
    return res.status(401).json({
        message: "Invalid email or password"
    });
}
const user = result.rows[0];

const passwordMatch = await bcrypt.compare(password, user.password);

if (!passwordMatch) {
    return res.status(401).json({
        message: "Invalid email or password"
    });
}
const token = jwt.sign(
    { userId: user.id },
    jwtSecret,
    { expiresIn: "1h" }
);
return res.status(200).json({
    message: "Login successful",
    token
});
} catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
        message: "Internal Server Error"
    });
}

});