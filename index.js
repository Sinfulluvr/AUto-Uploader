/*
      Dizzy Auto Condo Uploader
      Created by dizzy in 2021.

    Created in 2021 by dizzy for Arctic Society.
    Released in 2022 for xarzy and 2 Player Hub (AHJ)
*/


/*
======================================
Initialization
-
Basic Definitions
======================================
*/

var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
const noblox = require("noblox.js");
var http = require('http');
const fs = require("fs");
const cc = require("node-console-colors");

const { Octokit, App } = require("octokit");

const config = require("./config/config.json");
const discordapi = require("./modules/discord.js");
const robloxapi = require("./modules/roblox.js");
const unblacklister = require("./modules/unblacklister.js");

var app = express();
var uploading = false;
var gameid = 0;
var logs = "";
var server;

const octokit = new Octokit({
  auth: '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'
})

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

/*
======================================
Web System
-
Uploads web pages for basic logging and account creation.
======================================
*/

console.clear();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


app.set("view options", {layout: false});
app.use(express.static(__dirname + '/web'));

/* Add Cookie to the File */
function addCookie(path, cookie) {
  let data = fs.readFileSync(path, 'utf8');
  return data + "\n" + cookie;
}

/* Handle the data recieved when captcha solved */
app.post("/submit", (req, res) => {
  async function a() {
    var acc = await robloxapi.createAccount(req.body.id, req.body.token);
    await delay(3000);

    function b() {
      if(acc.toString() == undefined) {
        delay(1000);
        b()
      } else {
        return;
      }
    }
    
    b();

    const regex =
    /.ROBLOSECURITY=(_\|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.\|_[A-Za-z0-9]+)/g;
  const cookies = acc.headers.get('set-cookie');
  const cookie = regex.exec(cookies)?.[1];
  fs.writeFileSync("./config/cookies.txt", await addCookie("./config/cookies.txt", cookie));
  console.log("[" + cc.set("fg_purple", "DIZZY") + "] " + cc.set("fg_green", "Account generated."));
  };a();
  res.send(`{"code": "500", "responce": "success"}`);
});

/* Show logging data for debugging */
app.get("/logs", (req, res) => {
  res.send(logs);
});

/* Start listening on the port */
server = http.createServer(app);

server.listen(config.PORT);
console.log("[" + cc.set("fg_purple", "DIZZY") + "] " + cc.set("fg_green", "Listening on PORT:" + config.PORT));

/*
======================================
Main
-
Uploads web pages for basic logging and account creation.
======================================
*/

/* Define function for uploading Game */
async function uploadCondo() {
    logs = logs + "Checking cookie...<br/>";
    console.log("[" + cc.set("fg_purple", "DIZZY") + "] " + cc.set("fg_yellow", "Checking cookie..."));
    const cookie = await robloxapi.getAccount();

    /* Check if any cookies are left */
    if(cookie == false) {
        logs = logs + "<br/><br/>No more cookies are left.<br/>";
        //process.exit();
        //uploadCondo();
        console.log("[" + cc.set("fg_purple", "DIZZY") + "] " + cc.set("fg_red", "No more cookies are left."));
        return;
    }

    /* Login to the account if valid cookies */
    noblox.setCookie(cookie).then(async user => {
      /* Check if cookies are working */
        if(user.UserID == 0 || user.UserID == null || user.UserID == undefined) { console.log("Invalid cookie"); uploadCondo(); return; }

        if(config.debug == true) {
          console.log(cookie);
          console.log("userid: " + user.UserID);
        }

        /* Grab details for game */
        logs = logs + "Randomizing settings...<br/>";
        console.log("[" + cc.set("fg_purple", "DIZZY") + "] " + cc.set("fg_yellow", "Randomizing settings..."));

        var detailsA = await require("./config/gamedetails.json")[Math.floor(Math.random() * require("./config/gamedetails.json").length)];
        var detailsB = await require("./config/files.json")[Math.floor(Math.random() * require("./config/files.json").length)];

        /* Unblacklist files */

        logs = logs + "Unblacklisting place...<br/>";
        console.log("[" + cc.set("fg_purple", "DIZZY") + "] " + cc.set("fg_yellow", "Unblacklisting place..."));

        var placedata = await unblacklister.unblacklistGame(fs.readFileSync(path.join(__dirname, "/config/files/" + detailsB.filename)).toString(), false, false, false);

        /* Upload place */

        logs = logs + "Uploading place...<br/>";
        console.log("[" + cc.set("fg_purple", "DIZZY") + "] " + cc.set("fg_yellow", "Uploading place..."));

        gameid = await robloxapi.getStarterPlace(cookie);
        if(config.debug == true) {
          console.log("gameid: " + gameid);
        }

        var a = await robloxapi.updatePlace(cookie, placedata); // Upload Game
        var b = await robloxapi.setUniverseConfig(cookie, "R6"); // Set to R6 only
        var c = await robloxapi.setPlaceConfig(cookie, detailsA.name, detailsA.desc, detailsB.players); // Set game name, description, and max players
        var d = await robloxapi.enableVC(cookie); // Enables voice chat for the game
        fs.writeFileSync("./modules/temp/gameid.txt", gameid.toString()); // notes down the game ID

        /* Log game details */

        if(config.debug == true) {
          console.log("a: " + a.toString());
          console.log("b: " + b.toString());
          console.log("c: " + c.toString());
          console.log("d: " + d.toString());
        }

        logs = logs + "Game uploaded!<br/>";
        console.log("[" + cc.set("fg_purple", "DIZZY") + "] " + cc.set("fg_green", "Game uploaded."));
        
        console.log("[" + cc.set("fg_purple", "DIZZY") + "] " + cc.set("fg_blue", "Account ID: " + user.UserID + " - Account  Username: " + user.UserName));
        console.log("[" + cc.set("fg_purple", "DIZZY") + "] " + cc.set("fg_blue", "Place ID: " + gameid + " - Place Name: " + (await noblox.getUniverseInfo(gameid)).Name));
        console.log("[" + cc.set("fg_purple", "DIZZY") + "] " + cc.set("fg_blue", {a,b,c,d}.toString()));
        console.log("");

        discordapi.ShareWebhook("https://roblox.com/games/" + gameid.toString() + "/");
        uploading = false;

        return {a,b,c,d};

        /* Finished uploading */
    }).catch(err => {
      console.log("[" + cc.set("fg_purple", "DIZZY") + "] " + cc.set("fg_red", "(Warning) " + err));
      uploadCondo();
      return;
    });
}

async function uploadMain() {
  logs = logs + "Uploading new game...<br/>";
  if(uploading == true) { return }
    uploading = true;
    console.log("[" + cc.set("fg_purple", "DIZZY") + "] " + cc.set("fg_green", "Uploading game..."));
    var upload = await uploadCondo().catch(err => {
        console.log("[" + cc.set("fg_purple", "DIZZY") + "] " + cc.set("fg_red", "(Warning) " + err));
        uploadCondo(); 
      });
    setInterval(() => {
        if(uploading == false) {
            return
        }
    }, 100);
}

setInterval(async function() {
  if(uploading == false) {
      var a = await noblox.getUniverseInfo(gameid).then(result => {
          if(result.name == "[ Content Deleted ]") {
            uploadMain();
            return;
          }
      }).catch(err => {
        console.log("[" + cc.set("fg_purple", "DIZZY") + "] " + cc.set("fg_red", "(Warning) " + err));
        uploadMain();
        return;
      });
  
      if(gameid == 0) {
        uploadMain();
        return;
      }
  }
}, 1000);