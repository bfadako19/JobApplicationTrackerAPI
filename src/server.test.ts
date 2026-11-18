import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app, resetApplications, resetUsers } from "./server.js";
import jwt from "jsonwebtoken";

const getAuthToken = async () => {
    await request(app)
        .post("/auth/register")
        .send({
            email: "test@example.com",
            password: "password123"
        });

    const response = await request(app)
        .post("/auth/login")
        .send({
            email: "test@example.com",
            password: "password123"
        });

    return response.body.token;
};

beforeEach(async () => {
    await resetApplications();
    await resetUsers();
});

describe("GET/applications", () => {
    it("Should Return All Applications", async () => {
        const token = await getAuthToken();

        const response = await request(app)
            .get("/applications")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("applications");
        expect(response.body.applications).toEqual([]);
    });
    it("Should Filter Applications By Status", async () => {
        const token = await getAuthToken();
        await request(app)
            .post("/applications")
            .set("Authorization", `Bearer ${token}`)
            .send({
                company: "Google",
                position: "Software Engineer",
                status: "Interview"
            });

        await request(app)
            .post("/applications")
            .set("Authorization", `Bearer ${token}`)
            .send({
                company: "Amazon",
                position: "Developer",
                status: "Applied"
            });

        const response = await request(app)
            .get("/applications?status=Interview&page=1&limit=10")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.applications).toHaveLength(1);
        expect(response.body.applications[0].company).toBe("Google");
        expect(response.body.applications[0].status).toBe("Interview");
    });
    it("Should Not Allow One User To See Another User's Applications", async () => {
        const token1 = await getAuthToken();

        const created = await request(app)
            .post("/applications")
            .set("Authorization", `Bearer ${token1}`)
            .send({
                company: "Google",
                position: "Software Engineer",
                status: "Applied"
            });

        await request(app)
            .post("/auth/register")
            .send({
                email: "seconduser@example.com",
                password: "password123"
            });

        const login = await request(app)
            .post("/auth/login")
            .send({
                email: "seconduser@example.com",
                password: "password123"
            });

        const token2 = login.body.token;
        const response = await request(app)
            .get("/applications")
            .set("Authorization", `Bearer ${token2}`);

        expect(response.status).toBe(200);
        expect(response.body.applications).toHaveLength(0);
    });
    it("Should Reject Requests Without an Authentication Token", async () => {
    const response = await request(app)
        .get("/applications");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Access token required");

});
it("Should Reject Invalid Authentication Tokens", async () => {
    const response = await request(app)
        .get("/applications")
        .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Invalid or expired token");
});
it("Should Reject Expired Authentication Tokens", async () => {
    const token = jwt.sign(
        { userId: 1 },
        process.env.JWT_SECRET!,
        { expiresIn: "-1s" }
    );

    const response = await request(app)
        .get("/applications")
        .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Invalid or expired token");
});
});

describe("POST/application", () => {
    it("Should Create a New Application", async () => {
        const token = await getAuthToken();
        const response = await request(app).post("/applications")
            .set("Authorization", `Bearer ${token}`)
            .send({
                company: "Google",
                position: "Software Engineer",
                status: "Applied"
            });

        expect(response.status).toBe(201);
        expect(response.body.applications).toHaveProperty("id");
        expect(response.body.applications.company).toBe("Google");
        expect(response.body.applications.position).toBe("Software Engineer");
        expect(response.body.applications.status).toBe("Applied");

    });
    it("should reject an application with missing fields", async () => {
        const token = await getAuthToken();
        const response = await request(app)
            .post("/applications")
            .set("Authorization", `Bearer ${token}`)
            .send({
                company: "Google",
                position: "Software Engineer"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Company, Position, Status are Required");
    });
    it("should reject an invalid application status", async () => {
        const token = await getAuthToken();
        const response = await request(app)
            .post("/applications")
            .set("Authorization", `Bearer ${token}`)
            .send({
                company: "Google",
                position: "Software Engineer",
                status: "Pending"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Invalid Application Status");
    });
});

describe("PUT/applications/:id", () => {
    it("Should Update an Application's Status", async () => {
        const token = await getAuthToken();
        const created = await request(app)
            .post("/applications")
            .set("Authorization", `Bearer ${token}`)
            .send({
                company: "Google",
                position: "Software Engineer",
                status: "Applied"
            });

        const id = created.body.applications.id;

        const response = await request(app)
            .put(`/applications/${id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                status: "Interview"
            });

        expect(response.status).toBe(200);
        expect(response.body.application.status).toBe("Interview");
    });
    it("Should Reject an Invalid Application ID", async () => {
        const token = await getAuthToken();
        const response = await request(app)
            .put("/applications/abc")
            .set("Authorization", `Bearer ${token}`)
            .send({
                status: "Interview"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Invalid Application ID");
    });
    it("Should Return 404 When the Application Does Not Exist", async () => {
        const token = await getAuthToken();
        const response = await request(app)
            .put("/applications/999")
            .set("Authorization", `Bearer ${token}`)
            .send({
                status: "Interview"
            });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Application Not Found");
    });
    it("should reject an invalid application status", async () => {
        const token = await getAuthToken();
        const created = await request(app)
            .post("/applications")
            .set("Authorization", `Bearer ${token}`)
            .send({
                company: "Google",
                position: "Software Engineer",
                status: "Applied"
            });

        const id = created.body.applications.id;

        const response = await request(app)
            .put(`/applications/${id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                status: "Pending"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Invalid Application Status");
    });
    it("Should Not Allow One User To Update Another User's Application", async () => {
        const token1 = await getAuthToken();

        const created = await request(app)
            .post("/applications")
            .set("Authorization", `Bearer ${token1}`)
            .send({
                company: "Google",
                position: "Software Engineer",
                status: "Applied"
            }); const id = created.body.applications.id;

        await request(app)
            .post("/auth/register")
            .send({
                email: "seconduser@example.com",
                password: "password123"
            });

        const login = await request(app)
            .post("/auth/login")
            .send({
                email: "seconduser@example.com",
                password: "password123"
            });

        const token2 = login.body.token;
        const response = await request(app)
            .put(`/applications/${id}`)
            .set("Authorization", `Bearer ${token2}`)
            .send({
                status: "Interview"
            });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Application Not Found");
    });
});

describe("DELETE/applications/:id", () => {
    it("Should Delete an Application", async () => {
        const token = await getAuthToken();
        const created = await request(app)
            .post("/applications")
            .set("Authorization", `Bearer ${token}`)
            .send({
                company: "Google",
                position: "Software Engineer",
                status: "Applied"
            });

        const id = created.body.applications.id;

        const response = await request(app)
            .delete(`/applications/${id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Application Deleted Successfully");

        const applications = await request(app)
            .get("/applications")
            .set("Authorization", `Bearer ${token}`);

        expect(applications.body.applications).toHaveLength(0);
    });
    it("Should Reject an Invalid Application ID", async () => {
        const token = await getAuthToken();
        const response = await request(app)
            .delete("/applications/abc")
            .set("Authorization", `Bearer ${token}`);;

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Invalid Application ID");
    });
    it("Should Return 404 When the Application Does Not Exist", async () => {
        const token = await getAuthToken();
        const response = await request(app)
            .delete("/applications/999")
            .set("Authorization", `Bearer ${token}`);;

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Application Not Found");
    });
    it("Should Not Allow One User To Delete Another User's Application", async () => {
        const token1 = await getAuthToken();

        const created = await request(app)
            .post("/applications")
            .set("Authorization", `Bearer ${token1}`)
            .send({
                company: "Google",
                position: "Software Engineer",
                status: "Applied"
            });
        const id = created.body.applications.id;

        await request(app)
            .post("/auth/register")
            .send({
                email: "seconduser@example.com",
                password: "password123"
            });

        const login = await request(app)
            .post("/auth/login")
            .send({
                email: "seconduser@example.com",
                password: "password123"
            });

        const token2 = login.body.token;
        const response = await request(app)
            .delete(`/applications/${id}`)
            .set("Authorization", `Bearer ${token2}`);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Application Not Found");
    });
});

describe("POST /auth/register", () => {
    it("Should Register A New User", async () => {
        const response = await request(app)
            .post("/auth/register")
            .send({
                email: "test@example.com",
                password: "password123"
            });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe("User registered successfully");
        expect(response.body.user.email).toBe("test@example.com");
        expect(response.body.user).not.toHaveProperty("password");
        console.log("Registration response:", response.body);
    });
});
describe("POST /auth/login", () => {
    it("Should Login An Existing User", async () => {
        await request(app)
            .post("/auth/register")
            .send({
                email: "login@example.com",
                password: "password123"
            });

        const response = await request(app)
            .post("/auth/login")
            .send({
                email: "login@example.com",
                password: "password123"
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Login successful");
        expect(response.body.token).toBeDefined();
    });
});