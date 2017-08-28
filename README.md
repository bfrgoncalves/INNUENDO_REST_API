# INNUENDO Platform 

**A novel cross-sectorial platform for the integration of genomics in surveillance of foodborne pathogens**

1. [**Setting the Environment**](#setting-the-environment)
    * Virtual Environment
    * requirements.txt
    * Bower components
2. [**PostgresQL database**](#postgresql-database)
    * Install PostgresQL
    * Create the platform user
    * Create the DB
    * Set password for the user
    * Change configuration file
    * Create/Load the database structure
3. [**Redis**](#redis)
    * Install Redis
    * Launch Redis
4. [**Nginx server**](#nginx-server)
    * Install Nginx
    * Create a new configuration file
    * Create a SSL certificate
    * Add to sites available
    * Restart Nginx 
5. [**Setup AllegroGraph**](#setup-allegrograph)
    * Install AllegroGraph Server
    * Add more recent NGSOnto file
    * Adding Namespaces and removing duplicates
    * Install AllegroGraph Client
6. [**LDAP**](#ldap)
    * Install LDAP Server
    * Install phpldapadmin
    * Setup ldap nginx configuration file
    * Install/Setup LDAP CLient
    * Setup SFTP (SSH) with LDAP


## Setting the Environment

#### Virtual Environment

Create a virtual environment inside the repository folder with the name "flask" (`mkdir flask`). Everything will be installed there so that your main Python packages are not affected.

Install Python VirtualEnv - `sudo apt-get install python-virtualenv`

Run virtualenv inside the `flask` folder - `virtualenv flask`

#### requirements.txt

Install the `requirements.txt` file using pip.

`flask/bin/pip install -r requirements.txt`

Due to some lack of dependencies, you might also need to install the following python packages:

```
https://stackoverflow.com/questions/11618898/pg-config-executable-not-found
https://stackoverflow.com/questions/28253681/you-need-to-install-postgresql-server-dev-x-y-for-building-a-server-side-extensi
https://stackoverflow.com/questions/23937933/could-not-run-curl-config-errno-2-no-such-file-or-directory-when-installing
https://stackoverflow.com/questions/21530577/fatal-error-python-h-no-such-file-or-directory
http://thefourtheye.in/2013/04/20/installing-python-ldap-in-ubuntu/
```

#### Bower components

Bower is used to fetch all the client-side components required to create the user interface.

[Install NodeJS](https://nodejs.org/en/download/package-manager/):

```
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs
```

[Install Bower](https://bower.io/#install-bower):

```
npm install -g bower
```

Install Bower components by running `bower install` inside the `INNUENDO_REST_API/app` folder.

## PostgresQL database

PostgresQL is used in the application to store all information to be displayed to the user.

#### Install PostgresQL

```
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```
#### Create the platform user

```
#Enter with the default "postgres" user and create a new user for wthe application
#Change the version according to the installed postres version.
 
sudo -u postgres /usr/lib/postgresql/9.X/bin/createuser innuendo
```
#### Create the DB

Launch psql with the default postgres user:

`sudo -u postgres psql postgres`

Inside psql, set a password for the default postgres user:

`\password postgres`

Change the permissions of the previously created user to allow the creation of databases:

`ALTER USER innuendo CREATEDB;`

Create the innuendo database:

`CREATE DATABASE innuendo OWNER innuendo;`

Exit psql with `\q`

#### Change configuration file

Locate the postgres `pg_hba.conf` file. It Should be at `/etc/postgresql/9.X/main/`.

Open it and replace all METHOD column to `trust`.

Restart postgresql using:

`sudo service postgresql restart`


#### Set password for the user
Launch psql with the created user

`sudo -u innuendo psql innuendo`

Inside psql, set a password for the default postgres user:

`\password innuendo`

Exit psql with `\q`

#### Change configuration file (AGAIN)

Locate the postgres `pg_hba.conf` file. It Should be at `/etc/postgresql/9.X/main/`.

Open it and replace all METHOD column to `md5`.

Restart postgresql using:

`sudo service postgresql restart`


#### Create/Load the database structure

Load the database structure using a set of commands defined by the Flask-Migrate package:

```
#Inside de INNUENDO_REST_API folder run,
 
./manage.py db init --multidb #Initialize db
./manage.py db migrate #Sets a new version of the db
./manage.py db upgrade #Populates the DB with the new reated version.
```

## Redis
Redis is used in the application to control a redis queue for the nomenclature classification part.

#### Install Redis
```
wget http://download.redis.io/redis-stable.tar.gz
tar xvzf redis-stable.tar.gz
cd redis-stable
make
```

It might give an error when installing. If so, check this [link](https://askubuntu.com/questions/58869/how-to-sucessfully-install-redis-server-tclsh8-5-not-found-error).


#### Launch Redis

Launch redis using `redis-server`.

## Nginx server

## Setup AllegroGraph

## LDAP