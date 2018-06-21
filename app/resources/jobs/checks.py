from app import db
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with
from config import JOBS_ROOT, LDAP_PROVIDER_URL, phyloviz_root
import ldap
from app.models.models import Ecoli, Project
import requests
import os


class CheckControllerResource(Resource):

    def get(self):
        request = requests.get(os.path.join(JOBS_ROOT, "check"))

        return request.json()


class CheckDbGeneralResource(Resource):

    def get(self):

        try:
            project = db.session.query(Project).first()

        except Exception as e:
            return False

        return True


class CheckDbMLSTResource(Resource):

    def get(self):

        try:
            project = db.session.query(Ecoli).first()

        except Exception as e:
            return False

        return True


class CheckLDAPResource(Resource):

    def get(self):

        try:
            conn = ldap.open(LDAP_PROVIDER_URL)
        except Exception:

            return False

        return True


class CheckPHYLOViZResource(Resource):

    def get(self):
        request = requests.get(os.path.join(phyloviz_root, "api/db/postgres/find/datasets/name"))

        return request.json()