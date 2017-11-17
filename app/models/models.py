import ldap
from app import db
from flask_security import UserMixin, RoleMixin
from sqlalchemy.dialects.postgresql import ARRAY, JSON
from config import LDAP_PROVIDER_URL, baseDN

'''
Models:
	- Defines every model to be used on the postgres database
'''

#Secondary role table
roles_users = db.Table('roles_users', db.Column('user_id', db.Integer(), db.ForeignKey('users.id')), db.Column('role_id', db.Integer(), db.ForeignKey('roles.id')), info={'bind_key': 'innuendo_database'})
pipelines_workflows = db.Table('pipelines_workflows', db.Column('pipeline_id', db.Integer(), db.ForeignKey('pipelines.id')), db.Column('workflow_id', db.Integer(), db.ForeignKey('workflows.id')), info={'bind_key': 'innuendo_database'})
projects_strains = db.Table('projects_strains', db.Column('project_id', db.Integer(), db.ForeignKey('projects.id')), db.Column('strains_id', db.Integer(), db.ForeignKey('strains.id')), info={'bind_key': 'innuendo_database'})

#LADP connection
def get_ldap_connection():
	print LDAP_PROVIDER_URL
	conn = ldap.open(LDAP_PROVIDER_URL)
	return conn

class User(db.Model, UserMixin):
	__tablename__ = "users" #change table name from user to users just not clash with postgresql 
	__bind_key__ = 'innuendo_database'
	id = db.Column(db.Integer, primary_key=True)
	username = db.Column(db.String(120), index=True, unique=True)
	name = db.Column(db.String(255))
	gid = db.Column(db.String(255))
	homedir = db.Column(db.String(255))
	password = db.Column('password' , db.String(255))
	active = db.Column(db.Boolean())
	email = db.Column(db.String(120), index=True, unique=True)
	roles = db.relationship('Role', secondary=roles_users, backref=db.backref('users', lazy='dynamic'))
	projects = db.relationship('Project', backref='author', lazy='dynamic')
	analysis_parameters_object = db.Column(JSON)
	#The backref argument defines a field that will be added to the objects of the "many" class that points back at the "one" object. 
	#In our case this means that we can use post.author to get the User instance that created a post.
	
	@staticmethod
	def try_login(email, password):
		conn = get_ldap_connection()
		try:
			conn.simple_bind_s("cn="+email+",ou=users,dc=innuendo,dc=com", password)
		except Exception as e:
			return False
		search_filter = "uid="+email
		Entry = ""
		result = conn.search_s(baseDN,ldap.SCOPE_SUBTREE,search_filter)
		for dn, entry in result:
			DN = str(dn)
			Entry = entry
			print Entry
			break

		conn.unbind()
		if Entry != "":
			return Entry
		else:
			return False

	
class Role(db.Model, RoleMixin):
	__tablename__ = "roles"
	__bind_key__ = 'innuendo_database'
	id = db.Column(db.Integer(), primary_key=True)
	name = db.Column(db.String(80), unique=True)
	description = db.Column(db.String(255))

	# __str__ is required by Flask-Admin, so we can have human-readable values for the Role when editing a User.
	# If we were using Python 2.7, this would be __unicode__ instead.
	def __str__(self):
		return self.name

	# __hash__ is required to avoid the exception TypeError: unhashable type: 'Role' when saving a User
	def __hash__(self):
		return hash(self.name)


class Project(db.Model):
	__tablename__ = "projects"
	__bind_key__ = 'innuendo_database'
	id = db.Column(db.Integer(), primary_key=True)
	name = db.Column(db.String(255), unique=True)
	is_removed = db.Column(db.String(255))
	description = db.Column(db.Text())
	timestamp = db.Column(db.DateTime)
	user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
	pipelines = db.relationship('Pipeline', backref='project', lazy='dynamic')
	strains = db.relationship('Strain', secondary=projects_strains, backref=db.backref('project', lazy='dynamic'), lazy='dynamic')
	species_id = db.Column(db.Integer, db.ForeignKey('species.id'))
	
	def add_Strain(self, strain):
		if not self.is_strain_added(strain):
			self.strains.append(strain)
			return self
		else:
			return False

	def remove_Strain(self, strain):
		if self.is_strain_added(strain):
			self.strains.remove(strain)
			return self
		else:
			return False

	def is_strain_added(self, strain):
		return self.strains.filter(projects_strains.c.strains_id == strain.id).count() > 0

	def project_strains(self):
		return Strain.query.join(projects_strains, (projects_strains.c.strains_id == Strain.id)).filter(projects_strains.c.project_id == self.id).all()


class Pipeline(db.Model):
	__tablename__ = "pipelines"
	__bind_key__ = 'innuendo_database'
	id = db.Column(db.Integer(), primary_key=True)
	timestamp = db.Column(db.DateTime)
	project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
	parent_pipeline_id = db.Column(db.Integer())
	parent_project_id = db.Column(db.Integer())
	removed = db.Column(db.String(255))
	strain_id = db.Column(db.Integer, db.ForeignKey('strains.id'))

class Workflow(db.Model):
	__tablename__ = "workflows"
	__bind_key__ = 'innuendo_database'
	id = db.Column(db.Integer(), primary_key=True)
	name = db.Column(db.String(255), unique=True)
	classifier = db.Column(db.String(255))
	species = db.Column(db.String(255))
	availability = db.Column(db.String(255))
	timestamp = db.Column(db.DateTime)


class Process(db.Model):
	__tablename__ = "processes"
	__bind_key__ = 'innuendo_database'
	id = db.Column(db.Integer(), primary_key=True)
	timestamp = db.Column(db.DateTime)
	pipeline_id = db.Column(db.Integer, db.ForeignKey('pipelines.id'))
	messages = db.Column(JSON)


class Protocol(db.Model):
	__tablename__ = "protocols"
	__bind_key__ = 'innuendo_database'
	id = db.Column(db.Integer(), primary_key=True)
	timestamp = db.Column(db.DateTime)
	name = db.Column(db.String(255), unique=True)
	steps = db.Column(JSON)


class Specie(db.Model):
	__tablename__ = "species"
	__bind_key__ = 'innuendo_database'
	id = db.Column(db.Integer(), primary_key=True)
	name = db.Column(db.String(255), unique=True)
	timestamp = db.Column(db.DateTime)


class Strain(db.Model):
	__tablename__ = "strains"
	__bind_key__ = 'innuendo_database'
	id = db.Column(db.Integer(), primary_key=True)
	name = db.Column(db.String(255), unique=True)
	timestamp = db.Column(db.DateTime)
	strain_metadata = db.Column(JSON)
	fields = db.Column(JSON)
	species_id = db.Column(db.Integer, db.ForeignKey('species.id'))
	user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
	fq_location = db.Column(db.String(255))

#Table to store all procedure report data
class Report(db.Model):
	__tablename__ = "reports"
	__bind_key__ = 'innuendo_database'
	id = db.Column(db.Integer(), primary_key=True)
	job_id = db.Column(db.String(255))
	user_id = db.Column(db.Integer())
	username = db.Column(db.String(255))
	procedure = db.Column(db.String(255))
	project_id = db.Column(db.String(255))
	sample_name = db.Column(db.String(255))
	pipeline_id = db.Column(db.String(255))
	process_position = db.Column(db.String(255))
	procedure = db.Column(db.String(255))
	timestamp = db.Column(db.DateTime)
	report_data = db.Column(JSON)

#Table to store all combined reports
class Combined_Reports(db.Model):
	__tablename__ = "combined_reports"
	__bind_key__ = 'innuendo_database'
	id = db.Column(db.Integer(), primary_key=True)
	user_id = db.Column(db.Integer())
	username = db.Column(db.Text())
	name = db.Column(db.Text())
	description = db.Column(db.Text())
	run_identifiers = db.Column(db.Text())
	strain_names = db.Column(db.Text())
	species_id = db.Column(db.Text())
	timestamp = db.Column(db.DateTime)

class Message(db.Model):
	__tablename__ = "messages"
	__bind_key__ = 'innuendo_database'
	id = db.Column(db.Integer(), primary_key=True)
	timestamp = db.Column(db.DateTime)
	name = db.Column(db.String(255))
	description = db.Column(JSON)
	process_id = db.Column(db.Integer, db.ForeignKey('processes.id'))

class Tree(db.Model):
	__tablename__ = "trees"
	__bind_key__ = 'innuendo_database'
	id = db.Column(db.Integer(), primary_key=True)
	timestamp = db.Column(db.DateTime)
	user_id = db.Column(db.Integer())
	name = db.Column(db.Text())
	description = db.Column(db.Text())
	species_id = db.Column(db.Text())
	uri = db.Column(db.Text())
	phyloviz_user = db.Column(db.Text())


#######################MLST DATABASE##################################################

class Ecoli(db.Model):
	__tablename__ = "ecoli"
	__bind_key__ = 'mlst_database'
	id = db.Column(db.Integer(), primary_key=True)
	name = db.Column(db.String(255), unique=True)
	classifier = db.Column(db.String(255))
	allelic_profile = db.Column(JSON)
	strain_metadata = db.Column(JSON)
	platform_tag = db.Column(db.String(255)) #Tell if it is legacy or from the platform
	timestamp = db.Column(db.DateTime)

class Yersinia(db.Model):
	__tablename__ = "yersinia"
	__bind_key__ = 'mlst_database'
	id = db.Column(db.Integer(), primary_key=True)
	name = db.Column(db.String(255), unique=True)
	classifier = db.Column(db.String(255))
	allelic_profile = db.Column(JSON)
	strain_metadata = db.Column(JSON)
	platform_tag = db.Column(db.String(255)) #Tell if it is legacy or from the platform
	timestamp = db.Column(db.DateTime)

class Campylobacter(db.Model):
	__tablename__ = "campylobacter"
	__bind_key__ = 'mlst_database'
	id = db.Column(db.Integer(), primary_key=True)
	name = db.Column(db.String(255), unique=True)
	classifier = db.Column(db.String(255))
	allelic_profile = db.Column(JSON)
	strain_metadata = db.Column(JSON)
	platform_tag = db.Column(db.String(255)) #Tell if it is legacy or from the platform
	timestamp = db.Column(db.DateTime)

class Salmonella(db.Model):
	__tablename__ = "salmonella"
	__bind_key__ = 'mlst_database'
	id = db.Column(db.Integer(), primary_key=True)
	name = db.Column(db.String(255), unique=True)
	classifier = db.Column(db.String(255))
	allelic_profile = db.Column(JSON)
	strain_metadata = db.Column(JSON)
	platform_tag = db.Column(db.String(255)) #Tell if it is legacy or from the platform
	timestamp = db.Column(db.DateTime)

class Core_Schemas(db.Model):
	__tablename__ = "core_schemas"
	__bind_key__ = 'mlst_database'
	id = db.Column(db.Integer(), primary_key=True)
	name = db.Column(db.String(255), unique=True)
	loci = db.Column(JSON)
	timestamp = db.Column(db.DateTime)



