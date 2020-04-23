#!/usr/bin/env node

const Discord = require('discord.js');
const client = new Discord.Client();
let lastKnownObjects = [];
let guild = Discord.guild;
const axios = require('axios');
const apiUrl = 'https://www.3dprintersvoordezorg.be/json.php?action=openRequests&key=--APIKEY--';
const botChannelId = '698841186407809074';

client.login(--DISCORD API TOKEN--);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    guild = client.guilds.get('697806915861741658');
    console.log('Working on: ' + guild.name);

    checkOrders(apiUrl);
    setInterval(() => checkOrders(apiUrl), 600000);
});

function checkOrders(url) {
    console.log('Fetching orders...');
    axios.get(url)
        .then(response => parseOrders(response.data.aanvragen))
        .catch(error => console.log(error));
}

function parseOrders(bestellingen) {
    let nieuweBestellingen = [];
    bestellingen.forEach(bestelling => {
        try {
            if (lastKnownObjects.filter(function (best) { return best.url == bestelling.url }).length == 0)
                nieuweBestellingen.push(bestelling);
            if (bestelling.postcode.length > 0 && !guild.roles.some(function (role) { return role.name == bestelling.postcode; })) {
                console.log('Creating role: ' + bestelling.postcode);
                guild.createRole({
                    name: bestelling.postcode,
                    color: 'BLUE',
                    mentionable: 'True'
                });
            }
        }
        catch (exception) {
            console.log(exception);
        }
    });
    lastKnownObjects = bestellingen;

    if (nieuweBestellingen.length > 0) sendToDiscord(nieuweBestellingen);
}

function sendToDiscord(bestellingen) {
    var channel = client.channels.get(botChannelId);

    bestellingen.forEach(bestelling => {
        try {
            let orderRole;
            guild.roles.forEach(role => {
                if (role.name.includes(bestelling.postcode)) orderRole = role;
            })

            channel.send(`__**Nieuwe bestelling: ${orderRole}**__  -  ${bestelling.url} \n\`\`\`\n\nGemeente: ${bestelling.gemeente} ${bestelling.postcode}\n\nNaam: ${bestelling.aanvragerNaam}\n\nAantal: ${bestelling.aantal}\n\nType: ${bestelling.gevraagd}\`\`\``);
        } catch{

        }
    });
}
