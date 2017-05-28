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
import json
import requests
import subprocess
import random
import string

phyloviz_post_parser = reqparse.RequestParser()
phyloviz_post_parser.add_argument('headers_profile', dest='headers_profile', type=str, required=True, help="profile headers")
phyloviz_post_parser.add_argument('body_profile', dest='body_profile', type=str, required=True, help="profile body")
phyloviz_post_parser.add_argument('headers_metadata', dest='headers_metadata', type=str, required=True, help="metadata headers")
phyloviz_post_parser.add_argument('body_metadata', dest='body_metadata', type=str, required=True, help="metadata body")
phyloviz_post_parser.add_argument('dataset_name', dest='dataset_name', type=str, required=True, help="dataset name")
phyloviz_post_parser.add_argument('dataset_description', dest='dataset_description', type=str, required=True, help="dataset description")

#Load job results to display on graphical interface
class PHYLOViZResource(Resource):

	@login_required
	def post(self):
		args = phyloviz_post_parser.parse_args()

		headers_profile = json.loads(args.headers_profile);
		body_profile = json.loads(args.body_profile);

		headers_metadata = json.loads(args.headers_metadata);
		body_metadata = json.loads(args.body_metadata);

		file_name = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(8))

		file_path_profile = './app/uploads/'+file_name+'_profile.tab'

		file_path_metadata = './app/uploads/'+file_name+'_metadata.tab'

		#print file_path_profile

		#print headers[0]
		#print body[0]

		with open(file_path_profile, 'w') as p_file:
			hd = [];
			for x in headers_profile:
				hd.append(x['title'])
			
			p_file.write('\t'.join(hd) + '\n')
			
			for y in body_profile:
				p_file.write('\t'.join(y) + '\n')

		with open(file_path_metadata, 'w') as p_file:
			hd = [];
			for x in headers_metadata:
				hd.append(x['title'])
			
			p_file.write('\t'.join(hd) + '\n')
			
			for y in body_metadata:
				p_file.write('\t'.join(y) + '\n')

		command = 'python ./app/resources/phyloviz/remoteUpload.py -u phyloviz -p phyloviz -sdt profile -sd ' + file_path_profile + ' -m '+ file_path_metadata +' -d ' + args.dataset_name + ' -dn ' + args.dataset_description;
		command = command.split(' ')
		print command
		proc = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
		stdout, stderr = proc.communicate()

		print stdout, stderr

		return stdout, 200
		


