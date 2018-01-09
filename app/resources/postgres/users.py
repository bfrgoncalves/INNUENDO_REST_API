import ldap
from config import baseDN
from app import app, db, user_datastore, security
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask_security import current_user, utils
from flask import jsonify
from flask_security import current_user, login_required, login_user

from app.models.models import User
import os
import requests
import ldap

#Defining response

user_fields = {
	'id': fields.Integer,
	'email': fields.String,
    'projects': fields.Url('user_projects', absolute=True),
    'analysis_parameters_object': fields.String
}

#Define studies resources

user_parser = reqparse.RequestParser()
user_parser.add_argument('parameters_object', dest='parameters_object', type=str, required=True, help="Analysis parameters selector")

user_login_parser = reqparse.RequestParser()
user_login_parser.add_argument('username', dest='username', type=str, required=True, help="Username")
user_login_parser.add_argument('password', dest='password', type=str, required=True, help="Password")

class UserListResource(Resource):

    @login_required
    @marshal_with(user_fields)
    def get(self):
        users = db.session.query(User).all()
        return users

class UserResource(Resource):

    @login_required
    @marshal_with(user_fields)
    def get(self):
        users = db.session.query(User).filter(User.id == current_user.id).first()
        return users

    @login_required
    @marshal_with(user_fields)
    def put(self):
        args=user_parser.parse_args()
        users = db.session.query(User).filter(User.id == current_user.id).first()
        users.analysis_parameters_object = args.parameters_object
        db.session.commit()
        return users


#For user external authentication to be able to access to the reports remotely
class UserExternalLogin(Resource):

    def post(self):
        args=user_login_parser.parse_args()
        username = args.username
        password = args.password

        try:
            result = User.try_login(username, password)
            print result
            if result == False:
                return None
        except ldap.INVALID_CREDENTIALS, e:
            print e
            return None

        user = User.query.filter_by(username=result['uid'][0]).first()


        return {access:True, user_id: user.id}




