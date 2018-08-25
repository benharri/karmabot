# karmabot

![](avatar.png)

add karmabot@webex.bot to your webex teams space

## usage: 

mention the person you would like to look up along with the bot and any number of `+` or `-` to grant or remove karma from the mentioned user.

example: 

* `@user @+++` will increment `@user`'s karma by 2
* `@someone @+---` will decrement `@someone`'s karma by 2

make sure that the mentions are entered properly in the webex teams client

karma changes are capped to 5 at a time

## development setup:

1. clone the repo
1. `npm install`
1. `cp .env{.sample,}`
1. [get an api key](https://developer.webex.com/add-bot.html)
1. edit `.env` with your api key and endpoint (`BOT_ID` is not required)
1. use [ngrok](https://ngrok.com) or something that is publicly available for 1he callbacks endpoint
1. `npm start`

## heroku deployment:

1. configure [heroku](https://dashboard.heroku.com) with a new project set up to use heroku's git master or any branch on github that you specify.
1. edit `.env` with the endpoint of `https://{app-name}.herokuapp.com`
1. push to heroku or the specified github branch
1. add the webex teams bot to your space by username 
1. watch the logs on heroku
