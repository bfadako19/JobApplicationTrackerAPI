import express from "express";

export const app = express();

interface Application {
    id: number,
    company: string,
    position: string,
    status: string
}

const validStatus = ["Applied", "Screening", "Assessment", "Interview", "Offer", "Rejected", "Withdrawn"];

let applications: Application[] = [];
let nexId = 1;

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

app.get("/applications", (req, res) => {
    res.status(200).json({
        message: "Successfully retrieved applications",
        applications: applications
    });
});

app.post("/applications", (req, res) => {
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


    const application: Application = {
        id: nexId,
        company: req.body.company,
        position: req.body.position,
        status: req.body.status
    };
    nexId++;

    applications.push(application)

    res.status(201).json({
        message: "Application Created Successfully",
        applications: application

    });

});

app.put("/applications/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid Application ID"
        });

    }

    const application = applications.find((app) => app.id === id);

    if (!application) {
        return res.status(404).json({
            message: "Application Not Found"
        });
    }
    if (!req.body || !req.body.status || typeof req.body.status != "string") {
        return res.status(400).json({
            message: "A Valid Status is Required"
        });
    }
    if (!validStatus.includes(req.body.status.trim())) {
        return res.status(400).json({
            message: "Invalid Application Status"
        });

    }

    application.status = req.body.status;
    res.status(200).json({
        message: "Application Created Successfully",
        application: application
    })

});

app.delete("/applications/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid Application ID"
        });
    }

    const index = applications.findIndex((app) => app.id === id);

    if (index === -1) {
        return res.status(404).json({
            message: "Application Not Found"
        })
    }
    applications.splice(index, 1);

    res.status(200).json({
        message: "Application Deleted Successfully"
    });


});


