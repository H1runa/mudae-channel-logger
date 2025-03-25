require('dotenv').config();
const moment = require('moment');
const { Client } = require('discord.js-selfbot-v13');
const client = new Client();

client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);

  const channel = await client.channels.fetch(process.env.CHANNEL_ID);
  const query_channel = await client.channels.fetch(process.env.QUERY_CHANNEL);

  let oldestMessage = null;
  let lastMessage = null;

  let rolls = [];
  let claims = [];
  let gives = [];

  let roll_commands = process.env.ROLL_COMMANDS.split(',');

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  //function to query the character details
  async function query_character(name){    
    const filter = m => m.author.username.includes('Mudae') && m.embeds.length>0;    
    for (let i = 0; i<4; i++){
      try{        
        await query_channel.send('$im '+name);
        const collected = await query_channel.awaitMessages({filter, max: 1, time: 10000, errors: ['time']});
        const embed = collected.first().embeds[0];     
        // console.log('\n'+embed.description+'\n');   
        let char_name = embed.author.name;
        let series = null;        

        if (embed.description.includes('female')){
          series = embed.description.match(/^(.*?)<:female/s)[1].trim();
        } else if (embed.description.includes('male')){
          series = embed.description.match(/^(.*?)<:male/s)[1].trim();
        } 

        let kakera = embed.description.match(/\*  · \*\*(.*?)<:kakera/s)[1].trim();
        let claim_rank = embed.description.match(/Claim Rank: #(.*?)\n/s)[1].trim();
        let like_rank = embed.description.match(/Like Rank: #([\d,]+)/s)[1].trim();              
                
        console.log(`\nName: ${char_name}\nSeries: ${series}\nKakera: ${kakera}\nClaim Rank: ${claim_rank}\nLike Rank: ${like_rank}\n`);
        break;
      } catch (error){
        console.log(' ERROR while querying :  '+error);        
      }
      
    }
  }

  try{
    const messages = await channel.messages.fetch({limit:10, lastMessage});
    let obj = {
        name: null,
        series: null,
        owner: null,
        timestamp: null
    };    

    // console.log('Size : '+ messages.size);
    // console.log('Last message: ' + messages.last().createdAt)

    for (const [index,msg] of messages.entries()) {      
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
            Object.assign(obj, {name: null, series: null, timestamp: null});    
          }  

        //out of rolls        
        } else if (msg.author.username == 'Mudae' && msg.content.includes('roulette is limited to')){

          Object.assign(obj, {name: null, series: null, timestamp: null});

        //roll message
        } else if (roll_commands.some(comm => msg.content == comm)){
            obj.owner = msg.author.username;

            if (!Object.values(obj).includes(null)){              
              rolls.push({...obj});                        
              await query_character(obj.name);
              Object.assign(obj, {name: null, series: null, timestamp: null});    
            }                  
        //claims
        } else if (msg.author.username == 'Mudae' && msg.content.includes('are now married')){
          const split_msg = msg.content.split(' and ');
          const owner = split_msg[0].match(/\*\*(.*?)\*\*/)[1];
          const char = split_msg[1].match(/\*\*(.*?)\*\*/)[1];
          const timestamp = moment(msg.createdAt).format("YYYY-MM-DD HH:mm:ss");

          claims.push({name: char, owner: owner, timestamp: timestamp});
          
        
        //giving characters
        } else if (msg.author.username == 'Mudae' && msg.content.includes('given to')){
          const split_msg = msg.content.split(' given to ');
          const chars = split_msg[0];
          const user_id = split_msg[1].match(/<@(\d+)>/)[1];
          
          const owner = await client.users.fetch(user_id);
          const timestamp = moment(msg.createdAt).format("YYYY-MM-DD HH:mm:ss");
          
          let character;

          if (chars.includes(',')){
            character = chars.split(',');
          } else {
            character = [chars];
          }

          character.forEach(c => {
            gives.push({name: c.match(/\*\*(.*?)\*\*/)[1], owner: owner.username, timestamp: timestamp});            
          })
        }        
    };    
    
    // console.log(`Rolls : ${rolls.length}\nClaims : ${claims.length}\nGives : ${gives.length}`);
        
  } catch (error){
    console.log(error);
  }

})

client.login(process.env.CLIENT_TOKEN);