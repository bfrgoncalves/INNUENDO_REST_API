from app import app, db
import os
from flask import Flask, request, redirect, url_for
from flask.ext.restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask.ext.security import current_user
from flask import jsonify

from os import listdir
from os.path import isfile, join

from flask.ext.security import current_user, login_required, roles_required
import datetime

from werkzeug.utils import secure_filename
from flask import send_from_directory

def allowed_file(filename):
	return '.' in filename and \
		filename.rsplit('.', 1)[1] in app.config['ALLOWED_EXTENSIONS']


class FileUpload(Resource):
	
	@login_required
	def post(self):
		if 'file' not in request.files:
			flash('No file part')
			return redirect(request.url)
		file = request.files['file']
		# if user does not select file, browser also
		# submit a empty part without filename
		if file.filename == '':
			#flash('No selected file')
			return redirect(request.url)
		if file and allowed_file(file.filename):
			filename = secure_filename(file.filename)
			file.save(os.path.join(os.path.join(app.config['UPLOAD_FOLDER'], str(current_user.id)), filename))
			return jsonify({ "filename": file.filename })

	@login_required
	def get(self):
		mypath = os.path.join(app.config['UPLOAD_FOLDER'], str(current_user.id))
		onlyfiles = [{"filename":f, "uri": url_for('get_file', filename=f, _external=True)} for f in listdir(mypath) if isfile(join(mypath, f))]


		return jsonify({ "files": onlyfiles })

class GetFile(Resource):

	@login_required
	def get(self, filename):
		return jsonify({ "filename": filename })
