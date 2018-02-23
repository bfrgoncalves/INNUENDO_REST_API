from flask_security import Security, SQLAlchemyUserDatastore, login_required,\
    current_user, utils, roles_required, user_registered, login_user, utils
from flask_security.views import _security, _ctx, _render_json, _commit
from app import app, db, user_datastore, security, dbconAg, dedicateddbconAg, security
from app.models.models import Specie, User
import os
import requests
import ldap
from flask import request, after_this_request, redirect
from werkzeug.datastructures import MultiDict
from flask_security.changeable import change_user_password

from config import obo,localNSpace,dcterms, SFTP_HOST
from franz.openrdf.vocabulary.rdf import RDF

'''
App configuration:
    - Set of functions to be applied before the first app request and an handle override for the flask-login post function
'''


# Executes before the first request is processed.
@app.before_first_request
def before_first_request():

    # Create any database tables that don't exist yet.
    db.create_all()

    # Create the Roles "admin" and "end-user" -- unless they already exist
    user_datastore.find_or_create_role(name='admin', description='Administrator')
    user_datastore.find_or_create_role(name='end-user', description='End user')

    # Create two Users for testing purposes -- unless they already exists.
    # In each case, use Flask-Security utility function to encrypt the password.
    encrypted_password = utils.encrypt_password(app.config['ADMIN_PASS'])
    if not user_datastore.get_user(app.config['ADMIN_EMAIL']):
        user_datastore.create_user(email=app.config['ADMIN_EMAIL'], password=encrypted_password, username=app.config['ADMIN_USERNAME'], name=app.config['ADMIN_NAME'])

    # Commit any database changes; the User and Roles must exist before we can add a Role to the User
    specie1 = Specie(name="Campylobacter")
    specie2 = Specie(name="Yersinia")
    specie3 = Specie(name="E.coli")
    specie4 = Specie(name="Salmonella")

    if not db.session.query(Specie).filter(Specie.name == specie1.name).count() > 0:
        db.session.add(specie1)
    if not db.session.query(Specie).filter(Specie.name == specie2.name).count() > 0:
        db.session.add(specie2)
    if not db.session.query(Specie).filter(Specie.name == specie3.name).count() > 0:
        db.session.add(specie3)
    if not db.session.query(Specie).filter(Specie.name == specie4.name).count() > 0:
        db.session.add(specie4)

    db.session.commit()

@app.after_request
def after_request(response):
  response.headers.add('Access-Control-Allow-Origin', '*')
  response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  return response


@security.change_password_context_processor
def change_password():
    """View function which handles a change password request."""

    print request
    print request.form.get('password')
    print request.form.get('new_password')
    print request.form.get('new_password_confirm')

    if request.form.get('password'):
        try:
            result = User.try_login(current_user.username, request.form.get('password'))

            print result
            if result == False:
                return {"status": False}

        except ldap.INVALID_CREDENTIALS, e:
            print e
            return {"status": False}

        if request.form.get('new_password') == request.form.get(
                'new_password_confirm'):

            status = User.change_pass(current_user.username, request.form.get(
                'new_password'))

            if status:
                print "password changed"
        else:
            print "passwords dont match"

    else:
        return {"status": False}

    '''
    form_class = _security.change_password_form
    
    if request.is_json:
        form = form_class(MultiDict(request.get_json()))
    else:
        form = form_class()

    if form.validate_on_submit():
        after_this_request(_commit)
        change_user_password(current_user._get_current_object(),
                             form.new_password.data)
        if not request.is_json:
            utils.do_flash(*utils.get_message('PASSWORD_CHANGE'))
            return redirect(utils.get_url(_security.post_change_view) or
                            utils.get_url(_security.post_login_view))

    if request.is_json:
        form.user = current_user
        return _render_json(form)
    '''

    return {'foo': 'bar'}


@app.login_manager.request_loader
def load_user_from_request(request):

    print request.method
    
    if request.method == 'POST' and "/outputs/" not in request.base_url:
        username = request.form.get('email')
        password = request.form.get('password')

        try:
            result = User.try_login(username, password)
            print result
            if result == False:
                return None
        except ldap.INVALID_CREDENTIALS, e:
            print e
            return None

        user = User.query.filter_by(username=result['uid'][0]).first()
        
        if not user:
            encrypted_password = utils.encrypt_password(password)
            if not user_datastore.get_user(result['mail'][0]):
                user = user_datastore.create_user(email=result['mail'][0], password=encrypted_password, username=result['uid'][0], name=result['cn'][0], gid=result['gidNumber'][0], homedir=result['homeDirectory'][0])
                db.session.commit()
        
        user = User.query.filter_by(username=result['uid'][0]).first()
        login_user(user)
        return user


@user_registered.connect_via(app) #overrides the handler function to add a default role to a registered user
def user_registered_handler(app, user, confirm_token):

    if not os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'], str(user.email) + '_' + str(user.id))):
        os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], str(user.email) + '_' + str(user.id)))
    
    default_role = user_datastore.find_role('end-user')
    user_datastore.add_role_to_user(user, default_role)
    db.session.commit()

    id= user.id

    ############# Add user to NGS_onto ########################

    UserURI = dbconAg.createURI(namespace=localNSpace, localname="users/"+str(id))
    userType = dbconAg.createURI(namespace=dcterms, localname="Agent")
    dbconAg.add(UserURI, RDF.TYPE, userType)

