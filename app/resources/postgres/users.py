from app import db
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with
from flask_security import current_user, login_required, login_user

from app.models.models import User
import os
import ldap
import subprocess

user_fields = {
    'id': fields.Integer,
    'email': fields.String,
    'projects': fields.Url('user_projects', absolute=True),
    'analysis_parameters_object': fields.String
}

user_parser = reqparse.RequestParser()
user_parser.add_argument('parameters_object', dest='parameters_object', type=str, required=True, help="Analysis parameters selector")

user_login_parser = reqparse.RequestParser()
user_login_parser.add_argument('username', dest='username', type=str, required=True, help="Username")
user_login_parser.add_argument('password', dest='password', type=str, required=True, help="Password")

user_quota_parser = reqparse.RequestParser()
user_quota_parser.add_argument('project_id', dest='project_id', type=str, required=True, help="Project id")


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

        args = user_parser.parse_args()
        users = db.session.query(User).filter(User.id == current_user.id).first()
        users.analysis_parameters_object = args.parameters_object
        db.session.commit()
        return users


# For user external authentication to be able to access to the reports remotely
class UserExternalLogin(Resource):

    def post(self):

        args = user_login_parser.parse_args()
        username = args.username
        password = args.password

        try:
            result = User.try_login(username, password)
            if not result:
                return None
        except ldap.INVALID_CREDENTIALS, e:
            print e
            return None

        user = User.query.filter_by(username=result['uid'][0]).first()

        return {"access":True, "user_id": user.id}


class UserQuotaResource(Resource):

    @login_required
    def get(self):

        args = user_quota_parser.parse_args()
        project_id = args.project_id

        instStorage = "/".join(current_user.homedir.split("/")[0:-2]) + "/"
        project_dir = os.path.join(current_user.homedir, "jobs",
                                   project_id+"-*")

        # Get size of homedir
        proc = subprocess.Popen(["du", "-sh", "-B1", current_user.homedir],
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        out1, err = proc.communicate()

        print out1
        print err

        proc = subprocess.Popen(["du", "-sh", "-B1", instStorage],
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        out2, err = proc.communicate()

        print out2
        print err

        proc = subprocess.Popen(["du", "-sh", "-B1", project_dir],
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        out3, err = proc.communicate()

        print out3
        print err

        proc = subprocess.Popen(["df", "-Ph", "-B1", current_user.homedir],
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        out4, err = proc.communicate()

        print out4
        print err

        return {"u_quota": out1, "i_quota": out2, "f_space": out4,
                "p_space": out3}
