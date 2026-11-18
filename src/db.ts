import { Pool } from "pg";
import "dotenv/config";

export const pool = new Pool({
    user: "postgres",
    host: process.env.DB_HOST ||"localhost",
    database: "job_application_tracker",
    password: process.env.DB_PASSWORD,
    port: 5432
});
