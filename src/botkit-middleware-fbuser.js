const FB = require('fb');
const logLevels = ["debug", "info", "warn", "error"];

module.exports = function (options) {
    if (!options || !options.storage || !options.accessToken || !options.fields){
        throw new Error("You must supply an options object storage, accessToken, and fields");
    }
    function logConsole(logLevel,msg){
        if (logLevels.indexOf(logLevel) >= logLevels.indexOf(options.logLevel)){
            console.log(msg);
        }
    }

    FB.setAccessToken(options.accessToken);
    const middleware = {};
    middleware.receive = function (bot, message, next) {
        options.storage.users.get(message.user, function(err, user_data) {

            function finalize(usr) {
                message.user_profile = usr;
                next();
            }

            if (!user_data){
                logConsole('debug', 'No user found in storage. Fetching from Facebook API...')
                FB.api(message.user, { fields: options.fields}, function (fb_user) {
                    if (!fb_user){
                        logConsole('error', 'ERROR - No user found for facebook id:'+ message.user);
                        next(new Error('User not found'));
                    }

                    else if (fb_user.error){
                        logConsole('error','ERROR - facebook error:'+ message.user);
                        next(fb_user.error)
                    }

                    else {
                        fb_user.id = message.user;
                        options.storage.users.save(fb_user, function (err) {
                            finalize(fb_user);
                        });
                    }
                });
            }
            else{
                logConsole('debug','Found user_profile in storage:'+JSON.stringify(user_data))
                finalize(user_data);
            }
        });
    };

    return middleware;
};