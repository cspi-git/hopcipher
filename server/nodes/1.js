"use strict";

// Dependencies
const express = require("express")
const _ = require("lodash")

// Variables
const web = express()
const port = process.env.PORT || 8082

/// Configurations
// Express
web.use(express.json())

// Main
web.post("/e", (req, res)=>{
    var string = req.body.s
    string = _.reverse(string.split("")).join("")

    res.send(string)
})

web.post("/d", (req, res)=>{
    var string = req.body.s
    string = _.reverse(string.split("")).join("")

    res.send(string)
})


web.use("*", (req, res)=>res.send("404"))

web.listen(port, ()=>console.log(`Server is running. Port: ${port}`))