// ******** THIS IS THE MAIN SCRIPT THAT RENDERS THE MAP AND DATA ON THE PAGE **********
        
        
// The latitude and longitude to be stored from the browser
var latitude,longitude;    

$(document).ready(function(){


    // **** Connect SocketIO ******    

    // start up a SocketIO connection to the server 
    // Needed to change insecure connection --> Orignal: var socket = io.connect('http://' + document.domain + ':' + location.port);

    /* for production */
    var socket = io.connect('https://' + document.domain, {secure: true});
    
    /* for testing */ 
    // var socket = io.connect('http://' + document.domain + ':' + location.port);


    // Event handler for new connections.
    // The callback function is invoked when a connection with the server is established.
    socket.on('connect', function() {
        console.log('connected');
        // Successful connection message
        socket.emit('connection_msg', {data: 'I\'m connected!'});
    });   




    // **** Detect Geo Location ******

    if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition(handle_geolocation_query,handle_errors);

    } else {

        alert('Device probably not ready.');

    }

    function handle_geolocation_query(position){  

        // About: This function determines the current lat/lon of the browser and emits that data to the backend via socket io.

        latitude = (position.coords.latitude);
        longitude = (position.coords.longitude);
        console.log(latitude, longitude);

        // Once the latitude and longitude are established, we transmit this data to location_test.py
        socket.emit('my event', {data: [latitude,longitude]});

    return false;
    //onPositionReady();
}
    function onPositionReady() {
        console.log(latitude, longitude);
        // proceed
    }        

    // Error handingling if geolocation fails.
    function handle_errors(error) {  
        console.log("error");
    }



    // **** SocketIO ******    

    // About This section:
    // This is where the magic begins. The frontend and backend talk through socket.io. 

    socket.on('my_response', function(msg) {

        // About this function:
        // After python has processed the current user's lat/lon and determined the top 5 stations closest to their position,
        // the python file location_test.py emits all station data back to the browser in a message called 'my_response'
        // This function then parses all of that data for display on the map and other key metrics. 


        // the following lines parse 'msg' back from 'my_response' and stores the closest station's attribute data into vars

        // store msg.data into a variable called arr    
        var arr = msg.data[0];
        console.log(arr);


        // Closest Route Lat Long Array
        var plot_route = msg.data[1];
        console.log(plot_route[0]);
        console.log(plot_route);



        // parse arr and find key data points for the closest station

        var closest_stn_lat = arr[0][4];                                        // station latitude
        var closest_stn_lon = arr[0][5];                                        // station longitude
        var closest_stn_name = arr[0][2];                                       // station name / intersection
        var closest_stn_distance = arr[0][1]*1000;                              // distance to station in terms of meters
        var closest_stn_bikes_avail = arr[0][6];                                // number of bikes available at station
        var last_updated = "Last Updated: " + arr[0][9]                        // when the data was last updated

        // Now that we have the closest stations data, let's render this data on the page in their respective html tags 

        $('#closest-station-name').html(closest_stn_name);                      // closest station name
        $('#closest-station-distance').html(closest_stn_distance.toFixed(0));   // closest station's distance in meters
        $('#closest-station-bikes-avail').html(closest_stn_bikes_avail);        // number of bikes available at station
        $('#last-updated').html(last_updated);                                  // when the data was last updated


        // ***** Building the Folium / Leaflet map ******

        // Within this section, we will:
        //  1. Generate a map
        //  2. Add the current user's position to the map with a location marker
        //  3. Render the top 5 closest stations on the map
        //  4. Create a table of the top 2 to 5 closest stations

        // You can set geo boundries on a map if needed. For now, let's set it to null. 
        var bounds = null;

        // 1. Generate a map

        // Let's generate the attributes of the map
        var map_65d7746a8f474663b08f410179dc7d40 = L.map(
            'map_65d7746a8f474663b08f410179dc7d40', {
            center: [latitude, longitude],                                      // Lat/Lon Coordinates we want to center map on
            zoom: 15,                                                           // How far to zoom in
            maxBounds: bounds,                                                  // no boundries to our map
            layers: [],
            worldCopyJump: false,
            crs: L.CRS.EPSG3857,
            zoomControl: true,
            });


        // Additional attributes of the map
        var tile_layer_3401643f587f4bd8bf6b28898e20bd3f = L.tileLayer(
            'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',     // style of the map 
            {
            "attribution": null,
            "detectRetina": true,                                               // detect if retina display
            "maxNativeZoom": 18,
            "maxZoom": 18,
            "minZoom": 0,
            "noWrap": false,
            "subdomains": "abc"
            }).addTo(map_65d7746a8f474663b08f410179dc7d40);                     // Add everything to the map


        // 2. Add user's current location to the map

        // Determine user's current position and mark it on the map with a location marker
        var marker_cdfcc7dd21b0467c8b73a5752a5afbd5 = L.marker(
            [latitude, longitude],{
                icon: new L.Icon.Default()
                }
            ).addTo(map_65d7746a8f474663b08f410179dc7d40);


        // Create a pop-up bubble when the user clicks on their current position
        var popup_4ce58ca349a94404be9a53d906104f94 = L.popup({
            maxWidth: '300'
        });

        // Message to appear within the pop-up bubble: You are here
        var html_4942e830de7a47979226341bde58859f = $('<div id="html_4942e830de7a47979226341bde58859f" style="width: 100.0%; height: 100.0%;"><b>You are here</b></div>')[0];
        popup_4ce58ca349a94404be9a53d906104f94.setContent(html_4942e830de7a47979226341bde58859f);

        // bind the pop-up to the marker of the user's current position 
        marker_cdfcc7dd21b0467c8b73a5752a5afbd5.bindPopup(popup_4ce58ca349a94404be9a53d906104f94);


        // 3. Render the top 5 closest stations on the map

        // First, we'll create an array of ids, popups and html ids for each of the top 5 closest stations. 
        // This is used to identify and plot each station position on the map
        var points_on_map_ids = [
            ["circle_marker_4bf5c06b1f304e84897a1c08291af6a3","popup_1720344e1d8b4f5b941c5003e2e04816","html_14396b87cd3042c9ade66a65f2c5c58e"],
            ["circle_marker_49a28ded05e64350a8afe61924dd8960","popup_e7abdc0b9eda483eb4a9d21f26c49bd5","html_efb411b4490c400b84db0dc23fbe77c6"], 
            ["circle_marker_52bdb90e72924c958386ac0d123f5190","popup_3d2d8d9ff83b468fa8517e3bfed3cf2e","html_f1d6563b2d5848ab8a78f8c0e4ce1733"], 
            ["circle_marker_e838e49a0a2c49f0a5ad43eacedada19","popup_ee121dccf0bd4036b7e3394b45fab081","html_dbbf7d89a07645feb28284382bc5b326"], 
            ["circle_marker_b138ccc084ae4e359485ead66ea3f583","popup_7f22473f3d414bf2a5a00921bcf3756f","html_a4c107f02e354041a1b3d402004279e6"]

        ]


        // Next, we are going to loop through the arr (msg.data that python sent), parse and then add each point to the map
        for (var i=0; i < arr.length; i++) {

            var stn_id = arr[i][0]                              // station id
            var stn_dist = arr[i][1]                            // distance to station from current location
            var stn_loc = arr[i][2]                             // station name / location
            var stn_capacity = arr[i][3]                        // total bike capacity at the station
            var stn_lat = arr[i][4]                             // station latitude
            var stn_lon = arr[i][5]                             // station longitude
            var bikes_avail = arr[i][6]                         // bikes available at the station
            var docs_avail = arr[i][7]                          // number of open docs
            var stn_color = arr[i][8]                           // color of icon (red: 0 bikes avail, green: >1 bikes avail)

            console.log([stn_id, stn_lat, stn_lon])


            // **** Now let's plot each marker on the map ****

            var marker = points_on_map_ids[i][0]                // marker id
            var popup_id = points_on_map_ids[i][1]              // popup id for message in bubble
            var html = points_on_map_ids[i][2]                  // html id of marker


            // Create an if statement to determine whether or not a station has any bikes or not
            if (bikes_avail > 0) {
                    var bike_status_icon = 'https://cdn2.iconfinder.com/data/icons/circle-icons-1/64/bike-512.png'
            } else {
                    var bike_status_icon = 'https://www.garethcull.com/images/bike-512-red.png'

            }    

            // Plot station marker icons on the map
            marker = L.marker(
            [stn_lat, stn_lon],                                 // station lat / lon
            {
                icon: new L.Icon.Default()
                }
            ).addTo(map_65d7746a8f474663b08f410179dc7d40);      // add marker to map


            // Render icon on map based on if statement above
            var custom_icon_633aeb37e72f419988ca125d034fc874 = L.icon({
                iconUrl: bike_status_icon,                      // bike status icon (red or green)
                iconSize: [32,32]                               // size of icon in pixels
                });

            marker.setIcon(custom_icon_633aeb37e72f419988ca125d034fc874);

            // Size of the pop-up bubble when a user clicks on the bike status icon
            popup_id = L.popup({
                maxWidth: '300'
            });


            // Render a message in a pop-up bubble if user clicks on icon that displays # of bikes available at the station.    
            html = $('<div id="'+ html + '" style="width: 100.0%; height: 100.0%;">Bikes Available at ' + stn_loc + ': ' + bikes_avail + '</div>')[0];
            popup_id.setContent(html);

            // bind the marker with the pop-up message
            marker.bindPopup(popup_id)


            //  4. Create a table of the top 2 to 5 closest stations

            // Now let's generate and render a table of the 2nd-5th closest stations to the user's position
            if(i==0) {
                // skip the closest station - we don't need to add this to the table
            } else {

                var table = document.getElementById("myTable");         // Get table id
                var row = table.insertRow(-1);                          // Insert row at the end of the table
                var cell1 = row.insertCell(0);                          // First table column used for station location
                var cell2 = row.insertCell(1);                          // 2nd column = distance from station
                var cell3 = row.insertCell(2);                          // 3rd column = number of bikes available

                // Add top 2-5 station locations, distances and bikes available to table
                cell1.innerHTML = stn_loc;
                cell2.innerHTML = (stn_dist*1000).toFixed(0);
                cell3.innerHTML = bikes_avail;
            }


        }   // end for loop

        // Plot closest route on the map if available

        var route_to_map = []

        for (var i=0; i < plot_route.length; i++) {

            route_to_map.push(plot_route[i]);

        }

        console.log(route_to_map);


        if (plot_route = 0) {
                    // Don't do anything
                    console.log("No route to be plotted");

            } else {
                    // Plot the route
                    console.log("Plotting Closest Route");
                    var poly_line_cc9988716a9644949176ef1bea94f2a8 = L.polyline(
                                                                                route_to_map,
                                                    {
                                  "bubblingMouseEvents": true,
                                  "color": "#0A8A9F",
                                  "dashArray": null,
                                  "dashOffset": null,
                                  "fill": false,
                                  "fillColor": "#0A8A9F",
                                  "fillOpacity": 0.2,
                                  "fillRule": "evenodd",
                                  "lineCap": "round",
                                  "lineJoin": "round",
                                  "noClip": false,
                                  "opacity": 1.0,
                                  "smoothFactor": 1.0,
                                  "stroke": true,
                                  "weight": 2

                            }).addTo(map_65d7746a8f474663b08f410179dc7d40);

            }





    });     // end of my_response function


});         // end of document ready function