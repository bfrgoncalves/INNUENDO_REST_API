from app import app, db
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask_security import current_user
from flask import jsonify, request
from sqlalchemy import or_, cast, DATE

from app.models.models import Report, Combined_Reports
from flask_security import current_user, login_required, roles_required
import datetime
import json

############################################ NOT BEING USED #######################################################

"""
Processes are being defined in the ngsonto resources
"""

#Defining post arguments parser
report_get_parser = reqparse.RequestParser()
report_get_parser.add_argument('job_ids', dest='job_ids', type=str, required=False, help="job identifier")
report_get_parser.add_argument('species_id', dest='species_id', type=str, required=False, help="Species ID")

report_get_project_parser = reqparse.RequestParser()
report_get_project_parser.add_argument('project_id', dest='project_id', type=str, required=False, help="project id")
report_get_project_parser.add_argument('pipelines_to_check', dest='pipelines_to_check', type=str, required=False, help="pipelines_to_check")

report_get_filter_project_parser = reqparse.RequestParser()
report_get_filter_project_parser.add_argument('project_id', dest='project_id', type=str, required=False, help="project id")
report_get_filter_project_parser.add_argument('minTimeFilter', dest='minTimeFilter', type=str, required=False, help="maxTimeFilter")
report_get_filter_project_parser.add_argument('maxTimeFilter', dest='maxTimeFilter', type=str, required=False, help="maxTimeFilter")

report_strain_get_project_parser = reqparse.RequestParser()
report_strain_get_project_parser.add_argument('strain_id', dest='strain_id', type=str, required=False, help="strain id")

report_delete_parser = reqparse.RequestParser()
report_delete_parser.add_argument('report_name', dest='report_name', type=str, required=False, help="report name")

save_reports_parser = reqparse.RequestParser()
save_reports_parser.add_argument('job_ids', dest='job_ids', type=str, required=False, help="job identifier")
save_reports_parser.add_argument('species_id', dest='species_id', type=str, required=False, help="Species ID")
save_reports_parser.add_argument('strain_ids', dest='strain_ids', type=str, required=True, help="strains identifier")
save_reports_parser.add_argument('report_name', dest='report_name', type=str, required=False, help="Report Name")
save_reports_parser.add_argument('report_description', dest='report_description', type=str, required=False, help="Report Description")

#Defining response fields


class ReportsResource(Resource):

	@login_required
	def get(self):
		args = report_get_parser.parse_args()
		reports_to_send = []
		reports = []
		if not args.job_ids:
			#plus_report = db.session.query(Report).filter(Report.user_id == current_user.id).all()
			plus_report = db.session.query(Report).filter(Report.user_id == current_user.id).all()
			if plus_report:
				reports.append(plus_report)

		else:
			j_ids = args.job_ids.split(',')
			for j_id in j_ids:
				plus_report = db.session.query(Report).filter(Report.job_id == j_id).all()
				if plus_report:
					reports.append(plus_report)

		if len(reports) == 0:
			abort(404, message="No report available")
		else:
			for result in reports:
				for report in result:
					reports_to_send.append({'sample_name': report.sample_name, 'procedure_name': report.procedure, 'username': report.username, 'user_id': report.user_id, 'job_id': report.job_id, 'report_data': report.report_data})
				
		return reports_to_send, 200


class ReportsProjectResource(Resource):

	@login_required
	def get(self):
		args = report_get_project_parser.parse_args()
		reports_to_send = []
		reports = []

		pipelines = args.pipelines_to_check.split(",")

		for pipeline in pipelines:
			plus_report = db.session.query(Report).filter(Report.pipeline_id == pipeline).all()
			if plus_report:
				reports.append(plus_report)

		if len(reports) == 0:
			abort(404, message="No report available")
		else:
			for result in reports:
				for report in result:
					reports_to_send.append({'sample_name': report.sample_name, 'procedure_name': report.procedure, 'username': report.username, 'user_id': report.user_id, 'job_id': report.job_id, 'report_data': report.report_data})
				
		return reports_to_send, 200


class ReportInfoResource(Resource):

	#@login_required
	def get(self):
		args = report_get_project_parser.parse_args()
		reports_to_send = []
		reports = []

		reports = db.session.query(Report).filter(Report.project_id.in_(args.project_id.split(","))).all()

		if not reports:
			abort(404, message="No report available")
		else:
			for x in reports:
				reports_to_send.append({"sample_name":x.sample_name, "timestamp":x.timestamp.strftime("%Y-%m-%d")})
		
		return reports_to_send, 200

class ReportFilterResource(Resource):

	#@login_required
	def get(self):
		args = report_get_filter_project_parser.parse_args()
		reports_to_send = []
		reports = []
		print args.maxTimeFilter, args.minTimeFilter, args.project_id

		'''
		if args.dateFilter != None:
			options = {
				"<" : cast(Report.timestamp, DATE) < args.dateFilter,
				"<=" : cast(Report.timestamp, DATE) <= args.dateFilter,
				">" : cast(Report.timestamp, DATE) > args.dateFilter,
				">=" : cast(Report.timestamp, DATE) >= args.dateFilter,
				"=" : cast(Report.timestamp, DATE) == args.dateFilter
			}
		'''

		reports = db.session.query(Report).filter(Report.project_id.in_(args.project_id.split(",")), cast(Report.timestamp, DATE) >= args.minTimeFilter, cast(Report.timestamp, DATE) <= args.maxTimeFilter).all()

		'''if args.dateFilter == None and args.nameFilter != None:
			reports = db.session.query(Report).filter(Report.project_id.in_(args.project_id.split(",")), Report.sample_name.in_(args.nameFilter.split(","))).all()
		elif args.dateFilter != None and args.nameFilter == None and args.operatorFilter != None:
			reports = db.session.query(Report).filter(Report.project_id.in_(args.project_id.split(",")), options[args.operatorFilter]).all()
		elif args.dateFilter == None and args.nameFilter == None:
			reports = db.session.query(Report).filter(Report.project_id.in_(args.project_id.split(","))).all()
		else:
			reports = db.session.query(Report).filter(Report.project_id.in_(args.project_id.split(",")), (Report.sample_name.in_(args.nameFilter.split(",")) | options[args.operatorFilter])).all()
		'''
		#if not reports:
		#	abort(404, message="No report available")
		#else:
		for x in reports:
			reports_to_send.append({"project_id":x.project_id, "pipeline_id":x.pipeline_id, "process_id":x.process_position, "username":x.username, "user_id":x.user_id, "sample_name":x.sample_name, "report_json":x.report_data})
	
		return reports_to_send, 200


class ReportsByProjectResource(Resource):

	#@login_required
	def get(self):
		args = report_get_project_parser.parse_args()
		reports_to_send = []
		reports = []

		reports = db.session.query(Report).filter(Report.project_id.in_(args.project_id.split(","))).all()

		if not reports:
			abort(404, message="No report available")
		else:
			for x in reports:
				reports_to_send.append({"project_id":x.project_id, "pipeline_id":x.pipeline_id, "process_id":x.process_position, "username":x.username, "user_id":x.user_id, "sample_name":x.sample_name, "report_json":x.report_data})
		
		return reports_to_send, 200

class ReportsStrainResource(Resource):

	@login_required
	def get(self):
		args = report_strain_get_project_parser.parse_args()
		reports_to_send = []
		reports = []

		reports = db.session.query(Report).filter(Report.sample_name == args.strain_id).all()

		if not reports:
			abort(404, message="No report available")
		else:
			for report in reports:
				reports_to_send.append({'sample_name': report.sample_name, 'procedure_name': report.procedure, 'username': report.username, 'user_id': report.user_id, 'job_id': report.job_id, 'report_data': report.report_data})
			
		return reports_to_send, 200


class CombinedReportsResource(Resource):

	@login_required
	def post(self):
		args = save_reports_parser.parse_args()
		reports_to_send = []
		combined_report = Combined_Reports(species_id=args.species_id, strain_names=args.strain_ids, user_id=current_user.id, username=current_user.username, run_identifiers=args.job_ids, timestamp=datetime.datetime.utcnow(), name=args.report_name, description=args.report_description)
		if not combined_report:
			abort(404, message="An error as occurried when uploading the data".format(id))
		reports_to_send.append({'name': combined_report.name,'description': combined_report.description,'username': combined_report.username, 'user_id': combined_report.user_id, 'run_identifiers': combined_report.run_identifiers, 'strain_names':combined_report.strain_names})
		db.session.add(combined_report)
		db.session.commit()
		return reports_to_send, 201

	@login_required
	def get(self):
		args = report_get_parser.parse_args()
		reports_to_send = []
		all_saved_reports = db.session.query(Combined_Reports).filter(Combined_Reports.user_id == current_user.id, Combined_Reports.species_id == args.species_id).all()
		if not all_saved_reports:
			abort(404, message="No projects for user {}".format(current_user.id))
		else:
			for saved_report in all_saved_reports:
				reports_to_send.append({'name': saved_report.name,'description': saved_report.description,'username': saved_report.username, 'user_id': saved_report.user_id, 'run_identifiers': saved_report.run_identifiers, 'strain_names':saved_report.strain_names})
		return reports_to_send, 200

	@login_required
	def delete(self):
		args = report_delete_parser.parse_args()
		report_to_remove = db.session.query(Combined_Reports).filter(Combined_Reports.user_id == current_user.id, Combined_Reports.name == args.report_name).first()
		if not report_to_remove:
			abort(404, message="No report for user {}".format(current_user.id))
		db.session.delete(report_to_remove)
		db.session.commit()
		return 204
