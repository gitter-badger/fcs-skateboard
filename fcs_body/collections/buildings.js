Buildings = new Meteor.Collection('buildings');


buildBldgAddress = function(flr, x, y) {
    return flr + "-b(" + x + "," + y + ")";
};

createBldg = function(flr, near, contentType, payload) {
    var x = 0,
        y = 0,
        address = buildBldgAddress(flr, x, y),
        nearLookupsCount = 0,
        proximity = PROXIMITY,
        foundSpot = false,
        created = false;

    var findSpot = function() {
        if (near) {
            nearLookupsCount++;
            // have we almost exhausted the near by spots?
            if (nearLookupsCount > Math.pow((2 * proximity), 2)) {
                // if so, extend the lookup area
                proximity *= 2;
            }
            x = randomNumber(near.x - proximity, near.x + proximity);
            y = randomNumber(near.y - proximity, near.y + proximity);
        }
        else {
            x = randomNumber(0, FLOOR_W);
            y = randomNumber(0, FLOOR_H);
        }
        address = buildBldgAddress(flr, x, y);
        var existing = Buildings.findOne({address: address});
        return !existing;
    };

    var _createBldg = function() {
        return {
            address: address,
            flr: flr,
            x: x,
            y: y,
            contentType: contentType,
            payload: payload,
            processed: false,
            smell: DEFAULT_SMELL,
            occupied: false,
            occupiedBy: null
        };
    };

    while (!created) {
        while (!foundSpot) {
            foundSpot = findSpot();
        }
        created = Buildings.insert(_createBldg());
    }
};
