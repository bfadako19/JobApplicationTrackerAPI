import express from "express";

const app = express();

interface Application{
    id: number,
    company: string,
    position: string,
    status: string
}

const PORT = 3000;

let applications: Application[]=[];
let nexId = 1;

app.use(express.json());

app.get("/applications",(req,res) => {
    res.status(200).json({
        message: "Successfully retrieved applications",
        applications: applications
    });
});

app.post("/applications", (req,res) => {
    if(!req.body.company || !req.body.position || !req.body.status){
        return res.status(400).json ({
            message: "Company, Position, Status are Required"
        });
    }
    if(typeof req.body.company != "string" ||
       typeof req.body.position != "string" ||
       typeof req.body.status != "string"
    ){
        return res.status(400).json({
            message: "Company, Position, Status must be Strings"
        });
    }
    if(req.body.company.trim() === "" ||
        req.body.position.trim() === "" ||
       req.body.status.trim() === ""
    ){
        return res.status(400).json({
            message: "Fields cannot be Empty"
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

    res.status(201).json ({
        message: "Application Created Successfully",
        applications:application

    });

});

app.put("/applications/:id", (req,res) =>{
    const id = Number(req.params.id);

    const application = applications.find((app) => app.id===id);

    if(!application){
        return res.status(404).json({
            message: "Application Not Found"
        });
    }

    application.status = req.body.status;
    res.status(200).json({
        message: "Application Created Successfully",
        application: application
    })

});

app.delete("/applications/:id", (req,res) => {
    const id = Number(req.params.id);

    const index = applications.findIndex((app) => app.id === id);
    
    if(index === -1){
        return res.status(404).json({
            message: "Application Not Found" 
        })
    }
    applications.splice(index,1);

    res.status(200).json ({
        message: "Application Deleted Successfully"
    });


});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

