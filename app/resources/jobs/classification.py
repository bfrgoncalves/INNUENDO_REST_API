from app import db
from flask_restful import Api, Resource, reqparse, abort, marshal_with
from config import JOBS_ROOT, LDAP_PROVIDER_URL, phyloviz_root
import ldap
from app.models.models import Ecoli, Project, Platform
import requests
import os
from flask_security import current_user

from job_processing.queue_processor import Queue_Processor

# Imports for allegrograph check
from config import AG_HOST, AG_PORT, AG_USER, AG_PASSWORD
from franz.openrdf.sail.allegrographserver import AllegroGraphServer

classification_post_parser = reqparse.RequestParser()
classification_post_parser.add_argument('profile', dest='profile', type=str,
                                        required=True, help="profile")
classification_post_parser.add_argument('species', dest='species', type=str,
                                        required=True, help="species")
classification_post_parser.add_argument('sampleName', dest='sampleName', type=str,
                                        required=True, help="sample name")
classification_post_parser.add_argument('schemaVersion', dest='schemaVersion', type=str,
                                        required=True, help="schema version")

classification_processor = Queue_Processor()


class Classification(Resource):

    def get(self):
        args = job_post_parser.parse_args()
        profile = args.profile
        species = args.species
        sample_name = args.sampleName
        schemaVersion = args.schemaVersion

        classification = classification_processor.classify_profile(
            profile, species, sample_name, schemaVersion
        )

        return {"message": "Success", "classification": classification}
