from flask import render_template, flash, redirect, session, url_for, request, g #a function from the flask framework. Uses Jinja2 templating engine
from flask.ext.security import login_required, current_user, utils, roles_required
#from flask.ext.security.utils import get_hmac #Encrypts according to the config paramaters
from app import app


@app.route('/')
@app.route('/index')
#@login_required #Using this decorator, only login users are allowed to view the index page
def index():
	return render_template('index.html', title='Home')


@app.route('/logout')
def logout():
	logout_user()
	return redirect(url_for('index'))
