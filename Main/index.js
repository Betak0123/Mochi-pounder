
//kommenter følgende linjer

let playerReady = 0
let P1R = false
let P2R = false
let currentPage = '#splashscreen'
let score = 0
let time = 15

// Laver to variabler som vi skal bruge til spillet
let isPlaying = false
let addingPlayers = false
let turn = false

// Vi henter express bibloteket ned så vi kan bruge det i koden. 
const express = require('express')
const app = express()

// Det samme gøres for http biblioteket. Med det kan vi lave en http server.
const http = require('http')
const server = http.createServer(app)

// Derefter importeres Server-klassen fra biblioteket Socket.IO, og der oprettes en Socket.
const { Server } = require("socket.io")
const io = new Server(server)

// Vi sætter port til at have en værdi, og fortæller Express.js, at den offentlige mappe er public. Disse filer skal være mulige at tilgå i browseren. 
const port = 4000;
app.use(express.static('public'))

// Http-serveren bliver startet på den angivne prot
server.listen(port, () => {
  console.log('client available on: ' + port);
})

// håndterer Socket.IO's "connection" -begivenhed, som bliver udløst, når en klient opretter en forbindelse til serveren.
io.on('connection', (socket) => {
  console.log('a user connected')
  // der bliver udsendt "ip" -begivenheden til alle tilsluttede klienter med IP-adresse og portnummeret, som serveren lytter på.

  io.emit('ip', ip.address() + ":" + port)

  
  // Lyt på når der kommer besked fra klienten om hvilke side vi er på
  socket.on('page' , page =>{
    currentPage = page
    // Når siden bliver skiftet til startsiden, vil der nu være klar til at ventes på spillere
    if(page = '#startscreen'){
      addingPlayers = true
      console.log('Der ventes nu på spillere')
    }
    console.log('Nu er pagen: ' +page )
  })
  // Lyt efter at der bliver sendt genstart fra klienten, og genstart spillet hvis det er.
  socket.on('restart' , msg =>{
    if(msg == 'genstart'){
      restartF()
    }
    if(msg == 'genstartTrue'){
      restart()
    }
  })
  // Lyt på besked fra klienten (Så man også kan spille uden M5'ere)
  socket.on('player' , msg =>{
    console.log('Data received from click: ' + msg.toString());
  
    // Eksekver bestemte ting afhængigt af hvad stadie spillet er i
    if(isPlaying){
      Gamehandler(msg)  
    }
    if(addingPlayers){
      Playerhandler(msg)
    }
  })

})

//UDP TING
//dokumentation af dgram: https://nodejs.org/api/dgram.html

//npm install -s dgram
const udp = require('dgram')

//to get local ip
var ip = require('ip')

console.log(ip.address())
var udpSocket = udp.createSocket('udp4')


//Når den er klar til at få beskeder
udpSocket.on('listening', () => {
  var address = udpSocket.address()
  var port = address.port
  console.log('UDP Socket is listening at: ' + address.address + ":" + port);
})

//Når den får en besked fra M5'er
udpSocket.on('message', (msg, info) => {  
  console.log('Data received from client : ' + msg.toString());
    // Eksekver bestemte ting afhængigt af hvad stadie spillet er i
  if(isPlaying){
    Gamehandler(msg)  
  }
  if(addingPlayers){
    Playerhandler(msg)
  }
})

//Hvis der sker en fejl
udpSocket.on('error', (err) => {
  console.log('socket error:\n' + err.stack);
  udpSocket.close()
});

// port, ip adresse, callback
udpSocket.bind(port,ip.address(),false);


// Funktionen som skal håndterer alt logik for spillet. 
function Gamehandler(msg){
    if(msg == 'Hit1' && !turn){
      console.log('P1 ramte!')
      score += 1
      io.emit('udp-message', msg.toString())
      io.emit('udp-points', score)
      turn = true
    }
    else if(msg == 'Hit2' && turn){
      console.log('P2 ramte!')
      score += 1
      io.emit('udp-message', msg.toString())
      io.emit('udp-points', score)
      turn = false
    }
    else{
      io.emit('udp-message', 'fail')
      isPlaying = false
    }
}

  // Funktion der hånterer at tjekke om 2 spillere er klar. 
function Playerhandler(msg){
  if(msg == 'Hit1' && P1R == false){
    playerReady +=1
    P1R = true
    console.log('Der er nu ' + playerReady + ' spillere klar')
    io.emit('styling', '1green')
    if(playerReady == 2){
      gameStart()
    }
  }
  if(msg == 'Hit2' && P2R == false){
    playerReady +=1
    P2R = true
    console.log('Der er nu ' + playerReady + ' spillere klar')
    io.emit('styling', '2green')
    if(playerReady == 2){
      gameStart()
    }
  }
}

  // Funktion der starter spillet, sætter timer i gang og vælger hvem der starter. 
function gameStart(){
  var seconds = 4 
  let num = Math.random(0, 1)
  if(num <= 0.5){
    turn = false
    io.emit('styling','1Start')
  }else{
    turn = true
    io.emit('styling','2Start')
  }
  
  // Lav 3 sekunders countdown
  let fuck = setInterval(() => {
    if(seconds > 0){
      seconds -=1
      io.emit('countdown',seconds)
    }else{
      clearInterval(fuck)
    }
  }, 1000);
  
  // Start spillet for real efter 4 sekunder
  setTimeout(() => {
    io.emit('styling', 'gamestart')
    addingPlayers = false
    isPlaying = true
    timeUpdate(time)
  }, 4000);
}


function timeUpdate(tid){
  // starter kun hvis spillet er igang 
  if(isPlaying){
    setTimeout(() => {
      if(tid > 0){
        // Send besked til klient om hvad tiden er
        io.emit('time',tid)
        console.log('der er nu tid: ' + tid)
        // Kald funktionen igen med en mindre
        timeUpdate(tid -1)
      }else{
        // Hvis tiden er 0 slutter spillet 
        io.emit('time', '0')
        gameEnd()
      }
    }, 1000);
  }
}

function gameEnd(){
  io.emit('gamestate','win')
  isPlaying = false
}

  // Genstarter spillet for real
function restart(){
  playerReady = 0
  P1R = false
  P2R = false
  currentPage = '#splashscreen'
  score = 0
  time = 15
  isPlaying = false
  addingPlayers = false
  turn = false
  io.emit('gamestate', 'restart')
  console.log('den er nu genstartet rigtigt')
}

  // Genstarter bare stadiet af serveren. Bliver eksekveret når klienten reloader siden, og sørger for serveren ikke skal genstartes manuelt hver gang. 
function restartF(){
  playerReady = 0
  P1R = false
  P2R = false
  currentPage = '#splashscreen'
  score = 0
  time = 15
  isPlaying = false
  addingPlayers = false
  turn = false
  console.log('den er nu genstartet falsk')
}