from app import db
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with
from config import JOBS_ROOT, LDAP_PROVIDER_URL, phyloviz_root
import ldap
from app.models.models import Ecoli, Project, Platform
import requests
import os
from flask_security import current_user


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
        request = requests.get(os.path.join(phyloviz_root, "api/db/postgres/find/datasets/name"), verify=False)

        return request.json()


class PlatformStateResource(Resource):

    def get(self):

        if not current_user.is_authenticated:
            return "anonymous"

        platform_instance = db.session.query(Platform).first()

        if not platform_instance:
            return "true"
        else:
            return platform_instance.status

    def put(self):

        platform_instance = db.session.query(Platform).first()

        if not platform_instance:
            p = Platform(status="true")
            db.session.add(p)
            db.session.commit()
            return "true"

        if platform_instance.status == "true":
            platform_instance.status = "false"
            db.session.commit()

        else:
            platform_instance.status = "true"
            db.session.commit()

        return platform_instance.status
