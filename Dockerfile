FROM nginx:latest

#author 
MainTAINER kony

#Copy the static page files from the current maze_game directory to the /usr/share/nginx/html directory in the image
COPY ./  /usr/share/nginx/html

EXPOSE 80

#Copy nginx/default.conf to /etc/nginx/conf.d/default.conf