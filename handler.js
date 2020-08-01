'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const request = require('request');
const cheerio = require('cheerio');

const S3Params = {Bucket: 'notenspiegel-data', Key: 'state.html'};

/**
 * Updates state of Notenspiegel to S3 by updating the state file or creating it if it did not exist
 * 
 * @param {string} newState 
 */
const updateState = function (newState) {
  return S3.upload({ ...S3Params, Body: newState }, function (err, data) {
    if (err) {
      console.log("Error creating or update state file: ", err);
    } else {
      console.log("Successfully created or updated state file");
    }
  });
}

const sendUpdateNotification = function () {
  const params = {
    Message: 'In deinem HdM Notenspiegel hat sich etwas geändert!',
    PhoneNumber: process.env.PHONE_NUMBER,
    MessageAttributes: {
        'SenderID': {
            DataType: "String",
            StringValue: "HdM Notenspiegel Update Notifier",
        }
    }
  };

  var publishTextPromise = new AWS.SNS().publish(params).promise();
  publishTextPromise.then(data => {
    console.log("SMS Notification versendet.");
  }).catch(console.error);
}

module.exports.default = async event => {
  const options = {
    followAllRedirects: true,
    method: 'POST',
    url: 'https://vw-online.hdm-stuttgart.de/qisserver/rds',
    qs: { 
      state: 'user',
      type: '1',
      category: 'auth.login',
      startpage: 'portal.vm',
      breadCrumbSource: 'portal',
      asdf: process.env.HDM_USERNAME,
      fdsa: process.env.HDM_PASSWORD
    },
    headers: { 'Postman-Token': 'af6448c8-46e5-4ae7-883b-d456ec1b532a', 'cache-control': 'no-cache' }
  };

  try {
    const message = await new Promise((resolve, reject) => {
      request(options, function (error, response, body) {
        if (error) {
          reject('Es konnte keine Verbindung zur HdM-Webseite hergestellt werden.')
        }

        const $ = cheerio.load(body);
        const pruefungsverwaltungUrl = $('#makronavigation > ul > li:nth-child(3) a').attr('href')

        if (body.includes('Anmeldung fehlgeschlagen')) {
          reject('Anmeldung fehlgeschlagen');
        }

        if (pruefungsverwaltungUrl === undefined) {
          let message = 'Der HdM-Server ist zurzeit nicht wie gewohnt erreichbar.'
          const hours = (new Date).getHours()
          if (hours >= 2 && hours < 4) {
            message = 'Der HdM-Server steht täglich in der Zeit von 02:00 - 04:00 Uhr nicht zur Verfügung.'
          }
          reject(message);
        }

        options.url = pruefungsverwaltungUrl
        options.qs = null;
        request(options, function (error, response, body) {
          const $ = cheerio.load(body)
          const notenspiegelUrl = $('.mikronavi_list > ul > li:nth-child(2) a').attr('href');
          options.url = notenspiegelUrl

          request(options, async function (error, response, body) {
              const $ = cheerio.load(body)
              const newState = $('.content > table:nth-of-type(2)').html();

              let message;

              try {
                let oldState = await S3.getObject(S3Params).promise();
                oldState = oldState.Body.toString('utf-8');
                
                if (oldState != newState) {
                  sendUpdateNotification();
                  message = "Update im Notenspiegel erkannt!";
                } else {
                  message = "Keine Veränderung am Notenspiegel erkannt.";
                }
              } catch (err) {
                message = "Notenspiegel Update Notifier initialisiert.";
              } finally {
                updateState(newState);
              }
              
              resolve(message)
          });
        });
      });
    });

    console.log(message);
  } catch (err) {
    console.error(err);
  }
};
