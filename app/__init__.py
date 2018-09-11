from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from rq import Queue
from werkzeug.wsgi import DispatcherMiddleware

from franz.openrdf.sail.allegrographserver import AllegroGraphServer
from franz.openrdf.repository.repository import Repository
from config import basedir,AG_HOST,AG_PORT,AG_REPOSITORY,AG_USER,AG_PASSWORD, app_route

# IMPORT CONNECTION FROM THE WORKER REDIS
from worker import conn

# Setup Flask-Security
from flask_security import Security, SQLAlchemyUserDatastore
from .adminutils import UserAdmin, RoleAdmin
from flask_mail import Mail

'''
App route:
    - Defining the global app instance.
    - Launching triplestore client.
    - Set the redis queue
    - Set the mailer

    - Load all the other files required for the application to work:
        - views (load the index page of the pplication)
        - models (load all the datatabase Resource models)
        - api (load all the app end-points)
        - app_configuration (before first request and override login post of the flask-login package to deal with ldap)
'''

# Setup app
app = Flask(__name__)
# Reads the config file located at ../
app.config.from_object('config')


def simple(env, resp):
    resp(b'200 OK', [(b'Content-Type', b'text/plain')])
    return [b'Bad redirection. Confirm your URL.']

app.wsgi_app = DispatcherMiddleware(simple, {app_route: app.wsgi_app})

# Setup db
db = SQLAlchemy(app)

# SET THE REDIS QUEUE
q = Queue(connection=conn)

from app.models.models import User, Role

user_datastore = SQLAlchemyUserDatastore(db, User, Role)
security = Security(app, user_datastore)

# initialize mailer
mail = Mail(app)

# setup agraph
server = AllegroGraphServer(AG_HOST, AG_PORT, AG_USER, AG_PASSWORD)
catalog = server.openCatalog()

myRepository = catalog.getRepository(AG_REPOSITORY, Repository.OPEN)
myRepository.initialize()
dbconAg = myRepository.getConnection()
dedicateddbconAg = myRepository.getConnection()

print "Repository %s is up!  It contains %i statements." % (
    myRepository.getDatabaseName(), dbconAg.size())

print '###############################################################'

# models are files that define the database structure
from app import views, models, api, app_configuration
