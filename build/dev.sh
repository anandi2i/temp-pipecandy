#!/bin/sh
#dev.sh
#author: dinesh.r@ideas2it.com

#Get the branch name from user
read -p "Which branch to pull (dev/master/demo)? " branch_name

#Ask if automigrate is required
read -p "Do you need to run automigrate (y/n)? " automigrate

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

#babelify the joi related node_modules
#sudo npm install -g babel-cli if babel is not installed globally
babel -d node_modules/joi/ node_modules/joi/
babel -d node_modules/topo/ node_modules/topo/
babel -d node_modules/hoek/lib/ node_modules/hoek/lib/
babel -d node_modules/isemail/lib/ node_modules/isemail/lib/

#Install the bower components
echo "-------------------------------------------------------------------------"
echo "Installing bower components"
bower install
echo "Installed the bower components successfully"
echo "-------------------------------------------------------------------------"

export NODE_ENV=dev

#Run automigrate if required or just autoupdate
if [ "y" = $automigrate ]; then
  echo "Running automigrate"
  npm run automigrate
  echo "automigrate has been sucessfully completed"
else
  echo "Running autoupdate"
  npm run autoupdate
  echo "Autoupdate has been sucessfully completed"
fi
echo "-------------------------------------------------------------------------"

#Bundle the front end code
echo "Bundling the front end code"
npm run build
echo "Successfully bundled the front end code"
echo "-------------------------------------------------------------------------"

#Start pm2
echo "Starting the application"
pm2 restart all
echo "Application has been successfully started"
echo "-------------------------------------------------------------------------"
