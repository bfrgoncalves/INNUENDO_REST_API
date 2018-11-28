#!flask/bin/python
from flask_script import Manager
from flask_migrate import Migrate, MigrateCommand
from app import app, db

'''
Loads the Flask db Manager to deal with database migrations and upgrades. 
Version control

./manage db init --multidb
./manage db migrate
./manage db upgrade
'''

migrate = Migrate(app, db)
manager = Manager(app)

manager.add_command('db', MigrateCommand)

if __name__ == '__main__':
    manager.run()
