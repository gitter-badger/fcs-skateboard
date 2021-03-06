Accounts.onCreateUser(function (options, user) {

    console.log(JSON.stringify(options));

    user.createdAt = new Date();

    user.profile = getUserDetails(options, user);

    var tokens = {
        accessToken: user.services.twitter.accessToken,
        accessTokenSecret: user.services.twitter.accessTokenSecret
    };

    var wrappedCreateBldg = Async.wrap(createBldg);
    var bldgId = wrappedCreateBldg(INITIAL_FLOOR, user.profile.screenName, null,
        USER_CONTENT_TYPE, user.profile);
    var bldg = Buildings.findOne({_id: bldgId});

    var wrappedCreateDataPipe = Async.wrap(createDataPipe);
    var dataPipeId = wrappedCreateDataPipe(tokens);
    var wrappedCreateLifecycleManager = Async.wrap(createLifecycleManager);
    var lifecycleManagerId = wrappedCreateLifecycleManager(bldgId, dataPipeId);
    var wrappedCreateRsdt = Async.wrap(createRsdt);
    var rsdtId = wrappedCreateRsdt(bldg);

    user.bldg = {
        _id: bldgId,
        address: bldg.address
    };
    user.dataPipes = [dataPipeId];
    user.lifecycleManagers = [lifecycleManagerId];
    user.residents = [rsdtId];

    return user;
});


getUserDetails = function(options, user) {
    var profile = options.profile || {};
    if (user.services.twitter) {
        profile = getUserDetailsFromTwitter(profile, user);
    }
    return profile;
};

getUserDetailsFromTwitter = function(profile, user) {
    console.log(user.services.twitter);
    profile.language = user.services.twitter.lang;
    profile.picture = user.services.twitter.profile_image_url;
    profile.screenName = user.services.twitter.screenName;

    return profile;
};
