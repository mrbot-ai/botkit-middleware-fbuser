"use strict";
const FB = require('fb');
const moment = require('moment')
const logLevels = ["debug", "info", "warn", "error"];

module.exports = function (options) {
    if (!options || !options.storage || !options.accessToken || !options.fields || !options.expire){
        throw new Error("You must supply an options object storage, accessToken, and fields");
    }
    function logConsole(logLevel,msg){
        if (logLevels.indexOf(logLevel) >= logLevels.indexOf(options.logLevel)){
            console.log(msg);
        }
    }

    FB.setAccessToken(options.accessToken);

    function fetchFacebookProfile(message, cb){
        FB.api(message.user, { fields: options.fields}, function (fb_user) {
            if (!fb_user) {
                logConsole('error', 'ERROR - No user found for facebook id:' + message.user);
                return cb(new Error('User not found'));
            }

            else if (fb_user.error) {
                logConsole('error', 'ERROR - facebook error:' + message.user);
                return cb(fb_user.error)
            }
            return cb(null, fb_user)
        });
    }

    const middleware = {};
    middleware.receive = function (bot, message, next) {
        options.storage.users.get(message.user, function(err, user_data) {

            function finalize(usr) {
                message.user_profile = usr;
                next();
            }

            if (!user_data){
                logConsole('debug', 'No user found in storage. Fetching from Facebook API...')
                fetchFacebookProfile(message, (err,fb_user)=>{
                    if (err)
                        next(err);
                    else{
                        fb_user.id = message.user;
                        options.storage.users.save(fb_user, function (err) {
                            if (err)
                                next(err);
                            else
                                finalize(fb_user);
                        });
                    }
                })
            }else if (!user_data.timestamp || (user_data && options.expire && moment.now() - options.expire > user_data.timestamp) ){
                fetchFacebookProfile(message, (err,fb_user)=>{
                    if (err)
                        next(err);
                    else{
                        user_data.gender = fb_user.gender;
                        user_data.first_name = fb_user.first_name;
                        user_data.last_name = fb_user.last_name;
                        user_data.profile_pic = fb_user.profile_pic;
                        user_data.locale = fb_user.locale;
                        user_data.timezone = fb_user.timezone;
                        user_data.gender = fb_user.gender;
                        user_data.timestamp = moment.now()
                        user_data.is_payment_enabled = fb_user.is_payment_enabled;
                        user_data.last_ad_referral = fb_user.last_ad_referral;
                        options.storage.users.save(user_data, function (err) {
                            logConsole('debug','Facebook profile refreshed:'+JSON.stringify(user_data))
                            if (err)
                                next(err);
                            else
                                finalize(user_data);
                        });
                    }
                })
            }
            else{
                logConsole('debug','Found user_profile in storage:'+JSON.stringify(user_data))
                finalize(user_data);
            }
        });
    };

    return middleware;
};