from app import db
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask import request
import json

from app.models.models import Strain, Project, Ecoli, Yersinia, Salmonella, \
    Campylobacter, Report, Specie
from flask_security import current_user, login_required, roles_required
import datetime
import os

# Defining post arguments parser

strain_project_parser = reqparse.RequestParser()
strain_project_parser.add_argument('strainID', dest='strainID', type=str,
                                   required=False, help="Strain identifier")
strain_project_parser.add_argument('speciesID', dest='speciesID', type=str,
                                   required=False, help="Species identifier")
strain_project_parser.add_argument('from_user', dest='from_user', type=str,
                                   required=False,
                                   help="Get strains submitter only by user")

strain_update_parser = reqparse.RequestParser()
strain_update_parser.add_argument('strain_id', dest='strain_id', type=str,
                                  required=False, help="Strain identifier")
strain_update_parser.add_argument('key', dest='key', type=str, required=False,
                                  help="Key to change on metadata")
strain_update_parser.add_argument('value', dest='value', type=str,
                                  required=False, help="Value to change")

strain_names_parser = reqparse.RequestParser()
strain_names_parser.add_argument('selectedStrains', dest='selectedStrains',
                                 type=str, required=False,
                                 help="selectedStrains")
strain_names_parser.add_argument('selectedProjects', dest='selectedProjects',
                                 type=str, required=False,
                                 help="selectedProjects")

# Param parser to delete fastq from a strain
strain_fastq_delete_parser = reqparse.RequestParser()
strain_fastq_delete_parser.add_argument('strain_names', dest='strain_names',
                                 type=str, required=True,
                                 help="strain_names")
strain_fastq_delete_parser.add_argument('speciesID', dest='speciesID',
                                 type=str, required=True,
                                 help="speciesID")

# Defining response fields

strain_fields = {
    'id': fields.Integer,
    'strainID': fields.String(attribute='name'),
    'fields': fields.String,
    'strain_metadata': fields.String,
    'species_id': fields.String,
    'file_1': fields.String,
    'file_2': fields.String,
    'timestamp': fields.String,
    'classifier': fields.String,
    'fq_location': fields.String,
    'has_files': fields.String,
    'Accession': fields.String
}

strain_fields_project = {
    'id': fields.Integer,
    'strainID': fields.String(attribute='name'),
    'fields': fields.String,
    'strain_metadata': fields.String,
    'species_id': fields.String,
    'file_1': fields.String,
    'file_2': fields.String,
    'timestamp': fields.String,
    'classifier': fields.String,
    'fq_location': fields.String,
    'project_id': fields.String
}

# Defining metadata fields

nottoStore = ["fileselector"]

# Database correspondences
database_correspondece = {
    "E.coli": Ecoli,
    "Yersinia": Yersinia,
    "Salmonella": Salmonella,
    "Campylobacter": Campylobacter
}


class StrainResource(Resource):
    """
    Class to load and add strain information
    """

    @login_required
    @marshal_with(strain_fields)
    def get(self, name):
        """Get strain

        This method allows getting information about a given strain by
        searching for its name

        Parameters
        ----------
        name: str
            Strain name

        Returns
        -------

        """

        if not current_user.is_authenticated:
            abort(403, message="No permissions")
        strain = db.session.query(Strain).filter(Strain.name == name).first()

        # SEARCH FOR CLASSIFICATION ON EACH DB
        e_results = db.session.query(Ecoli).filter(Ecoli.name == name).first()

        if not e_results:
            y_results = db.session.query(Yersinia)\
                .filter(Yersinia.name == name).first()

            if not y_results:
                c_results = db.session.query(Campylobacter)\
                    .filter(Campylobacter.name == name).first()

                if not c_results:
                    s_results = db.session.query(Salmonella)\
                        .filter(Salmonella.name == name).first()

                    if not s_results:
                        strain.classifier = "NA"
                else:
                    strain.classifier = c_results.classifier
            else:
                strain.classifier = y_results.classifier
        else:
            strain.classifier = e_results.classifier

        if not strain:
            abort(404, message="No strain available")
        return strain, 200


class StrainListResource(Resource):
    """
    Class to get list of strains
    """

    @login_required
    @marshal_with(strain_fields)
    def get(self):
        """Get strains list

        This method allows getting list of strains according to a set of
        parameters.
        Can return user and other user strains. Requires species id.

        Returns
        -------

        """

        args = strain_project_parser.parse_args()

        if not current_user.is_authenticated:
            abort(403, message="No permissions")

        if args.speciesID and args.from_user == "true":
            strains = db.session.query(Strain)\
                .filter(Strain.species_id == args.speciesID,
                        Strain.user_id == current_user.id).all()
        elif args.speciesID and args.from_user == "false":
            strains = db.session.query(Strain)\
                .filter(Strain.species_id == args.speciesID).all()
        else:
            strains = db.session.query(Strain).all()

        for strain in strains:
            strain.file_1 = json.loads(strain.strain_metadata)["File_1"]
            strain.file_2 = json.loads(strain.strain_metadata)["File_2"]

            try:
                strain.Accession = json.loads(strain.strain_metadata)["Accession"]
            except Exception as e:
                print e
                strain.Accession = "NA"

            fastq_files_dir = os.path.join(strain.fq_location, "ftp", "files")

            file1_path = os.path.join(fastq_files_dir, strain.file_1)
            file2_path = os.path.join(fastq_files_dir, strain.file_2)

            if not os.path.isfile(file1_path) or not os.path.isfile(file2_path):
                strain.has_files = "false"
            else:
                strain.has_files = "true"

        if not strains:
            abort(404, message="No strain available")

        return strains, 200

    @login_required
    @marshal_with(strain_fields)
    def post(self):
        """Adds a strain to the database

        This method adds a strains with the files associated and its metadata
        to the database.

        Returns
        -------
        new strain
        """

        args = request.form
        metadata_fields = []
        for i in args:
            if i not in nottoStore:
                metadata_fields.append(i)
        if not current_user.is_authenticated:
            abort(403, message="No permissions to POST")

        if not args["Food-Bug"]:
            s_name = args["Primary"]\
                .replace(" ", "-")\
                .replace(".", "-")\
                .replace("#", "-")
        else:
            # Remove concatenation of Food-bug and Primary identifier
            s_name = args["Primary"]\
                .replace(" ", "-")\
                .replace(".", "-")\
                .replace("#", "-")

        strain = db.session.query(Strain).filter(Strain.name == s_name).first()

        if strain:
            try:
                if args["File_1"] \
                        and (json.loads(strain.strain_metadata)["File_1"] ==
                                 args["File_1"]
                             or json.loads(strain.strain_metadata)["File_1"] !=
                                args["File_1"]):
                    strain.file_1 = json.loads(strain.strain_metadata)["File_1"]

                if args["File_2"] \
                        and (json.loads(strain.strain_metadata)["File_2"] ==
                                 args["File_2"]
                             or json.loads(strain.strain_metadata)["File_2"] !=
                                args["File_2"]):
                    strain.file_2 = json.loads(strain.strain_metadata)["File_2"]
            except KeyError as e:
                print e
                # Case no file is associated with the strain (Rarely happens)
                strain.strain_metadata = json.dumps(args)
                db.session.commit()
            return strain, 200

        try:
            strain = Strain(name=s_name, species_id=args["species_id"],
                            fields=json.dumps(
                                {"metadata_fields": metadata_fields}),
                            strain_metadata=json.dumps(args),
                            timestamp=datetime.datetime.utcnow(),
                            user_id=current_user.id,
                            fq_location=current_user.homedir)

            if not strain:
                abort(404, message="An error as occurried")

            db.session.add(strain)
            db.session.commit()
        except Exception as erro:
            print erro
            db.session.rollback()
            strain = db.session.query(Strain).filter(Strain.name == s_name)\
                .first()

        return strain, 201

    @login_required
    @marshal_with(strain_fields)
    def put(self):
        """Modify strain metadata

        This method allows the modification of certain aspects of the strain
        metadata. Ids cannot be changed or the files associated with it.

        Returns
        -------

        """
        args = request.form
        strain = db.session.query(Strain)\
            .filter(Strain.id == args["strain_id"]).first()

        if not strain:
            abort(404, message="An error as occurried")
        else:
            strain_metadata = json.loads(strain.strain_metadata)

            for key, val in args.iteritems():
                strain_metadata[key] = val

            strain.strain_metadata = json.dumps(strain_metadata)
            db.session.commit()

            return strain, 201


class StrainsByNameResource(Resource):
    """
    Class that allows searching for strains by using a set of filters
    """

    @marshal_with(strain_fields_project)
    def post(self):
        """Get all strains with a given filter

        Searches for strains with a given name and belonging to a set of
        projects.

        Returns
        -------
        list: list of strains
        """

        args = strain_names_parser.parse_args()
        strains_to_search = args.selectedStrains.split(",")
        projects_to_search = args.selectedProjects.split(",")

        print strains_to_search

        nameToProject = {}

        for i, y in enumerate(strains_to_search):
            nameToProject[strains_to_search[i]] = projects_to_search[i]

        strains = db.session.query(Strain)\
            .filter(Strain.name.in_(strains_to_search)).all()

        for strain in strains:
            print strain.name
            database_entry = db.session.query(Specie)\
                .filter(Specie.id == strain.species_id).first()

            if database_entry:
                classifiers = db.session\
                    .query(database_correspondece[database_entry.name])\
                    .filter(database_correspondece[database_entry.name].name
                            == strain.name).first()

                if classifiers:
                    strain.classifier = "{}:{}:{}".format(
                        classifiers.classifier_l1, classifiers.classifier_l2,
                        classifiers.classifier_l3)

        for i, strain in enumerate(strains):
            strain.file_1 = json.loads(strain.strain_metadata)["File_1"]
            strain.file_2 = json.loads(strain.strain_metadata)["File_2"]
            strain.project_id = nameToProject[strain.name]

        if not strains:
            return {}
        return strains, 200


class StrainProjectListResource(Resource):
    """
    Class to perform operations of strains of a given project
    """

    @login_required
    @marshal_with(strain_fields)
    def get(self, id):
        """Get project strains

        Get all strains of a given project.

        Parameters
        ----------
        id: str
            Project identifier

        Returns
        -------
        list: list of strains
        """

        if not current_user.is_authenticated:
            abort(403, message="No permissions")
        project = db.session.query(Project).filter(Project.id == id).first()

        if not project:
            abort(404, message="No project available")
        strains = project.project_strains()

        if not strains:
            abort(404, message="No strain available")

        for strain in strains:
            file_1 = json.loads(strain.strain_metadata)["File_1"]
            file_2 = json.loads(strain.strain_metadata)["File_2"]

            strain.file_1 = file_1
            strain.file_2 = file_2

            try:
                strain.Accession = json.loads(strain.strain_metadata)["Accession"]
            except Exception as e:
                print e
                strain.Accession = "NA"

            fastq_files_dir = os.path.join(strain.fq_location, "ftp", "files")

            file1_path = os.path.join(fastq_files_dir, file_1)
            file2_path = os.path.join(fastq_files_dir, file_2)

            if not os.path.isfile(file1_path) or not os.path.isfile(file2_path):
                strain.has_files = "false"
            else:
                strain.has_files = "true"

        return strains, 200

    @login_required
    @marshal_with(strain_fields)
    def put(self, id):
        """Add strain to project

        This method allows adding a strain to a project.
        Requires the strain name and the project identifier

        Parameters
        ----------
        id: str
            project identifier

        Returns
        -------
        strain object
        """

        args = strain_project_parser.parse_args()
        if not current_user.is_authenticated:
            abort(403, message="No permissions")
        project = db.session.query(Project).filter(Project.id == id).first()
        if not project:
            abort(404, message="No project available")
        strain = db.session.query(Strain)\
            .filter(Strain.name == args.strainID).first()
        if not strain:
            abort(404, message="No strain available")

        put_status = project.add_Strain(strain)

        if not put_status:
            return abort(404, message="Strain already on project")

        db.session.commit()

        strain.file_1 = json.loads(strain.strain_metadata)["File_1"]
        strain.file_2 = json.loads(strain.strain_metadata)["File_2"]

        try:
            strain.Accession = json.loads(strain.strain_metadata)["Accession"]
        except Exception as e:
            print e
            strain.Accession = "NA"

        fastq_files_dir = os.path.join(strain.fq_location, "ftp", "files")

        file1_path = os.path.join(fastq_files_dir, strain.file_1)
        file2_path = os.path.join(fastq_files_dir, strain.file_2)

        if not os.path.isfile(file1_path) or not os.path.isfile(file2_path):
            strain.has_files = "false"
        else:
            strain.has_files = "true"

        return strain, 200

    @login_required
    @marshal_with(strain_fields)
    def delete(self, id):
        """Remove strain from project

        This method allows removing a strain from a project. Requires the
        strain name and the project id.

        It also removes the reports associated with that strain on that project.

        Parameters
        ----------
        id: str
            project identifier

        Returns
        -------
        strain object
        """

        args = strain_project_parser.parse_args()
        if not current_user.is_authenticated:
            abort(403, message="No permissions")
        project = db.session.query(Project).filter(Project.id == id).first()
        if not project:
            abort(404, message="No project available")
        strain = db.session.query(Strain)\
            .filter(Strain.name == args.strainID).first()
        if not strain:
            abort(404, message="No strain available")

        project.remove_Strain(strain)

        p_id = str(id)

        # Remove associated reports if exist
        reports = db.session.query(Report).\
            filter(Report.project_id == p_id, Report.sample_name ==
                   args.strainID).all()

        if reports:
            for report in reports:
                db.session.delete(report)

        db.session.commit()

        return strain, 200


class DeleteReadsFromStrain(Resource):
    """
    Class of resource to delete strains from a given project.
    """

    def delete(self):

        if not current_user.is_authenticated:
            abort(403, message="No permissions")

        args = strain_fastq_delete_parser.parse_args()

        strains = db.session.query(Strain)\
            .filter(Strain.species_id == args.speciesID,
                    Strain.user_id == current_user.id,
                    Strain.name.in_(args.strain_names.split(","))).all()

        for strain in strains:
            file_1 = json.loads(strain.strain_metadata)["File_1"]
            file_2 = json.loads(strain.strain_metadata)["File_2"]

            fastq_files_dir = os.path.join(current_user.homedir, "ftp", "files")

            file1_path = os.path.join(fastq_files_dir, file_1)
            file2_path = os.path.join(fastq_files_dir, file_2)

            print "DELETED:"

            if os.path.isfile(file1_path):
                os.remove(file1_path)
                print file1_path

            if os.path.isfile(file2_path):
                os.remove(file2_path)
                print file2_path

        return 204


class SpeciesStatistics(Resource):
    """
    Class of resource to get global statistics regarding a defining species.
    Get info on number of strains, number of projects and number of profiles.
    """

    def get(self):

        # Get strain count
        strains_1_count = db.session.query(Strain).filter(
            Strain.species_id == "1").count()
        strains_2_count = db.session.query(Strain).filter(
            Strain.species_id == "2").count()
        strains_3_count = db.session.query(Strain).filter(
            Strain.species_id == "3").count()
        strains_4_count = db.session.query(Strain).filter(
            Strain.species_id == "4").count()

        # Get project count
        projects_1_count = db.session.query(Project).filter(
            Project.species_id == "1").count()
        projects_2_count = db.session.query(Project).filter(
            Project.species_id == "2").count()
        projects_3_count = db.session.query(Project).filter(
            Project.species_id == "3").count()
        projects_4_count = db.session.query(Project).filter(
            Project.species_id == "4").count()

        # Get profile count
        profile_1_count = db.session.query(Ecoli).count()
        profile_2_count = db.session.query(Yersinia).count()
        profile_3_count = db.session.query(Campylobacter).count()
        profile_4_count = db.session.query(Salmonella).count()

        # Build object
        species_object = {
            "E.coli": [strains_1_count, projects_1_count, profile_1_count],
            "Salmonella": [strains_4_count, projects_4_count,
                              profile_4_count],
            "Yersinia": [strains_2_count, projects_2_count, profile_2_count],
            "Campylobacter": [strains_3_count, projects_3_count,
                              profile_3_count]
        }

        return species_object
