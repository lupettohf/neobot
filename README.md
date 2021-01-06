# neobot
Minecraft trasparent (and persistant) proxy and wannabe AFK bot using mineflayer and minecraft-protocol. Tested and developed for 1.12.2.

This project aims to be a a persistent proxy and a bot for Minecraft servers (mostly anarchy servers where automation is allowed). 

## Features 
* Makes a persistent connection to the server like [2bored2wait](https://github.com/themoonisacheese/2bored2wait)
* Command system to manage the bot/proxy (wip)
* Fishing Bot (working even when connected to the proxy)
* AutoEat when disconnected (with mineflayer-auto-eat)
* AntiAFK (currently not working, see limitations)

## Limits
* neobot uses the same packet caching code as 2bored2wait, so when you connect (or reconnect) some items/world data can appear missing. To fix this issue you have to reload the chunks by walking a few blocks or going though a portal
* Mineflayer is not intended to be used as a proxy to a real client, while this is possible it has some limitations, many API calls do not work or needs tweaks to work while the player is connected to the proxy, for example the AFK function uses  `bot.setControlState('jump', true)` which require Phisics.js plugin (the mineflayer plugin that handles client physic), however the physics plugin must be off while the player is connected to the proxy. 
* Right now the bot is developed for 1.12.2, i could work even on newer and older versions, hover due to the use of version specific packets some features need or might need tweaks to work in versions different than 1.12.2

## To-Do
* Configuration system
* A better command system/modular plugins (right now commands gets also passed to the server)
* Handling of crashes, disconnects, kicks, ban and reboots
* Webhook notifications to Discord or other services
* Fix bugs
* A total rewrite

### Credits
[2bored2wait](https://github.com/themoonisacheese/2bored2wait) for the proxy caching library and some other code (filterpackets)
[AFKBot](https://github.com/DrMoraschi/AFKBot) for the idea
All the folks developing minecraft-protocol and mienflayer. 
