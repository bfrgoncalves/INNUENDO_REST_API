from flask.ext.security import Security, SQLAlchemyUserDatastore, login_required, current_user, utils, roles_required, user_registered
from app import app, db, user_datastore, security


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
        user_datastore.create_user(email=app.config['ADMIN_EMAIL'], password=encrypted_password)

    # Commit any database changes; the User and Roles must exist before we can add a Role to the User
    db.session.commit()

    # Give one User has the "end-user" role, while the other has the "admin" role. (This will have no effect if the
    # Users already have these Roles.) Again, commit any database changes.
    user_datastore.add_role_to_user(app.config['ADMIN_EMAIL'], 'admin')
    db.session.commit()

@user_registered.connect_via(app) #overrides the handler function to add a default role to a registered user
def user_registered_handler(app, user, confirm_token):
    default_role = user_datastore.find_role('end-user')
    user_datastore.add_role_to_user(user, default_role)
    db.session.commit()