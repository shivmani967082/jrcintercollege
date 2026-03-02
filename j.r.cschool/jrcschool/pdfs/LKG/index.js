const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Express Server Running Successfully ✅");
});

app.listen(3000, () => {
  console.log("Server Started on https://jrcintercollege.onrender.com");
});
