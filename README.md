# INNUENDO Platform 

**A novel cross-sectorial platform for the integration of genomics in surveillance of foodborne pathogens**

1. [**Setting the Environment**](#setting-the-environment)
    * Virtual Environment
    * requirements.txt
    * Bower components

2. [**PostgresQL database**]()
    * Install PostgresQL
    * Create the platform user
    * Create the DB
    * Set password for the user
    * Change configuration file
    * Create/Load the database structure

3. [**Redis**]()
    * Install Redis
    * Launch Redis

4. [**Nginx server**]()
    * Install Nginx
    * Create a new configuration file
    * Create a SSL certificate
    * Add to sites available
    * Restart Nginx
    
5. [**Setup AllegroGraph**]()
    * Install AllegroGraph Server
    * Add more recent NGSOnto file
    * Adding Namespaces and removing duplicates
    * Install AllegroGraph Client

6. [**LDAP**]()
    * Install LDAP Server
    * Install phpldapadmin
    * Setup ldap nginx configuration file
    * Install/Setup LDAP CLient
    * Setup SFTP (SSH) with LDAP


## Setting the Environment

> **Virtual Environment**

Create a virtual environment inside the repository folder with the name "flask" (`mkdir flask`). Everything will be installed there so that your main Python packages are not affected.

Install Python VirtualEnv - `sudo apt-get install python-virtualenv`

Run virtualenv inside the `flask` folder - `virtualenv flask`

> **requirements.txt**

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

> **Bower components**

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