const app = require("./app");
const { connectDatabase } = require("./config/database");
// const port = process.env.port

connectDatabase();

app.listen(process.env.PORT, () => {
    console.log(`server is running on port ${process.env.PORT}`)
});

