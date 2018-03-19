from app import db
from flask_restful import Api, Resource, reqparse, abort, fields, \
    marshal_with #filters data according to some fields

from app.models.models import Project, User
from flask_security import current_user, login_required, roles_required, \
    auth_token_required
import datetime
import random
import string
import os

# Defining post arguments parser
project_post_parser = reqparse.RequestParser()
project_post_parser.add_argument('description', dest='description', type=str,
                                 required=True, help="The project description")
project_post_parser.add_argument('name', dest='name', type=str, required=True,
                                 help="Project name")
project_post_parser.add_argument('species_id', dest='species_id', type=str,
                                 required=True, help="Species identifier")

project_get_parser = reqparse.RequestParser()
project_get_parser.add_argument('get_others', dest='get_others', type=bool,
                                required=False, help="Get other projects")
project_get_parser.add_argument('all', dest='all', type=bool, required=False,
                                help="Get all projects")

project_put_parser = reqparse.RequestParser()
project_put_parser.add_argument('lock', dest='lock', type=str, required=True,
                                help="lock info")
project_put_parser.add_argument('project_id', dest='project_id', type=str,
                                required=True,help="project id")

# Defining response fields

author_fields = {
    'id': fields.Integer,
    'uri': fields.Url('single_user', absolute=True)
}


all_project_fields = {
    'id': fields.Integer,
    'name': fields.String,
    'description': fields.String,
    'timestamp': fields.DateTime,
    'uri': fields.Url('user_single_project', absolute=True),
    'species_id': fields.String,
    'is_removed': fields.String,
    'username': fields.String
}

project_fields = {
    'id': fields.Integer,
    'name': fields.String,
    'description': fields.String,
    'timestamp': fields.DateTime,
    'pipelines': fields.Url('pipelines', absolute=True),
    'strains': fields.Url('project_strains', absolute=True),
    'species_id': fields.String,
    'is_removed': fields.String,
    'username': fields.String
}

# Define projects resources


class ProjectUserResource(Resource):
    """
    Class of user associated projects
    """

    @login_required
    @marshal_with(project_fields)
    def get(self, id):
        """Get projects of user

        This method gets the project with a given identifier

        Parameters
        ----------
        id: str
            Project identifier

        Returns
        -------
        Project object
        """

        if not current_user.is_authenticated:
            abort(403, message="No permissions")

        project = db.session.query(Project).filter(Project.id == id).first()

        if not project:
            abort(404, message="Project {} doesn't exist".format(id))
        return project, 200

    @login_required
    @marshal_with(project_fields)
    def delete(self, id):
        """Delete project

        Deletes a project with a given identifier and that belongs to the
        current logged user.

        Parameters
        ----------
        id: str
            Project identifier

        Returns
        -------

        """

        if not current_user.is_authenticated:
            abort(403, message="No permissions")

        project = db.session.query(Project)\
            .filter(Project.id == id, Project.user_id == current_user.id)\
            .first()

        project.name = project.name + "_" +\
                       ''.join(random.choice(string.ascii_uppercase +
                                             string.digits) for _ in range(4))
        if not project:
            abort(404, message="Project {} doesn't exist".format(id))
        project.is_removed = True
        db.session.commit()
        return project, 204

    @login_required
    @marshal_with(project_fields)
    def put(self, id):
        """Lock project

        This method locks a given project. It removes all the processed tmp
        data from the user folder and assign a new tag to the project.
        Locked projects cannot be unlocked

        Parameters
        ----------
        id: str
            Project identifier

        Returns
        -------
        modified project
        """

        if not current_user.is_authenticated:
            abort(403, message="No permissions")

        args = project_put_parser.parse_args()

        project = db.session.query(Project)\
            .filter(Project.id == id, Project.user_id == current_user.id)\
            .first()

        if not project:
            abort(404, message="Project {} doesn't exist".format(id))

        if args.lock == "lock":

            project.is_removed = args.lock
            db.session.commit()

            print current_user.homedir
            dirs_to_remove = os.path.join(current_user.homedir, "jobs",
                                          args.project_id + "-*", "work")

            try:
                os.system("rm -r " + dirs_to_remove)
            except Exception as e:
                return project

        else:
            print "Project was not locked"

        return project


class ProjectListUserResource(Resource):
    """
    Class to get lists of project
    """

    @login_required
    @marshal_with(all_project_fields)
    def get(self):
        """Get user projects

        This method returns all the projects of a given user.

        Returns
        -------
        list: list of user projects
        """

        args = project_get_parser.parse_args()
        if not current_user.is_authenticated:
            abort(403, message="No permissions")

        if args.get_others:
            projects = db.session.query(Project)\
                .filter(Project.user_id != current_user.id).all()
        else:
            projects = db.session.query(Project)\
                .filter(Project.user_id == current_user.id).all()
        if not projects:
            abort(404, message="No projects for user {}"
                  .format(current_user.id))

        for project in projects:
            user = db.session.query(User)\
                .filter(project.user_id == User.id).first()
            project.username = user.username

        return projects, 200

    @login_required
    @marshal_with(all_project_fields)
    def post(self):
        """Add project

        This method adds a project to the user projects. It requires:
        - species_id
        - description
        - user_id
        - dataset name

        Returns
        -------
        new project
        """

        args = project_post_parser.parse_args()
        if not current_user.is_authenticated:
            abort(403, message="No permissions to POST")
        project = Project(species_id=args.species_id,
                          description=args.description,
                          user_id=current_user.id,
                          name=args.name,
                          timestamp=datetime.datetime.utcnow())
        if not project:
            abort(404, message="An error as occurried when uploading the data"
                  .format(id))

        try:
            db.session.add(project)
            db.session.commit()
        except Exception as e:
            abort(409, message="Project name already exists.")
        return project, 201


class ProjectListUserSpecieResource(Resource):
    """
    CLass to get list of projects with filters
    """

    # @login_required
    @marshal_with(all_project_fields)
    def get(self, id):
        """Get projects with filters

        Can return projects of other users or just the user projects or all
        projects

        Parameters
        ----------
        id: species id

        Returns
        -------
        list: list of projects
        """

        args = project_get_parser.parse_args()

        if args.all:
            projects = db.session.query(Project)\
                .filter(Project.species_id == id).all()
        elif args.get_others:
            projects = db.session.query(Project)\
                .filter(Project.user_id != current_user.id,
                        Project.species_id == id).all()
        else:
            projects = db.session.query(Project)\
                .filter(Project.user_id == current_user.id,
                        Project.species_id == id).all()
        if not projects:
            abort(404, message="No projects for specie {}".format(id))

        for project in projects:
            user = db.session.query(User)\
                .filter(project.user_id == User.id).first()

            project.username = user.username

        return projects, 200


class ProjectListAllResource(Resource):
    """
    Class to get all projects
    """

    # @login_required
    @marshal_with(all_project_fields)
    def get(self):
        """Get all projects

        This method returns all the available projects

        Returns
        -------
        list: all projects
        """

        projects = db.session.query(Project).all()
        if not projects:
            abort(404, message="No projects for specie {}".format(id))
        return projects, 200
