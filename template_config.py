import os
basedir = os.path.abspath(os.path.dirname(__file__)) #base directory of app structure

#keys for passwords
SECRET_KEY = 'super-secret'
SECURITY_PASSWORD_HASH = 'pbkdf2_sha512'
SECURITY_PASSWORD_SALT = 'salt_1'

#Admin_info
ADMIN_EMAIL = 'email'
ADMIN_PASS = 'password'

#enable security views
SECURITY_REGISTERABLE = True
SECURITY_RECOVERABLE = True
SECURITY_CHANGEABLE = True 

#database endpoints and migrate repositories
DATABASE_USER = 'username'
DATABASE_PASS = 'password'
SQLALCHEMY_DATABASE_URI = 'postgresql://'+DATABASE_USER+':'+DATABASE_PASS+'@localhost/test_database' #sqlite database uri (path to the database file)
SQLALCHEMY_MIGRATE_REPO = os.path.join(basedir, 'db_repository') #location to be used to store and update database files

#mail configuration
MAIL_SERVER = 'smtp.gmail.com'
MAIL_PORT = 465
MAIL_USE_SSL = True
MAIL_USERNAME = 'sender_email'
MAIL_PASSWORD = 'sender_pass'
WTF_CSRF_ENABLED = True
#To be used in the Flask-WTF extension

#File upload information
UPLOAD_FOLDER = 'app/uploads/'
ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'tab'])

#app route

app_route = '/app'
#SECURITY_URL_PREFIX = app_route
SECURITY_POST_LOGIN_VIEW = app_route
SECURITY_POST_LOGOUT_VIEW = app_route
