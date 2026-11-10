import {app} from "./server.js";

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server Running on http://localhost:${PORT}`)
})