from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy
from config import basedir
import os 

app = Flask(__name__)
app.config.from_object('config') #Reads the config file located at ../
db = SQLAlchemy(app) #initialization of the database

# Setup Flask-Security
from flask.ext.security import Security, SQLAlchemyUserDatastore
from .models import User, Role

user_datastore = SQLAlchemyUserDatastore(db, User, Role)
security = Security(app, user_datastore)

from .adminutils import UserAdmin, RoleAdmin
from flask.ext.admin import Admin
from flask_mail import Mail
#initialize mailer
mail = Mail(app)

# Initialize Flask-Admin
admin = Admin(app)

# Add Flask-Admin views for Users and Roles
admin.add_view(UserAdmin(User, db.session))
admin.add_view(RoleAdmin(Role, db.session))

from app import views, models #models are files that define the database structure
