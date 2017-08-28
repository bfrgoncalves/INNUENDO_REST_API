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
    'projects': fields.Url('user_projects', absolute=True),
    'analysis_parameters_object': fields.String
}

#Define studies resources

user_parser = reqparse.RequestParser()
user_parser.add_argument('parameters_object', dest='parameters_object', type=str, required=True, help="Analysis parameters selector")

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




