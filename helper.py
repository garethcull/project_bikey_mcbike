import numpy as np
import geopy.distance                       # Used to calculate the distance between user and each bike stations.
import openrouteservice                     # Used to get lat / longs in between starting and ending lat / long
from openrouteservice import convert
from datetime import datetime
import requests                             # Used to fetch bike share data feeds
import pytz                                 # Used to convert utc time to eastern standard time


def fetch_data():
    
    """
    Background: 
    This function fetches 2 bike share data feeds from the City of Toronto and returns each in a variable.
    
    Inputs:
    None
    
    Outputs:
    stn_attr: data about each bike share station (eg. lat / lon information, station name, etc)
    stn_status: data used to determine how many bikes are available for each station and timestamp for when this data was last updated
    
    """
    
    # Station Information
    stn_url = "https://tor.publicbikesystem.net/ube/gbfs/v1/en/station_information"
    r = requests.get(stn_url)
    station_attr = r.json()
    stn_attr = station_attr['data']['stations']


    # Station Status
    stn_stats = "https://tor.publicbikesystem.net/ube/gbfs/v1/en/station_status"
    stats_data = requests.get(stn_stats)
    stn_data = stats_data.json()
    stn_status = stn_data['data']['stations']
    
    return stn_attr, stn_status
    
    

def get_closest_stn(mycoord,all_stn_data):
    
    """
    Background: The function will calculate the distance between the user and all bike share stations.
    
    Inputs:
    
    mycoord: This is the user's lat long as determined by the client.
    all_stn_data: This is all of the bikeshare station data that was merged and joined. 
    
    Outputs:
    
    distances_to_all: A list of all of the distances between the user's position and each bike station, in addition to some metrics about num of bikes available, timestamp for when the data was last updated, etc.
    
    """

    distances = []

    #for index, row in station_attr.iterrows():
    
    for i in range(len(all_stn_data)):
        
        
        #coordinates of the station
        slat = all_stn_data[i][6]
        slon = all_stn_data[i][7]
        
        # need to pass sgeo into geopy function below
        sgeo = (slat,slon)

        # additional detail about the station to return
        sid = all_stn_data[i][0]
        sname = all_stn_data[i][5]
        capacity = all_stn_data[i][8]
        bikes_avail = all_stn_data[i][1]
        docks_avail = all_stn_data[i][2]
        last_updated = all_stn_data[i][3]
        
        
        # Convert UTC into Eastern Standard Time
        last_updated = datetime.utcfromtimestamp(last_updated).strftime('%Y-%m-%d %H:%M:%S')
        convert = datetime.strptime(last_updated, '%Y-%m-%d %H:%M:%S')

        # Use pytz to set time to UTC then convert to eastern
        utc = pytz.timezone('UTC')
        aware_date = utc.localize(convert)
        eastern = pytz.timezone('US/Eastern')
        eastern_time = aware_date.astimezone(eastern).strftime('%Y-%m-%d %H:%M:%S')
        print([last_updated, eastern_time])
        
        # Set marker colors of bike icons to red if bikes avail = 0, else set to green.
        if bikes_avail == 0:
            marker_color = '#ed1c24'
            pop_up = 'The number of bikes available at STN#' + str(sid) + ": 0"
            
        else:
            marker_color = '#00a651'
            pop_up = 'The number of bikes available at STN#' + str(sid) + ": " + str(bikes_avail)
               
        
        # Calculate the distance
        distance = geopy.distance.vincenty(mycoord, sgeo).km
        #print(distance)
        distances.append([sid, distance, sname, capacity, slat, slon, bikes_avail,docks_avail, marker_color, eastern_time])
        
        #print(distances)
        distances_to_all = distances
        
        # sort all stations by distance to my coord
        distances_to_all.sort(key=lambda tup: tup[1]) 
        
        
    
    return distances_to_all


def join_stn_data(stn_status, stn_attr):
    
    """
    Background: The function joins two bike share datasets into one on station_id.
    
    Inputs:
    
    stn_status: status of each station from the following feed - https://tor.publicbikesystem.net/ube/gbfs/v1/en/station_status
    stn_attr: station data from the following feed - https://tor.publicbikesystem.net/ube/gbfs/v1/en/station_information

    
    Outputs:
    
    joined_data: a list of joined data between stn_status and stn_attr
    
    """

    joined_data = []

    for index, row in np.ndenumerate(stn_status):

            # Find index for each row and join on station_id
            find_index = next((index for (index, stn_attr) in enumerate(stn_attr) if stn_attr["station_id"] == row['station_id']), None)

            try:
                join_sid = stn_attr[find_index]['station_id']
                join_address = stn_attr[find_index]['name']
                join_lat = stn_attr[find_index]['lat']
                join_lon = stn_attr[find_index]['lon']
                join_capacity = stn_attr[find_index]['capacity']
                join_pay = stn_attr[find_index]['rental_methods']
                stn_data = [row['station_id'], 
                            row['num_bikes_available'], 
                            row['num_docks_available'], 
                            row['last_reported'], 
                            join_sid,
                            join_address,
                            join_lat,
                            join_lon,
                            join_capacity,
                            join_pay]
                
                # append all joined data in list joined_data
                joined_data.append(stn_data)

            except:
                pass


    return joined_data


def plot_route(myLat,myLon,closestLat,closestLon):
    
    """
    Background:
    This function will return all of the paths / routes in latitudes and longitudes in between our starting and ending trip points.
    
    Inputs:
    
    myLat: the user's latitude coordinates
    myLon: the user's longitude coordinates
    closestLat: the closest station's latitude coordinates
    closestLon: the closest station's longitude coordinates
    
    Outputs:
    
    reverse: A list of lat long tuples for each trip. 
    
    """
    
    coords = ((myLon,myLat),(closestLon,closestLat))

            
    try:
        #Specify your personal API key
        client = openrouteservice.Client(key={{INSERT YOUR API KEY}}) 
        geometry = client.directions(coords)['routes'][0]['geometry']
        decoded = convert.decode_polyline(geometry)

        # We need to reverse the long / lat output from results so that we can graph lat / long
        reverse = [(y, x) for x, y in decoded['coordinates']]
        print(reverse)
    
    except:
        print('Api limit reached')
        reverse = None
    
    return reverse


