from app import app, db
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask_security import current_user
from flask import jsonify

from flask_security import current_user, login_required, roles_required, auth_token_required
import datetime

from config import CURRENT_ROOT, JOBS_ROOT

from app.models.models import Protocol
from app.models.models import Strain
from app.models.models import Report
from app.models.models import Tree
import json
import requests
import subprocess
import random
import string

from job_processing.queue_processor import Queue_Processor

'''
File resources:
	- Get template for strain batch submission
'''
templates_folder = 'app/static/file_templates'
class TemplateResource(Resource):

	@login_required
	def get(self):
		uploads = os.path.join(current_app.root_path, app.config['UPLOAD_FOLDER'])
		return send_from_directory(directory=uploads, filename=filename)
