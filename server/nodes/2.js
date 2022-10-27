"use strict";

// Dependencies
const express = require("express")

// Variables
const web = express()
const port = process.env.PORT || 8083

/// Configurations
// Express
web.use(express.json())

// Main
web.post("/e", (req, res)=>{
    var string = req.body.s
    string = string.replace(/7/, "a")

    res.send(string)
})

web.post("/d", (req, res)=>{
    var string = req.body.s
    string = string.replace(/a/, "7")

    res.send(string)
})

web.use("*", (req, res)=>res.send("404"))

web.listen(port, ()=>console.log(`Server is running. Port: ${port}`))