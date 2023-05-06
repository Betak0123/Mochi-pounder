//currentpage skal pege på det side-id der skal være aktivt først (fra html filen) 
let udpDiv
let currentPage = '#splashscreen'
let clientSocket
let restartable = false

// let sound1 = new Audio('./public/sounds/Pound1.mp3')
// let sound2 = new Audio('./public/sounds/Pound2.mp3')

let sound1, sound2
let socket
let canvas, startscreen, losescreen
let playerOne, playerTwo
let punch, charge

// Initialiser alle vores html ting vi vil kunne arbejde med, og alle de lyde vi gerne vil bruge. 
function preload(){
  initSounds()
  initVars()
}

  // Lav objektet Moch
class Mochi{
  constructor(x,y){
    this.posx = x
    this.posy = y
    this.sizex = 100
    this.sizey = 100
    this.img = Idle
  }
  show(){
    image(this.img, this.posx, this.posy, this.sizex, this.sizey) 
  }
  update(img){
    this.img = img
    if(img == Ouch){
      // Timeout bruges for at sikre at det rigtige billede vises
      setTimeout(() => { 
        this.img = Idle
      }, 200);
    }
  }
}

// Player-objekt som bruges til at lave hver af spillerne 
class PlayerObject{
  constructor(x, y, img){
    this.posx = x
    this.posy = y
    this.sizex = 300
    this.sizey = 300
    this.img = img
    this.dia = 30
  }
  show(){
    image(this.img, this.posx, this.posy, this.sizex, this.sizey) 
  }
  // Gør så de slår når update bliver kaldt. 
  update(img){
    this.img = img
    setTimeout(() => { 
      if(img == punchB){
        this.img = chargeB
      }else if(img == punchG){
        this.img = chargeG
      } 
    }, 100);
  }
}



function setup(){ 
  // Gør det muligt at kommunikerer med serveren. 
  socket = io()
  socket.emit('restart', 'genstart')
  shift('#splashscreen')
  canvas = createCanvas(windowWidth, windowHeight)
  canvas.hide()
  background(0,0,0,0)
  startscreen.child(canvas)
  sakuya.play()

  // Lav de 3 objekter som bruges i spillet. 
  playerOne = new PlayerObject(windowWidth/4+30, windowHeight-350 , chargeG)
  playerTwo = new PlayerObject(3*windowWidth/4-330, windowHeight-350, chargeB)
  mochi = new Mochi(windowWidth/2-50 ,windowHeight-150 )

  // Lyt efter Ip-adressen fra serveren
  socket.on('ip', (msg) => {
    select('#ip').html('IP adressen: ' + msg)
  })
  
  // Lyt efter point som man har fra serveren
  socket.on('udp-points', (point)=>{
    score.html(point)
  })

  // Lyt efter besked, og eksekver kode ud fra hvilken besked der er modtaget. 
  socket.on('udp-message', (msg)=>{
    console.log(msg)
      
    if(msg == 'Hit1'){
      sound1.play()
      console.log('P1 ramte!')
      playerOne.update(punchG)
      playerTwo.update(readyB)
      mochi.update(Ouch)
    }
    else if(msg == 'Hit2'){
      sound2.play()
      console.log('P2 ramte!')
      playerTwo.update(punchB)
      playerOne.update(readyG)
      mochi.update(Ouch)
    }
    if(msg == 'fail'){
      console.log('Wrong timing')
      gameLose()
    }
  })

  // Hver klar til at lytte på alle de beskeder som ændre noget udseende for elementer i Dommen.
  socket.on('styling', (style) =>{
    console.log('Modtog besked på styling')
    if(style == '1green'){
      start1.style('backgroundColor', 'lightgreen')
    }
    if(style == '2green'){
      start2.style('backgroundColor', 'lightgreen')
    }
    if(style == 'gamestart'){
      gameStart()
    }
    if(style == '1Start'){
      player.style('left', '20%')
      player.style('opacity', 100)
    }
    if(style == '2Start'){
      player.style('left', '70%')
      player.style('opacity', 100)
    }
  })

  // Lyt efter besked der viser tiden
  socket.on('time', (time) => {
    countdown.html(time)
  })

  // Lyt efter besked på de 3 første sekunder af countdown, og start lyd første gang der kommer besked.
  socket.on('countdown', (seconds) => {
    console.log('Modtog: ' + seconds + ' på countdown')
    if(seconds == 3){
      announcer.play()
      startTime.style('opacity', 100)
    }
    startTime.html(seconds)
  })

  // Tjek hvad slutstadiet af spillet blivers
  socket.on('gamestate', (state) => {
    console.log('State er nu: ' + state)
    if(state == 'dead'){
      gameLose()
    }
    if(state == 'win'){
      gameWin()
    }
  })

  // Sørg for at skifte side når startknappen bliver trykket på.
  startbutton.mousePressed( () =>{
    if(currentPage == '#splashscreen'){
      shift('#startscreen')
      startsound.play()
    }
  })

  // Sørg for at genstarte spillet, når restartknappen bliver trykket på.
  restartbutton.mousePressed( () =>{
    if(restartable){
      restart()
      restartable = false
      startsound.play()
      console.log('genstarter!')
    }
  })
}

  // Hvis de forskellige elementer på vores canvas.
function draw(){
  clear();  
  mochi.show()
  playerOne.show()
  playerTwo.show()
}

// Gør det muligt at kontrollere spillet via keyboard, hvis man ikke lige har M5'ere
function keyPressed() {
  if (keyCode === 13) {
    gameStart();
    start2.style('backgroundColor', 'lightgreen')
    start1.style('backgroundColor', 'lightgreen')
  }
  if(keyCode === 75){
    socket.emit('player', 'Hit1')
  }
  else if(keyCode === 76){
    socket.emit('player', 'Hit2')
  }
}

// Behandl logik hvis spillet er tabt. 
function gameLose(){
  gamemusic.pause()
  deathsound.play()
  mochi.update(Death)
  setTimeout(() => {
    mochi.update(Death)
    
  }, 200);
  setTimeout(() => {
    restartable = true
    restartbutton.style('opacity', 100)
  }, 2000);
}

// start alt styling og lyd når spillet starter
function gameStart(){
  sakuya.pause()
  console.log('hej')
  setTimeout(() => {
    startTitle.style('opacity', 0)
    score.style('opacity', 100)
    countdown.style('opacity', 100)
    startTime.style('opacity', 0)
    start1.style('opacity', 0)
    player.style('opacity', 0)
    start2.style('opacity', 0)
    canvas.show()
    gamemusic.play()
  }, 300);
}

// Behandl logik hvis spillet er vundet. 
function gameWin(){
  gamemusic.pause()
  winsound.play()
  mochi.update(Win)
  setTimeout(() => {
    mochi.update(Win)
  }, 200);
  setTimeout(() => {
    restartable = true
    restartbutton.style('opacity', 100)
  }, 2000);
}

// Sæt alt tilbage til start
function restart(){
  shift('#splashscreen')
  socket.emit('restart', 'genstart')
  startTitle.style('opacity', 100)
  score.style('opacity', 0)
  countdown.style('opacity', 0)
  startTime.style('opacity', 100)
  start1.style('opacity', 100)
  start2.style('opacity', 100)
  start2.style('backgroundColor', 'red')
  start1.style('backgroundColor', 'red')
  player.style('opacity', 0)
  restartbutton.style('opacity', 0)
  canvas.hide()
  score.html('0')
  startTime.style('opacity',0)
  sakuya.play()

}



//skifter sider ud fra et id 
function shift(newPage) {
    //currentpage har hele tiden klassen 'show' 
    // - nu fjerner vi den og giver den til 'newPage'
    select(currentPage).removeClass('show')
    select(newPage).addClass('show')
    currentPage = newPage
    // Send siden vi nu er på til server
    socket.emit('page', currentPage)
}    


function initVars(){
  startbutton = select('#startbutton')
  restartbutton = select('#restartbutton')
  start1 = select('#start1')
  start2 = select('#start2')
  startTitle = select('#startTitle')
  countdown = select('#countdown')
  score = select('#score')
  startscreen = select('#startscreen')
  losescreen = select('#losescreen')
  startTime = select('#startTime')
  player = select('#player')
  splashscreen = select('#splashscreen')
}

function initSounds(){
  sound1 = loadSound('./sounds/Pound1.mp3')
  sound2 = loadSound('./sounds/Pound2.mp3')
  deathsound = loadSound('./sounds/death.mp3')
  gamemusic = loadSound('./sounds/playmusic.mp3')
  winsound = loadSound('./sounds/winsound.mp3')
  sakuya = loadSound('./sounds/sakuya2.mp3')
  announcer = loadSound('./sounds/announcer.mp3')
  startsound = loadSound('./sounds/startsound.mp3')

  punchB = loadImage('./assets/punchB.png');
  chargeB = loadImage('./assets/chargeB.png');
  punchG = loadImage('./assets/punchG.png');
  chargeG = loadImage('./assets/chargeG.png');
  readyB = loadImage('./assets/readyB.png');
  readyG = loadImage('./assets/readyG.png');
  Win = loadImage('./assets/Win.png');
  Idle = loadImage('./assets/Idle.png');
  Ouch = loadImage('./assets/Ouch.png');
  Death = loadImage('./assets/Death.png');
}
