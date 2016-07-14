from app import db
from flask.ext.security import UserMixin, RoleMixin

#Secondary role table
roles_users = db.Table('roles_users', db.Column('user_id', db.Integer(), db.ForeignKey('users.id')), db.Column('role_id', db.Integer(), db.ForeignKey('roles.id')))

class User(db.Model, UserMixin):
	__tablename__ = "users" #change table name from user to users just not clash with postgresql 
	id = db.Column(db.Integer, primary_key=True)
	#username = db.Column(db.String(64), index=True, unique=True)
	password = db.Column('password' , db.String(255))
	active = db.Column(db.Boolean())
	email = db.Column(db.String(120), index=True, unique=True)
	roles = db.relationship('Role', secondary=roles_users, backref=db.backref('users', lazy='dynamic'))
	studies = db.relationship('Study', backref='author', lazy='dynamic')
	#posts = db.relationship('Post', backref='author', lazy='dynamic')
	#With this relationship we get a user.posts member that gets us the list of posts from the user. 
	#The first argument to db.relationship indicates the "many" class of this relationship. 
	#The backref argument defines a field that will be added to the objects of the "many" class that points back at the "one" object. 
	#In our case this means that we can use post.author to get the User instance that created a post.


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


class Study(db.Model):
	__tablename__ = "studies"
	id = db.Column(db.Integer(), primary_key=True)
	description = db.Column(db.String(255))
	timestamp = db.Column(db.DateTime)
	user_id = db.Column(db.Integer, db.ForeignKey('users.id'))