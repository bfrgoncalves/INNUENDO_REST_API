import os
basedir = os.path.abspath(os.path.dirname("__file__"))

# Frontend current IP root
FRONTEND_IP = '<ip>'

# PHYLOViZ Online route
phyloviz_root = 'http://<phylovizroute>'

# AllegroGraph IP route
AGRAPH_IP = '<allegroip>'

CURRENT_ROOT = 'http://'+FRONTEND_IP+'/app'

FILES_ENTRY_POINT = 'https://'+FRONTEND_IP+'/app'

# LDAP IP
LDAP_IP = '<ldapip>'

# INNUENDO SLURM MASTER IP
JOBS_IP = '<jobsip>'

# JOBS ROOT
JOBS_ROOT = 'http://'+JOBS_IP+'/jobs/'

# OUTPUT PROCESS URL
OUTPUT_URL = CURRENT_ROOT + 'api/v1.0/ngsonto/projects/<int:id>/pipelines/<int:id2>/processes/<int:id3>/outputs/'

# Files ROOT
FILES_ROOT = 'http://'+JOBS_IP+'/jobs/fastqs/'

# DOWNLOAD ROOT
DOWNLOADS_ROOT = 'http://'+JOBS_IP+'/jobs/download/'

REPORTS_URL = "/reportsApp/"

# user storages location inside the mounted store
# ex: ["storage/users"]
USER_STORAGES = ["<storagelocationpath>"]

# keys for passwords
SECRET_KEY = 'super-secret'
SECURITY_PASSWORD_HASH = 'pbkdf2_sha512'
SECURITY_PASSWORD_SALT = 'salt_1'

# Admin_info
ADMIN_EMAIL = 'innuendo@admin.com'
ADMIN_NAME = 'Admin'
ADMIN_USERNAME = 'innuendo_admin'
ADMIN_PASS = 'password'

# Platform admin group code
ADMIN_GID = '501'

# URL for redis connection
REDIS_URL = 'redis://<redisip>:6379'

# Enable security views
SECURITY_REGISTERABLE = False
SECURITY_RECOVERABLE = True
SECURITY_CHANGEABLE = True
SECURITY_FLASH_MESSAGES = True

# FAST-MLST path. Used to get closest profiles
FAST_MLST_PATH = "<fastmlstpath>"

# Nextflow tags available in assemblerflow
NEXTFLOW_TAGS = [
    "reads_download",
    "seq_typing",
    "patho_typing",
    "integrity_coverage",
    "fastqc_trimmomatic",
    "true_coverage",
    "fastqc",
    "check_coverage",
    "spades",
    "process_spades",
    "assembly_mapping",
    "pilon",
    "mlst",
    "abricate",
    "chewbbaca",
    "sistr"
]

########## Database endpoints and migrate repositories #######################

DATABASE_USER = '<databaseuser>'
DATABASE_PASS = '<databasepass>'

# wgMLST database URL
database_uri = 'postgresql://' + \
               DATABASE_USER+':'+DATABASE_PASS + \
               '@<databaseip>/<databasename>'

# Platform general database url
innuendo_database_uri = 'postgresql://' + \
                        DATABASE_USER+':'+DATABASE_PASS + \
                        '@<databaseip>/<databasename>'

# SQLAlchemy database connections
SQLALCHEMY_BINDS = {
    'mlst_database': database_uri,
    'innuendo_database': innuendo_database_uri
}

# Location to be used to store and update database files
SQLALCHEMY_MIGRATE_REPO = os.path.join(basedir, 'db_repository')
SQLALCHEMY_TRACK_MODIFICATIONS = True

# Mail configuration. NOT BEING USED
MAIL_SERVER = 'smtp.gmail.com'
MAIL_PORT = 465
MAIL_USE_SSL = True
MAIL_USERNAME = '<gmailaccount>'
MAIL_PASSWORD = '<gmailpassword>'
WTF_CSRF_ENABLED = False
# To be used in the Flask-WTF extension

# Application default route location
app_route = '/app'
APPLICATION_ROOT = app_route

# Flask security views configuration
SECURITY_POST_LOGIN_VIEW = app_route
SECURITY_POST_LOGOUT_VIEW = app_route
SECURITY_POST_REGISTER_VIEW = app_route
SECURITY_POST_CONFIRM_VIEW = app_route
SECURITY_POST_RESET_VIEW = app_route
SECURITY_POST_CHANGE_VIEW = app_route

################## sftp ################################################

SFTP_HOST = LDAP_IP
SFTP_PORT = '22'

################## ldap ################################################
# LDAP configuration
LDAP_PROVIDER_URL = LDAP_IP
LDAP_PROTOCOL_VERSION = 3
baseDN = 'dc=innuendo,dc=com'
LDAP_ADMIN_NAME = "admin"
LDAP_ADMIN_PASS = "verysecret"

################## DEFAULT USER SETTINGS ###############################
# Used in case no LDAP is configured.
# Use LOGIN_METHOD="None" in case of no LDAP
# Use LOGIN_METHOD="LDAP" in case LDAP is configured
LOGIN_METHOD = "None"
LOGIN_GID = "501"
LOGIN_HOMEDIR = "/INNUENDO/"
LOGIN_USERNAME = "innuendo_user"
LOGIN_PASSWORD = "innuendo_user"
LOGIN_EMAIL = "innuendo@innuendo.com"


########DECODIFICATION OF DATABASES AND BASE METADATA FOR MLST DATABASE #######
# Information regarding the available species
ALL_SPECIES = [
    "E.coli",
    "Yersinia",
    "Campylobacter",
    "Salmonella"
]

# Replacement for allele classifications in chewbbaca to send to phyloviz online
allele_classes_to_ignore = {
    'LNF': '0',
    'INF-': '',
    'NIPHEM': '0',
    'NIPH': '0',
    'LOTSC': '0',
    'PLOT3': '0',
    'PLOT5': '0',
    'ALM': '0',
    'ASM': '0'
}

# Metadata used on legacy data
metadata_to_use_all = {
    'FILE': 'strainID',
    'Source': 'source_Source',
    'Country': 'Location',
    'Serotype': 'Serotype',
    'Pathotype': 'Pathotyping',
    'ST': 'ST'
}

# Base metadata in case no metadata for a given strain
base_metadata = {
    "strainID": "",
    "source_Source": "",
    "Location": "",
    "Serotype": "",
    "Pathotyping": "",
    "ST": ""
}

# Path to the wg index file used by fast-mlst for profile search up to x
# differences
wg_index_correspondece = {
    "E.coli": "/INNUENDO/inputs/indexes/ecoli_wg",
    "Yersinia": "/INNUENDO/inputs/indexes/yersinia_wg",
    "Salmonella": "/INNUENDO/inputs/indexes/salmonella_wg",
    "Campylobacter": "/INNUENDO/inputs/indexes/campy_wg"
}

# Path to the core index file used by fast-mlst for profile search up to x
# differences
core_index_correspondece = {
    "E.coli": "/INNUENDO/inputs/indexes/ecoli_core",
    "Yersinia": "/INNUENDO/inputs/indexes/yersinia_core",
    "Salmonella": "/INNUENDO/inputs/indexes/salmonella_core",
    "Campylobacter": "/INNUENDO/inputs/indexes/campy_core"
}

# Path to the list of the wg loci for each species
wg_headers_correspondece = {
    "E.coli": "/INNUENDO/inputs/core_lists/ecoli_headers_wg.txt",
    "Yersinia": "/INNUENDO/inputs/core_lists/yersinia_headers_wg.txt",
    "Salmonella": "/INNUENDO/inputs/core_lists/salmonella_headers_wg.txt",
    "Campylobacter": "/INNUENDO/inputs/core_lists/campy_headers_wg.txt"
}

# Path to the list of the core loci for each species
core_headers_correspondece = {
    "E.coli": "/INNUENDO/inputs/core_lists/ecoli_headers_core.txt",
    "Yersinia": "/INNUENDO/inputs/core_lists/yersinia_headers_core.txt",
    "Salmonella": "/INNUENDO/inputs/core_lists/salmonella_headers_core.txt",
    "Campylobacter": "/INNUENDO/inputs/core_lists/campy_headers_core.txt"
}

# Location of the file with the core profiles for each species. Used to
# contruct the search index
core_increment_profile_file_correspondece = {
    "E.coli": "/INNUENDO/inputs/indexes/ecoli_core_profiles.tab",
    "Yersinia": "/INNUENDO/inputs/indexes/yersinia_core_profiles.tab",
    "Salmonella": "/INNUENDO/inputs/indexes/salmonella_core_profiles.tab",
    "Campylobacter": "/INNUENDO/inputs/indexes/campy_core_profiles.tab"
}

# Location of the file with wg profiles for each species. Used to contruct the
# search index
wg_increment_profile_file_correspondece = {
    "E.coli": "/INNUENDO/inputs/indexes/ecoli_wg_profiles.tab",
    "Yersinia": "/INNUENDO/inputs/indexes/yersinia_wg_profiles.tab",
    "Salmonella": "/INNUENDO/inputs/indexes/salmonella_wg_profiles.tab",
    "Campylobacter": "/INNUENDO/inputs/indexes/campy_wg_profiles.tab"
}

# Classification levels for each specie. Number of profile differences
classification_levels = {
    "E.coli": [8, 112, 793],
    "Yersinia": [9, 133, 1189],
    "Salmonella": [14, 338, 997],
    "Campylobacter": [4, 59, 292]
}

##################  ALLEGROGRAPH CONFIGURATION  ###############################

CURRENT_DIRECTORY = os.getcwd()

AG_HOST = os.environ.get('AGRAPH_HOST', AGRAPH_IP)
AG_PORT = int(os.environ.get('AGRAPH_PORT', '10035'))

AG_REPOSITORY = '<allegrorepositoryname>'
AG_USER = '<allegrouser>'
AG_PASSWORD = '<allegropassword>'

# List namespaces
obo = "http://purl.obolibrary.org/obo/"
dcterms= "http://purl.org/dc/terms/"
edam = "http://edamontology.org#"
localNSpace="http://ngsonto.net/api/v1.0/"


pTypes =[
    'dnaextraction',
    'librarypreparation',
    'qualityControl',
    'sequencing',
    'trimming',
    'filtering',
    'mapping',
    'denovo',
    'allelecall',
    'pathotyping'
]

protocolsTypes =[
    'http://purl.obolibrary.org/obo/NGS_0000067',
    'http://purl.obolibrary.org/obo/NGS_0000068',
    'http://purl.obolibrary.org/obo/NGS_0000088',
    'http://purl.obolibrary.org/obo/NGS_0000072',
    'http://purl.obolibrary.org/obo/NGS_0000065',
    'http://purl.obolibrary.org/obo/NGS_0000066',
    'http://purl.obolibrary.org/obo/NGS_0000071',
    'http://purl.obolibrary.org/obo/NGS_0000070',
    'http://purl.obolibrary.org/obo/NGS_0000090',
    'http://purl.obolibrary.org/obo/NGS_0000100'
]

processTypes = [
    'http://purl.obolibrary.org/obo/OBI_0000257',
    'http://purl.obolibrary.org/obo/OBI_0000711',
    'http://edamontology.org/operation_3218',
    'http://purl.obolibrary.org/obo/OBI_0000626',
    'http://edamontology.org/operation_0369',
    'http://purl.obolibrary.org/obo/NGS_0000008',
    'http://edamontology.org/operation_0523',
    'http://edamontology.org/operation_0524',
    'http://purl.obolibrary.org/obo/NGS_0000098',
    'http://purl.obolibrary.org/obo/NGS_0000099'
]

processMessages =[
    'http://purl.obolibrary.org/obo/OBI_0001051',
    'http://purl.obolibrary.org/obo/NGS_0000001',
    'http://purl.obolibrary.org/obo/SO_0000150',
    'http://purl.obolibrary.org/obo/SO_0000150',
    'http://purl.obolibrary.org/obo/SO_0000150',
    'http://purl.obolibrary.org/obo/SO_0000150',
    'http://purl.obolibrary.org/obo/SO_0000149',
    'http://purl.obolibrary.org/obo/OBI_0001573',
    'http://purl.obolibrary.org/obo/OBI_0001305',
    'http://purl.obolibrary.org/obo/OBI_0001305'
]

protocolsTypes = dict(zip(pTypes, protocolsTypes))
processTypes = dict(zip(pTypes, processTypes))
processMessages = dict(zip(pTypes, processMessages))
