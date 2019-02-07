//firebase configuration
var config = {
    apiKey: "AIzaSyC88nQOFV_H15tOFBeRz4ChfWvA2-DehF4",
    authDomain: "amazingrebelsproject1.firebaseapp.com",
    databaseURL: "https://amazingrebelsproject1.firebaseio.com",
    projectId: "amazingrebelsproject1",
    storageBucket: "",
    messagingSenderId: "327937749814"
};
firebase.initializeApp(config);

//global vars
var origin;
var fromDT;
var toDT;
var price;
var city;
var stateCode;
var startDateTime;
var endDateTime;
var selectedEvents = [];
var cityCode;
var placesArray = [];
var selectedFlights = [];
var noQuoteMessage = "";
var noEventMessage = "";
var buttonID;
var eventCity;
var inputValid = true;

//DB refs
var refPlaces = firebase.database().ref("Places");

//functions
//main functions to call sky api
function mainFunction() {
    //Remove previous results
    initialization();
    //input collection
    inputCollection();
    //input validation
    inputValidation();
    if (inputValid) {
        //input conversion
        inputConversion();
        //call event API
        skyAPI();
    };
};

function initialization(){
    noQuoteMessage = "";
    inputValid = true;
    selectedEvents = [];
    selectedFlights = [];
    $("#results").empty();
}

function inputCollection() {
    //origin place
    origin = $("#origin").val();
    //from date
    fromDT = $("#fromDT").val();
    //to date
    toDT = $("#toDT").val();
    //max price
    price = $("#price").val();

};

function inputValidation() {
    if (!$.isNumeric(price) || price <= 0) {
        $("#results").text("Please put correct price!");
        inputValid = false;
    };

    var now = moment();
    now = moment(now).add(1, "days");
    now = moment(now).format("YYYY-MM-DD");
    if (toDT < fromDT) {
        $("#results").text("Please pick correct end date!");
        inputValid = false;
    };
    
    if (fromDT < now){
        $("#results").text("The start date is a past date. Please pick correct start date!");
        inputValid = false;
    };
};

function inputConversion() {
    var cityState = origin.split(",");
    city = cityState[0];
    stateCode = cityState[1];
    startDateTime = fromDT + "T00:00:00Z";
    endDateTime = toDT + "T00:00:00Z"
    var place = $.grep(placesArray, function (n){
        return (n.CityName === city);
    });
    cityCode = place[0].SkyscannerCode;
}

function skyAPI() {
    skyUrl();
    var queryURL = skyUrl();
    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(filterFlights);
};

function skyUrl() {
    queryURL = "https://partners.api.skyscanner.net/apiservices/browsequotes/v1.0/US/usd/en-US/" + cityCode + "/us/" + fromDT + "/" + toDT + "?";
    queryParams = {
        "apikey": "prtl6749387986743898559646983194",
    };
    return queryURL + $.param(queryParams);
};

function filterFlights(response) {
    if (response.Quotes.length === 0) {
        noQuoteMessage = "no quote is available at this time!";
    }
    else {
        for (var i=0; i<response.Quotes.length; i++) {
            if(response.Quotes[i].MinPrice <= price){
                var destinationCode = response.Quotes[i].OutboundLeg.DestinationId;
                var place = $.grep(placesArray, function (n){
                    return (n.PlaceId === destinationCode);
                });
                var destinationCity = place[0].CityName;
                selectedFlights.push({
                        "destinationCity": destinationCity,
                        "price": response.Quotes[i].MinPrice
                    }
                )
            }
        }
        returnFlights();
    };
};

function returnFlights() {
    var $section = $("<section>");
    var $divContainer = $("<div>");
    $divContainer.attr("class", "container");
    
    if (selectedFlights.length === 0 ){
        noQuoteMessage = "no quote is available at this time! You might want to increase the price.";
    }
    else {
        for (var i = 0; i < selectedFlights.length; i++) {
            var $button = $("<button>");
            $button.text(selectedFlights[i].destinationCity + "," + selectedFlights[i].price);
            $button.attr("class", "flightButton");
            $button.css("display", "block");
            $button.attr("id", i);
            $button.attr("value", selectedFlights[i].destinationCity);
            $divContainer.append($button);
        };
    };
    if (noQuoteMessage === ""){
        $section.append($divContainer);
        $("#results").append($section);
    }
    else {
        $("#results").text(noQuoteMessage);
        noQuoteMessage = "";
    }
};

//functions to call event api
function eventFunction() {
    $(".eventSection").empty();
    selectedEvents = [];
    eventCity = $(this).attr("value");
    buttonID = "#" + $(this).attr("id");
    eventAPI();
};

function eventAPI() {
    var queryURL = eventUrl();
    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(filterEvents);
}

function eventUrl() {
    queryURL = "https://app.ticketmaster.com/discovery/v2/events.json?";
    queryParams = {
        "apikey": "RiZRkyV5YlnXPcOPAlrXwWG4IMbwx2n8",
        "countryCode": "US"
    };
    queryParams.city = eventCity;
    queryParams.startDateTime = startDateTime;
    queryParams.endDateTime = endDateTime;
    return queryURL + $.param(queryParams);
};

function filterEvents(response) {
    var eventCount = 0;
    if (response.page.totalElements === 0) {
        noEventMessage = "no event is available at this time!"
    }
    else if (response._embedded.events.length > 3) {
        eventCount = 3;
    }
    else {
        eventCount = response._embedded.events.length;
    };
    if (eventCount > 0){
        for (var i = 0; i < eventCount; i++) {
            selectedEvents.push({
                "eventName": response._embedded.events[i].name,
                "eventURL": response._embedded.events[i].url
            });
        };
    };
    returnEvents();
    weatherAPI();
};

function returnEvents() {
       
    var section = $("<section>");
    var divContainer = $("<div>");
    section.attr("class", "eventSection");
    divContainer.attr("class", "container");
    if (selectedEvents.length !== 0){    
        for (var i = 0; i < selectedEvents.length; i++) {
            var eventButton = $("<button>");
            var eventLink = $("<a>");
            eventLink.text(selectedEvents[i].eventName);
            eventLink.attr("href", selectedEvents[i].eventURL);
            eventLink.attr("target", "_blank");
            eventButton.append(eventLink);
            divContainer.append(eventButton);

        };
    } else {
        divContainer.text(noEventMessage);
        noEventMessage = "";
    }
    section.append(divContainer);
    $(buttonID).append(section);
};

//functions to call weather api
function weatherAPI() {
    weatherUrl();
    var queryURL = weatherUrl();
    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(returnWeather);
};

function weatherUrl() {
    queryURL = "https://api.openweathermap.org/data/2.5/weather?";
    queryParams = {
        "apikey": "710caaee5eb7962fcebb2ea857da3696"
    };
    queryParams.q = eventCity + ",us";
    queryParams.units = "imperial";
    return queryURL + $.param(queryParams);
};

function returnWeather(response) {
    var section = $("<section>");
    var divContainer = $("<div>");
    section.attr("class", "weatherSection");
    divContainer.attr("class", "container");
    divContainer.text("Current Weather: " + response.main.temp + ", " + response.weather[0].description);
    section.append(divContainer);
    $(buttonID).append(section);
};     

//script starts
$("#submit").on("click", mainFunction);
$(document).on("click", ".flightButton", eventFunction);

//loading places from firebase
refPlaces.once("value", function(snapshot){
    placesArray = snapshot.val();
});



