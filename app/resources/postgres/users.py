import ldap
from config import baseDN
from app import app, db, user_datastore, security
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask_security import current_user, utils
from flask import jsonify
from flask_security import current_user, login_required, login_user

from app.models.models import User

#Defining response

user_fields = {
	'id': fields.Integer,
	'email': fields.String,
    'projects': fields.Url('user_projects', absolute=True)
}

#Define studies resources

class UserListResource(Resource):

    @login_required
    @marshal_with(user_fields)
    def get(self):
        users = db.session.query(User).all()
        return users

class UserResource(Resource):

    @login_required
    @marshal_with(user_fields)
    def get(self, id):
        users = db.session.query(User).filter(User.id == id).first()
        return users

