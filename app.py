# Import Modules

from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from helper import get_closest_stn, join_stn_data, plot_route, fetch_data          # a helper python file
import numpy as np
from datetime import datetime

# Socket IO Flask App Setup

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

# disable caching
@app.after_request
def add_header(r):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    r.headers['Cache-Control'] = 'public, max-age=0'
    return r


# Flask App

@app.route('/')
def index():
    return render_template('map.html')


@socketio.on('my event')
def main(message):
    
    """
    Background: 
    This app fetches bike share data from the City of Toronto and the user's location from the client. It then determines the top 5 closest bike stations to the user and returns a route to the closest station prior to sending this information back to the client to be plotted on a map.
    
    Input: 
    message: GEO data that comes from the client containing the user's longitude and latitude. 
    
    Output:
    client_data: Socket_io sends (emits) data back to the client containing data from the top 5 closest stations to the user and 
                 any route information. This data will be used to plot the top 5 stations on a leaflet map. 
    
    """
    
    # Fetch 2 toronto bike share data feeds and store in stn_attr, stn_status
    stn_attr, stn_status = fetch_data()

    # Merge Station Information and Station Status
    all_stn_data = join_stn_data(stn_status, stn_attr)
    
    
    # Store User's Lat / Lon data from the client via socketio into a data variable
    # print(message)
    data = np.array(list(message.values()))
    
    # The user's lat / lon coordinates
    mylat = data[0][0]
    mylon = data[0][1]
    
    #  mycoord will be used in some functions from helper.py
    mycoord = [mylat,mylon]
    
    # get a list of stations and their distances sorted by closest station to the user's lat / lon
    distances_to_all = get_closest_stn(mycoord, all_stn_data)
    
    # Get the closest stations lat / lon and the user's distance to the closest station (in km)
    closest_lat = distances_to_all[0][4]
    closest_lon = distances_to_all[0][5]
    closest_distance = distances_to_all[0][1]
    
    # If the user's distance is less than 2 km away from a station,
    # fetch all of the lat/lon positions between the user and the closest station.
    if closest_distance <= 2:
        # get route lat / lon data
        route = plot_route(mylat,mylon,closest_lat,closest_lon)
        if route == None:
            route = 0
            print('No route data available')
        else:
            route
        print(route)
    else:
        # do nothing
        route = 0
        print("Route too far to plot")
    
    # slice distances_to_all and get the top 5 closest stations
    top5closest_stns = distances_to_all[0:5]
    
    # Prepare to send the top 5 closest stations and route information back to the client
    client_data = [top5closest_stns, route]
    #print(client_data)
    
    # Send the top 5 closest stations and route information back to the client
    emit('my_response', {'data': client_data})
    

if __name__ == '__main__':
    socketio.run(app)