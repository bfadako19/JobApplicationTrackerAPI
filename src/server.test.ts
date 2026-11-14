import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import {app, resetApplications} from "./server.js";

beforeEach(async () => {
    await resetApplications();
});

describe("GET/applications", () =>{
    it("Should Return All Applications",  async () =>{
        const response = await request(app).get("/applications");

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("applications");
        expect(response.body.applications).toEqual([]);
    });
});

describe("POST/application", () =>{
    it("Should Create a New Application", async () => {
        const response = await request(app).post("/applications").
        send({
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
    const response = await request(app)
        .post("/applications")
        .send({
            company: "Google",
            position: "Software Engineer"
        });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Company, Position, Status are Required");
});
it("should reject an invalid application status", async () => {
    const response = await request(app)
        .post("/applications")
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
    const created = await request(app)
        .post("/applications")
        .send({
            company: "Google",
            position: "Software Engineer",
            status: "Applied"
        });

    const id = created.body.applications.id;

    const response = await request(app)
        .put(`/applications/${id}`)
        .send({
            status: "Interview"
        });
    
    expect(response.status).toBe(200);
    expect(response.body.application.status).toBe("Interview");
});
it("Should Reject an Invalid Application ID", async () => {
    const response = await request(app)
        .put("/applications/abc")
        .send({
            status: "Interview"
        });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid Application ID");
});
it("Should Return 404 When the Application Does Not Exist", async () => {
    const response = await request(app)
        .put("/applications/999")
        .send({
            status: "Interview"
        });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Application Not Found");
});
it("should reject an invalid application status", async () => {
    const created = await request(app)
        .post("/applications")
        .send({
            company: "Google",
            position: "Software Engineer",
            status: "Applied"
        });

    const id = created.body.applications.id;

    const response = await request(app)
        .put(`/applications/${id}`)
        .send({
            status: "Pending"
        });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid Application Status");
});
});

describe("DELETE/applications/:id", () => {
    it("Should Delete an Application", async () => {
    const created = await request(app)
        .post("/applications")
        .send({
            company: "Google",
            position: "Software Engineer",
            status: "Applied"
        });

    const id = created.body.applications.id;

    const response = await request(app)
        .delete(`/applications/${id}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Application Deleted Successfully");

    const applications = await request(app).get("/applications");

    expect(applications.body.applications).toHaveLength(0);
});
it("Should Reject an Invalid Application ID", async () => {
    const response = await request(app)
        .delete("/applications/abc");

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid Application ID");
});
it("Should Return 404 When the Application Does Not Exist", async () => {
    const response = await request(app)
        .delete("/applications/999");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Application Not Found");
});
});