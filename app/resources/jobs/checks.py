from app import db
from flask_restful import Api, Resource, reqparse, abort, marshal_with
from config import JOBS_ROOT, LDAP_PROVIDER_URL, phyloviz_root
import ldap
from app.models.models import Project, Platform
import requests
import os
from flask_security import current_user

# Imports for allegrograph check
from config import AG_HOST, AG_PORT, AG_USER, AG_PASSWORD
from franz.openrdf.sail.allegrographserver import AllegroGraphServer

from app.app_configuration import database_correspondece


check_user_get_parser = reqparse.RequestParser()
check_user_get_parser.add_argument('userId', dest='userId', type=str,
                                 required=True, help="userId")


class CheckControllerResource(Resource):

    def get(self):
        request = requests.get(os.path.join(JOBS_ROOT, "check"))

        return request.json()


class CheckDbGeneralResource(Resource):

    def get(self):

        try:
            project = db.session.query(Project).first()
            print project
        except Exception as e:
            print e
            return False

        return True


class CheckDbMLSTResource(Resource):

    def get(self):
        for specie in database_correspondece:
            try:
                project = db.session.query(database_correspondece[specie]).first()
                print project
                break
            except Exception as e:
                print e
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


class CheckAllegroResource(Resource):

    def get(self):

        available = False

        try:
            server = AllegroGraphServer(AG_HOST, AG_PORT,
                                        AG_USER, AG_PASSWORD)
            catalog = server.openCatalog('')

            if len(catalog.listRepositories()):
                available = True

        except Exception:
            available = False

        return available


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


class CheckUserAuthentication(Resource):

    def get(self):

        args = check_user_get_parser.parse_args()

        if current_user.is_authenticated:
            print args.userId, current_user.id
            if args.userId != str(current_user.id):
                return False
            else:
                return True
        else:
            return "anonymous"



