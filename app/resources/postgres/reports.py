from app import db
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with
from flask import jsonify, request, send_file

from app.models.models import Report, Combined_Reports
from flask_security import current_user, login_required
import datetime
import zipfile
import string
import random
import json

############################################ NOT BEING USED ####################

"""
Processes are being defined in the ngsonto resources
"""

# Defining post arguments parser
report_get_parser = reqparse.RequestParser()

report_get_parser.add_argument('job_ids', dest='job_ids', type=str,
                               required=False, help="job identifier")
report_get_parser.add_argument('species_id', dest='species_id', type=str,
                               required=False, help="Species ID")

# Defining projects get arguments parser
report_get_project_parser = reqparse.RequestParser()

report_get_project_parser.add_argument('project_id', dest='project_id',
                                       type=str, required=False,
                                       help="project id")
report_get_project_parser.add_argument('pipelines_to_check',
                                       dest='pipelines_to_check', type=str,
                                       required=False,
                                       help="pipelines_to_check")

# Defining report filter get arguments parser
report_get_filter_project_parser = reqparse.RequestParser()

report_get_filter_project_parser.add_argument('selectedProjects',
                                              dest='selectedProjects', type=str,
                                              required=False,
                                              help="selectedProjects")
report_get_filter_project_parser.add_argument('selectedStrains',
                                              dest='selectedStrains', type=str,
                                              required=False,
                                              help="selectedStrains")

# Defining strains in report get arguments parser
report_strain_get_project_parser = reqparse.RequestParser()

report_strain_get_project_parser.add_argument('strain_id', dest='strain_id',
                                              type=str, required=False,
                                              help="strain id")

# Defining report delete arguments parser
report_delete_parser = reqparse.RequestParser()

report_delete_parser.add_argument('report_name', dest='report_name', type=str,
                                  required=False, help="report name")

# Defining report get files arguments parser
report_get__files_parser = reqparse.RequestParser()

report_get__files_parser.add_argument('path',
                                      dest='path', type=str, required=True,
                                      help="path")
report_get__files_parser.add_argument('sampleNames', dest='sampleNames',
                                      type=str, required=True,
                                      help="sampleNames")

# Defining report get files arguments parser
report_get__files_path_parser = reqparse.RequestParser()

report_get__files_path_parser.add_argument('paths',
                                      dest='paths', type=str, required=True,
                                      help="paths")
report_get__files_path_parser.add_argument('file_names',
                                      dest='file_names', type=str, required=True,
                                      help="file_names")

# Defining save report arguments parser
save_reports_parser = reqparse.RequestParser()

save_reports_parser.add_argument('projects_ids', dest='job_ids', type=str,
                                 required=False, help="job identifier")
save_reports_parser.add_argument('filters', dest='filters', type=str,
                                 required=False, help="Applied filters")
save_reports_parser.add_argument('highlights', dest='highlights', type=str,
                                 required=False, help="Applied highlights")
save_reports_parser.add_argument('strain_names', dest='strain_ids', type=str,
                                 required=True, help="strains identifier")
save_reports_parser.add_argument('name', dest='name', type=str, required=False,
                                 help="Report Name")
save_reports_parser.add_argument('description', dest='description', type=str,
                                 required=False, help="description")

saved_report_get_parser = reqparse.RequestParser()
saved_report_get_parser.add_argument('user_id', dest='user_id', type=str,
                                 required=False, help="user identifier")

saved_report_post_parser = reqparse.RequestParser()
saved_report_post_parser.add_argument('user_id', dest='user_id', type=str,
                                 required=False, help="user identifier")
saved_report_post_parser.add_argument('username', dest='username', type=str,
                                 required=False, help="user name")
saved_report_post_parser.add_argument('name', dest='name', type=str,
                                 required=False, help="report name")
saved_report_post_parser.add_argument('description', dest='description', type=str,
                                 required=False, help="description")
saved_report_post_parser.add_argument('strain_names', dest='strain_names', type=str,
                                 required=False, help="strain_names")
saved_report_post_parser.add_argument('projects_id', dest='projects_id', type=str,
                                 required=False, help="projects_id")
saved_report_post_parser.add_argument('filters', dest='filters', type=str,
                                 required=False, help="filters")
saved_report_post_parser.add_argument('highlights', dest='highlights', type=str,
                                 required=False, help="highlights")
saved_report_post_parser.add_argument('is_public', dest='is_public', type=str,
                                 required=False, help="if public")

saved_report_delete_parser = reqparse.RequestParser()
saved_report_delete_parser.add_argument('user_id', dest='user_id', type=str,
                                 required=False, help="user identifier")
saved_report_delete_parser.add_argument('report_id', dest='report_id', type=str,
                                 required=False, help="report identifier")


class ReportsResource(Resource):
    """
    Class to get reports
    """

    @login_required
    def get(self):
        """Get list of reports

        Get reports of a given list of identifiers

        Returns
        -------
        list: reports list
        """

        args = report_get_parser.parse_args()
        reports_to_send = []
        reports = []
        if not args.job_ids:
            plus_report = db.session.query(Report)\
                .filter(Report.user_id == current_user.id).all()
            if plus_report:
                reports.append(plus_report)

        else:
            j_ids = args.job_ids.split(',')
            for j_id in j_ids:
                plus_report = db.session.query(Report)\
                    .filter(Report.job_id == j_id).all()
                if plus_report:
                    reports.append(plus_report)

        if len(reports) == 0:
            abort(404, message="No report available")
        else:
            for result in reports:
                for report in result:
                    reports_to_send.append(
                        {'sample_name': report.sample_name,
                         'procedure_name': report.procedure,
                         'username': report.username,
                         'user_id': report.user_id,
                         'job_id': report.job_id,
                         'report_data': report.report_data
                         }
                    )

        return reports_to_send, 200


class ReportsProjectResource(Resource):
    """
    Class to get reports for set of pipelines
    """

    @login_required
    def get(self):
        """Get reports from pipelines

        This method allows getting the reports associated to a comma
        separated list of pipeline identifiers

        Returns
        -------
        list: reports list
        """

        args = report_get_project_parser.parse_args()
        reports_to_send = []
        reports = []

        pipelines = args.pipelines_to_check.split(",")

        for pipeline in pipelines:
            plus_report = db.session.query(Report)\
                .filter(Report.pipeline_id == pipeline).all()
            if plus_report:
                reports.append(plus_report)

        if len(reports) == 0:
            abort(404, message="No report available")
        else:
            for result in reports:
                for report in result:
                    reports_to_send.append(
                        {'sample_name': report.sample_name,
                         'procedure_name': report.procedure,
                         'username': report.username,
                         'user_id': report.user_id,
                         'job_id': report.job_id,
                         'report_data': report.report_data
                         }
                    )

        return reports_to_send, 200


class ReportInfoResource(Resource):
    """
    Class to get general information of a given report
    """

    # @login_required
    def get(self):
        """Get report information

        This method allows getting general information of a series of
        reports, mainly reports of a given project.

        Returns
        -------
        list: list of reports general information
        """


        args = report_get_project_parser.parse_args()
        reports_to_send = []
        inArray = []

        reports = db.session.query(Report)\
            .filter(Report.project_id.in_(args.project_id.split(","))).all()

        if not reports:
            abort(404, message="No report available")
        else:
            for x in reports:
                if x.sample_name not in inArray:
                    reports_to_send.append(
                        {"sample_name": x.sample_name,
                         "timestamp": x.timestamp.strftime("%Y-%m-%d"),
                         "project_id": x.project_id
                         }
                    )
                    inArray.append(x.sample_name)

        return reports_to_send, 200


class ReportFilterResource(Resource):
    """
    Class to get reports by applying filters
    """

    # @login_required
    def post(self):
        """Reports with filters

        Returns the projects filtered according to a list of selected projet
        identifiers and strain identifiers.

        Returns
        -------
        list: list of reports
        """

        args = report_get_filter_project_parser.parse_args()

        reports_to_send = []

        reports = db.session.query(Report)\
            .filter(Report.project_id.in_(args.selectedProjects.split(",")),
                    Report.sample_name.in_(args.selectedStrains.split(",")))\
            .all()

        for x in reports:
            reports_to_send.append(x.report_data)

        return reports_to_send, 200


class ReportsByProjectResource(Resource):
    """
    Class to get reports by project
    """

    # @login_required
    def get(self):
        """Get reports by projects

        Get reports of a given list of projects

        Returns
        -------
        list: list of reports
        """

        args = report_get_project_parser.parse_args()
        reports_to_send = []

        reports = db.session.query(Report)\
            .filter(Report.project_id.in_(args.project_id.split(","))).all()

        if not reports:
            abort(404, message="No report available")
        else:
            for x in reports:
                reports_to_send.append(x.report_data)

        return reports_to_send, 200


class ReportsStrainResource(Resource):
    """
    Class to get reports of a given strain
    """

    @login_required
    def get(self):
        """Get reports of strain

        This method allows getting the reports available for a given strain
        according to its identifier.

        Returns
        -------
        list: list of reports
        """

        args = report_strain_get_project_parser.parse_args()
        reports_to_send = []

        reports = db.session.query(Report)\
            .filter(Report.sample_name == args.strain_id).all()

        if not reports:
            abort(404, message="No report available")
        else:
            for report in reports:
                reports_to_send.append(
                    {'sample_name': report.sample_name,
                     'procedure_name': report.procedure,
                     'username': report.username,
                     'user_id': report.user_id,
                     'job_id': report.job_id,
                     'report_data': report.report_data
                     }
                )

        return reports_to_send, 200


class CombinedReportsResource(Resource):
    """
    Class to load and save combined reports
    """

    @login_required
    def post(self):
        """Stores information about a current report

        This method allows storing the required information to represent a
        report in a specific space in time.
        Requires information regaring the projects and strains being used,
        and infomration about the filters and the highlights.

        Returns
        -------
        list: combined report
        """

        args = save_reports_parser.parse_args()
        reports_to_send = []

        availableReports = db.session.query(Combined_Reports).filter(
            Combined_Reports.name == args.report_name)

        if availableReports:
            reports_to_send.append({
                "message": "The provided Report name already exists."
            })
        else:
            combined_report = Combined_Reports(species_id=args.species_id,
                                           strain_names=args.strain_ids,
                                           user_id=current_user.id,
                                           username=current_user.username,
                                           run_identifiers=args.job_ids,
                                           timestamp=datetime.datetime.utcnow(),
                                           name=args.report_name,
                                           description=args.report_description)
            if not combined_report:
                abort(404, message="An error as occurried when uploading the data")

            reports_to_send.append(
                {'name': combined_report.name,
                 'description': combined_report.description,
                 'username': combined_report.username,
                 'user_id': combined_report.user_id,
                 'run_identifiers': combined_report.run_identifiers,
                 'strain_names': combined_report.strain_names
                 }
            )

            db.session.add(combined_report)
            db.session.commit()
        return reports_to_send, 201

    @login_required
    def get(self):
        """Get the combined reports available for a given user.

        Returns
        -------
        list: list of saved reports
        """

        args = report_get_parser.parse_args()
        reports_to_send = []

        all_saved_reports = db.session.query(Combined_Reports)\
            .filter(Combined_Reports.user_id == current_user.id,
                    Combined_Reports.species_id == args.species_id).all()

        if not all_saved_reports:
            abort(404, message="No projects for user {}"
                  .format(current_user.id))
        else:
            for saved_report in all_saved_reports:
                reports_to_send.append(
                    {'name': saved_report.name,
                     'description': saved_report.description,
                     'username': saved_report.username,
                     'user_id': saved_report.user_id,
                     'run_identifiers': saved_report.run_identifiers,
                     'strain_names': saved_report.strain_names
                     }
                )

        return reports_to_send, 200

    @login_required
    def delete(self):
        """Delete a combined report

        This method allows to delete a combined report from the database

        Returns
        -------

        """

        args = report_delete_parser.parse_args()

        report_to_remove = db.session.query(Combined_Reports)\
            .filter(Combined_Reports.user_id == current_user.id,
                    Combined_Reports.name == args.report_name).first()

        if not report_to_remove:
            abort(404, message="No report for user {}".format(current_user.id))

        db.session.delete(report_to_remove)
        db.session.commit()

        return 204


class SavedReportsResource(Resource):
    """
    Class to load, save and delete saved reports
    """

    def get(self):
        """Get a list of saved reports for the user

        This method allows getting a list with all the available saved
        reports for a given user.

        Returns
        -------
        list: list with the saved reports of a given user
        """
        args = saved_report_get_parser.parse_args()
        reports_to_send = []

        all_saved_reports = db.session.query(Combined_Reports) \
            .filter((Combined_Reports.user_id == args.user_id) |
                    (Combined_Reports.is_public == "true")).all()

        for x in all_saved_reports:
            print x.filters

            reports_to_send.append({
                "report_id": x.id,
                "user_id": x.user_id,
                "username": x.username,
                "name": x.name,
                "description": x.description,
                "strain_names": x.strain_names,
                "projects_id": x.projects_id,
                "filters": x.filters.encode('utf8'),
                "highlights": x.highlights.encode('utf8'),
                "is_public": x.is_public,
                "timestamp": x.timestamp.strftime("%d-%m-%Y %H:%M:%S")
            })

        return reports_to_send

    def post(self):
        """Adds a saved report to the database

        This method allows adding a report to the database by specifying the
        projects, strains, filters and highlights applied at a given instance.

        Returns
        -------
        list: added report
        """

        args = saved_report_post_parser.parse_args()
        reports_to_send = []

        availableReports = db.session.query(Combined_Reports).filter(
            Combined_Reports.name == args.name).first()

        if availableReports:
            reports_to_send.append({
                "message": "The provided Report name already exists."
            })
        else:
            combined_report = Combined_Reports(user_id=args.user_id,
                                               username=args.username,
                                               name=args.name,
                                               description=args.description,
                                               strain_names=args.strain_names,
                                               projects_id=args.projects_id,
                                               filters=args.filters,
                                               highlights=args.highlights,
                                               is_public=args.is_public,
                                               timestamp=datetime.datetime.utcnow())

            if not combined_report:
                return 404

            reports_to_send.append(
                {
                    "user_id": combined_report.user_id,
                    "username": combined_report.username,
                    "name": combined_report.name,
                    "description": combined_report.description,
                    "strain_names": combined_report.strain_names,
                    "projects_id": combined_report.projects_id,
                    "filters": combined_report.filters,
                    "highlights": combined_report.highlights,
                    "is_public": args.is_public,
                    "timestamp": combined_report.timestamp.strftime("%d-%m-%Y %H:%M:%S")
                })

            db.session.add(combined_report)
            db.session.commit()

        return reports_to_send, 201

    def delete(self):
        """Deletes a saved report

        This method allows deleting a saved report based on its id and on the
        user_id.

        Returns
        -------
        list: deleted report
        """

        args = saved_report_delete_parser.parse_args()

        report_to_remove = db.session.query(Combined_Reports) \
            .filter(Combined_Reports.user_id == args.user_id,
                    Combined_Reports.id == args.report_id).first()

        if not report_to_remove:
            return 404

        db.session.delete(report_to_remove)
        db.session.commit()

        return 204


class ReportsFileStrainResource(Resource):
    """
    Class to download the available assemblies of a report
    """

    def get(self):
        """Get assemblies

        Returns the assemblies available in the requested paths.

        Returns
        -------
        zip file with the assemblies
        """

        args = report_get__files_parser.parse_args()
        try:
            randomString = ''\
                .join(random.choice(string.ascii_uppercase + string.digits)
                      for _ in range(2))

            zip_file_name = "/tmp/assemblies_" + randomString + ".zip"

            sampleNames = args.sampleNames.split(";")

            with zipfile.ZipFile(zip_file_name, 'w') as myzip:
                for i, f in enumerate(args.path.split(";")):
                    myzip.write(f, sampleNames[i] + ".fasta")

            response = send_file(zip_file_name, as_attachment=True)
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Content-Type', 'application/force-download')

            return response
        except Exception as e:
            print e
            return 404


class FilePathOnZipResource(Resource):
    """
    Class to get files in path and return a zip
    """

    def get(self):
        """Get paths

        Returns the files in the provided paths in a zip format

        Returns
        -------
        zip file with the assemblies
        """

        args = report_get__files_path_parser.parse_args()
        try:
            randomString = ''\
                .join(random.choice(string.ascii_uppercase + string.digits)
                      for _ in range(2))

            zip_file_name = "/tmp/files_" + randomString + ".zip"

            file_names = args.file_names.split(";")

            with zipfile.ZipFile(zip_file_name, 'w') as myzip:
                for i, f in enumerate(args.paths.split(";")):
                    myzip.write(f, file_names[i])

            response = send_file(zip_file_name, as_attachment=True)
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Content-Type', 'application/force-download')

            return response
        except Exception as e:
            print e
            return 404

