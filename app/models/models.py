import ldap
import ldap.modlist as modlist
from app import db
from flask_security import UserMixin, RoleMixin
from sqlalchemy.dialects.postgresql import ARRAY, JSON
from config import LDAP_PROVIDER_URL, baseDN, LDAP_ADMIN_NAME, LDAP_ADMIN_PASS
from passlib.hash import ldap_md5

'''
Models:
    - Defines every model to be used on the postgres database
'''

# Secondary role table
roles_users = db.Table('roles_users',
                       db.Column(
                           'user_id',
                           db.Integer(),
                           db.ForeignKey('users.id')
                       ),
                       db.Column(
                           'role_id',
                           db.Integer(),
                           db.ForeignKey('roles.id')
                       ),
                       info={'bind_key': 'innuendo_database'}
                       )

pipelines_workflows = db.Table('pipelines_workflows',
                               db.Column(
                                   'pipeline_id',
                                   db.Integer(),
                                   db.ForeignKey('pipelines.id')
                               ),
                               db.Column(
                                   'workflow_id',
                                   db.Integer(),
                                   db.ForeignKey('workflows.id')
                               ),
                               info={'bind_key': 'innuendo_database'}
                               )

projects_strains = db.Table('projects_strains',
                            db.Column(
                                'project_id',
                                db.Integer(),
                                db.ForeignKey('projects.id')
                            ),
                            db.Column(
                                'strains_id',
                                db.Integer(),
                                db.ForeignKey('strains.id')
                            ),
                            info={'bind_key': 'innuendo_database'}
                            )


# LDAP connection
def get_ldap_connection():
    """Get ldap connection

    Method to get a connection to the ldap server. From here you can perform
    requests to the LDAP server.

    Returns
    -------
    Namespace: Connection object to apply some methods.
    """

    conn = ldap.open(LDAP_PROVIDER_URL)
    return conn


class Platform(db.Model):
    """
    Definition of the Platform model. Used to define the current platform
    state. Can be useful for lock of the platform by the administrator and
    other options
    """

    __tablename__ = "platform"
    __bind_key__ = 'innuendo_database'
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(255))


class User(db.Model, UserMixin):
    """
    Definition of the User model for the database
    """

    __tablename__ = "users"
    __bind_key__ = 'innuendo_database'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(120), index=True, unique=True)
    name = db.Column(db.String(255))
    gid = db.Column(db.String(255))
    homedir = db.Column(db.String(255))
    password = db.Column('password', db.String(255))
    active = db.Column(db.Boolean())
    email = db.Column(db.String(120), index=True, unique=True)
    roles = db.relationship('Role', secondary=roles_users,
                            backref=db.backref('users', lazy='dynamic'))
    projects = db.relationship('Project', backref='author', lazy='dynamic')
    analysis_parameters_object = db.Column(JSON)

    @staticmethod
    def try_login(email, password):
        """LDAP login

        Function to login to the LDAP server based on the username and password

        Parameters
        ----------
        email: str
            Username of the ldap user
        password: str
            Password of the ldap user

        Returns
        -------
        bool: Returns false if error on login
        Object: User entry if successful connection
        """

        conn = get_ldap_connection()
        try:
            conn.simple_bind_s("cn="+email+",ou=users,"+baseDN, password)
        except Exception as e:
            return False

        #conn.unbind()

        '''try:
            conn.simple_bind_s("cn=" + LDAP_ADMIN_NAME + "," + baseDN, LDAP_ADMIN_PASS)
        except Exception as e:
            print e
            return False'''

        search_filter = "uid="+email
        entry = ""
        result = conn.search_s(baseDN, ldap.SCOPE_SUBTREE, search_filter)
        for dn, ent in result:
            entry = ent
            break

        conn.unbind()
        if entry != "":
            return entry
        else:
            return False

    @staticmethod
    def change_pass(email, old, new_password):
        """Change LDAP password method

        Function to change the password of the LDAP user. It requires the
        username, the old password and a new password. It binds to the ldap
        server and then performs the operation by storing the encrypted
        password in the ldap database.

        Parameters
        ----------
        email: str
            Username of the ldap user
        old: str
            Old password
        new_password: str
            New password

        Returns
        -------
        bool: True if successfully changed the password, False if not.
        """

        conn = get_ldap_connection()

        try:
            # Reset Password
            password_value_old = {
                "userPassword": ldap_md5.encrypt(str(old))
            }

            password_value_new = {
                "userPassword": ldap_md5.encrypt(str(new_password))
            }

            conn.simple_bind_s("cn=" + email + ",ou=users," + baseDN, old)

            ldif = modlist.modifyModlist(password_value_old, password_value_new)

            conn.modify_s("cn=" + email + ",ou=users," + baseDN, ldif)
            return True

        except Exception as e:
            return False


class Role(db.Model, RoleMixin):
    """
    Definition of the Role model for the database
    """

    __tablename__ = "roles"
    __bind_key__ = 'innuendo_database'
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))

    # __str__ is required by Flask-Admin, so we can have human-readable
    # values for the Role when editing a User.
    # If we were using Python 2.7, this would be __unicode__ instead.
    def __str__(self):
        return self.name

    # __hash__ is required to avoid the exception TypeError: unhashable type:
    #  'Role' when saving a User
    def __hash__(self):
        return hash(self.name)


class Project(db.Model):
    """
    Definition of the Project model for the database. A Project is a
    collection of strains on which can then be applied pipelines.
    """

    __tablename__ = "projects"
    __bind_key__ = 'innuendo_database'
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(255), unique=True)
    is_removed = db.Column(db.String(255))
    description = db.Column(db.Text())
    timestamp = db.Column(db.DateTime)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    pipelines = db.relationship('Pipeline', backref='project', lazy='dynamic')
    strains = db.relationship('Strain', secondary=projects_strains,
                              backref=db.backref('project', lazy='dynamic'),
                              lazy='dynamic')
    species_id = db.Column(db.Integer, db.ForeignKey('species.id'))

    def add_Strain(self, strain):
        """Add strain to the project

        This method allows adding a specific strain to a project by creating
        a relationship between a strain and the project.

        Parameters
        ----------
        strain: str
            Strain identifier to perform queries on

        Returns
        -------
        bool: Returns False if not successfully added.
        """

        if not self.is_strain_added(strain):
            self.strains.append(strain)
            return self
        else:
            return False

    def remove_Strain(self, strain):
        """Remove strain from project

        This method allows removing a strain from a project by removing the
        relationships between the strain and the project.

        Parameters
        ----------
        strain: str
            Strain identifier to remove from the project

        Returns
        -------
        bool: Returns False if not successfully added.
        """

        if self.is_strain_added(strain):
            self.strains.remove(strain)
            return self
        else:
            return False

    def is_strain_added(self, strain):
        return self.strains.filter(
            projects_strains.c.strains_id == strain.id).count() > 0

    def project_strains(self):
        return Strain.query.join(
            projects_strains,(projects_strains.c.strains_id == Strain.id))\
            .filter(projects_strains.c.project_id == self.id).all()


class Pipeline(db.Model):
    """
    Definition of the Pipeline model of the database. It as relationships
    with the projects and the strains. A pipeline is applied to a Strain and
    consists of a series of Workflows.
    """

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
    """
    Definition of the Workflow model of the database. A workflow is part of a
    pipeline and consists of a series of Protocols.
    """
    __tablename__ = "workflows"
    __bind_key__ = 'innuendo_database'
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(255))
    classifier = db.Column(db.String(255))
    species = db.Column(db.String(255))
    dependency = db.Column(db.String(255))
    availability = db.Column(db.String(255))
    version = db.Column(db.String(255))
    timestamp = db.Column(db.DateTime)


class Process(db.Model):
    """
    Definition of the Process model of the database. It has a relationship
    with the pipelines since a process is part of a pipeline. A Process is an
    instance of a Protocol.
    """

    __tablename__ = "processes"
    __bind_key__ = 'innuendo_database'
    id = db.Column(db.Integer(), primary_key=True)
    timestamp = db.Column(db.DateTime)
    pipeline_id = db.Column(db.Integer, db.ForeignKey('pipelines.id'))
    messages = db.Column(JSON)


class Protocol(db.Model):
    """
    Definition of the Protocol model of the database. It defines what is
    going to be run in a given strain.
    """

    __tablename__ = "protocols"
    __bind_key__ = 'innuendo_database'
    id = db.Column(db.Integer(), primary_key=True)
    timestamp = db.Column(db.DateTime)
    name = db.Column(db.String(255))
    steps = db.Column(JSON)
    version = db.Column(db.String(255))


class Specie(db.Model):
    """
    Definition of the Species model of the database. It has relationships
    with each strain since strains need to belong to a given species.
    """

    __tablename__ = "species"
    __bind_key__ = 'innuendo_database'
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(255), unique=True)
    timestamp = db.Column(db.DateTime)


class Strain(db.Model):
    """
    Definition if the Strain model of the database. It has relationships with
    the species and the user. The strain also has metadata associated with it.
    """

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


# Table to store all procedure report data
class Report(db.Model):
    """
    Define the report model of the database. It has information about the
    user producing the report, the sample, the pipeline and the process.
    Report data is stored in a JSON format that can then be parsed.
    """

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


# Table to store all combined reports
class Combined_Reports(db.Model):
    """
    Define the saved report model of the database. It allows to store an
    instance of a report to be loaded after. It has information about the
    projects, strains, filters applied and highlights.
    """

    __tablename__ = "combined_reports"
    __bind_key__ = 'innuendo_database'
    id = db.Column(db.Integer(), primary_key=True)
    user_id = db.Column(db.Integer())
    username = db.Column(db.Text())
    name = db.Column(db.Text())
    description = db.Column(db.Text())
    strain_names = db.Column(db.Text())
    projects_id = db.Column(db.Text())
    filters = db.Column(db.Text())
    highlights = db.Column(db.Text())
    is_public = db.Column(db.Text())
    timestamp = db.Column(db.DateTime)


# Table to store notifications between users in the platform
class Message(db.Model):
    """
    Define the message model of the database. Allows communication and
    provides notifications to users.
    """

    __tablename__ = "messages"
    __bind_key__ = 'innuendo_database'
    id = db.Column(db.Integer(), primary_key=True)
    timestamp = db.Column(db.DateTime)
    title = db.Column(db.String(255))
    messageFrom = db.Column(db.String(255))
    messageTo = db.Column(db.String(255))
    message = db.Column(db.Text())
    status = db.Column(db.String(255))


class Tree(db.Model):
    """
    Define the tree entries model of the database. It has information about
    the using submitting the data and also stores the tree URL.
    """

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
    status = db.Column(db.String(255))


#######################MLST DATABASE############################################

class Ecoli(db.Model):
    """
    Defines the species specific storage of profiles and its classification.
    Ecoli specification.
    """

    __tablename__ = "ecoli"
    __bind_key__ = 'mlst_database'
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(255), unique=True)
    classifier_l1 = db.Column(db.String(255))
    classifier_l2 = db.Column(db.String(255))
    classifier_l3 = db.Column(db.String(255))
    allelic_profile = db.Column(JSON)
    strain_metadata = db.Column(JSON)
    # Tell if it is legacy or from the platform
    platform_tag = db.Column(db.String(255))
    timestamp = db.Column(db.DateTime)


class Yersinia(db.Model):
    """
    Defines the species specific storage of profiles and its classification.
    Yersinia specification.
    """

    __tablename__ = "yersinia"
    __bind_key__ = 'mlst_database'
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(255), unique=True)
    classifier_l1 = db.Column(db.String(255))
    classifier_l2 = db.Column(db.String(255))
    classifier_l3 = db.Column(db.String(255))
    allelic_profile = db.Column(JSON)
    strain_metadata = db.Column(JSON)
    # Tell if it is legacy or from the platform
    platform_tag = db.Column(db.String(255))
    timestamp = db.Column(db.DateTime)


class Campylobacter(db.Model):
    """
    Defines the species specific storage of profiles and its classification.
    Campylobacter specification.
    """

    __tablename__ = "campylobacter"
    __bind_key__ = 'mlst_database'
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(255), unique=True)
    classifier_l1 = db.Column(db.String(255))
    classifier_l2 = db.Column(db.String(255))
    classifier_l3 = db.Column(db.String(255))
    allelic_profile = db.Column(JSON)
    strain_metadata = db.Column(JSON)
    # Tell if it is legacy or from the platform
    platform_tag = db.Column(db.String(255))
    timestamp = db.Column(db.DateTime)


class Salmonella(db.Model):
    """
    Defines the species specific storage of profiles and its classification.
    Salmonella specification.
    """

    __tablename__ = "salmonella"
    __bind_key__ = 'mlst_database'
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(255), unique=True)
    classifier_l1 = db.Column(db.String(255))
    classifier_l2 = db.Column(db.String(255))
    classifier_l3 = db.Column(db.String(255))
    allelic_profile = db.Column(JSON)
    strain_metadata = db.Column(JSON)
    # Tell if it is legacy or from the platform
    platform_tag = db.Column(db.String(255))
    timestamp = db.Column(db.DateTime)


class Core_Schemas(db.Model):
    """
    DEPRECATED MODEL
    """

    __tablename__ = "core_schemas"
    __bind_key__ = 'mlst_database'
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(255), unique=True)
    loci = db.Column(JSON)
    timestamp = db.Column(db.DateTime)
