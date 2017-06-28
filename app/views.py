from flask import render_template, flash, redirect, session, url_for, request, g #a function from the flask framework. Uses Jinja2 templating engine
from flask_security import login_required, current_user, utils, roles_required
import json
#from flask.ext.security.utils import get_hmac #Encrypts according to the config paramaters
from app import app
import requests
from config import JOBS_ROOT

def getID(current_user):
	if current_user.is_authenticated:
		return current_user.id
	else:
		return 0

@app.route('/')
@app.route('/index')
#@login_required #Using this decorator, only login users are allowed to view the index page
def index():
	print current_user
	current_user_id = getID(current_user)
	username = ""
	if current_user.is_authenticated:
		username = current_user.username
	if current_user.gidNumber == "501":
		show_protocols = True
	else:
		show_protocols = False
	return render_template('index.html', title='Home', current_user_id=json.dumps(current_user_id), current_user_name=json.dumps(username), jobs_root=json.dumps(JOBS_ROOT), show_protocols=show_protocols)


@app.route('/logout')
def logout():
	logout_user()
	return redirect(url_for('index'))
