const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const parser = require('body-parser');
const nodemailer = require('nodemailer');
const express = require('express');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_PATH = 'token.json';

//Check if the credentials.json file is present for google service account
// And if present check for further authorization
fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading credentials with error ' + err.message);
    authorize(JSON.parse(content), setUserObject);
});
// get oAuth2 from google api
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
// Check if file present
// If absent get the new token file
// If present, set the file as token and set the oAuth credentials and run the setUserObject function as callback
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        console.log(oAuth2Client);
        callback(oAuth2Client);
    });
}
// function to get the new authorization token from google and save it to token.json and then call the setUserObject as callback
function getNewToken(oAuth2Client, callback) {
    const authURL = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this URL: ', authURL);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.log('Error while loading access token with error ', err.message);
            oAuth2Client.setCredentials(token);
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                console.log('Token stored in ', TOKEN_PATH);
            });
            console.log(oAuth2Client);
            callback(oAuth2Client);
        });
    });
}

//Create an array for storing user information
var userObjectArray = [];
var everyoneEmail = [];

function setUserObject(auth){
    const sheets = google.sheets({ version: 'v4', auth });
    sheets.spreadsheets.values.get({
        spreadsheetId: '1ZU9GUAT4wwBsqZfbF_NOHp9CtnE3AW8wMNuTDq2bhBg',
        range: 'NameEmail!A2:B',
    }, (err, res) => {
        if (err) return console.error('API error ', err);
        const rows = res.data.values;
        if (rows.length) {
            rows.forEach(row => {
                var userObj = { name: row[0], email: row[1] };
                userObjectArray.push(userObj);
                everyoneEmail.push(row.email);
            });
        }
    });
}

// For the presentation of HTML data on request
const app = express();

app.set('views', __dirname + '/public/views')
app.use(express.static(__dirname + '/public'))//For serving the static files like css and js
app.set('view engine', 'pug');//use pug template


app.get('/', (req, res) => {
    //pass JSON object to the HTML file
    var userObjectJSON = JSON.stringify(userObjectArray);
    console.log(userObjectJSON);
    // Check for data found from the sheet and send data only if data found
    if (userObjectArray.length === 0) {
        res.send('<p>No data found. Please refresh or check the data list.</p>');
    } else {
        res.render('./result', {
            title: 'Hello World',
            tableData: userObjectJSON
        });
    }
})
//get authentication requirements for mailer
var myAuth = require('./my_auth');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: myAuth.email,
        pass: myAuth.password
    }
});
app.use(parser.urlencoded({ extended: true }));//for the POST request parsing
app.post('/sendemail', (req, res) => {
    var mailList = req.body.receiverEmail;
    var mailOptions = {
        from: 'Dikson <sender@gmail.com>', // sender address
        subject: req.body.subject, // Subject line
        text: req.body.message, // plain text body
    }
    // check if mail is for everyone or from the form list
    if (mailList != 'Everyone') {
        mailOptions.to = mailList;
    } else {
        mailOptions.to = everyoneEmail;
    }
    // Send mail
    transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
            console.error("error sending mail ", err);
            return;
        } else {
            console.log("Success: " + info.messageId);
            console.log("preview: " + nodemailer.getTestMessageUrl(info));
        }
        res.send('Ok');
    });

})
const server = app.listen(7000, () => {
    console.log(`Express running - PORT ${server.address().port}`);
});
