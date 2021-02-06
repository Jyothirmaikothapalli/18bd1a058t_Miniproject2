const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const { Payload } =require("dialogflow-fulfillment");
const app = express();

const MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
/*MongoClient.connect(url,function(err,db)
{
  if (err) throw err;
  var db =db.db("chatbot");
  var query = { acct_num : "1122"};
  db.collection("user_table").find(query).toArray(function(err,result){
    if (err) throw err;
    console.log(result);
  });
});*/

var randomstring = require("randomstring"); 
var user_name="";

app.post("/dialogflow", express.json(), (req, res) => {
    const agent = new WebhookClient({ 
		request: req, response: res 
		});


async function identify_user(agent)
{
  const acct_num = agent.parameters.acct_num;
  const client = new MongoClient(url,{"useUnifiedTopology": "true"});
  await client.connect();
  //const query={"acct_num":"${acct_num}"};
  const snap = await client.db("chatbot").collection("user_table").findOne({acct_num: acct_num});
  console.log("hello");
  if(snap==null){
	  await agent.add("Re-Enter your account number");

  }
  else
  {
  user_name=snap.username;
  await agent.add("Welcome  "+user_name+"!!  \n How can I help you");}
}
	
async function report_issue(agent)
{
 
  var issue_vals={1:"Internet Down",2:"Slow Internet",3:"Buffering problem",4:"No connectivity"};
  
  const intent_val=agent.parameters.issue_num;
  
  var val=issue_vals[intent_val];
  
  var trouble_ticket=randomstring.generate(7);

  //Generating trouble ticket and storing it in Mongodb
  //Using random module
  const client = new MongoClient(url,{useUnifiedTopology: true});
  await client.connect();
 
  
    
	var u_name = user_name;     
    var issue_val=  val; 
    var status="pending";

	let ts = Date.now();
    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();

    var time_date=year + "-" + month + "-" + date;

    var myobj = { username:u_name, issue:issue_val,status:status,time_date:time_date,trouble_ticket:trouble_ticket };

        await client.db("chatbot").collection("issues").insertOne(myobj);
     if(isuue_val<5){
     await agent.add("The issue reported is: "+ val +"\nThe ticket number is: "+trouble_ticket);
    }
    else{
      agent.add("invalid");
    }
    }
    }

//trying to load rich response
function custom_payload(agent)
{
	var payLoadData=
		{
  "richContent": [
    [
      {
        "type": "list",
        "title": "Internet Down",
        "subtitle": "Press '1' for Internet is down",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "Slow Internet",
        "subtitle": "Press '2' Slow Internet",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
	  {
        "type": "divider"
      },
	  {
        "type": "list",
        "title": "Buffering problem",
        "subtitle": "Press '3' for Buffering problem",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "No connectivity",
        "subtitle": "Press '4' for No connectivity",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      }
    ]
  ]
}
agent.add(new Payload(agent.UNSPECIFIED,payLoadData,{sendAsMessage:true, rawPayload:true }));
}




var intentMap = new Map();
intentMap.set("service_intent",identify_user);

intentMap.set("service_intent-custom",custom_payload);
intentMap.set("service_intent-custom-custom",report_issue);

agent.handleRequest(intentMap);

});//Closing tag of app.post
app.listen( 582);
