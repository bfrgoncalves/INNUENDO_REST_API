from flask import render_template, flash, redirect, session, url_for, request, g
from flask_security import login_required, current_user, utils, roles_required
import json
from app import app
import requests
from config import FILES_ENTRY_POINT
from config import ADMIN_GID
from config import REPORTS_URL

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
		if current_user.gid == ADMIN_GID:
			show_protocols = True
		else:
			show_protocols = False
	except Exception, e:
		show_protocols = False
	
	print username
	return render_template('index.html', title='Home', current_user_id=json.dumps(current_user_id), reports_url=json.dumps(REPORTS_URL), current_user_name=json.dumps(username), jobs_root=json.dumps(FILES_ENTRY_POINT), show_protocols=show_protocols, show_info_button=json.dumps(show_protocols), homedir=json.dumps(homedir))


@app.route('/logout')
def logout():
	logout_user()
	return redirect(url_for('index'))
