#Pipecandy

#Installation Guide

##Development Setup
###Prerequisites

This guide was prepared on a machine with the following configuration:

* Ubuntu 14.04
* Nodejs(Recommended v4.5.0 or v6.6.0)  
* Postgresql 9.5  
  Create the postgres user and grant access to the database:  
  1. CREATE USER pguser WITH PASSWORD 'pgpass';
  2. CREATE DATABASE pipecandy;
  3. GRANT ALL PRIVILEGES ON DATABASE "pipecandy" to pguser;
* Redis Server 2.8.4
* Spamassassin installation
  $ sudo apt-get install spamassassin spamc

  To Enable the spamd
  $ $ sudo gedit /etc/default/spamassassin

  # Change to one to enable spamd
  ENABLED=1

  Restart the sampd demon using
  sudo /etc/init.d/spamassassin start  

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
