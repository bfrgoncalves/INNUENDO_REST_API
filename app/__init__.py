from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from config import basedir
import os 

from werkzeug.serving import run_simple
from werkzeug.wsgi import DispatcherMiddleware

from franz.openrdf.sail.allegrographserver import AllegroGraphServer
from franz.openrdf.repository.repository import Repository
from franz.miniclient import repository
from config import basedir,AG_HOST,AG_PORT,AG_REPOSITORY,AG_USER,AG_PASSWORD, app_route



#Setup app
app = Flask(__name__)
app.config.from_object('config') #Reads the config file located at ../

def simple(env, resp):
    resp(b'200 OK', [(b'Content-Type', b'text/plain')])
    return [b'Hello WSGI World']

app.wsgi_app = DispatcherMiddleware(simple, {app_route: app.wsgi_app})

#Setup db
db = SQLAlchemy(app) #initialization of the database

# Setup Flask-Security
from flask_security import Security, SQLAlchemyUserDatastore
from app.models.models import User, Role

user_datastore = SQLAlchemyUserDatastore(db, User, Role)
security = Security(app, user_datastore)

from .adminutils import UserAdmin, RoleAdmin
from flask_admin import Admin
from flask_mail import Mail
#initialize mailer
mail = Mail(app)

# Initialize Flask-Admin
#admin = Admin(app)

# Add Flask-Admin views for Users and Roles
#admin.add_view(UserAdmin(User, db.session))
#admin.add_view(RoleAdmin(Role, db.session))


#setup agraph
server= AllegroGraphServer(AG_HOST, AG_PORT, AG_USER, AG_PASSWORD)
catalog = server.openCatalog()             ## default rootCatalog
#print "Available repositories in catalog '%s':  %s" % (catalog.getName(), catalog.listRepositories())    
myRepository = catalog.getRepository(AG_REPOSITORY, Repository.OPEN)
myRepository.initialize()
dbconAg = myRepository.getConnection()
dedicateddbconAg = myRepository.getConnection()
print "Repository %s is up!  It contains %i statements." % (
	myRepository.getDatabaseName(), dbconAg.size())

print '###############################################################'


from app import views, models, api, app_configuration #models are files that define the database structure
