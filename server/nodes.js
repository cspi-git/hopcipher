"use strict";

// Dependencies
const express = require("express")

// Variables
const web = express()
const port = process.env.PORT || 8081

// Main
web.get("/", (req, res)=>{
    const key = req.query.k

    if(!key || key !== "famfkoJAFIOAi1258951895kfaokfjkaw0u12891") return res.redirect("404") // Be sure to change the key If you want to use this for production.

    res.json(["http://localhost:8082/", "http://localhost:8083/"])
})

web.use("*", (req, res)=>res.send("404"))

web.listen(port, ()=>console.log(`Server is running. Port: ${port}`))