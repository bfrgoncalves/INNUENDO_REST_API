import ldap
from app import app, db, user_datastore
from flask.ext.restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask.ext.security import current_user
from flask import jsonify
from flask.ext.security import current_user, login_required

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
'''
@app.login_manager.request_loader
def load_user_from_request(request):
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        print request.form

        try:
            User.try_login(email, password)
        except ldap.INVALID_CREDENTIALS:
            return None

        user = User.query.filter_by(email=email).first()
        
        if not user:
            encrypted_password = utils.encrypt_password(password)
            if not user_datastore.get_user(email):
                user = user_datastore.create_user(email=email, password=encrypted_password)
        
        return user
'''