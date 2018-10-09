# Project Bikey McBike

### Contents
What is Project Bikey McBike?<br/>
How does this app work?<br/>
Requirements<br/>
Demo<br/>


### What is Project Bikey McBike?

Recently, I put together a series of posts about how to plot ride and bike sharing data on a map using python. As someone who loves hacking away on data and building data driven products, I thought it would be fun to take the code behind those tutorials and transform it into a simple bike sharing application using the Flask microframework and SocketIO. And then in true open source fashion, i'll document how it works and post the code online for anybody who wants to learn how to create a simple data-driven sharing app. 

Feel free to fork, and even replace bike share data with other data feeds of your own. 
<br/>

### How does this app work. 

At a high level, this app does the following:

1. Asks the user for access to their GEO location
2. Once the user grants access, the client sends the user's geolocation data server side 
3. A python script then takes that geolocation data and determines the top 5 closest bike share stations to their position (using geopy and some open data from the City of Toronto) and how many bikes are available to rent.
4. The python script then determines the route to the closest bike share station using openrouteservice
5. The python script then passes back to the client all of the latitudes and longitudes for the top 5 closest stations, the shortest route and bike availability information. 
6. Then the client renders the user's position, top 5 closest stations and the route to the closest station. 
7. The client also renders metrics about distance to each top station and the number of bikes available to rent.


### What does this app look like?

{{INSERT SCREENSHOT}}


### Requirements

This app uses the following python libraries, which you will need to install:

- numpy
- geopy
- openrouteservice
- datetime
- flask
- flask_socketio
- requests

On the client side:

- jquery
- leaflet.js
- bootstrap

I also installed Termux on the Play Store to run the app locally on my phone.


### Main files to review how it works

Essentially, main functionality of the app is contained within the following files:

1. main_mobile.py - this is the main script which aggregates and transforms data from the client (geo) and bikeshare data
2. bikeshare_np.py - this is a helper script which determines distances and other information about each bikestation.
3. /static/location.html - this is the index page which renders the map and all of the data.


### Demo

I'll put this up on a server shortly.


### Useful Reference Links

Here are some links that I found very useful:

- Flask: http://flask.pocoo.org/
- SocketIO: https://flask-socketio.readthedocs.io/en/latest/
- How to Create a Local Server on your Mobile: http://neilkarwasra.blogspot.com/2017/08/how-to-install-and-run-python-flask-web_15.html








