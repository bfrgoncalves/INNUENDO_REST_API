Create a virtual environment inside the repository folder with the name "flask". Everything will be installed there so that your main Python installation is not affected.

Python 3.4: python -m venv flask

If you are using any other version of Python older than 3.4, then you need to download and install virtualenv before you can create a virtual environment.

Mac: sudo easy_install virtualenv

Linux: sudo apt-get install python-virtualenv

Python < 3.4: virtualenv flask


Install the required dependencies using the pip package manager installed in the virtual environment using the requirements.txt file.

flask/bin/pip install -r requirements.txt

Install bower components
Install bower
run: bower install

Install PostgreSQL and create a database.

Change the necessary parameters in the template_config.py file and rename it to config.py 

Load the database with the following commands:

./manage.py db init
./manage.py db migrate
./manage.py db upgrade

Run the app with the run.py

chmod a+x run.py
./run.py