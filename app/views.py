from flask import render_template, flash, redirect, session, url_for, request, g
from flask_security import login_required, current_user, utils, roles_required
import json
from app import app
import requests
from config import JOBS_ROOT

'''
Views:
	- Define the index route of the application
'''


def getID(current_user):
	if current_user.is_authenticated:
		return current_user.id
	else:
		return 0

@app.route('/')
@app.route('/index')
def index():
	current_user_id = getID(current_user)
	username = ""
	homedir = ""
	if current_user.is_authenticated:
		username = current_user.username
		homedir = current_user.homedir
	try:
		if current_user.gid == "501":
			show_protocols = True
		else:
			show_protocols = False
	except Exception, e:
		show_protocols = False
	
	print username
	return render_template('index.html', title='Home', current_user_id=json.dumps(current_user_id), current_user_name=json.dumps(username), jobs_root=json.dumps(JOBS_ROOT), show_protocols=show_protocols, homedir=homedir)


@app.route('/logout')
def logout():
	logout_user()
	return redirect(url_for('index'))
