import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import "dotenv/config";

interface AuthenticatedRequest extends Request {
    userId?: number;
}

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
}

export const authenticateToken = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Access token required"
        });
    }
    try {
    const decoded = jwt.verify(token, jwtSecret);
    if (typeof decoded === "string" || typeof decoded.userId !== "number") {
    return res.status(403).json({
        message: "Invalid token payload"
    });
}

req.userId = decoded.userId;
} catch (error) {
    return res.status(403).json({
        message: "Invalid or expired token"
    });
}
next();
};