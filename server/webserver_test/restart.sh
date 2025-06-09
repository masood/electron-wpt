docker stop test
docker rm test
docker build -t express_server .
docker run -v /home/cla/webserver_test/public:/usr/src/app/public -p 80:3000 -p 443:443 -it --name test express_server