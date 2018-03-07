var canvasWindow= document.getElementById('mainGame');
var canvas2d=canvasWindow.getContext('2d');
var playerBullets = [];
var enemies = [], rewards = [], Lasers = [];
var isPaused = true;
var gameOver = false;
var laserActive = false;
var FPS = 1000/10;
var score = 0,previousScore = 0, scoreCheck =0;
var stars = [];
var currentStage = 1;
var numOfLives = 3;
var numStars = 40;
var levelUp = false;
var gameAlreadyStarted = false;
var musicOff =false;
var bulletSpeed = 5 , enemySpeed = 2;
var currentActivePlayer = "player1";
var soundOff = false;
canvasWindow.width=window.innerWidth;
canvasWindow.height=window.innerHeight;
feather.replace();
createStars();
createLaser();

//Calling a loop at FPS rate to update and redraw game environment
var refreshIntervalId = setInterval(function(){

	if(!isPaused){
		update();
		draw();
		handleCollision();
	}
	
}, FPS);


/******************************** Game Entity Programming ******************************************/

var player = {

	active : true,
	color : 'black',
	x : window.innerWidth / 2,
	y : window.innerHeight - 100,
	width : 50,
	upgraded:false,
	height : 50,
	sprite: Sprite(currentActivePlayer),
	draw : function(){
		if (this.active) {
			canvas2d.fillStyle = this.color;
			canvas2d.fillRect(this.x, this.y, this.width, this.height);
			this.sprite.draw(canvas2d, this.x, this.y);
		}
	},

	leftmove : function(){
		if ((this.x - 15) > 0) 
		{
			this.x -= 15;
		}else{
			this.x = 0;
		}
		
	},

	rightmove : function(){
		if ((this.x + 15) < window.innerWidth - 32) 
		{
			this.x += 15;
		}else{
			this.x = window.innerWidth-32;
		}

		
	},

	upgrade :function(){
		var bulletPosition = this.leftPoint();
		playerBullets.push(Bullet({
			speed : bulletSpeed,
			x : bulletPosition.x,
			y : bulletPosition.y
		}));
		bulletPosition = this.rightPoint();
		playerBullets.push(Bullet({
			speed : bulletSpeed,
			x : bulletPosition.x,
			y : bulletPosition.y
		}));
	},

	shoot : function(){

		if(!soundOff  && !gameOver){
			Sound.play("shoot");
		}
		if (this.upgraded) {
			this.upgrade();
		}
		var bulletPosition = this.midpoint();
		playerBullets.push(Bullet({
			speed : bulletSpeed,
			x : bulletPosition.x,
			y : bulletPosition.y
		}));
	},


	midpoint : function(){
		return {
			x : this.x + this.width / 2,
			y : this.y + this.height / 2
		};
	},

	leftPoint : function(){
		return {
			x : this.x + this.width / 10,
			y : this.y + this.height / 4
		};
	},

	rightPoint : function(){
		return {
			x : this.x + (this.width*(9/10)),
			y : this.y + this.height / 4
		};
	},

	explode : function(){
		if(!soundOff && !gameOver){
			Sound.play("explosion");
		}
		GameOver();
		
	}

};

//Bullets
function Bullet(I){
	
	I = I || {};
	I.active = true;
	I.xVelocity = 0;
	I.yVelocity = -I.speed;
	I.width = 3;
	I.height = 3;
	I.color = "#FFFF00";
	I.inBounds = function(){
		return (this.x >= 0 && this.x <= canvasWindow.width && this.y >= 0 && this.y <= canvasWindow.height);
	};

	I.draw = function(){
		canvas2d.fillStyle = this.color;
		canvas2d.fillRect(this.x,this.y,this.width,this.height);

	};

	
	I.update = function(){
		this.x += this.xVelocity;
		this.y += this.yVelocity;
		this.active = this.active && this.inBounds();

	};

	return I;

}

// Laser functionality
var laserImage = Sprite("laser");
function createLaser(){
	Lasers.push(Laser({}));
	Lasers.push(Laser({}));
}

//Laser status in top right corner
function laserIcon(){
	canvas2d.fillStyle = "black";
	canvas2d.fillRect(canvasWindow.width - 200, 100, 50, 50);
	laserImage.draw(canvas2d, canvasWindow.width - 250, 60);
}

function Laser(I){
	I =I || {};
	I.sprite=Sprite("laser");
	I.color = "#FFFF00" ;
	I.active = true;
	I.x = 0;
	I.y = window.innerHeight - 101 ;
	I.endingX = canvasWindow.width;
	I.endingY = window.innerHeight - 101 ;
	I.color = "white";
	I.inBounds = function(){
		return (this.y >= 0 );
	};
	
	I.update = function(){
		this.y-=bulletSpeed ;
		this.endingY-=bulletSpeed ;
		this.active = this.active && this.inBounds();
		if(!(this.inBounds()))
		{
			laserActive = false;
		}

	};

	I.draw = function(){
		console.log("drawing");
		canvas2d.lineWidth = 10;
		canvas2d.beginPath();
		canvas2d.moveTo(this.x,this.y);
		canvas2d.lineTo(this.endingX,this.endingY);
		canvas2d.strokeStyle = this.color;
		canvas2d.stroke();
		
	};

	return I;

}

//Rewards ships
function Rewards(I){
	I = I || {};
	I.status = 2;
	I.sprite=Sprite("reward");
	I.active = true;
	I.color = "black";
	I.age = Math.floor(Math.random() * 128 );
	I.x = canvasWindow.width / 4 + Math.random() * canvasWindow.width / 2;
	I.y = 0;
	I.killPrice = 100;
	I.xVelocity = 0;
	I.yVelocity = enemySpeed + 2 ;
	I.width = 50;
	I.height = 50;
	I.inBounds = function(){
		return this.x >= 0 && this.x <= canvasWindow.width && this.y >= 0 && this.y <= canvasWindow.height;

	};

	I.draw = function(){
		canvas2d.fillStyle = this.color;
		canvas2d.fillRect(this.x, this.y, this.width, this.height);
		this.sprite.draw(canvas2d, this.x, this.y);
	};

	I.update = function(){
		this.x += this.xVelocity;
		this.y += this.yVelocity;
		this.xVelocity = 3 * Math.sin(this.age * Math.PI /64);
		this.age++;
		this.active = this.active && this.inBounds();

	};

	I.upgrade = function(){
		
		player.upgraded = true;
		this.killPrice = 0;
		this.active = false;
		player.sprite =Sprite(currentActivePlayer+"a");
		setTimeout(RemoveUpgrade, 10000,this);
				
	}

	return I;
}

//remove cannon upgrade after 10 seconds
function RemoveUpgrade(){
	player.upgraded = false;
	player.sprite =Sprite(currentActivePlayer);
}

//Enemy design
function Enemy(I){

	I = I || {};
	I.sprite=Sprite(I.enemyType);
	I.active = true;
	I.age = Math.floor(Math.random() * 128 );
	I.color = "black";
	I.x = canvasWindow.width / 4 + Math.random() * canvasWindow.width / 2;
	I.y = 0;
	I.killPrice = I.price;
	I.xVelocity = 0;
	I.yVelocity = enemySpeed;
	I.width = 32;
	I.height = 32;
	I.inBounds = function(){
		return this.x >= 0 && this.x <= canvasWindow.width && this.y >= 0 && this.y <= canvasWindow.height;

	};

	I.crossed = function(){
		var temp =this.y >= canvasWindow.height;
		
		return  (this.y >= canvasWindow.height);
	}

	I.draw = function(){
		canvas2d.fillStyle = this.color;
		canvas2d.fillRect(this.x, this.y, this.width, this.height);
		this.sprite.draw(canvas2d, this.x, this.y);
	};


	I.update = function(){
		this.x += this.xVelocity;
		this.y += this.yVelocity;
		this.xVelocity = 3 * Math.sin(this.age * Math.PI /64);
		this.age++;
		this.active = this.active && this.inBounds();

	};

	I.explode = function(){
		if(!soundOff && !gameOver){
			Sound.play("explosion");
		}
		if (this.status ==2) {
			numOfLives++;
			this.status=0;
		}
		score+=this.killPrice;
		this.killPrice = 0;
		this.sprite = Sprite("explode");
		setTimeout(Destroyed, 200,this);
				
	}

	return I;
}

//Stars in space
function createStars(){
	// Create all the stars
	
	for(var i = 0; i < numStars; i++) {
		stars.push(Star());
	}
		
}

function Star(S) {
	S = S || {};
	S.x = Math.round(Math.random() * canvasWindow.width);
	S.y = Math.round(Math.random() * canvasWindow.height);
	S.width = 2;
	S.height = 2;
	S.color = "white";
	S.draw = function(){
			canvas2d.fillStyle = this.color;
			canvas2d.fillRect(this.x,this.y,this.width,this.height);
		};

	return S;
}

//Player life status
var life = {
	
	sprite : Sprite("life"),
	draw : function(){

		canvas2d.fillStyle ="black";
		canvas2d.fillRect(10,10,50,50);
		this.sprite.draw(canvas2d, 10,10);
		canvas2d.fillStyle = "white";
		canvas2d.font = "35px Arial";
		canvas2d.fillText(" x "+ numOfLives, 60, 50 );
	}

}



/********************************** Game Functionality Programming **************************************/

//When enemy collide with player or life is 0
function GameOver(){
	gameOver = true;
	canvas2d.fillStyle = "white";
	canvas2d.font = "100px Arial";
	canvas2d.fillText("Game Over", canvasWindow.width/3, canvasWindow.height /2 );
	clearInterval(refreshIntervalId);
	setTimeout(EndGame, 3000);


}

//updating player position after window resize
function updatePlayerPosition(){
	player.x = window.innerWidth/2;
	player.y = window.innerHeight - 100;
}

//Updating game environment
function update(){

	canvas2d.clearRect(0, 0, canvasWindow.width, canvasWindow.height);

	playerBullets.forEach(function(bullet){
		bullet.update();
	});

	playerBullets = playerBullets.filter(function(bullet){
		return bullet.active;
	 });

	
	if( score!=0 && score%800 == 0 && previousScore != score){
		enemies.push(Enemy({price:50,enemyType:"specialEnemy",status:2}));
		rewards.push(Rewards());
		previousScore =score;
	}

	if(score!=0 && (score)%2000 == 0 && score < 10000 && scoreCheck != score){
			levelUp = true;
			enemySpeed+=0.5;
			bulletSpeed+=0.7;
			scoreCheck = score;
	}

	rewards.forEach(function(reward){
		reward.update();
	});

	rewards = rewards.filter(function(reward){
		return reward.active;
	 });

	enemies.forEach(function(enemy){
		enemy.update();
		if (enemy.crossed()) {
			numOfLives--;
		}
		if (numOfLives == 0) {
			GameOver();
		}
		
	});

	enemies = enemies.filter(function(enemy){
		return enemy.active;
	});

	if(Math.random() < 0.1){
		enemies.push(Enemy({price:10,enemyType:"enemy",status:1}));
	}

	if(laserActive && Lasers.length != 0)
	{
		Lasers[0].update();
	}

	Lasers = Lasers.filter(function(laser){
		return laser.active;
	 });


}

//Redrawing updated game environment
function draw(){
	
	canvas2d.fillStyle = "white";
	canvas2d.font = "35px Arial";
	canvas2d.fillText("Score : "+ score, canvasWindow.width - 250, 50 );
	laserIcon();
	canvas2d.fillStyle = "white";
	canvas2d.fillText(" x "+ Lasers.length , canvasWindow.width - 200, 100 );
	player.draw();
	life.draw();
	
	stars.forEach(function(star){
		star.draw();

	});

	if(laserActive && Lasers.length != 0)
	{

		Lasers[0].draw();
	}

	rewards.forEach(function(reward){
		reward.draw();

	});

	playerBullets.forEach(function(bullet){
		bullet.draw();

	});

	enemies.forEach(function(enemy){
		enemy.draw();
	});

	if (levelUp) {
		canvas2d.fillStyle = "white";
		canvas2d.font = "135px Arial";
		canvas2d.fillText("Level Up ", canvasWindow.width/3, canvasWindow.height/2 );
		setTimeout(function(){
			levelUp = false;
		},2000);
	}



	
}

//when enemy or player destroyed
function Destroyed(current){
		current.active = false;	
	}

//End game when player destroyed
function EndGame(){
	if(!isPaused){
		$("#score").text("Your Score :"+score);
		$("#mainGame").toggleClass("hidden");
		$("#gameOver-page").toggleClass("hidden");
		$(".body").css("overflow","auto");
		currentStage = 4 ;
		
	}
}


//Collision between player and enemy or enemy and bullets
function collides(a, b){
	res = a.active && b.active && a.x < b.x + b.width && a.x + a.width > b.x  && a.y < b.y + b.height && a.y + a.height >  b.y ; 
	//console.log(res);
	return res;
}

//collision between enemy and laser
function Lasercollides(a, b){
	res = a.active && b.active && a.y < b.y + b.height ; 
	//console.log(res);
	return res;
}

function handleCollision(){
	playerBullets.forEach(function(bullet){
		enemies.forEach(function(enemy){
			if (collides(bullet,enemy)){
				enemy.explode();
				bullet.active = false;
			}
		});
	});

	if(laserActive && Lasers.length != 0)
	{
		enemies.forEach(function(enemy){
			if (Lasercollides(Lasers[0],enemy)){
				enemy.explode();
				
			}
		});
	}
	rewards.forEach(function(reward){
		if (collides(reward,player)) {
			reward.upgrade();
		}
	});

	enemies.forEach(function(enemy){
		if (collides(enemy,player)) {
			player.explode();
		}
	});

}

//html Button click and keyboard key press functionalities

if( isPaused && !gameOver)
{
	//Binding keyboard keys to respective function calls
	$(document).bind("keydown" ,"left", function(){
		if (player.active && !isPaused) {
			player.leftmove();
		}

	});

	$(document).bind("keydown" ,"right", function(){
		if (player.active && !isPaused) {
			player.rightmove();
		}
	});

	$(document).bind("keydown" ,"space up", function(){
		if (player.active && !isPaused) {
			player.shoot();
		}
		
	});

	$(document).bind("keydown" ,"shift", function(){
		if (player.active && !isPaused && !laserActive) {
			console.log("shift");
			laserActive = true;
		}

	});

	$(document).bind("keydown" ,"esc", function(){
		
		switch(currentStage){
			case 1: if(gameAlreadyStarted && !gameOver){
						isPaused = !isPaused ;
						$("#menu-page").toggleClass("hidden");
						$("#mainGame").toggleClass("hidden");
						currentStage = 2;
						$(".body").css("overflow","hidden");
					}
					break;

			case 2: if (!gameOver) {
						isPaused = !isPaused ;
						$("#menu-page").toggleClass("hidden");
						$("#mainGame").toggleClass("hidden");
					}
					$(".body").css("overflow","auto");
					currentStage = 1;
					break;

			case 3: $("#customize-page").toggleClass("hidden");
					$("#menu-page").toggleClass("hidden");
					currentStage = 1;
					break;

			case 4: $("#menu-page").toggleClass("hidden");
					$("#gameOver-page").toggleClass("hidden");
					$("#play-button").addClass("hidden");
					currentStage  = 1;
					gameAlreadyStarted = false;
					gameOver = false;
					break;

			case 5: $("#menu-page").toggleClass("hidden");
					$("#instruction-page").toggleClass("hidden");
					currentStage  = 1;
					break;
		}

	});
}

//if muse left buton clicked
$( window ).mousedown(function() {
  if (player.active && !isPaused) {
			player.shoot();
		}
});

//Window Resize Functionality
window.addEventListener("resize", function(){
	canvasWindow.width = window.innerWidth;
	canvasWindow.height = window.innerHeight;
	updatePlayerPosition();

});


//Avatar selection functionalities
$("#player1").click(function() {

	$("#" + currentActivePlayer).addClass("bg-primary");
	$("#" + currentActivePlayer).removeClass("bg-warning");
	player.sprite = Sprite("player1");
	$(this).removeClass("bg-primary");
	$(this).addClass("bg-warning");
	currentActivePlayer = "player1";

});

$("#player2").click(function() {
	$("#" + currentActivePlayer).addClass("bg-primary");
	$("#" + currentActivePlayer).removeClass("bg-warning");
	player.sprite = Sprite("player2");
	$(this).removeClass("bg-primary");
	$(this).addClass("bg-warning");
	currentActivePlayer = "player2";

});

//Invader selector
$("#player3").click(function() {
	$("#" + currentActivePlayer).addClass("bg-primary");
	$("#" + currentActivePlayer).removeClass("bg-warning");
	player.sprite = Sprite("player3");
	$(this).removeClass("bg-primary");
	$(this).addClass("bg-warning");
	currentActivePlayer = "player3";


});

$("#player4").click(function() {
	$("#"+currentActivePlayer).addClass("bg-primary");
	$("#"+currentActivePlayer).removeClass("bg-warning");
	player.sprite = Sprite("player4");
	$(this).removeClass("bg-primary");
	$(this).addClass("bg-warning");
	currentActivePlayer = "player4";

});

$("#player5").click(function() {
	$("#"+currentActivePlayer).addClass("bg-primary");
	$("#"+currentActivePlayer).removeClass("bg-warning");
	player.sprite = Sprite("player5");
	$(this).removeClass("bg-primary");
	$(this).addClass("bg-warning");
	currentActivePlayer = "player5";

});


$("#player6").click(function() {
	$("#"+currentActivePlayer).addClass("bg-primary");
	$("#"+currentActivePlayer).removeClass("bg-warning");
	player.sprite = Sprite("player6");
	$(this).removeClass("bg-primary");
	$(this).addClass("bg-warning");
	currentActivePlayer = "player6";


});

//********************************************Main Menu***********************************************

$("#play-button").click(function() {
	$("#menu-page").toggleClass("hidden");
	$("#mainGame").toggleClass("hidden");
	isPaused=false;
	gameAlreadyStarted = true;
	$(this).text("Resume");
	$("#restart-button").removeClass("hidden");
	currentStage = 2;
	$(".body").css("overflow","hidden");

});


$("#settings-button").click(function(){

	$("#menu-page").toggleClass("hidden");
	$("#customize-page").toggleClass("hidden");
	currentStage = 3;
	
});

$(".restart").click(function() {
	location.reload();
});

$("#instruction-button").click(function(){

	$("#menu-page").toggleClass("hidden");
	$("#instruction-page").toggleClass("hidden");
	currentStage = 5;
	
});

$("#exit-button").click(function(){

	window.top.close();
});


//***********************************Setting Page********************************************
$('#volume-desc').on('click',function(){
	var audioPlayer = document.getElementById("backgroundMusic");
	var audioVolume = parseFloat($("#volume-rocker").val());
	
	if(audioVolume - 0.05 > 0){
		audioVolume -= 0.05;
	}
	else{
		audioVolume = 0;
	}

	$("#volume-rocker").val(audioVolume);
	audioPlayer.volume = audioVolume;
	


});

$('#volume-rocker').on('input',function(){
	var audioPlayer = document.getElementById("backgroundMusic");
	var audioVolume = $(this).val();
	audioPlayer.volume = audioVolume;

	});

$('#volume-incr').on('click',function(){
	var audioPlayer = document.getElementById("backgroundMusic");
	var audioVolume = parseFloat($("#volume-rocker").val());
	
	
	if(audioVolume + 0.05 < 1){

		audioVolume += 0.05;
	}
	else{
		audioVolume = 1;
	}
	$("#volume-rocker").val(audioVolume);
	audioPlayer.volume = audioVolume;


	});



$("#music-button").click(function(){
	var audioPlayer = document.getElementById("backgroundMusic");
	if (!musicOff) {
		audioPlayer.pause();
	}
	else{
		audioPlayer.play();
	}
	var buttonText = (musicOff == false) ? " Music Off" :" Music On";
	$(this).toggleClass("bg-primary");
	$(this).toggleClass("bg-warning");
	//$(this).text(buttonText);
	$("#musicIcon").toggleClass("text-danger");
	$("#musicText").text(buttonText);
	
	musicOff = !musicOff;
});

$("#sound-button").click(function(){
	var buttonText = (soundOff == false) ? " Sound Off" :" Sound On";
	soundOff = !soundOff;
	$(this).toggleClass("bg-primary");
	$(this).toggleClass("bg-warning");
	$("#soundText").text(buttonText);
	$("#soundIcon").toggleClass("text-danger");
});

$("#select-music-button").change(function(){
    var file = this.files[0];
    var name = file.name;
    $("#backgroundMusic").attr("src","sounds/"+name);
    var audioPlayer = document.getElementById("backgroundMusic");
    audioPlayer.currentTime = 0;
    var buttonText = (musicOff == false) ? " Music Off" :" Music On";
    if (musicOff) {
		$("#music-button").toggleClass("bg-primary");
		$("#music-button").toggleClass("bg-warning");
		$("#music-button").text(buttonText);
		musicOff = !musicOff;
	}

    
});



$("#back-button").click(function(){

	$("#menu-page").toggleClass("hidden");
	$("#customize-page").toggleClass("hidden");
	currentStage = 1;
	
});


//************************************Instruction Page**************************************

$("#instruction-back-button").click(function(){

	$("#menu-page").toggleClass("hidden");
	$("#instruction-page").toggleClass("hidden");
	currentStage = 1;
	
});

$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})