
openExternalURL = function(externalUrl) {
    if (externalUrl) {
        var target = '_top';
        if (externalUrl.length > 4 && externalUrl.substr(0, 4) == "http")
            target = '_blank';
        window.open(externalUrl, target);
    }
};

redirectTo = function(newAddress) {
    window.open("/buildings/" + newAddress, "_top");
};

bldgRenderFunc = {
    'twitter-social-post': function(d) {
        var text = d.payload.text;
        var html = "<p " +
            "style=\"color: #" + d.payload.user.profile_text_color + "; " +
            "background-color: #" + d.payload.user.profile_background_color + "; " +
            "height: 10px; \">" + text + "</p>";
        return html;
    },
    'daily-feed': function(d) {
        var html = "<table style='border-color: red; height: 5px;' " +
            "width='5px;'>";
        html += "<tr><td bgcolor='red' style='color: white; " +
            "text-align: center; vertical-align: middle; " +
            "height: 2px; font-weight: bold; font-size: 1px;'>" +
            d.key.substring(5, 8) + "</td></tr>";
        html += "<tr><td bgcolor='white' style='width: 100%; " +
            "text-align: center; font-weight: bold; font-size: 2px;'>" +
            d.key.substring(9, 11) + "</td></tr>";
        html += "</table>";
        return html;
    },
    'user': function(d) {
        var imgUrl = d.payload.picture;
        var html = "<div style=\"height: 6px; width: 6px;\">";
        html += "<img src=\"" + d.payload.picture + "\" width=6px " +
            "height=6px title=\"" + d.key + "\">";
        html += "</div>";
        return html;
    }
};

Template.buildingsGrid.helpers({
    bldgKey: function() {
        var bldg = getBldg(Session.get("currentAddress"));
        Session.set("currentBldg", bldg);

        var bldgKey = getBldgKey(bldg);
        if (bldgKey) {
            return bldgKey;
        }
        else {
            // if there's no bldg, just show the address
            return Session.get("currentAddress");
        }
    }
});

Template.buildingsGrid.events({
    "click .bldg": function(event) {
        var externalUrl = $(event.currentTarget).attr("href");
        openExternalURL(externalUrl);
    },
    "click .navigate-up": function() {
        var newAddress = getContainingBldgAddress(Session.get("currentAddress"));
        redirectTo(newAddress);
    }
});

Template.buildingsGrid.rendered = function () {
    var WIDTH = 1200,
        HEIGHT = 600,
        BOUNDING_WIDTH = 1220,
        BOUNDING_HEIGHT = 620,
        SQUARE_WIDTH = 10,
        SQUARE_HEIGHT = 10,
        MAX_ZOOM_OUT = 0.8,
        MAX_ZOOM_IN = 60;


    var self = this;
    var dom = {};

    var _zoom = function(_translate, _scale) {
        dom.svg.attr("transform", "translate(" + _translate + ")scale(" + _scale + ")");
    };

    var zoom = function() {
        _zoom(d3.event.translate, d3.event.scale);
    };

    var zoomBehavior = d3.behavior.zoom().scaleExtent([MAX_ZOOM_OUT, MAX_ZOOM_IN]).on("zoom", zoom);

    dom.svg = d3.select("#display").append("svg")
        .attr("width", BOUNDING_WIDTH)
        .attr("height", BOUNDING_HEIGHT)
        .append("g")
        .call(zoomBehavior)
        .append("g");

    dom.svg.append("rect")
        .attr("class", "overlay")
        .attr("width", BOUNDING_WIDTH)
        .attr("height", BOUNDING_HEIGHT)
        .attr("fill", "lightblue");


    var xScale = d3.scale.linear().domain([0, FLOOR_W * SQUARE_WIDTH]).range([0, WIDTH]);
    var yScale = d3.scale.linear().domain([0, FLOOR_H * SQUARE_HEIGHT]).range([0, HEIGHT]);

    if (!self.handle) {
        self.handle = Meteor.autorun(function () {
            var query = {};
            if (Session.get("currentBldg") != Session.get("currentAddress")) {
                // if we're in a flr, don't render the containing bldg
                query = {flr: Session.get("currentAddress")};
            }
            // add g elements for all bldgs
            dom.bldgs = dom.svg.selectAll('.bldg')
                .data(Buildings.find(query).fetch())
                .enter()
                .append("g")
                .attr("class", "bldg")
                .attr("xlink:href", getBldgLink);

            // draw the bldg frame
            dom.bldgs
                .append('rect')
                .attr({
                    x: function (d) {
                        return xScale(d.x * SQUARE_WIDTH)
                    },
                    y: function (d) {
                        return yScale(d.y * SQUARE_HEIGHT)
                    },
                    width: xScale(SQUARE_WIDTH),
                    height: yScale(SQUARE_HEIGHT),
                    stroke: 'grey',
                    "stroke-width": 0.01,
                    fill: function (d) {
                        if (d.contentType)
                            return "white";
                    }
                });

            // add the bldg content
            dom.bldgs
                .append("foreignObject")
                .attr({
                    width: xScale(SQUARE_WIDTH),
                    height: yScale(SQUARE_WIDTH),
                    x: function (d) {
                        return xScale(d.x * SQUARE_WIDTH)
                    },
                    y: function (d) {
                        return yScale(d.y * SQUARE_HEIGHT)
                    },
                    fill: 'none'
                })
                .append("xhtml:body").append("xhtml:div")
                .style({
                    "font-size": "0.6px"
                })
                .html(function (d) {
                    return bldgRenderFunc[d.contentType](d);
                });

            // if given a bldg address, zoom on it
            if (Session.get("currentAddress") && Session.get("currentAddress") == Session.get("currentBldg")) {
                var coords = extractBldgCoordinates(Session.get("currentBldg"));
                if (coords) {
                    var x = xScale(coords[0] * SQUARE_WIDTH),
                        y = yScale(coords[1] * SQUARE_WIDTH);
                    // if possible, show some offset
                    var X_OFFSET = xScale(10),
                        Y_OFFSET = yScale(5);
                    if (x > X_OFFSET) x -= X_OFFSET;
                    if (y > Y_OFFSET) y -= Y_OFFSET;
                    // apply the zoom
                    var translateVector = [-(x * MAX_ZOOM_IN), -(y * MAX_ZOOM_IN)];
                    zoomBehavior.scale(MAX_ZOOM_IN);
                    zoomBehavior.translate(translateVector);
                    _zoom(translateVector, MAX_ZOOM_IN);
                }
            }
        });
    }

};