(async()=>{
    "use strict";

    // Dependencies
    const request = require("request-async")
    const sovrinDID = require("sovrin-did")

    // Variables
    const sovrin = sovrinDID.gen()
    const nonce = sovrinDID.getNonce()
    const signKey = sovrin.secret.signKey
    const keyPair = sovrinDID.getKeyPairFromSignKey(signKey)

    // Main
    var serverPublicKey = await request("http://localhost:8080/")
    serverPublicKey = Uint8Array.from(serverPublicKey.body.split(",").map(x=>parseInt(x,10)))

    // Encrypt
    var response = await request.post("http://localhost:8080/e", {
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify({ p: keyPair.publicKey.toString(), n: nonce.toString(), s: sovrinDID.encryptMessage(JSON.stringify({ s: "secret", p: "password" }), nonce, sovrinDID.getSharedSecret(serverPublicKey, keyPair.secretKey)).toString() })
    })

    response = JSON.parse(response.body)
    response.p = Uint8Array.from(response.p.split(",").map(x=>parseInt(x,10)))
    response.n = Uint8Array.from(response.n.split(",").map(x=>parseInt(x,10)))
    response.c = Uint8Array.from(response.c.split(",").map(x=>parseInt(x,10)))

    const a = sovrinDID.decryptMessage(response.c, response.n, sovrinDID.getSharedSecret(response.p, keyPair.secretKey)).toString()
    
    console.log(a)

    // Decrypt
    response = await request.post("http://localhost:8080/d", {
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify({ p: keyPair.publicKey.toString(), n: nonce.toString(), s: sovrinDID.encryptMessage(JSON.stringify({ s: a, p: "password" }), nonce, sovrinDID.getSharedSecret(serverPublicKey, keyPair.secretKey)).toString() })
    })

    response = JSON.parse(response.body)
    response.p = Uint8Array.from(response.p.split(",").map(x=>parseInt(x,10)))
    response.n = Uint8Array.from(response.n.split(",").map(x=>parseInt(x,10)))
    response.c = Uint8Array.from(response.c.split(",").map(x=>parseInt(x,10)))
    
    console.log(sovrinDID.decryptMessage(response.c, response.n, sovrinDID.getSharedSecret(response.p, keyPair.secretKey)).toString())
})()