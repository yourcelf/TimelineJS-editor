"use strict";
const superagent = require("superagent");
const options = require("./options");

const IMGUR_UPLOAD_URL = "https://api.imgur.com/3/image";

module.exports = {
  uploadImage: function(imageDataUrl, progressListener) {
    if (!options.imgurClientId) {
      throw new Error("Can't upload image without setting imgurClientId option");
    }
    return new Promise((resolve, reject) => {
      superagent.post(IMGUR_UPLOAD_URL)
        .set("Authorization", `Client-ID ${options.imgurClientId}`)
        .set("Accept", "application/json")
        .send({image: imageDataUrl.split("base64,")[1], type: 'base64'})
        .on("progress", progressListener)
        .end(function(err, res) {
          if (err) {
            console.log(err);
            return reject(err);
          }
          let data = JSON.parse(res.text).data;
          return resolve(data.link.replace("http:", "https:"));
        });
    });
  }
};
