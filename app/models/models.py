import ldap
from app import db
from flask.ext.security import UserMixin, RoleMixin
from sqlalchemy.dialects.postgresql import ARRAY, JSON
from config import LDAP_PROVIDER_URL, baseDN

#Secondary role table
roles_users = db.Table('roles_users', db.Column('user_id', db.Integer(), db.ForeignKey('users.id')), db.Column('role_id', db.Integer(), db.ForeignKey('roles.id')))
pipelines_workflows = db.Table('pipelines_workflows', db.Column('pipeline_id', db.Integer(), db.ForeignKey('pipelines.id')), db.Column('workflow_id', db.Integer(), db.ForeignKey('workflows.id')))
projects_strains = db.Table('projects_strains', db.Column('project_id', db.Integer(), db.ForeignKey('projects.id')), db.Column('strains_id', db.Integer(), db.ForeignKey('strains.id')))

#LADP connection
def get_ldap_connection():
	print LDAP_PROVIDER_URL
	conn = ldap.open(LDAP_PROVIDER_URL)
	return conn

class User(db.Model, UserMixin):
	__tablename__ = "users" #change table name from user to users just not clash with postgresql 
	id = db.Column(db.Integer, primary_key=True)
	username = db.Column(db.String(120), index=True, unique=True)
	name = db.Column(db.String(255))
	password = db.Column('password' , db.String(255))
	active = db.Column(db.Boolean())
	email = db.Column(db.String(120), index=True, unique=True)
	roles = db.relationship('Role', secondary=roles_users, backref=db.backref('users', lazy='dynamic'))
	projects = db.relationship('Project', backref='author', lazy='dynamic')
	#The backref argument defines a field that will be added to the objects of the "many" class that points back at the "one" object. 
	#In our case this means that we can use post.author to get the User instance that created a post.
	
	@staticmethod
	def try_login(email, password):
		conn = get_ldap_connection()
		try:
			conn.simple_bind_s("cn="+email+",dc=innuendo,dc=com", password)
		except Exception as e:
			print "BAH"
			print e
			return False
		search_filter = "uid="+email
		Entry = ""
		result = conn.search_s(baseDN,ldap.SCOPE_SUBTREE,search_filter)
		for dn, entry in result:
			DN = str(dn)
			Entry = entry
			print DN
			print Entry
			break

		conn.unbind()
		if Entry != "":
			return Entry
		else:
			return False

	
class Role(db.Model, RoleMixin):
	__tablename__ = "roles"
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
	id = db.Column(db.Integer(), primary_key=True)
	name = db.Column(db.String(255))
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
	id = db.Column(db.Integer(), primary_key=True)
	timestamp = db.Column(db.DateTime)
	project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
	parent_pipeline_id = db.Column(db.Integer())
	parent_project_id = db.Column(db.Integer())
	removed = db.Column(db.String(255))
	strain_id = db.Column(db.Integer, db.ForeignKey('strains.id'))

class Workflow(db.Model):
	__tablename__ = "workflows"
	id = db.Column(db.Integer(), primary_key=True)
	name = db.Column(db.String(255), unique=True)
	classifier = db.Column(db.String(255))
	timestamp = db.Column(db.DateTime)


class Process(db.Model):
	__tablename__ = "processes"
	id = db.Column(db.Integer(), primary_key=True)
	timestamp = db.Column(db.DateTime)
	pipeline_id = db.Column(db.Integer, db.ForeignKey('pipelines.id'))
	messages = db.Column(JSON)


class Protocol(db.Model):
	__tablename__ = "protocols"
	id = db.Column(db.Integer(), primary_key=True)
	timestamp = db.Column(db.DateTime)
	name = db.Column(db.String(255), unique=True)
	steps = db.Column(JSON)


class Specie(db.Model):
	__tablename__ = "species"
	id = db.Column(db.Integer(), primary_key=True)
	name = db.Column(db.String(255), unique=True)
	timestamp = db.Column(db.DateTime)


class Strain(db.Model):
	__tablename__ = "strains"
	id = db.Column(db.Integer(), primary_key=True)
	name = db.Column(db.String(255), unique=True)
	timestamp = db.Column(db.DateTime)
	strain_metadata = db.Column(JSON)
	fields = db.Column(JSON)
	species_id = db.Column(db.Integer, db.ForeignKey('species.id'))
	user_id = db.Column(db.Integer, db.ForeignKey('users.id'))

#Table to store all procedure report data
class Report(db.Model):
	__tablename__ = "reports"
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
	id = db.Column(db.Integer(), primary_key=True)
	user_id = db.Column(db.Integer())
	username = db.Column(db.String(255))
	name = db.Column(db.String(255))
	description = db.Column(db.String(255))
	run_identifiers = db.Column(db.String(255))
	strain_names = db.Column(db.String(255))
	species_id = db.Column(db.String(255))
	timestamp = db.Column(db.DateTime)

class Message(db.Model):
	__tablename__ = "messages"
	id = db.Column(db.Integer(), primary_key=True)
	timestamp = db.Column(db.DateTime)
	name = db.Column(db.String(255))
	description = db.Column(JSON)
	process_id = db.Column(db.Integer, db.ForeignKey('processes.id'))



