var restify = require('restify');
var builder = require('botbuilder');
var parser = require('rss-parser');
var md = require('html-md');

function beenPosted(guid) {
    if (guid === "https://securingtomorrow.mcafee.com/?p=77301"){
        return false;
    } else {
        return false;
    }
}

function checkNews(session){
    var options = {
        customFields: {
            item: ['description']
        }
    }

    parser.parseURL('http://securingtomorrow.mcafee.com/category/mcafee-labs/feed/', options, function(err, parsed) {
        console.log(parsed.feed.title);
        parsed.feed.entries.forEach(function(entry) {
            if(!beenPosted(entry.guid))
            {
                //if (entry.isoDate === n) {
                console.log(entry.title + ':' + entry.link);
                console.log(entry.pubDate);
                console.log(entry.guid);
                //console.log(entry.categories);
                //console.log(entry.description);
                //console.log(entry.isoDate);


                var m,
                    urls = [],
                    rex = /<img[^>]+src="?([^"\s]+)"?\s*\/>/g;

                while (m = rex.exec(entry.description)) {
                    urls.push(m[1]);
                }
                console.log(urls[0]);

                var msg = new builder.Message(session)
                    .addAttachment({
                        contentType: "application/vnd.microsoft.card.adaptive",
                        content: {
                            "type": "AdaptiveCard",
                            "version": "0.5",
                            "body":
                                [
                                    {
                                        "type": "Container",
                                        "items": [
                                            {
                                                "type": "TextBlock",
                                                "text": entry.title,
                                                "size": "medium",
                                                "weight": "bolder"
                                            },
                                            {
                                              "type": "TextBlock",
                                              "text": entry.pubDate,
                                              "size": "small",
                                              "weight": "bold"
                                            },
                                            {
                                                "type": "TextBlock",
                                                "text": md(entry.description),
                                                "wrap": true
                                            }
                                        ]
                                    }
                                ],
                            "actions": [
                                {
                                    "type": "Action.OpenUrl",
                                    "url": entry.link,
                                    "title": "Learn More"
                                }
                            ]
                        }
                    });
                session.send(msg).endDialog();
            }
        });
    });
}

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session) {
    session.send("You said: %s", session.message.text);
    checkNews(session);
});

// Check if team or bot joined
bot.on('conversationUpdate', (msg) => {
    if (msg.membersAdded && msg.membersAdded.length > 0) {
        var botId = msg.address.bot.id;

        var members = msg.membersAdded;
        // Loop through all members that were just added to the team
        for (var i = 0; i < members.length; i++) {
            // See if the member added was our bot
            if (msg.membersAdded[i].id === botId) {
                var botmessage = new builder.Message()
                    .address(msg.address)
                    .text('Hello There. Thanks for the invite. I am MacBot. If you need some help just type "@macbot help" at any time');

                bot.send(botmessage, function (err) {
                });
            } else {
                var botmessage = new builder.Message()
                    .address(msg.address)
                    .text('Welcome! I am MacBot. If you need some help just type "@macbot help" at any time');

                bot.send(botmessage, function (err) {
                });
            }
        }
    }

});