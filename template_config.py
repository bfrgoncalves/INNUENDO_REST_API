import os
basedir = os.path.abspath(os.path.dirname(__file__)) #base directory of app structure

#keys for passwords
SECRET_KEY = 'super-secret'
SECURITY_PASSWORD_HASH = 'pbkdf2_sha512'
SECURITY_PASSWORD_SALT = 'salt_1'

#Admin_info
ADMIN_EMAIL = '<email>'
ADMIN_PASS = '<password>'

#enable security views
SECURITY_REGISTERABLE = True
SECURITY_RECOVERABLE = True
SECURITY_CHANGEABLE = True
SECURITY_FLASH_MESSAGES = True 

#database endpoints and migrate repositories
DATABASE_USER = '<database_user>'
DATABASE_PASS = '<password>'
SQLALCHEMY_DATABASE_URI = 'postgresql://'+DATABASE_USER+':'+DATABASE_PASS+'@<postgres_database>' #sqlite database uri (path to the database file)
SQLALCHEMY_MIGRATE_REPO = os.path.join(basedir, 'db_repository') #location to be used to store and update database files

#mail configuration
MAIL_SERVER = 'mail_configuration' # example: smtp.gmail.com
MAIL_PORT = 465
MAIL_USE_SSL = True
MAIL_USERNAME = '<email>'
MAIL_PASSWORD = '<password>'
WTF_CSRF_ENABLED = True
#To be used in the Flask-WTF extension

#File upload information
UPLOAD_FOLDER = 'app/uploads/'
ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'tab'])

#APP ROOT
app_route = '<app_default_root' # default to /
APPLICATION_ROOT = app_route

SECURITY_POST_LOGIN_VIEW = app_route
SECURITY_POST_LOGOUT_VIEW = app_route
SECURITY_POST_REGISTER_VIEW = app_route
SECURITY_POST_CONFIRM_VIEW = app_route
SECURITY_POST_RESET_VIEW = app_route
SECURITY_POST_CHANGE_VIEW = app_route

##################  agraph  ############################################

#agraph config
CURRENT_DIRECTORY = os.getcwd() 

AG_HOST = os.environ.get('AGRAPH_HOST', '<agraph_host')
AG_PORT = int(os.environ.get('AGRAPH_PORT', '<agraph_port>'))
#AG_CATALOG = os.environ.get('AGRAPH_CATALOG', 'test-catalog')
AG_REPOSITORY = '<repository_name>'
AG_USER = '<username>'
AG_PASSWORD = '<password>'

#list namespaces
obo = "http://purl.obolibrary.org/obo/"
dcterms="http://purl.org/dc/terms/"
edam ="http://edamontology.org#"
localNSpace="http://ngsonto.net/api/v1.0/"

pTypes =['dnaextraction', 'librarypreparation', 'qualityControl', 
            'sequencing', 'trimming', 'filtering', 
            'mapping', 'denovo']
            
protocolsTypes =['http://purl.obolibrary.org/obo/NGS_0000067','http://purl.obolibrary.org/obo/NGS_0000068', 'http://purl.obolibrary.org/obo/NGS_0000088', 
            'http://purl.obolibrary.org/obo/NGS_0000072','http://purl.obolibrary.org/obo/NGS_0000065','http://purl.obolibrary.org/obo/NGS_0000066', 
            'http://purl.obolibrary.org/obo/NGS_0000071','http://purl.obolibrary.org/obo/NGS_0000070']
processTypes = ['http://purl.obolibrary.org/obo/OBI_0000257','http://purl.obolibrary.org/obo/OBI_0000711', 'http://edamontology.org/operation_3218',
            'http://purl.obolibrary.org/obo/OBI_0000626','http://edamontology.org/operation_0369', 'http://purl.obolibrary.org/obo/NGS_0000008', 
            'http://edamontology.org/operation_0523', 'http://edamontology.org/operation_0524']

processMessages =['http://purl.obolibrary.org/obo/OBI_0001051' ,'http://purl.obolibrary.org/obo/NGS_0000001', 'http://purl.obolibrary.org/obo/SO_0000150'
            'http://purl.obolibrary.org/obo/SO_0000150', 'http://purl.obolibrary.org/obo/SO_0000150', 'http://purl.obolibrary.org/obo/SO_0000150',
            'http://purl.obolibrary.org/obo/SO_0000149','http://purl.obolibrary.org/obo/SO_0000149']


protocolsTypes = dict(zip(pTypes, protocolsTypes))
processTypes = dict(zip(pTypes, processTypes))
processMessages = dict(zip(pTypes, processMessages))