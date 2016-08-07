#!/bin/sh
#uat-services.sh
#author: dinesh.r@ideas2it.com

#Get the branch name from user
read -p "Which branch to pull (dev/master/demo)? " branch_name

echo "-------------------------------------------------------------------------"
#Pull dev code
if [ "master" = "$branch_name" ] || [ "dev" = "$branch_name" ] || [ "demo" = "$branch_name" ]; then
  echo "Pulling the branch $branch_name from pipecandy repo"
  git pull origin $branch_name
  echo "Successfully pulled out the code"
else
  echo "cannot pull the branch $branch_name"
  return
fi
echo "-------------------------------------------------------------------------"

#Stop pm2
pm2 stop all
echo "Application has been stopped"
echo "-------------------------------------------------------------------------"

#Install the node modules
echo "Installing node modules"
npm install
echo "Node modules has been successfully installed"
echo "-------------------------------------------------------------------------"

export NODE_ENV=uat

#Start pm2
echo "Starting the application"
pm2 restart all
echo "Application has been successfully started"
echo "-------------------------------------------------------------------------"
