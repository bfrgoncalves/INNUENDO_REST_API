from app import app, db
import os
from flask import Flask, request, redirect, url_for
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask_security import current_user
from flask import jsonify

from os import listdir
from os.path import isfile, join

from flask_security import current_user, login_required, roles_required
import datetime

import json
import requests

config1 = {}
execfile("config.py", config1)

#Defining post arguments parser
downloads_get_parser = reqparse.RequestParser()
downloads_get_parser.add_argument('accession_numbers', dest='accession_numbers', type=str, required=True, help="ENA accession numbers")

class GetFilesResource(Resource):

	@login_required
	def get(self):
		print config1['FILES_ROOT']
		request = requests.get(config1['FILES_ROOT'], params={'username':current_user.username})
		try:
			return request.json(), 200
		except Exception as e:
			return False, 200

class DownloadFilesResource(Resource):

	@login_required
	def post(self):
		args=downloads_get_parser.parse_args()
		request = requests.post(config1['DOWNLOADS_ROOT'], data={'username':current_user.username, 'accession_numbers': args.accession_numbers})
		print request.json()

		return request.json(), 200

	@login_required
	def get(self):
		args=downloads_get_parser.parse_args()
		request = requests.get(config1['DOWNLOADS_ROOT'], data={'username':current_user.username, 'accession_numbers': args.accession_numbers})
		print request.json()
		return request.json(), 200
