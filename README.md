#Pipecandy

#Installation Guide

##Development Setup
###Prerequisites

This guide was prepared on a machine with the following configuration:

* Ubuntu 14.04
* Ruby 1.9.3  
  To convert sass to css install the gem saas:  
    gem install sass
* Nodejs(Recommended v4.4.4 or v6.2.0)  
* Postgresql 9.3.12  
  Create the postgres user and grant access to the database:  
  1. CREATE USER pguser WITH PASSWORD 'pgpass';
  2. CREATE DATABASE pipecandy;
  3. GRANT ALL PRIVILEGES ON DATABASE "pipecandy" to pguser;
* Redis Server 2.8.4

#####One time installation
* Install strongloop  
  npm install -g strongloop
* Install bower  
  npm install -g bower
* Install gulp  
  npm install -g gulp

###Product Installation steps  
* Install node modules  
  npm install
* Install bower components  
  bower install

###Database autoupdate and automigration
* npm run autoupdate
* npm run automigrate

######Run the server:
npm start or gulp

######Open the browser and hit:
http://localhost:3001 (proxy to webpack dev server)
