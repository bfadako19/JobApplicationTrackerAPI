import express from "express";
import { pool } from "./db.js";
import { authRouter } from "./auth.js";
import { authenticateToken } from "./authMiddleware.js";

export const app = express();

app.use(express.json());
app.use("/auth", authRouter);

const validStatus = ["Applied", "Screening", "Assessment", "Interview", "Offer", "Rejected", "Withdrawn"];


export async function resetApplications(): Promise<void> {
    await pool.query("TRUNCATE TABLE applications RESTART IDENTITY");
}
export async function resetUsers(): Promise<void> {
    await pool.query("TRUNCATE TABLE users RESTART IDENTITY CASCADE");
}

app.use(express.json());

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && "body" in err) {
        return res.status(400).json({
            message: "Invalid JSON format"
        });
    }

    console.error(err);

    return res.status(500).json({
        message: "Internal Server Error"
    });
});
app.get("/applications", authenticateToken, async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const status = req.query.status;

    if (status !== undefined && typeof status !== "string") {
        return res.status(400).json({
            message: "Invalid status parameter"
        });
    }

    const filterStatus = typeof status === "string" ? status.trim() : undefined;

    if (filterStatus !== undefined && !validStatus.includes(filterStatus)) {
        return res.status(400).json({
            message: "Invalid application status"
        });
    }

    if (!Number.isInteger(page) || page < 1 ||
        !Number.isInteger(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({
            message: "Invalid pagination parameters. Page must be positive and limit must be between 1 and 100."
        });
    }
    const offset = (page - 1) * limit;
    const userId = (req as express.Request & { userId?: number }).userId;
    try {
        const result = filterStatus
            ? await pool.query(
                "SELECT * FROM applications WHERE user_id = $1 AND status = $2 ORDER BY id ASC LIMIT $3 OFFSET $4",
                [userId, filterStatus, limit, offset]
            )
            : await pool.query(
                "SELECT * FROM applications WHERE user_id = $1 ORDER BY id ASC LIMIT $2 OFFSET $3",
                [userId, limit, offset]
            );
        const countResult = filterStatus
            ? await pool.query(
                "SELECT COUNT(*) FROM applications WHERE user_id = $1 AND status = $2",
                [userId, filterStatus]
            )
            : await pool.query(
                "SELECT COUNT(*) FROM applications WHERE user_id = $1",
                [userId]
            );

        const totalApplications = Number(countResult.rows[0].count);
        const totalPages = Math.ceil(totalApplications / limit);

        res.status(200).json({
            message: "Successfully retrieved applications",
            page: page,
            limit: limit,
            totalApplications: totalApplications,
            totalPages: totalPages,
            applications: result.rows
        });
    } catch (error) {
        console.error("Error retrieving applications:", error);

        res.status(500).json({
            message: "Internal Server Error"
        });
    }
});

app.post("/applications", authenticateToken, async (req, res) => {
    if (!req.body || !req.body.company || !req.body.position || !req.body.status) {
        return res.status(400).json({
            message: "Company, Position, Status are Required"
        });
    }
    if (typeof req.body.company != "string" ||
        typeof req.body.position != "string" ||
        typeof req.body.status != "string"
    ) {
        return res.status(400).json({
            message: "Company, Position, Status must be Strings"
        });
    }
    if (req.body.company.trim() === "" ||
        req.body.position.trim() === "" ||
        req.body.status.trim() === ""
    ) {
        return res.status(400).json({
            message: "Fields cannot be Empty"
        });
    }
    if (!validStatus.includes(req.body.status)) {
        return res.status(400).json({
            message: "Invalid Application Status"
        });

    }

    const userId = (req as express.Request & { userId?: number }).userId;
    try {
        const result = await pool.query(
            "INSERT INTO applications (company, position, status, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
            [req.body.company, req.body.position, req.body.status, userId]
        );

        res.status(201).json({
            message: "Application Created Successfully",
            applications: result.rows[0]
        });
    } catch (error) {
        console.error("Error creating application:", error);

        res.status(500).json({
            message: "Internal Server Error"
        });
    }

});

app.put("/applications/:id", authenticateToken, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid Application ID"
        });
    }

    if (!req.body || !req.body.status || typeof req.body.status !== "string") {
        return res.status(400).json({
            message: "A Valid Status is Required"
        });
    }

    if (!validStatus.includes(req.body.status.trim())) {
        return res.status(400).json({
            message: "Invalid Application Status"
        });
    }
    const userId = (req as express.Request & { userId?: number }).userId;
    try {
        const result = await pool.query(
            "UPDATE applications SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
            [req.body.status.trim(), id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Application Not Found"
            });
        }

        res.status(200).json({
            message: "Application Updated Successfully",
            application: result.rows[0]
        });
    } catch (error) {
        console.error("Error updating application:", error);

        res.status(500).json({
            message: "Internal Server Error"
        });
    }
});

app.delete("/applications/:id", authenticateToken, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid Application ID"
        });
    }
    const userId = (req as express.Request & { userId?: number }).userId;
    try {
        const result = await pool.query(
            "DELETE FROM applications WHERE id = $1 AND user_id = $2 RETURNING *",
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Application Not Found"
            });
        }

        res.status(200).json({
            message: "Application Deleted Successfully"
        });
    } catch (error) {
        console.error("Error deleting application:", error);

        res.status(500).json({
            message: "Internal Server Error"
        });
    }
});


