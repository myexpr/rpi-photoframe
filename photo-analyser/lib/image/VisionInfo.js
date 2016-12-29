let request = require('request');
let config = require('../../Config').vision;

module.exports = (URL, callback) => {
    let options = {
        url: config.URL,
        headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': config.key
        },
        method: "POST",
        json: {
            'url': URL
        }
    };
    request(options, (error, response, body) => {
        if (body) {
            let tags = body.tags || [];
            body.tags = tags.filter(tag => {
                return tag.confidence >= 0.9;
            });

            let categories = body.categories || [];
            body.categories = categories.filter(category => {
                return category.score >= 0.9;
            })

            body.description =  body.description ||[];
            let captions = body.description.captions || [];
            body.description.captions = captions.filter(caption => {
                return caption.confidence >= 0.9;
            })

        }
        callback(error, response, body);
    });
}