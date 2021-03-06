
Meteor.publish("userData", function () {
    return Meteor.users.find({_id: this.userId},
        {fields: {'bldg': 1, 'profile': 1}});
});

Meteor.publish("buildings", function (addr) {
    var flrAddr,
        bldgAddr;
    if (!addr) {
        bldgAddr = getCurrentUserBldgAddress();
        flrAddr = bldgAddr + "-l0";
    }
    else {
        flrAddr = getFlr(addr);
        bldgAddr = getBldg(addr);
    }
    // publish both flr & its container bldg
    query = {
        $or: [
            {flr: flrAddr},
            {address: bldgAddr}
        ]
    };
    return Buildings.find(query);
});
