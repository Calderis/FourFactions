//#01
/* CONNECTION TO socket.io */
//var socket = io.connect('http://141.138.157.108:4445');//Online
var socket = io.connect('http://localhost:4445');//Offline

/* GAME FEATURES - MODIFIED TO SERVER TOO */
var bulletLife = 0, // Bullet life expectency

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

    shotRate = 1,//Time between 2 shot
    laserSpeed = 30,//Laser speed
    shipSpeed = 15,//Ship speed
    lifeShield = 90,//Shield time

    nbrAsteroids = 30,//number of asteroids

    colorEmpire = "#fc0000",//Empire color
    colorRepublic = "#6200fe",//Republic color
    colorDroid = "#ffa500",//Droid color
    colorRebel = "#00fe00",//Rebels color

    fps = 24,//frame per seconds
    syncServerTime = 3;//Synchronisation rate with server


/****** CODE SOMMARY ******/
/*
Use Ctrl + F to find the function or elements

#01 : Connection to socket
#02 : Disable autocomplete to input
#03 : Blocks HTML
#04 : Connection to the server
#05 : Registered pseudo to server
#06 : Find his account thanks to 4Factions's code
#07 : Constructors
#08 : Player movements : keyboard detector
#09 : Show scores
#10 : Chat
#11 : Sound gestion
#12 : Balistic and previsionnal calcul
#13 : Synch game data with server
#14 : Draw game
#15 : Game loop
*/




/* GAME SET - PLEASE DO NOT TOUCH */
var allow = true;//allow player to die
var listElements = [];// List of all element of the map

//#02
//FORBID PRE-SELECTION OF INPUT - DO NOT PROPOSE ANY SUGGEST
window.onload = function() {
	for(var i = 0, l = document.getElementsByTagName('input').length; i < l; i++) {
		if(document.getElementsByTagName('input').item(i).type == 'text') {
			document.getElementsByTagName('input').item(i).setAttribute('autocomplete', 'off');
		};
	};
};

//#03
/* STOCK HTML BLOCK */
var Game = document.getElementById("Game"),
    matchPoint = document.getElementById("matchPoint"),
    killList = document.getElementById("killList"),
    teamSelect = document.getElementById("teamSelect"),
    login = document.getElementById("login"),
    loginUl = document.getElementById("loginUl"),
    canvas = document.getElementById("canvas"),
    battle = document.getElementById("battle"),
    boutonPseudo = document.getElementById("boutonPseudo"),
    boutonPseudoB = document.getElementById("boutonPseudoB"),
    FFCODE = document.getElementById("FFCODE"),
    Connection = document.getElementById("Connection"),
    message = document.getElementById("message"),
    zoneChat = document.getElementById("zoneChat"),
    bmute = document.getElementById("mute"),
    sound = document.getElementById("sound");
//Canvas
var canvas = document.getElementById("canvas"),
	context = canvas.getContext('2d');
//Canvas on full screen
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;

//DISPLAY BLOCK SHOW/HIDE
function show(block){block.style.display = "block";}
function hide(block){block.style.display = "none";}

//FIRST STATE : HIDE THE BATTLE AND YHE LOGIN FORM
hide(battle); //hide battle
hide(login); //hide login


//#04
/****** CONNECTION TO THE SERVER ******/
//PHASE 01 : SOMEONE IS CONNECTING TO THE SERVER
//The client must choose between one of the four factions
function selectTeam(num){
    player.team = num;
    socket.emit("hereIAm", player.team);
    hide(teamSelect);
    show(battle);
    if(num==1){
        boutonPseudo.classList.add("bEmpire");
        boutonPseudoB.classList.add("bEmpire");
        loginUl.classList.add("bEmpire");
    }
    else if(num==2){
        boutonPseudo.classList.add("bRepublic");
        boutonPseudoB.classList.add("bRepublic");
        loginUl.classList.add("bRepublic");
    }
    else if(num==3){
        boutonPseudo.classList.add("bDroid");
        boutonPseudoB.classList.add("bDroid");
        loginUl.classList.add("bDroid");
    }
    else if(num==4){
        boutonPseudo.classList.add("bRebels");
        boutonPseudoB.classList.add("bRebels");
        loginUl.classList.add("bRebels");
    }
}
//Connection as a guest
socket.on("incomingPlayer", function(guest, score){
    player.pseudo = guest.pseudo;
    player.ID = guest.ID;
    document.getElementById("scoreEmpire").innerHTML = score[0];
    document.getElementById("scoreRepublic").innerHTML = score[1];
    document.getElementById("scoreDroid").innerHTML = score[2];
    document.getElementById("scoreRebel").innerHTML = score[3];
    /* Player's ship's creation */
    player.ship = new spaceElement("Fighter", player.team, player.ID);
});


//#05
//PHASE 02 : CLIENT COULD REGISTERED IS OWN PSEUDO
function wantPseudo(){
    show(login);
}
function Register(form){
    if(form.pseudo.value!=""){
        socket.emit('Registration', form.pseudo.value);
    }
    form.pseudo.value = "";
}
//REGISTRATION'S CONFIRMATION
socket.on("sendFFC", function(data){
    player.pseudo = data.pseudo;
    FFCODE.innerHTML = "(FF Code : " + data.FFC + ")";
    hide(boutonPseudo);
    hide(boutonPseudoB);
    hide(login);
    hide(Connection);
    player.die();
});
//ERROR 01 : PSEUDO ALREADY EXIST
socket.on("Error01", function(){ //There are no other error but at the begining, I anticipated the fact that there could have other ones
    document.getElementById("error01").innerHTML = "This pseudo already exist, please choose an other one";
});

//#06
//PHASE 03 : CLIENT QUIT THE GAME BUT COME BACK AFTER
//USER GOT A FFC
function connection(form){
    socket.emit("connectFFC", form.ffc.value);
    form.ffc.value = "";
}
//CONNECTION'S CONFIRMATION
socket.on("foundYou", function(perso){
    player.pseudo = perso.pseudo;
    player.ID = perso.ID;
    player.team = perso.team;
    hide(boutonPseudo);
    hide(boutonPseudoB);
    hide(login);
    player.die();
});








//#07
/****** CONSTRUCTORS ******/
//LOCAL PLAYER
var player = {
    ID : -1000,
    pseudo : "Guest",
    team : 0,
    ship : "",
    gotAShip : false,
    explosion : "",
    bullet : [],
    reactor : [],
    die : function () {
        allow = false;
        var explosion = new exploZ();
        socket.emit("newExplosion", explosion);
        socket.emit("destroyBefore", true);
        setTimeout(function(){ player.ship = new spaceElement("Fighter", player.team, player.ID)},500);
        newPos();
    }
}
//SPACE ELEMENT CONSTRUCTOR FIGHTER - MOTHERSHIP - ASTEROID
function spaceElement(type, team, ID){
    socket.emit("destroyBefore", true);
    player.gotAShip = true;
    this.ID = ID || 0,
    this.team = team || 0,
    this.x = 0,
    this.y = 0,
    this.a = 0,
    this.td = false,
    this.tg = false,
    this.v = 0,
    this.immunite = lifeShield,
    this.pseudo = player.pseudo,
    this.c = "white",
    this.bullets = [],
    this.reactor = [],
    this.type = type, // Fighter - Asteroid - Mothership
    this.moveRight = function(){
        this.a += 0.1;
        this.td = true;
        estimation(this.ID,this.x,this.y,this.a,this.v,this.bullets,this.tg,this.td)
    },
    this.moveLeft = function(){
        this.a -= 0.1;
        this.tg = true;
        estimation(this.ID,this.x,this.y,this.a,this.v,this.bullets,this.tg,this.td)
    },
    this.moveUp = function(){
        this.v += 1.5;
        this.tg=false;
        this.td=false;
        for(var i=0; i<Math.abs(Math.random()*5); i++){
            var propulsion = {
                x : this.x,
                y : this.y,
                a : (Math.random()*8) + this.a,
                r : 5
            }
            }
        this.reactor.push(propulsion);
        if(this.v>shipSpeed) this.v = shipSpeed;
        estimation(this.ID,this.x,this.y,this.a,this.v,this.bullets,this.tg,this.td)
    },
    this.shot = function(){
        if(shotRate<0){
            shotRate = 1;
            var bullet = {
                owner: player.pseudo || "Personne",
                x: this.x,
                y: this.y,
                c: this.c,
                a: this.a,
                team : this.team,
                life : 30
            }
            this.bullets.push(bullet);
            newPos();
            estimation(this.ID,this.x,this.y,this.a,this.v,this.bullets,this.tg,this.td)
        }
        else shotRate--;
    }
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
    allow = true;
    socket.emit("newSpaceElement", this);
}
//EXPLOSIONS
var explosions = [];
socket.on("explosion", function(newExplosions){
    explosions = newExplosions;
});
function exploZ(){
    this.debris = [];
    this.team = player.team;
    for (var i = 0; i < 20; i++) {
        var debri = {
            x : player.ship.x,
            y : player.ship.y,
            c: player.ship.c,
            radius : 2.5,
            vx : (Math.random()*5)-2.5,
            vy : (Math.random()*5)-2.5 
        }
        this.debris.push(debri);
    }
}








//#08
/* PLAYER MOVEMENTS - KEYBOARD DETECTOR */
var Key = {
  _pressed: {},
  
  isDown: function(keyCode) {
    return this._pressed[keyCode];
  },
  
  onKeydown: function(event) {
    this._pressed[event.keyCode] = true;
  },
  
  onKeyup: function(event) {
    delete this._pressed[event.keyCode];
      player.ship.td = false;
      player.ship.tg = false;
  }
};
spaceElement.prototype.update = function() {
    if(allow){
        if (Key.isDown(90)) this.moveUp();      //Z
        if (Key.isDown(38)) this.moveUp();      //↑

        if (Key.isDown(81)) this.moveLeft();    //Q
        if (Key.isDown(37)) this.moveLeft();    //←

        if (Key.isDown(68)) this.moveRight();   //D
        if (Key.isDown(39)) this.moveRight();   //→

        if (Key.isDown(32)) this.shot();        //SPACE
    }
};
/* keyboard listener */
window.addEventListener('keyup', function(event) { Key.onKeyup(event); }, false);
window.addEventListener('keydown', function(event) { Key.onKeydown(event); }, false);





//#09
//SCORE
socket.on("Score", function(data){
    document.getElementById("scoreEmpire").innerHTML = data.score[0];
    document.getElementById("scoreRepublic").innerHTML = data.score[1];
    document.getElementById("scoreDroid").innerHTML = data.score[2];
    document.getElementById("scoreRebel").innerHTML = data.score[3];
    killList.innerHTML = "<span class='team" + data.kTeam + "'>" + data.killer + "</span><span class='kill'></span><span class='team" + data.vTeam + "'>" + data.victim + "</span><br>" + killList.innerHTML;
});






//#10
/*********** CHAT ***********/
function sendMessage(){
    var Message = message.value;
    if(Message!=""){
        var type = 0;
        if(Message.substring(0,2)=="/t"){
            type = player.team;
            Message = Message.substring(2,Message.length);
        }
        socket.emit("newMsg", {pseudo : player.pseudo, message : Message, team: player.team, type : type});
        message.value = ""; 
    }
}
//validate msg with enter without refresh the page
function validateMsg(e){
    var key=e.keyCode || e.which;
    if (key==13){
     sendMessage();
    }
}
//When you received a message
socket.on("incomingMsg", function(data){
    var p = document.createElement("p");
    p.className = "team" + data.type;
    p.innerHTML = "<span class='team" + data.team + "'>" + data.pseudo + "</span> : " + data.message;
    zoneChat.insertBefore(p, zoneChat.childNodes[0]);
});



//#11
/* SOUND GESTION */
function mute(){
    if(sound.muted){
        sound.muted = false;
        bmute.style.backgroundImage = "url('../images/sound.png')";
    }
    else{
        sound.muted = true;
        bmute.style.backgroundImage = "url('../images/nosound.png')";
    }
}
function volume(lvl){
    sound.volume = lvl/100;
    console.log(lvl);
}




//#12
/* BALISTIC AND PREVISIONNAL CALCULS */
//LOCAL - REPLACE ELEMENTS WITH PREVISIONNAL CALCUL
//this function is used for the player to have his own coordonates at real time
// like that, he'll got real time data for his own ship
function estimation(ID,x,y,a,v,bullets,tg,td){
    for(var k=0; k<listElements.length; k++){
        if(listElements[k].ID==ID){
            listElements[k].x = x,
            listElements[k].y = y,
            listElements[k].a = a,
            listElements[k].v = v,
            listElements[k].tg = tg,
            listElements[k].td = td,
            listElements[k].bullets = bullets
        }
    }
}
/*
In this function we'll calcul all bullets trajectory (that normally won't change once fired

We use the "for" for calculating previsional position of asteroid but we have to know that only the server know exactly were the asteroid is, so we just could anticipate but the speed rate of asteroid change with the number of player.

Next we estimate propulsion's trajectory of all ship (but once fire, it musn't change trajectory too

Finally we try too calcul where the other fighter might be because we do not received data every time. So between each refresh we must try to find the trajectory. The algorithme is the next one :
If ship goes straight : continu to go straight
If the ship is stopped : do not move him
If the ship was rotating while refresh data have been sent, continu to make him rotate in the same way
If the player where not rotating while refresh data have been sent, do not rotate him

The problem is the next one : if player turn left, send data but between two refresh, change direction, we do not have any way to know that so it appear as a glitch to others players
*/

function balistic(){
    for(var k=0; k<listElements.length; k++){
        if(k<nbrAsteroids-1){
            /* ASTEROIDS */
            listElements[k].x += Math.cos(listElements[k].a)*vAst;
            listElements[k].y += Math.sin(listElements[k].a)*vAst;
        }
        else if(k>nbrAsteroids+2){
            /* LASERS SHOT */
            for(var i=0; i<listElements[k].bullets.length; i++){
                listElements[k].bullets[i].x += Math.cos(listElements[k].bullets[i].a)*laserSpeed;
                listElements[k].bullets[i].y += Math.sin(listElements[k].bullets[i].a)*laserSpeed;
                listElements[k].bullets[i].life--;
                if(listElements[k].bullets[i].life<0) listElements[k].bullets.splice(i,1);
            }
            /* PROPULSION */
            for(var i=0; i<listElements[k].reactor.length; i++){
                listElements[k].reactor[i].x += -Math.cos(listElements[k].reactor[i].a)*2;
                listElements[k].reactor[i].y += -Math.sin(listElements[k].reactor[i].a)*2;
                listElements[k].reactor[i].r -= 0.1;
                if(listElements[k].reactor[i].r<0) listElements[k].reactor.splice(i,1);
            }
            /* IF ELEMENT = PLAYER LOCAL */
            if(listElements[k].ID==player.ship.ID){
                player.ship.bullets = listElements[k].bullets;
                player.ship.reactor = listElements[k].reactor;
                listElements[k].x += Math.cos(listElements[k].a)*listElements[k].v;
                listElements[k].y += Math.sin(listElements[k].a)*listElements[k].v;
                listElements[k].v -= 0.3;
                if(listElements[k].v<0) listElements[k].v = 0;
            }
            else{
                /* ESTIMATION */
                if(listElements[k].tg) listElements[k].a -= 0.1;
                if(listElements[k].td) listElements[k].a += 0.1;
                listElements[k].immunite--;
                listElements[k].x += Math.cos(listElements[k].a)*listElements[k].v;
                listElements[k].y += Math.sin(listElements[k].a)*listElements[k].v;
                listElements[k].v -= 0.3;
                if(listElements[k].v<0) listElements[k].v = 0;
            }
        }
        memoAst = listElements[2].x;
    }
    //player's data
    player.ship.immunite--;
    player.ship.x += Math.cos(player.ship.a)*player.ship.v;
    player.ship.y += Math.sin(player.ship.a)*player.ship.v;
    if(player.ship.x<0) player.ship.x = lengthMapX-1;
    if(player.ship.x>lengthMapX) player.ship.x = 0;
    if(player.ship.y<0) player.ship.y = lengthMapY-1;
    if(player.ship.y>lengthMapY) player.ship.y = 0;
    player.ship.v -= 0.3;
    if(player.ship.v<0) player.ship.v = 0;
}




//#13
/* DATA FLUX*/
//SEND PERSONNAL DATA TO THE SERVER
function newPos(){
    socket.emit("newPos", {
        ID : player.ID,
        newPseudo : player.pseudo,
        newX:player.ship.x,
        newY:player.ship.y,
        newA:player.ship.a,
        newV:player.ship.v,
        newTG:player.ship.tg,
        newTD:player.ship.td,
        newIMMU:player.ship.immunite,
        newBullets:player.ship.bullets,
        newReactor:player.ship.reactor
    });
}

//Synchro data personnal data with server data
var memoAst = 0; //memorized the place of the ateroid n°1
var vect = 0;
var vAst = 1; // Vitesse asteroid prediction
var firstTurn = true;
socket.on("newData", function(data){
    /*if(firstTurn==false){
        memoAst = listElements[0].x;
    }else firstTurn = false;*/
    
    listElements = data;
    
    
    vect = listElements[2].x-memoAst;
    if(vect<0) vAst +=0.1;
    else vAst -= 0.1;
});





//#14
/****** DRAWING GAME ******/
//Draw game and detect collision between:
//01 : Player's ship & other space element
//02 : Player's ship & bullets (laser)
function drawGame(elements){
    //all clear
    context.clearRect(0,0,canvas.width, canvas.height);
    for(var i=0; i<elements.length;i++){
        
        //Shadow - Blur effect
        context.shadowBlur = 5;
        if(elements[i].team==0) context.shadowColor = "white";
        else if(elements[i].team==1) context.shadowColor = colorEmpire;
        else if(elements[i].team==2) context.shadowColor = colorRepublic;
        else if(elements[i].team==3) context.shadowColor = colorDroid;
        else if(elements[i].team==4) context.shadowColor = colorRebel;
        
        /* TEST COLLISIONS */
        var distX = Math.abs(elements[i].x-player.ship.x);
        var distY = Math.abs(elements[i].y-player.ship.y);
        if(elements[i].team!=player.team){
           if(distX<40 && distY<50 && allow && player.ship.immunite<0){
                player.die();
            }
        }
        
        for(j=0;j<elements[i].bullets.length;j++){
            var bullet = elements[i].bullets[j];
            
            /* TEST IMPACT */
            var disX = Math.abs(bullet.x-player.ship.x);
            var disY = Math.abs(bullet.y-player.ship.y);
            var imgData = context.getImageData(bullet.x - player.ship.x + (canvas.width/2),bullet.y- player.ship.y + (canvas.height/2),1,1);
            if(imgData.data[0]==255 && imgData.data[1]==255 && imgData.data[2]==255){
                bullet.life = 0;
            }
            if(bullet.team!=player.team){
               if(disX<15 && disY<15 && allow && player.ship.immunite<0){
                    player.die();
                    socket.emit("Kill", {
                        victim : player.pseudo,
                        vTeam : player.team,
                        killer : bullet.owner,
                        kTeam : bullet.team,
                    });
                   bullet.life = 0;
                }
            }
            
            //Lasers
            context.beginPath();
            context.moveTo(bullet.x-player.ship.x+(canvas.width/2) + Math.cos(bullet.a)*30+15, bullet.y-player.ship.y +(canvas.height/2) + Math.sin(bullet.a)*30+10);
            context.lineTo(bullet.x-player.ship.x+(canvas.width/2)+15,bullet.y-player.ship.y+(canvas.height/2)+10);
            context.lineWidth = 2;
            context.strokeStyle = elements[i].c;
            context.stroke();
            
        }
        for(j=0;j<elements[i].reactor.length;j++){
            var propulsion = elements[i].reactor[j];
            elements[i].reactor[j].x += -Math.cos(listElements[i].reactor[j].a)*2;
            elements[i].reactor[j].y += -Math.sin(listElements[i].reactor[j].a)*2;
            elements[i].reactor[j].r -= 0.2;
            if(elements[i].reactor[j].r<1) elements[i].reactor.splice(j,1);
            
            //Propulsion
            context.beginPath();
            context.arc(propulsion.x-player.ship.x+(canvas.width/2)+15,propulsion.y-player.ship.y +(canvas.height/2)+10,propulsion.r,0,Math.PI*2,true);
            context.strokeStyle = "yellow";
            context.stroke();
            
        }
        //Draw elements
        drawElement(elements[i]);
    }
    //Draws explosions
    for(var i=0; i<explosions.length; i++){
        for(var j=0; j<explosions[i].debris.length; j++){
            var c = explosions[i].debris[j];
            context.shadowColor = c.c;
			context.beginPath();
			context.arc(c.x - player.ship.x + (canvas.width/2), c.y- player.ship.y + (canvas.height/2), c.radius, 0, Math.PI*2, false);
			context.fillStyle = c.c;
			context.fill();
			
			c.x += c.vx;
			c.y += c.vy;
			c.radius -= .05;
            if(c.radius<0) explosions[i].debris.splice(j,1);
        }
        if(explosions[i].debris.length==0){
            explosions.splice(i,1);
            socket.emit("explosionDone", explosions);
        }
    }
}
//Draw space elements
function drawElement(obj) {
    var newX = obj.x - player.ship.x + (canvas.width/2);
    var newY = obj.y - player.ship.y + (canvas.height/2);
    
    //Shadow - Blur effect
    context.shadowBlur = 5;
    if(obj.team==0) context.shadowColor = "white";
    else if(obj.team==1) context.shadowColor = colorEmpire;
    else if(obj.team==2) context.shadowColor = colorRepublic;
    else if(obj.team==3) context.shadowColor = colorDroid;
    else if(obj.team==4) context.shadowColor = colorRebel;
    
    //MINI MAP
    context.beginPath();
    context.arc(obj.x/40,obj.y/40,1,0,Math.PI*2);
    context.fillStyle = obj.c;
    context.fill();
    
    //SHIP
    if(obj.type=="Fighter"){
        wShip = 30;
	    hShip = 20;
        context.save();
        //Pseudo
        context.font = "10px Arial";
        context.fillStyle = obj.c;
        context.fillText(obj.pseudo,newX-10,newY-30);
        
        //Rotation
        context.translate(newX+(wShip/2),newY+(hShip/2));
        context.rotate(obj.a);
        context.translate(-(newX+(wShip/2)),-(newY+(hShip/2)));
        if(obj.immunite>0){
            context.beginPath();
            context.arc(newX+(wShip/2),newY+(hShip/2),25,0,Math.PI*2,true);
            context.closePath();
            context.strokeStyle = obj.c;
            context.stroke();
        }
        //Drawing
        context.beginPath();
        context.moveTo(newX,newY);
        context.lineTo(newX+30,newY+10);
        context.lineTo(newX,newY+20);
        context.lineTo(newX+5,newY+10);
        context.closePath();
        
        
        //Color
        context.strokeStyle = obj.c;
        context.stroke();
        context.restore();
    }
    else if(obj.type=="Asteroid"){
        wShip = 60;
	    hShip = 60;
        context.save();
        
        //Rotation
        context.translate(newX+(wShip/2),newY+(hShip/2));
        context.rotate(obj.a);
        context.translate(-(newX+(wShip/2)),-(newY+(hShip/2)));
        //Drawing
        context.beginPath();
        context.moveTo(newX,newY);
        context.lineTo(newX+50,newY);
        context.lineTo(newX+50,newY+10);
        context.lineTo(newX+60,newY+10);
        context.lineTo(newX+60,newY+40);
        context.lineTo(newX+30,newY+60);
        context.lineTo(newX+10,newY+50);
        context.lineTo(newX+20,newY+40);
        context.lineTo(newX,newY+30);
        context.closePath();
        context.strokeStyle = "#FFF"; //WHITE
        context.stroke();

        context.beginPath();
        context.moveTo(newX+10,newY+10);
        context.lineTo(newX+25,newY+10);
        context.lineTo(newX+25,newY+30);
        context.lineTo(newX+10,newY+25);
        context.closePath();
        context.stroke();

        context.beginPath();
        context.moveTo(newX+45,newY+20);
        context.lineTo(newX+55,newY+20);
        context.lineTo(newX+50,newY+40);
        context.lineTo(newX+40,newY+40);
        context.closePath();
        context.stroke();
        context.restore();
    }
    else if(obj.type=="Mothership"){
        //EMPIRE
        if(obj.team==1){
            wShip = 380;
            hShip = 120;
            newX -= wShip/4;
            context.save();

            //Rotation
            context.translate(newX+(wShip/2),newY+(hShip/2));
            context.rotate(obj.a);
            context.translate(-(newX+(wShip/2)),-(newY+(hShip/2)));
            //Drawing
            context.beginPath();
            context.moveTo(newX, newY);
            context.lineTo(newX+140,newY+20);
            context.lineTo(newX+160,newY+50);
            context.lineTo(newX+180,newY+50);
            context.lineTo(newX+200,newY+30);
            context.lineTo(newX+280,newY+70);
            context.lineTo(newX+280,newY+90);
            context.lineTo(newX+200,newY+130);
            context.lineTo(newX+180,newY+110);
            context.lineTo(newX+160,newY+110);
            context.lineTo(newX+140,newY+140);
            context.lineTo(newX,newY+160);
            context.lineTo(newX-20,newY+100);
            context.lineTo(newX-40,newY+80);
            context.lineTo(newX-20,newY+60);
            context.closePath();
            context.strokeStyle = obj.c;
            context.stroke();
            context.restore();
        }
        //REPUBLIC
        else if(obj.team==2){
            wShip = 320;
            hShip = 160;
            newX -= wShip/1.6;
            newY -= hShip/3;
            context.save();

            //Rotation
            context.translate(newX+(wShip/2),newY+(hShip/2));
            context.rotate(obj.a);
            context.translate(-(newX+(wShip/2)),-(newY+(hShip/2)));
            //Drawing
            context.beginPath();
            context.moveTo(newX,newY);
            context.lineTo(newX,newY+80);
            context.lineTo(newX+20,newY+80);
            context.lineTo(newX+20,newY+100);
            context.lineTo(newX+40,newY+100);
            context.lineTo(newX+60,newY+160);
            context.lineTo(newX+120,newY+100);
            context.lineTo(newX+150,newY+90);
            context.lineTo(newX+180,newY+120);
            context.lineTo(newX+320,newY+60);
            context.lineTo(newX+320,newY+20);
            context.lineTo(newX+180,newY-40);
            context.lineTo(newX+130,newY-10);
            context.lineTo(newX+120,newY-20);
            context.lineTo(newX+60,newY-80);
            context.lineTo(newX+40,newY-20);
            context.lineTo(newX+20,newY-20);
            context.lineTo(newX+20,newY);
            context.closePath();
            context.strokeStyle = obj.c;
            context.stroke();
            context.restore();
        }
        //DROID
        else if(obj.team==3){
            wShip = 100,
            hShip = 100;
            newX -= wShip/0.96;
            newY -= hShip/3.75;
            context.save();

            //Rotation
            context.translate(newX+(wShip/2),newY+(hShip/2));
            context.rotate(obj.a);
            context.translate(-(newX+(wShip/2)),-(newY+(hShip/2)));
            //Drawing
            context.beginPath();
            context.arc(newX+100,newY+100,40,0,Math.PI*2,true);
            context.strokeStyle = obj.c; //yellow
            context.stroke();
            context.beginPath();
            context.arc(newX+100,newY+100,120,Math.PI*11/6,Math.PI/6,true);
            context.arc(newX+100,newY+100,70,Math.PI/6,Math.PI*11/6);
            context.closePath();
            context.stroke();
            context.restore();
        }
        //REBELS
        else if(obj.team==4){
            wShip = 280,
            hShip = 160;
            newX -= wShip/4;
            newY -= hShip/2;
            context.save();

            //Rotation
            context.translate(newX+(wShip/2),newY+(hShip/2));
            context.rotate(obj.a);
            context.translate(-(newX+(wShip/2)),-(newY+(hShip/2)));
            //Drawing
            context.beginPath();
            context.moveTo(newX,newY);
            context.lineTo(newX+80,newY);
            context.lineTo(newX+100,newY-40);
            context.lineTo(newX+200,newY-60);
            context.lineTo(newX+260,newY-20);
            context.lineTo(newX+340,newY);
            context.bezierCurveTo(newX+380, newY, newX+380, newY+60, newX+340, newY+60);
            context.lineTo(newX+260,newY+80);
            context.lineTo(newX+200,newY+120);
            context.lineTo(newX+100,newY+100);
            context.lineTo(newX+80,newY+60);
            context.lineTo(newX,newY+60);
            context.bezierCurveTo(newX-40, newY+60, newX-40, newY, newX, newY);
            context.closePath();
            context.strokeStyle = obj.c;
            context.stroke();
            context.restore();
        }
    }
}










//#15
/* GAME LOOP */
//regulate requestAnimationFrame to be sure that everyone is cadanced on the same frequency
var now;
var then = Date.now();
var interval = 1000/fps;
var delta;
var time = 0;
function loop(){
    requestAnimationFrame(loop);
    now = Date.now();
    delta = now - then;
     
    if (delta > interval) {
        then = now - (delta % interval);
        if(player.gotAShip){
            player.ship.update();
            balistic();
            drawGame(listElements);
        }
        if(time<3){
            newPos();
        }
        if(time<0){
            time = syncServerTime;
            socket.emit("askForRefresh", true);
        }
        else time--;
    }
}
loop();