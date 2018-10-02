
import os
import ldap

from flask_security import Security, SQLAlchemyUserDatastore, login_required,\
    current_user, utils, roles_required, user_registered, login_user
from app import app, db, user_datastore, dbconAg,\
    security
from app.models.models import Specie, User
from flask import request, after_this_request, redirect, current_app
from flask_security.utils import do_flash, get_message, get_url
from flask_security.signals import password_changed
from config import localNSpace,dcterms, SFTP_HOST, LOGIN_METHOD, \
    LOGIN_USERNAME, LOGIN_GID, LOGIN_HOMEDIR, LOGIN_PASSWORD, LOGIN_EMAIL, \
    ALL_SPECIES
from franz.openrdf.vocabulary.rdf import RDF

'''App configuration:
    - Set of functions to be applied before the first app request and an 
    handle  override for the flask-login post function'''


# Executes before the first request is processed.
@app.before_first_request
def before_first_request():

    # Create any database tables that don't exist yet.
    db.create_all()

    # Create the Roles "admin" and "end-user" -- unless they already exist
    user_datastore.find_or_create_role(name='admin',
                                       description='Administrator')
    user_datastore.find_or_create_role(name='end-user', description='End user')

    # Create two Users for testing purposes -- unless they already exists.
    # In each case, use Flask-Security utility function to encrypt the password.
    encrypted_password = utils.encrypt_password(app.config['ADMIN_PASS'])
    if not user_datastore.get_user(app.config['ADMIN_EMAIL']):
        user_datastore.create_user(email=app.config['ADMIN_EMAIL'],
                                   password=encrypted_password,
                                   username=app.config['ADMIN_USERNAME'],
                                   name=app.config['ADMIN_NAME'])

    for specie in ALL_SPECIES:
        # Commit any database changes; the User and Roles must exist before
        # we can add a Role to the User
        specie_to_add = Specie(name=specie)

        if not db.session.query(Specie)\
                .filter(Specie.name == specie_to_add.name).count() > 0:
            db.session.add(specie_to_add)

    db.session.commit()

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers',
                       'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods',
                       'GET,PUT,POST,DELETE,OPTIONS')
    return response


# Overwrites default password change of flask
@security.change_password_context_processor
def change_password():
    """View function which handles a change password request."""

    if request.form.get('password'):
        try:
            result = User.try_login(current_user.username,
                                    request.form.get('password'))

            if not result:
                do_flash(*get_message('INVALID_PASSWORD'))
                return {"status": False}

        except ldap.INVALID_CREDENTIALS, e:
            print e
            do_flash(*get_message('INVALID_PASSWORD'))
            return {"status": False}

        if request.form.get('new_password') == request.form.get('password'):
            do_flash(*get_message('PASSWORD_IS_THE_SAME'))
            return {"status": False}

        if request.form.get('new_password') == request.form.get(
                'new_password_confirm'):

            if len(request.form.get('new_password_confirm')) < 6:
                do_flash(*get_message('PASSWORD_INVALID_LENGTH'))
                return {"status": False}

            status = User.change_pass(current_user.username,
                                      request.form.get('password'),
                                      request.form.get('new_password'))

            print status

            if status:
                password_changed.send(current_app._get_current_object(),
                                      user=current_user._get_current_object())
                do_flash(*get_message('PASSWORD_CHANGE'))
                print "password changed"
                return {"status": True}

        else:
            do_flash(*get_message('RETYPE_PASSWORD_MISMATCH'))
            print "passwords dont match"

    else:
        if request.form.get('new_password'):
            do_flash(*get_message('PASSWORD_NOT_PROVIDED'))
        return {"status": False}


@app.login_manager.request_loader
def load_user_from_request(request):

    if request.method == 'POST' and "/outputs/" not in request.base_url:
        username = request.form.get('email')
        password = request.form.get('password')

        if LOGIN_METHOD != "None":
            try:
                result = User.try_login(username, password)

                if not result:
                    do_flash(*get_message('INVALID_PASSWORD'))
                    return None

            except ldap.INVALID_CREDENTIALS, e:
                do_flash(*get_message('INVALID_PASSWORD'))
                return None

            user = User.query.filter_by(username=result['uid'][0]).first()

            if not user:
                encrypted_password = utils.encrypt_password(password)

                if not user_datastore.get_user(result['mail'][0]):
                    user = user_datastore.create_user(
                        email=result['mail'][0],
                        password=encrypted_password,
                        username=result['uid'][0],
                        name=result['cn'][0],
                        gid=result['gidNumber'][0],
                        homedir=result['homeDirectory'][0])

                    db.session.commit()

            user = User.query.filter_by(username=result['uid'][0]).first()

        else:
            user = User.query.filter_by(username=LOGIN_USERNAME).first()

            if username != LOGIN_USERNAME or LOGIN_PASSWORD != password:
                do_flash(*get_message('INVALID_PASSWORD'))
                return None

            if not user:
                encrypted_password_config = utils.encrypt_password(LOGIN_PASSWORD)

                if not user_datastore.get_user(LOGIN_EMAIL):
                    user = user_datastore.create_user(
                        email=LOGIN_EMAIL,
                        password=encrypted_password_config,
                        username=LOGIN_USERNAME,
                        name=LOGIN_USERNAME,
                        gid=LOGIN_GID,
                        homedir=LOGIN_HOMEDIR)

                    db.session.commit()

            if not os.path.exists(os.path.join(LOGIN_HOMEDIR, "jobs")):
                os.makedirs(os.path.join(LOGIN_HOMEDIR, "jobs"))

            user = User.query.filter_by(username=LOGIN_USERNAME).first()

        login_user(user)
        return user


# overrides the handler function to add a default role to a registered user
@user_registered.connect_via(app)
def user_registered_handler(app, user, confirm_token):

    if not os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'],
                                       str(user.email) + '_' + str(user.id))):

        os.makedirs(
            os.path.join(
                app.config['UPLOAD_FOLDER'],
                str(user.email) + '_' + str(user.id)
            )
        )
    
    default_role = user_datastore.find_role('end-user')
    user_datastore.add_role_to_user(user, default_role)
    db.session.commit()

    id= user.id

    ############# Add user to NGS_onto ########################

    UserURI = dbconAg.createURI(namespace=localNSpace,
                                localname="users/"+str(id))
    userType = dbconAg.createURI(namespace=dcterms, localname="Agent")
    dbconAg.add(UserURI, RDF.TYPE, userType)

