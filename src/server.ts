import express from "express";
import { pool } from "./db.js";

export const app = express();

const validStatus = ["Applied", "Screening", "Assessment", "Interview", "Offer", "Rejected", "Withdrawn"];


export async function resetApplications(): Promise<void> {
    await pool.query("TRUNCATE TABLE applications RESTART IDENTITY");
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
app.get("/applications", async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    if (!Number.isInteger(page) || page < 1 ||
        !Number.isInteger(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({
            message: "Invalid pagination parameters. Page must be positive and limit must be between 1 and 100."
        });
    }
    const offset = (page - 1) * limit;
    try {
        const result = await pool.query(
            "SELECT * FROM applications ORDER BY id ASC LIMIT $1 OFFSET $2",
            [limit, offset]
        );
        const countResult = await pool.query(
            "SELECT COUNT(*) FROM applications"
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

app.post("/applications", async (req, res) => {
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


    try {
        const result = await pool.query(
            "INSERT INTO applications (company, position, status) VALUES ($1, $2, $3) RETURNING *",
            [req.body.company, req.body.position, req.body.status]
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

app.put("/applications/:id", async (req, res) => {
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

    try {
        const result = await pool.query(
            "UPDATE applications SET status = $1 WHERE id = $2 RETURNING *",
            [req.body.status.trim(), id]
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

app.delete("/applications/:id", async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid Application ID"
        });
    }

    try {
        const result = await pool.query(
            "DELETE FROM applications WHERE id = $1 RETURNING *",
            [id]
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


