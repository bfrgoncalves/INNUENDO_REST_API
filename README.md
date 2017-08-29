# INNUENDO Platform 

**A novel cross-sectorial platform for the integration of genomics in surveillance of foodborne pathogens**

To configure the process controller, continue to this [link](https://github.com/bfrgoncalves/INNUENDO_PROCESS_CONTROLLER)

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

> #### Virtual Environment

Create a virtual environment inside the repository folder with the name "flask" (`mkdir flask`). Everything will be installed there so that your main Python packages are not affected.

Install Python VirtualEnv - `sudo apt-get install python-virtualenv`

Run virtualenv inside the `flask` folder - `virtualenv flask`

> #### requirements.txt

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

> #### Bower components

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

> #### Install PostgresQL

```
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```
> #### Create the platform user

```
#Enter with the default "postgres" user and create a new user for wthe application
#Change the version according to the installed postres version.
 
sudo -u postgres /usr/lib/postgresql/9.X/bin/createuser innuendo
```
> #### Create the DB

Launch psql with the default postgres user:

`sudo -u postgres psql postgres`

Inside psql, set a password for the default postgres user:

`\password postgres`

Change the permissions of the previously created user to allow the creation of databases:

`ALTER USER innuendo CREATEDB;`

Create the innuendo database:

`CREATE DATABASE innuendo OWNER innuendo;`

Exit psql with `\q`

> #### Change configuration file

Locate the postgres `pg_hba.conf` file. It Should be at `/etc/postgresql/9.X/main/`.

Open it and replace all METHOD column to `trust`.

Restart postgresql using:

`sudo service postgresql restart`


> #### Set password for the user
Launch psql with the created user

`sudo -u innuendo psql innuendo`

Inside psql, set a password for the default postgres user:

`\password innuendo`

Exit psql with `\q`

> #### Change configuration file (AGAIN)

Locate the postgres `pg_hba.conf` file. It Should be at `/etc/postgresql/9.X/main/`.

Open it and replace all METHOD column to `md5`.

Restart postgresql using:

`sudo service postgresql restart`


> #### Create/Load the database structure

Load the database structure using a set of commands defined by the Flask-Migrate package:

```
#Inside de INNUENDO_REST_API folder run,
 
./manage.py db init --multidb #Initialize db
./manage.py db migrate #Sets a new version of the db
./manage.py db upgrade #Populates the DB with the new reated version.
```

## Redis
Redis is used in the application to control a redis queue for the nomenclature classification part.

> #### Install Redis
```
wget http://download.redis.io/redis-stable.tar.gz
tar xvzf redis-stable.tar.gz
cd redis-stable
make
```

It might give an error when installing. If so, check this [link](https://askubuntu.com/questions/58869/how-to-sucessfully-install-redis-server-tclsh8-5-not-found-error).


> #### Launch Redis

Launch redis using `redis-server`.

## Nginx server

Nginx is used here to create web-servers for each application. This will allow the connection between applications using each REST Api. 

> #### Install Nginx

`sudo apt-get install nginx`

> #### Create a new configuration file

Add a new configuration file named `innuendo.com` which will be used to allow Nginx to be set as a reverse proxy for the AllegroGraph and INNUENDO_REST_API Flask App.

Fill with the following:

```
server {
	    listen 80 default_server;
	    listen [::]:80 default_server;
	    
	    listen 443 ssl;
	    server_name _;
	    
	    ssl_certificate /etc/nginx/ssl/nginx.crt;
            ssl_certificate_key /etc/nginx/ssl/nginx.key;
	    
	    location /app {
		#rewrite ^/app/(.*) /$1  break;
	        proxy_pass http://localhost:5000;
	    }

	    location / {
	        # First attempt to serve request as file, then
	        # as directory, then fall back to displaying a 404.
		#rewrite ^/allegro/(.*) /$1  break;
	        proxy_pass http://localhost:10035;
	    }
	    
	    location /jobs {
                # First attempt to serve request as file, then
                # as directory, then fall back to displaying a 404.
                #rewrite ^/jobs/(.*) /$1  break;
                proxy_pass http://localhost:5001;
            }	

	    location /ldap/ {
                # First attempt to serve request as file, then
                # as directory, then fall back to displaying a 404.
                rewrite ^/ldap/(.*) /$1  break;
                proxy_pass http://localhost:81;
            }

}
```

> #### Create a SSL certificate

Create the SSL certificate that will allow to use HTTPS.

```
sudo mkdir /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/nginx/ssl/nginx.key -out /etc/nginx/ssl/nginx.crt
```

> #### Add to sites available

Add `innuendo.com` file to the sites available and then create a symlink to the sites enabled on Nginx.

```
#Move the file to the sites-available folder of Nginx
mv innuendo.com /etc/nginx/sites-available/

#Go to that folder
cd /etc/nginx/sites-available/

#Link that file to one on the sites-enabled folder
ln -s /etc/nginx/sites-available/innuendo.com /etc/nginx/sites-enabled/
```

> #### Restart Nginx

`sudo service restart nginx`

## Setup AllegroGraph

## LDAP

Centralized authentication system that will be used to authenticate the user on all applications.

> #### Install LDAP Server

`sudo apt-get install slapd ldap-utils`
```
#Choose these options on the installer

Omit openLDAP config: No
base DN of the LDAP directory: innuendo.com
organization name: innuendo
Database backend to use: HDB
Database removed when slapd is purged: No
MOve old database: Yes
Allow LDAPv2 protocol: No
```

> #### Install phpldapadmin

phpLdapAdmin is a web interface for user management. It will link to LDAP.

`apt-get install phpldapadmin`

Follow the instructions on this tutorial for the configuration:

https://www.digitalocean.com/community/tutorials/how-to-install-and-configure-openldap-and-phpldapadmin-on-an-ubuntu-14-04-server

> #### Setup ldap nginx configuration file

Create a new nginx server configuration file for LDAP called `ldap.com`

Fill with the following:

```
server {
        listen 81;
        root /usr/share/phpldapadmin/htdocs;
        index index.php index.html;

        server_name localhost;

        location ~ \.php$ {
           try_files $uri =404;
           #Include Nginx’s fastcgi configuration
           include /etc/nginx/fastcgi.conf;
           #Look for the FastCGI Process Manager at this location
           fastcgi_pass unix:/run/php/php7.0-fpm.sock;
        }

}
```

> #### Install/Setup LDAP Client

Follow the tutorial at:

https://www.digitalocean.com/community/tutorials/how-to-authenticate-client-computers-using-ldap-on-an-ubuntu-12-04-vps

On the part of the groups creation, you will need to create two groups, the **innuendo_users** group and the **admin** group. They will be assigned to different users depending on their permissions.

You will need information provided when installing the LDAP server, mainly the server domain of the ldap server.

After the tutorial, change the skel structure when creating a new user.

```
cd /etc/skel
sudo mkdir ftp
sudo mkdir ftp/files
```

Restart nscd:

`sudo /etc/init.d/nscd restart`

> #### Setup SFTP (SSH) with LDAP

Open the ssh config file:

`sudo nano /etc/ssh/sshd_config`

At the end of the file, replace the Subsystem line and add the two Match Group entries described bellow.
This will only allow sftp connection of the innuendo users and will only allow to access to their home directory.

```
#Subsystem sftp /usr/lib/openssh/sftp-server
Subsystem sftp internal-sftp

# Set this to 'yes' to enable PAM authentication, account processing,
# and session processing. If this is enabled, PAM authentication will
# be allowed through the ChallengeResponseAuthentication and
# PasswordAuthentication.  Depending on your PAM configuration,
# PAM authentication via ChallengeResponseAuthentication may bypass
# the setting of "PermitRootLogin without-password".
# If you just want the PAM account and session checks to run without
# PAM authentication, then enable this but set PasswordAuthentication
# and ChallengeResponseAuthentication to 'no'.
UsePAM yes

Match Group innuendo-users
    ChrootDirectory %h/ftp
    AllowTCPForwarding no
    X11Forwarding no
    ForceCommand internal-sftp

Match Group admin
    ChrootDirectory %h/ftp
    AllowTCPForwarding no
    X11Forwarding no
    ForceCommand internal-sftp
```

Restart ssh:

`sudo /etc/init.d/ssh restart`

## Next steps

To configure the process controller, proceed [here](https://github.com/bfrgoncalves/INNUENDO_PROCESS_CONTROLLER) to do it.