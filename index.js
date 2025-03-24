require('dotenv').config();
const moment = require('moment');
const { Client } = require('discord.js-selfbot-v13');
const client = new Client();

client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);

  const channel = await client.channels.fetch(process.env.CHANNEL_ID);

  let oldestMessage = null;
  let lastMessage = null;

  let rolls = [];
  let claims = [];
  let gives = [];

  try{
    const messages = await channel.messages.fetch({limit:10, lastMessage});
    let obj = {
        name: null,
        series: null,
        owner: null,
        timestamp: null
    };    

    await messages.forEach(async (msg) => {
      //normal roll
        if (msg.author.username == 'Mudae' && msg.embeds.length>0 && msg.embeds[0].description.includes('React with any emoji to claim') && msg.interaction == null){
            const roll = msg.embeds[0];
            const name = roll.author.name;
            const series = roll.description.replace(/\nReact with any emoji to claim!/g, '');

            obj.name = name;
            obj.series = series;
            obj.timestamp = moment(msg.createdAt).format("YYYY-MM-DD HH:mm:ss");

        //slash command roll
        } else if (msg.author.username == 'Mudae' && msg.embeds.length>0 && msg.embeds[0].description.includes('React with any emoji to claim') && msg.interaction != null) {
          const roll = msg.embeds[0];
          const name = roll.author.name;
          const series = roll.description.replace(/\nReact with any emoji to claim!/g, '');

          obj.name = name;
          obj.series = series;
          obj.timestamp = moment(msg.createdAt).format("YYYY-MM-DD HH:mm:ss");
          obj.owner = msg.interaction.user.username;          

          if (!Object.values(obj).includes(null)){            
            rolls.push({...obj});            
          }  

        //out of rolls        
        } else if (msg.author.username == 'Mudae' && msg.content.includes('roulette is limited to')){

          Object.assign(obj, {name: null, series: null, timestamp: null});

        //roll message
        } else if (msg.content == '$m'){
            obj.owner = msg.author.username;

            if (!Object.values(obj).includes(null)){              
              rolls.push({...obj});              
            }      
        //claims
        } else if (msg.author.username == 'Mudae' && msg.content.includes('are now married')){
          const split_msg = msg.content.split(' and ');
          const owner = split_msg[0].match(/\*\*(.*?)\*\*/)[1];
          const char = split_msg[1].match(/\*\*(.*?)\*\*/)[1];
          const timestamp = moment(msg.createdAt).format("YYYY-MM-DD HH:mm:ss");

          claims.push({name: char, owner: owner, timestamp: timestamp});
          // console.log(claims);
        
        //giving characters
        } else if (msg.author.username == 'Mudae' && msg.content.includes('given to')){
          const split_msg = msg.content.split(' given to ');
          const chars = split_msg[0].match(/\*\*(.*?)\*\*/)[1];
          const user_id = split_msg[1].match(/<@(\d+)>/)[1];
          
          const owner = await client.users.fetch(user_id);
          
          let character;

          if (chars.includes(',')){
            character = chars.split(',');
          } else {
            character = [chars];
          }

          character.forEach(c => {
            gives.push({name: c, owner: owner.username});            
          })
        }
    });    
    
    console.log(gives);
        
  } catch (error){
    console.log(error);
  }

})

client.login(process.env.CLIENT_TOKEN);