from app import app, db
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask_security import current_user
from flask import jsonify, send_file

from flask_security import current_user, login_required, roles_required, auth_token_required
import datetime
import os

'''
File resources:
	- Get template for strain batch submission
'''

class TemplateResource(Resource):

	@login_required
	def get(self):
		templates_folder = 'static/file_templates'
		file_path = os.path.join(templates_folder, "template_strain_batch_submission.tab")
		print file_path
		try:
			response = send_file(file_path, as_attachment=True)
			response.headers.add('Access-Control-Allow-Origin', '*')
			response.headers.add('Content-Type', 'application/force-download')
			return response
		except Exception as e:
			print e
			#self.Error(400)
			return 404
