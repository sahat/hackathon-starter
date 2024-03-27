
# Set up Guacd
echo Creating guacd container...
docker run -d \
    --name guacd \
    guacamole/guacd

# Set up Postgres image
echo Creating postgres container...
docker run -d \
    --name guac-postgres \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=$PASSWD \
    -v /docker/data/guacamole/database:/var/lib/postgresql/data   \
    postgres
    
echo "Do you want to initialize the database? If you already have a working guacamole schema, choose no! (yes/no)"
read input
if [ "$input" == "yes" ]
then
  echo Creating the database, user, and applying the schema per: 
  echo http://guacamole.apache.org/doc/gug/jdbc-auth.html#jdbc-auth-postgresql

  # make sql script
  echo Making init DB scripts...
  docker run --rm guacamole/guacamole /opt/guacamole/bin/initdb.sh --postgres > /tmp/initdb.sql

  # Copy scripts into postgres
  echo Copying init DB script into postgres container...
  docker cp /tmp/initdb.sql guac-postgres:/initdb.sql

  # Create the DB
  echo Creating guacamole db...
  docker exec -u postgres guac-postgres createdb guacamole_db

  # Run the DB init
  echo Pre-populating guacamole db...
  docker exec -u postgres guac-postgres psql guacamole_db postgres -f /initdb.sql
fi

# set up guacamole
echo Creating guacamole container
docker run -d \
    --name guacamole \
    --link guacd:guacd \
    --link guac-postgres:postgres \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=$PASSWD \
    -e POSTGRES_DATABASE=guacamole_db \
    -v /docker/data/guacamole/guacamole:/guac   \
    -e GUACAMOLE_HOME=/guac \
    -p 4080:8080 \
    guacamole/guacamole
