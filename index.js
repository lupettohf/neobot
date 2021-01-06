var mineflayer = require('mineflayer')
const mc = require('minecraft-protocol');
var autoeat = require("mineflayer-auto-eat")
var config = require('./config.json')
const cachePackets = require('./cachePackets.js');

var proxyClient; // This is the real client (java)
var bot; // This is the fake client connecting to the server
var server; // The proxy


var toggleAntiAFK = false;
let nowFishing = false
let mcData

run()

function run()
{
	log("Starting Minecraft Server");
	server = mc.createServer({ 
    	'online-mode': true,
    	encryption: true,
    	host: config.server.host_bind,
    	port: config.server.port,
    	version: "1.12.2",
    	'max-players': maxPlayers = 1,
    	'motd': "§cl§6u§eh§af§9'§bs§5 §ca§6f§ek§a §9p§br§5o§cx§6y§e §as§9e§br§5v§ce§6r"
  	});

  	log("Starting mineflayer client");
  	bot = mineflayer.createBot({
    	host: config.client.host,
    	port: config.client.port,
    	username: config.client.username,
    	password: config.client.password,
    	plugins: {
      		physics: false
    	},
    	hideErrors: true
  	})
  	
  	bot.loadPlugin(autoeat);
  	//Loads item definition
	bot.on('inject_allowed', () => {
  		mcData = require('minecraft-data')(bot.version)
	})

  	cachePackets.init(bot._client, true);

  	bot._client.on("packet", (data, meta, rawData) => {
  		if(proxyClient){ filterPacketAndSend(rawData, meta, proxyClient); }
  	});

  	//Handles remote server quit
  	bot._client.on('end', () =>
  	{
  		if(proxyClient) 
  		{
  			proxyClient.end("Hurr durr, got disconnected form server.\nAttempting to restart");
  			proxyClient = null;
  		}
  		//run();
  	});

  	//Handles generic errors
  	bot._client.on('error', (err) => {
  		if(proxyClient)
  		{
  			proxyClient.end("Hurr durr, we got a thing here:\n"+err.toString());
  			proxyClient = null;
  		}
  	});

  	server.on('listening', function () {
  		log('Server listening on port ' + server.socketServer.address().port)
	});

	// Here it handles packet switching to client
  	server.on('login', (newProxyClient) => { 
  		let remoteAddress = newProxyClient.socket.remoteAddress
  		log('New incoming connection from: '+remoteAddress)

  		if(bot.username == undefined)
  		{
  			server.end("Wait for bot to connect.");
  		}

  	  	newProxyClient.on('packet', (data, meta, rawData) => { 
        	filterPacketAndSend(rawData, meta, bot._client);
      	});
      	cachePackets.join(newProxyClient);
      	proxyClient = newProxyClient;

      	newProxyClient.on('end', function () {
    		log(remoteAddress + ' Closed connection');
    		//bot.physics.physicEnabled = true;
  		})

      	proxyClient.on('packet', (data, meta) => {
  			if(meta.name === "chat")
  			{
  				switch(data.message)
  				{
  					case ",antiafk":
  						//bunnyTheAntiAFK(2000)
  						break;
  					case ",fishing on":
  						startFishing()
  						break;
  					case ",fishing off":
  						stopFishing()
  						break;
  					case ",ping":
  						sendMessage(newProxyClient, "Pong!");
  						break;
  					case ",stats":
  						stats();
  						break;
  				}
  			}
  		});

  		sendMessage(newProxyClient, "Welcome to luhf's afk proxy!")
  		//bot.physics.physicEnabled = false;
    });

  	// Relay chat to terminal
  	bot.on('message', (msg) => {
    	log(msg.toString());
  	})

  	// Send playerlist to terminal and setup autoeat
  	bot.once('spawn', () => {
    	var playersList = Object.keys(bot.players).join(", ")
    	log(`Online players: ${playersList}`)
    	bot.autoEat.options = {
  			priority: "foodPoints", 
  			startAt: 19,
  			bannedFood: [],
    	};
  	});

  	//Hook for autoeat
  	bot.on("health", () => {
    	if (bot.food === 20) bot.autoEat.disable()
    	else {
    	sendMessage(proxyClient, "Proxy AutoEat running...") 
    		bot.autoEat.enable() 
    	}
  	}) 

}

function filterPacketAndSend(data, meta, dest) {
  if (meta.name !== "keep_alive" && meta.name !== "update_time") {   	
    dest.writeRaw(data);
  }
}

function stats()
{
	sendMessage(proxyClient, `Server version: ${bot.game.serverBrand} (${bot.player.ping} ms)\nExperience: ${bot.experience.pints} (level ${bot.experience.level})\n`);
}

function onSoundEffect(packet) {
    if(packet.soundId == 153) //This is the splash sound, this id is oly valid for 1.12.2
  	{
  		bot._client.removeListener('sound_effect', onSoundEffect)
 	  	setTimeout(()=>
 	  	{
 	  		bot._client.write('use_item', {hand: 0});
 	  	}, 350);	
 	  	setTimeout(()=>
 		{
 	 		startFishing()
 		}, 550);	
 		return;  	
  	}    
}

async function startFishing () {
  sendMessage(proxyClient, `Starting proxy fishing module.`);
  try {
    await bot.equip(mcData.itemsByName.fishing_rod.id, 'hand')
  } catch (err) {
    return bot.chat(err.message)
  }

  nowFishing = true

  bot._client.on('sound_effect', onSoundEffect)

  try {
    await bot.fish()
  } catch (err) {
    bot.chat(err.message)
  }
  nowFishing = false
}

function stopFishing () {
  sendMessage(proxyClient, `Stopped proxy fishing module.`);
  bot.removeListener('sound_effect', onSoundEffect)

  if (nowFishing) {
    bot.activateItem()
  }
}


function bunnyTheAntiAFK(interval)
{
	if(toggleAntiAFK){ 
		sendMessage(proxyClient, "Anti AFK --> off");
		toggleAntiAFK = false; 
		clearInterval(jumpTimeout); 
		return;
	}
	sendMessage(proxyClient, "Anti AFK --> on");
	const jumpTimeout = setInterval(() =>
	{
		setTimeout(() =>
		{
			bot.setControlState('jump', false)
		}, 200);
		bot.setControlState('jump', true)
	}, interval);
	toggleAntiAFK = true;
}

function sendMessage(client, message)
{
	if(client == undefined) return;
	    		
    var msg = {
    	translate: 'chat.type.announcement',
    	"with": [
      	'§cS§6e§er§av§9e§br',
      	message
    ]}; 			
	client.write('chat', { message: JSON.stringify(msg), position: 0, sender: '0'});
}

function log(message)
{
	console.log(message);
}