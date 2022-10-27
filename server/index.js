(async()=>{
    "use strict";

    // Dependencies
    const shuffleSeed = require("shuffle-seed")
    const request = require("request-async")
    const sovrinDID = require("sovrin-did")
    const express = require("express")
    const _ = require("lodash")
    const md5 = require("md5")
    
    // Variables
    const web = express()
    const port = process.env.PORT || 8080
    
    const sovrin = sovrinDID.gen()
    const nonce = sovrinDID.getNonce()
    const signKey = sovrin.secret.signKey
    const keyPair = sovrinDID.getKeyPairFromSignKey(signKey)

    const server = {
        masterKey: "A?FAWkaj12o5u12589la:AW{)@%(!fkjawf_---2o15-awfj09q251215", // Change it to any master password that you want. Max character is 56.
        maxNodesToUse: 3
    }

    var nodes = await request("http://localhost:8081?k=famfkoJAFIOAi1258951895kfaokfjkaw0u12891")
    nodes = JSON.parse(nodes.body).map((node)=>{
        return { url: node, id: md5(node).slice(0, 4) }
    })

    // Functions
    function onionEncrypt(string, password){
        return new Promise((resolve)=>{
            const ids = []
            var result;
            var times = 0

            async function encrypt(){
                if(times === server.maxNodesToUse){
                    console.log(ids)
                    console.log(result)
                    return resolve(`${result}:${ids}`)
                }

                const node = nodes[Math.floor(Math.random() * nodes.length)]

                var encrypted = await request.post(`${node.url}e`, {
                    headers: {
                        "content-type": "application/json"
                    },
                    body: JSON.stringify({ s: result ? result : string, p: password })
                })

                ids.push(node.id)
                result = encrypted.body
                times++
                encrypt()
            }

            encrypt()
        })
    }

    function onionDecrypt(string, password, ids){
        return new Promise((resolve)=>{
            var result;
            var times = 0

            async function decrypt(){
                if(times === server.maxNodesToUse) return resolve(result)

                const node = _.find(nodes, { id: ids[times] })

                var decrypted = await request.post(`${node.url}d`, {
                    headers: {
                        "content-type": "application/json"
                    },
                    body: JSON.stringify({ s: result ? result : string, p: password })
                })

                result = decrypted.body
                times++
                decrypt()
            }

            decrypt()
        })
    }
    
    /// Configurations
    // Express
    web.use(express.json())
    
    // Main
    web.get("/", (req, res)=>{
        res.send(keyPair.publicKey.toString())
    })
    
    web.post("/e", async(req, res)=>{
        var clientPublicKey = req.body.p
        var clientNonce = req.body.n
        var string = req.body.s
    
        clientPublicKey = Uint8Array.from(clientPublicKey.split(",").map(x=>parseInt(x,10)))
        clientNonce = Uint8Array.from(clientNonce.split(",").map(x=>parseInt(x,10)))
        string = Uint8Array.from(string.split(",").map(x=>parseInt(x,10)))
        string = sovrinDID.decryptMessage(string, clientNonce, sovrinDID.getSharedSecret(clientPublicKey, keyPair.secretKey)).toString()
        string = JSON.parse(string)
        string.s = shuffleSeed.shuffle(new Buffer.from(string.s, "utf8").toString("hex").split(""), server.masterKey).join("")

        var encrypted = await onionEncrypt(string.s, string.p)
        console.log("EE:",encrypted)
        
        res.json({
            p: keyPair.publicKey.toString(),
            n: nonce.toString(),
            c: sovrinDID.encryptMessage(encrypted, nonce, sovrinDID.getSharedSecret(clientPublicKey, keyPair.secretKey)).toString()
        })
    })

    web.post("/d", async(req, res)=>{
        var clientPublicKey = req.body.p
        var clientNonce = req.body.n
        var string = req.body.s
    
        clientPublicKey = Uint8Array.from(clientPublicKey.split(",").map(x=>parseInt(x,10)))
        clientNonce = Uint8Array.from(clientNonce.split(",").map(x=>parseInt(x,10)))
        string = Uint8Array.from(string.split(",").map(x=>parseInt(x,10)))
        string = sovrinDID.decryptMessage(string, clientNonce, sovrinDID.getSharedSecret(clientPublicKey, keyPair.secretKey)).toString()
        string = JSON.parse(string)

        console.log("S:",string)
        console.log("SO:",string.s.split(":")[0])
        var decrypted = await onionDecrypt(string.s.split(":")[0], string.p, string.s.split(":")[1].split(","))

        console.log("EB:", decrypted)
        decrypted = shuffleSeed.unshuffle(decrypted.split(""), server.masterKey).join("")
        decrypted = new Buffer.from(decrypted, "hex").toString("utf8")
        console.log("E:",decrypted)

        res.json({
            p: keyPair.publicKey.toString(),
            n: nonce.toString(),
            c: sovrinDID.encryptMessage(decrypted, nonce, sovrinDID.getSharedSecret(clientPublicKey, keyPair.secretKey)).toString()
        })
    })
    
    web.use("*", (req, res)=>res.send("404"))
    
    web.listen(port, ()=>console.log(`Server is running. Port: ${port}`))
})()