const fs = require('fs');
const aws = require('aws-sdk');
const gm = require('gm').subClass({imageMagick: true});
const path = require('path');
const s3 = new aws.S3();
const emlformat = require('eml-format');
//const json2md = require("json2md");

const destBucket = process.env.DEST_BUCKET;
const transformation = process.env.TRANSFORMATION;

exports.handler = function main(event, context) {
  // Fail on mising data
  if (!destBucket || !transformation) {
    context.fail('Error: Environment variable DEST_BUCKET or TRANSFORMATION missing');
    return;
  }
  if (event.Records === null) {
    context.fail('Error: Event has no records.');
    return;
  }
  // Make a task for each record
  let tasks = [];
  for (let i = 0; i < event.Records.length; i++) {
    tasks.push(transformationPromise(event.Records[i], destBucket));
  }

  Promise.all(tasks)
    .then(() => { context.succeed(); })
    .catch((err) => { context.fail(err); });
};

function transformationPromise(record, destBucket) {
  return new Promise((resolve, reject) => {
    // The source bucket and source key are part of the event data
    const srcBucket = record.s3.bucket.name;
    const srcKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    // Modify destKey if an alternate copy location is preferred
    const destKey = srcKey;
    const transformstatus = 'transforming: ' + srcBucket + ':' + srcKey + ' to ' + destBucket + ':' + destKey;
    console.log('Attempting: ' + transformstatus);

    get(srcBucket, srcKey)
      .then(original => compress(original))
      .then(modified => put(destBucket, destKey, modified))
      .then(() => {
        console.log('Success: ' + transformstatus);
        return resolve('Success: ' + transformstatus);
      })
      .catch(error => {
        console.error(error);
        return reject(error);
      });
  });
}

function get(srcBucket, srcKey) {
  return new Promise((resolve, reject) => {
    s3.getObject({
      Bucket: srcBucket,
      Key: srcKey
    }, (err, data) => {
      if (err) {
        console.error('Error getting object: ' + srcBucket + ':' + srcKey);
        return reject(err);
      } else {
        console.log('This is the data.Body.toString UTF-8 you are reading: ' + data.Body.toString('utf-8'));
        //console.log(data.Body.toString('utf-8')); //needed as inBuffer is binary
        resolve(data.Body.toString('utf-8'));
      }
    });
  });
}

function put(destBucket, destKey, data) {
  return new Promise((resolve, reject) => {
    //change file extension from eml to json or md
    var newfilename = destKey;
    newfilename = newfilename.replace(/\.(eml)($|\?)/, '.json');
    console.log(newfilename); // http://tricky.href.svg/filename.png?abc1?test2?test3

    s3.putObject({
      Bucket: destBucket,
      Key: newfilename,
      Body: data
    }, (err, data) => {
      if (err) {
        console.error('Error putting object: ' + destBucket + ':' + destKey);
        return reject(err);
      } else {
        console.log('Putting this data into output folder: ' + JSON.stringify(data, " ", 2));
        resolve(data);
      }
    });
  });
}

function compress(inBuffer) {
  return new Promise((resolve, reject) => {
    console.log('you are about to open file');
    var eml = inBuffer;
    console.log('This is whats going to be transformed: ' + eml);
    emlformat.read(eml, function(error, data) {
      if (error)  {
        return console.log(error);} else {
          //console.log('Success post tranform data.Body: ' + JSON.stringify(data.text, " ", 2));
          // TODO Add transformation cases here
           //var returnformat = {};
           delete data.from;
           delete data.to;
           delete data.headers;
           delete data.html;
           data.subject = 'We could not make this stuff up!';
           var obj = JSON.parse(JSON.stringify(data));
           console.log(obj);
            //console.log(JSON.stringify(data.subject));
            //console.log('hey hey look here: ' + JSON.stringify(json2md([obj])));
            //resolve(arr);

            //resolve(json2md(iterate(obj, '')));
            resolve(JSON.stringify(obj, " ", 2));
        }
      });
    });
}
