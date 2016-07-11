#!/bin/sh
#build.sh
#author: dinesh.r@ideas2it.com

#Get the branch name from user
read -p "Which branch to pull (dev/master)? " branch_name

#Ask if automigration is required
read -p "Do you need to run automigration (y/n)? " automigration

echo "-------------------------------------------------------------------------"
#Pull dev code
if [ "master" = "$branch_name" ] || [ "dev" = "$branch_name" ]; then
  echo "Pulling the branch $branch_name from pipecandy repo"
  git pull origin $branch_name
  echo "Successfully pulled out the code"
else
  echo "cannot pull the branch $branch_name"
  return
fi
echo "-------------------------------------------------------------------------"

#Stop pm2
pm2 stop pipecandy
echo "Application has been stopped"
echo "-------------------------------------------------------------------------"

#http://unix.stackexchange.com/questions/37313/how-do-i-grep-for-multiple-patterns
SERVICES='campaignConsumer\|followUpSender\|emailQueuePoller\|campaignMailSender\|mailDequeue\|initEmailReader'
#http://stackoverflow.com/questions/13910087/shell-script-to-capture-process-id-and-kill-it-if-exist
PID=`ps -eaf | grep $SERVICES | grep -v grep | awk '{print $2}'`
if [ "" !=  "$PID" ];
then
  echo "killing the process like campaignConsumer, followUpSender, emailQueuePoller"
  kill -9 $PID
  echo "Killed the running process sucessfully"
else
  echo "No process found to kill"
fi
echo "-------------------------------------------------------------------------"

#Install the node modules
echo "Installing node modules"
npm install
echo "Node modules has been successfully installed"
echo "-------------------------------------------------------------------------"

#Install the bower components
echo "-------------------------------------------------------------------------"
echo "Installing bower components"
bower install
echo "Installed the bower components successfully"
echo "-------------------------------------------------------------------------"

#Run automigration if required or just autoupdate
if [ "y" = $automigration ]; then
  echo "Running automigration"
  npm run automigration
  echo "Automigration has been sucessfully completed"
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

export NODE_ENV = "dev"

#Start the services/process
#http://stackoverflow.com/questions/23024850/nohup-as-background-task-does-not-return-prompt
echo "Starting the campaign sending services campaignConsumer, followUpSender, emailQueuePoller"
nohup npm run campaignConsumer > log/campaignConsumer.out 2>&1 &
#nohup npm run campaignMailSender > log/campaignMailSender.out 2>&1 &
nohup npm run mailDequeue > log/mailDequeue.out 2>&1 &
nohup npm run initEmailReader > log/initEmailReader.out 2>&1 &
#nohup npm run followUpSender > log/followUpSender.out 2>&1 &
nohup npm run emailQueuePoller > log/emailQueuePoller.out 2>&1 &
echo "Successfully started the process"
echo "-------------------------------------------------------------------------"

#Start pm2
echo "Starting the application"
pm2 start pipecandy
echo "Application has been successfully started"
echo "-------------------------------------------------------------------------"
