/* GAME FEATURES - MODIFY AS WISH*/
var portServer = 4445, //port used

    bulletLife = 0, // Bullet life expectency

    lengthMapX = 5000,//Width map
    lengthMapY = 5000,//Height map

    posBaseEmpireX = 1250,//Empire spawn x
    posBaseEmpireY = 1250,//Empire spawn y

    posBaseRepublicX = 3850,//Republic spawn x
    posBaseRepublicY = 1250,//Republic spawn y

    posBaseDroidX = 1250,//Federation spawn x
    posBaseDroidY = 3850,//Federation spawn y

    posBaseRebelX = 3850,//Rebels spawn x
    posBaseRebelY = 3850,//Rebels spawn y

    nbrAsteroids = 30,//number of asteroids

    colorEmpire = "#fc0000",//Empire color
    colorRepublic = "#6200fe",//Republic color
    colorDroid = "#ffa500",//Droid color
    colorRebel = "#00fe00";//Synchronisation rate with server




/****** SOMMARY ******/
/*
Use Ctrl + F to find the function or elements

#01 : Librairies used
#02 : Constructors
#03 : Creation of game's elements
#04 : When someone is connecting to the server
#05 : Local data
#06 : Connection trough guest
#07 : Registration
#08 : Connection trough FFC
#09 : Game's events
#10 : When a player is killed
#11 : When player is disconnected
#12 : Chat
#13 : Refresh data from player to server
*/


//#01
/* LIBRAIRIES */
var express = require('express'), //librairie for make path easier
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    ent = require('ent'), // Disable HTML caracters (equal htmlentities in PHP)
    fs = require('fs');

/* SERVER CONFIG */
app.use(express.static(__dirname + '/public_html'));//all the client part here



/* DO NOT TOUCH */
var myServer = {
    port : portServer,//hearing port
    listPlayers : [],
    game : {
        spaceElements : [],
        explosions : [],
        score : [0,0,0,0]
    }
};


//#02
/****** CONSTRUCTORS ******/
// CLIENTS
function Client(pseudo, team, email){
    this.ID = myServer.listPlayers.length,
    this.pseudo = pseudo,
    this.email = email || "",
    this.team = team,
    this.CODE = codeFFC(),
    this.socket = 0;
    myServer.listPlayers.push(this);
}

/* FOUR FACTION UNIQUE CODE*/
function codeFFC(){
    var ffcDate = new Date();
    var ffcCode = "";
    var components = [
        ffcDate.getYear(),
        ffcDate.getMonth(),
        ffcDate.getDate(),
        ffcDate.getHours(),
        ffcDate.getMinutes(),
        ffcDate.getSeconds(),
        ffcDate.getMilliseconds()
    ];
    for(var i=0; i<components.length; i++){
        ffcCode += components[i].toString(16); //convert in hexa
    }
    return ffcCode;
}
//spaceShip's constructor
function spaceElement(type, team, ID){
    this.ID = ID || 0,
    this.team = team || 0,
    this.x = 0,
    this.y = 0,
    this.a = 0,
    this.c = "white",
    this.bullets = [],
    this.reactor = [],
    this.type = type // Fighter - Asteroid - Mothership
    if(this.team==1){
        this.a = 0.8;
        this.c = colorEmpire;
        this.x = posBaseEmpireX;
        this.y = posBaseEmpireY;
    }
    if(this.team==2){
        this.a = 2.1;
        this.c = colorRepublic;
        this.x = posBaseRepublicX;
        this.y = posBaseRepublicY;
    }
    if(this.team==3){
        this.a = 5.3;
        this.c = colorDroid;
        this.x = posBaseDroidX;
        this.y = posBaseDroidY;
    }
    if(this.team==4){
        this.a = 3.9;
        this.c = colorRebel;
        this.x = posBaseRebelX;
        this.y = posBaseRebelX;
    }
    myServer.game.spaceElements.push(this);
}




//#03
/****** CREATION OF GAMES ELEMENTS ******/
//Creates natura (Admin) and homes bases
var Admin = new Client("Admin", 0);
var Empire = new Client("Empire Cruiser", 1);
var Republic = new Client("Republic Cruiser", 2);
var Federation = new Client("Federation Cruiser", 3);
var Rebel = new Client("Rebel Cruiser", 4);
//Creation of asteroids
for(var i=0;i<nbrAsteroids;i++){
    if(i==1){}
    else if(i==2){
        var asteroid = new  spaceElement("Asteroid", 0, -i);
        asteroid.x = Math.floor((Math.random() * lengthMapX));
        asteroid.y = Math.floor((Math.random() * lengthMapX));
        asteroid.a = 0;
    }
    else{
        var asteroid = new  spaceElement("Asteroid", 0, -i);
        asteroid.x = Math.floor((Math.random() * lengthMapX));
        asteroid.y = Math.floor((Math.random() * lengthMapX));
        asteroid.a = Math.floor(Math.random() * 360);
    }
}
//Creation of mothership
var motherShipEmpire = new spaceElement("Mothership", 1, -1);
var motherShipEmpire = new spaceElement("Mothership", 1, -5);
var motherShipRepublic = new spaceElement("Mothership", 2, -2);
var motherShipDroid = new spaceElement("Mothership", 3, -3);
var motherShipRebel = new spaceElement("Mothership", 4, -4);






//#04
/* WHEN SOMEONE IS CONNECTING TO THE SERVER */
io.sockets.on('connection', function (socket) {
    
    //#05
    // Stock data into a local part of the server
    var local = {
        pseudo : "",
        ID : -1,
        CODE : "",
        team : 0,
        x : 0,
        y : 0,
        a : 0
    }
    
    //#06
    /* CONNECTION TROUGH GUEST */
    //Give to player a new account as guest
    socket.on("hereIAm", function(team){
        local.pseudo = "GUEST_" +  myServer.listPlayers.length;
        socket.join("General");
        var guest = new Client(local.pseudo, team);
        local.team = team;
        local.ID = guest.ID;
        if(local.team==1) socket.join("teamA");
        else if(local.team==2) socket.join("teamB");
        else if(local.team==3) socket.join("teamC");
        else if(local.team==4) socket.join("teamD");
        socket.emit("incomingPlayer", guest, myServer.game.score);
    });
    
    //#07
    /* REGISTRATION */
    //Verify if the pseudo is already used
    //If not, modify the guest account and give the 4F code
    socket.on("Registration", function(pseudo){
        var errorPseudo = false;
        for(var i=0; i<myServer.listPlayers.length; i++){
            if(pseudo == myServer.listPlayers[i].pseudo){
                errorPseudo = true;
            }
        }
        if(errorPseudo) socket.emit("Error01", true);
        else{
            for(var j=0; j<myServer.listPlayers.length; j++){
                if(myServer.listPlayers[j].ID==local.ID){
                    local.pseudo = myServer.listPlayers[j].pseudo;
                    
                    myServer.listPlayers[j].pseudo = pseudo;
                    myServer.listPlayers[j].team = local.team;
                    local.pseudo = pseudo;
                    local.CODE = myServer.listPlayers[j].CODE;
                }
            }
            socket.emit("sendFFC", {FFC:local.CODE, pseudo:local.pseudo});
        }
    });

    //#08
    /* CONNECTION TROUGH FFC */
    //Search if the code is linked with an account
    socket.on("connectFFC", function(FFC){
        for(var i=0; i<myServer.listPlayers.length; i++){
            if(FFC == myServer.listPlayers[i].CODE){
                local.pseudo = myServer.listPlayers[i].pseudo;
                local.ID = myServer.listPlayers[i].ID;
                local.team = myServer.listPlayers[i].team;
                socket.emit("foundYou", local);
                socket.join("General");
                socket.leave("teamA");
                socket.leave("teamB");
                socket.leave("teamC");
                socket.leave("teamD");
                if(local.team==1) socket.join("teamA");
                else if(local.team==2) socket.join("teamB");
                else if(local.team==3) socket.join("teamC");
                else if(local.team==4) socket.join("teamD");
            }
        }
    });
    //#09
    //NEW SPACE ELEMENT
    //Add space element to data
    socket.on("newSpaceElement", function(element){
        myServer.game.spaceElements.push(element);
        io.to("General").emit("newData", myServer.game.spaceElements);
    });
    //NEW EXPLOSION
    //Add explosion to data
    socket.on("newExplosion", function(explo){
        myServer.game.explosions.push(explo);
        io.to("General").emit("explosion", myServer.game.explosions);
    });
    //EXPLOSION DONE
    //Remove explosion from data
    socket.on("explosionDone", function(explo){
        myServer.game.explosions = explo;
        io.to("General").emit("explosion", myServer.game.explosions);
    });
    //DESTROY SHIP
    //Remove ship from data
    socket.on("destroyBefore", function(){
        for(var i=0; i<myServer.game.spaceElements.length;i++){
            if(myServer.game.spaceElements[i].ID==local.ID){
                myServer.game.spaceElements.splice(i,1);
            }
        }
    });
    
    //#10
    //KILL PLAYER
    //Give score
    socket.on("Kill", function(data){
        myServer.game.score[data.kTeam-1]++;
        data.score = myServer.game.score;
        io.to("General").emit("Score", data);
    });
    
    //#11
    //ON DISCONNECT
    socket.on('disconnect', function() {
        socket.leave("General");
        for(var i=0; i<myServer.game.spaceElements.length;i++){
            if(myServer.game.spaceElements[i].ID==local.ID){
                myServer.game.spaceElements.splice(i,1);
            }
        }
    });
    
    
    //#12
    //CHAT
    socket.on("newMsg", function(data){
        data.message = ent.encode(data.message);
        if(data.type == 0) io.to("General").emit("incomingMsg", data);
        else if(data.type==1) io.to("teamA").emit("incomingMsg", data);
        else if(data.type==2) io.to("teamB").emit("incomingMsg", data);
        else if(data.type==3) io.to("teamC").emit("incomingMsg", data);
        else if(data.team==4) io.to("teamD").emit("incomingMsg", data);
    });
    
    //#13
    //Synchro data with player's data
    var tempo = [];
    socket.on("newPos", function(pos){
        tempo = []
        for(var i = 0; i<myServer.game.spaceElements.length;i++){
            if(i>0 && i<nbrAsteroids-1){
                myServer.game.spaceElements[i].x += Math.cos(myServer.game.spaceElements[i].a);
                myServer.game.spaceElements[i].y += Math.sin(myServer.game.spaceElements[i].a);
                if(myServer.game.spaceElements[i].x<0) myServer.game.spaceElements[i].x = lengthMapX-1;
                if(myServer.game.spaceElements[i].x>lengthMapX) myServer.game.spaceElements[i].x = 0;
                if(myServer.game.spaceElements[i].y<0) myServer.game.spaceElements[i].y = lengthMapY-1;
                if(myServer.game.spaceElements[i].y>lengthMapY) myServer.game.spaceElements[i].y = 0;
            }
            if(myServer.game.spaceElements[i].ID==pos.ID){
                myServer.game.spaceElements[i].pseudo = pos.newPseudo;
                myServer.game.spaceElements[i].x = pos.newX;
                myServer.game.spaceElements[i].y = pos.newY;
                myServer.game.spaceElements[i].a = pos.newA;
                myServer.game.spaceElements[i].v = pos.newV;
                myServer.game.spaceElements[i].td = pos.newTD;
                myServer.game.spaceElements[i].tg = pos.newTG;
                myServer.game.spaceElements[i].immunite = pos.newIMMU;
                myServer.game.spaceElements[i].bullets = pos.newBullets;
                myServer.game.spaceElements[i].reactor = pos.newReactor;
            }
            var data = {
                ID : myServer.game.spaceElements[i].ID,
                pseudo : myServer.game.spaceElements[i].pseudo,
                x : myServer.game.spaceElements[i].x,
                y : myServer.game.spaceElements[i].y,
                c : myServer.game.spaceElements[i].c,
                a : myServer.game.spaceElements[i].a,
                v : myServer.game.spaceElements[i].v,
                tg : myServer.game.spaceElements[i].tg,
                td : myServer.game.spaceElements[i].td,
                immunite : myServer.game.spaceElements[i].immunite,
                type : myServer.game.spaceElements[i].type,
                team : myServer.game.spaceElements[i].team,
                bullets : myServer.game.spaceElements[i].bullets,
                reactor : myServer.game.spaceElements[i].reactor
            }
            tempo.push(data);
            
        }
    });
    socket.on("askForRefresh", function(){
        socket.emit("newData", tempo);
    });
});

server.listen(myServer.port);
//console.log("Serveur ON (http://141.138.157.108:" + myServer.port + ")");
console.log("Serveur ON (localhost:" + myServer.port + ")");