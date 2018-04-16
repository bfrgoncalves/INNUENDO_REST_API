from app import db, dbconAg
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with
from flask import jsonify, send_file, request
from app.utils.queryParse2Json import parseAgraphQueryRes
from flask_security import current_user, login_required, roles_required, auth_token_required
import datetime
from config import CURRENT_ROOT, JOBS_ROOT, OUTPUT_URL, USER_STORAGES
from config import obo,localNSpace,protocolsTypes,processTypes,processMessages
from franz.openrdf.query.query import QueryLanguage
from app.models.models import Protocol
from app.models.models import Strain
from app.models.models import Report, Project, User

from sqlalchemy import cast, Integer

import json
import requests
import os
import string
import random
import shutil

from job_processing.queue_processor import Queue_Processor

'''
Jobs resources:
    - send job to slurm
    - add results to database
    - classify profile using fast-mlst
'''

job_post_parser = reqparse.RequestParser()

job_post_parser.add_argument('protocol_ids', dest='protocol_ids', type=str,
                             required=True, help="Protocols Ids")
job_post_parser.add_argument('strain_id', dest='strain_id', type=str,
                             required=True, help="Protocols Ids")
job_post_parser.add_argument('pipeline_id', dest='pipeline_id', type=str,
                             required=True, help="Pipeline identifier")
job_post_parser.add_argument('project_id', dest='project_id', type=str,
                             required=True, help="project id")
job_post_parser.add_argument('process_id', dest='process_id', type=str,
                             required=True, help="process id")
job_post_parser.add_argument('processes_wrkdir', dest='processes_wrkdir',
                             type=str, required=True, help="processes_wrkdir")
job_post_parser.add_argument('processes_to_run', dest='processes_to_run',
                             type=str, required=True, help="processes_to_run")
job_post_parser.add_argument('strain_submitter', dest='strain_submitter',
                             type=str, required=True, help="strain_submitter id"
                             )
job_post_parser.add_argument('current_specie', dest='current_specie',
                             type=str,  required=True, help="current specie")
job_post_parser.add_argument('sampleName', dest='sampleName', type=str,
                             required=True, help="Sample Name")


job_get_parser = reqparse.RequestParser()
job_get_parser.add_argument('job_id', dest='job_id', type=str, required=True,
                            help="Job id")
job_get_parser.add_argument('procedure_name', dest='procedure_name',
                            type=str,  required=True, help="Procedure name")
job_get_parser.add_argument('sample_name', dest='sample_name', type=str,
                            required=True, help="Sample name")
job_get_parser.add_argument('process_position', dest='process_position',
                            type=str, required=True,
                            help="Position of the process")
job_get_parser.add_argument('pipeline_id', dest='pipeline_id', type=str,
                            required=True, help="Pipeline identifier")
job_get_parser.add_argument('project_id', dest='project_id', type=str,
                            required=True, help="project id")
job_get_parser.add_argument('process_id', dest='process_id', type=str,
                            required=True, help="process id")
job_get_parser.add_argument('homedir', dest='homedir', type=str, required=True,
                            help="home dir")
job_get_parser.add_argument('database_to_include', dest='database_to_include',
                            type=str, required=True,
                            help="Database to use if required")
job_get_parser.add_argument('current_user_name', dest='current_user_name',
                            type=str, required=True, help="Current user name")
job_get_parser.add_argument('current_user_id', dest='current_user_id', type=str,
                            required=True, help="current user id")
job_get_parser.add_argument('from_process_controller',
                            dest='from_process_controller', type=str,
                            required=True,
                            help="is the request from the process controller?")

job_results_get_parser = reqparse.RequestParser()
job_results_get_parser.add_argument('job_id', dest='job_id', type=str,
                                    required=True, help="Job id")

job_download_results_get_parser = reqparse.RequestParser()
job_download_results_get_parser.add_argument('file_path', dest='file_path',
                                             type=str, required=True,
                                             help="Job Path")

job_classify_chewbbaca_post_parser = reqparse.RequestParser()
job_classify_chewbbaca_post_parser.add_argument('job_id', dest='job_id',
                                                type=str, required=True,
                                                help="Job ID")
job_classify_chewbbaca_post_parser.add_argument('database_to_include',
                                                dest='database_to_include',
                                                type=str, required=True,
                                                help="Database to include")

nextflow_logs_get_parser = reqparse.RequestParser()
nextflow_logs_get_parser.add_argument('pipeline_id', dest='pipeline_id',
                                      type=str, required=True,
                                      help="pipeline_id")
nextflow_logs_get_parser.add_argument('project_id', dest='project_id',
                                      type=str, required=True,
                                      help="project_id")
nextflow_logs_get_parser.add_argument('filename', dest='filename', type=str,
                                      required=True, help="filename")

database_processor = Queue_Processor()


# Add job data to db
def add_data_to_db(results, sample, project_id, pipeline_id, process_position,
                   username, user_id, procedure, species, overwrite):
    """Adds reports data to postgres database

    Method to add all the required information to construct a report entry
    for a process of the platform.

    Parameters
    ----------
    results: dict
        JSON object with the results provided by a given process
    sample: str
        Sample name
    project_id: str
        Project identifier
    pipeline_id: str
        Pipeline identifier
    process_position: str
        The position of the process in the pipeline
    username: str
        The username submitting the report
    user_id: str
        The id of the user submitting the report
    procedure: str
        The process name
    species: str
        The species name
    overwrite: str
        If is to overwrite the report entry
    Returns
    -------
    bool: True in case report is saved sucessfully on the database
    """

    report = db.session.query(Report).filter(
        Report.project_id == project_id, Report.pipeline_id == pipeline_id,
        Report.procedure == procedure).first()

    print results.keys()

    # Classify the profiles case the procedure is chewbbaca
    if "chewbbaca" in procedure:
        new_job_id = project_id + pipeline_id + process_position

        if results["status"] != "fail":
            jobID = database_processor.classify_profile(results, species,
                                                        sample, new_job_id)
            strain = db.session.query(Strain).filter(Strain.name == sample)\
                .first()

            if not strain:
                print "No strain with name " + sample
            else:
                try:
                    metadata = json.loads(strain.strain_metadata)
                    chewstatus = results["status"]
                    metadata["chewBBACAStatus"] = chewstatus
                    strain.strain_metadata = json.dumps(metadata)
                    db.session.commit()
                except Exception:
                    print "No chewbbaca status"
        else:
            print "chewBBACA failed"

    # Add the serotype to the metadata case the procedure is seq_typing
    if "seq_typing" in procedure:
        strain = db.session.query(Strain).filter(Strain.name == sample).first()

        if not strain:
            print "No strain with name " + sample
        else:
            try:
                metadata = json.loads(strain.strain_metadata)
                typing = results["typing"]["seqtyping"]
                metadata["Serotype"] = typing
                strain.strain_metadata = json.dumps(metadata)
                db.session.commit()
            except Exception:
                print "No seqtyping data"

    # Add pathotype to the metadata case the procedure is pathotyping
    if "patho_typing" in procedure:
        strain = db.session.query(Strain).filter(Strain.name == sample).first()

        if not strain:
            print "No strain with name " + sample
        else:
            try:
                metadata = json.loads(strain.strain_metadata)
                typing = results["typing"]["pathotyping"]
                metadata["Pathotype"] = typing
                strain.strain_metadata = json.dumps(metadata)
                db.session.commit()
            except Exception:
                print "No pathotyping data"

    # Add report to db if not exists
    if not report:
        report = Report(project_id=project_id, pipeline_id=pipeline_id,
                        report_data=results,
                        timestamp=datetime.datetime.utcnow(),
                        user_id=user_id, username=username, sample_name=sample,
                        process_position=process_position, procedure=procedure)
        if not report:
            abort(404, message="An error as occurried when uploading the data")

        db.session.add(report)
        db.session.commit()

        return True
    else:

        report_to_append = ["trace"]

        if overwrite == "false":
            for el in report_to_append:
                try:
                    results[el].extend(report.report_data[el])
                except Exception:
                    print "No trace to append"

        report.project_id = project_id
        report.pipeline_id = pipeline_id
        report.process_position = process_position
        report.report_data = results
        report.timestamp = datetime.datetime.utcnow()
        report.user_id = user_id
        report.username = username
        report.sample_name = sample
        report.procedure = procedure

        db.session.commit()

    return True


class Job_Reports(Resource):
    """
    Class to add job report to db
    """

    def post(self):
        """Add job report to db

        Parses the post requests and loads the json object to be stored in
        the dababase

        Returns
        -------
        bool: True if the requests was sucessful
        """

        parameters = request.json
        try:
            parameters_json = json.loads(parameters.replace("'", '"'))
        except Exception as e:
            print e
            return 500

        json_data = parameters_json["report_json"]
        username = parameters_json["current_user_name"]
        user_id = parameters_json["current_user_id"]
        task = parameters_json["task"]
        workdir = parameters_json["workdir"]
        versions = parameters_json["versions"]
        trace = parameters_json["trace"]
        overwrite = parameters_json["overwrite"]

        json_data["trace"] = [trace]
        json_data["versions"] = versions
        json_data["task"] = task
        json_data["workdir"] = workdir

        is_added = add_data_to_db(json_data, parameters_json["sample_name"],
                                  parameters_json["project_id"],
                                  parameters_json["pipeline_id"],
                                  parameters_json["process_id"],  username,
                                  user_id, json_data["task"],
                                  parameters_json["species"], overwrite)

        return True


# Run jobs using nextflow and get job status
class Job_queue(Resource):
    """
    Class to submit jobs to the process controller and to get the status of
    the procedures
    """

    @login_required
    def post(self):
        """Sends the job to the process controller

        Parses the request and sends all the required fields to the process
        controller.

        protocol_ids, process_ids, processes_wrkdir, strain_id,
        processes_to_run, project_id, pipeline_id

        Returns
        -------
        list: list with the processes unique identifiers
        """

        args = job_post_parser.parse_args()
        protocol_ids = args.protocol_ids.split(',')
        process_ids = args.process_id.split(',')
        processes_wrkdir = args.processes_wrkdir.split(',')
        strain_id = args.strain_id
        processes_to_run = args.processes_to_run.split(',')

        data = []
        to_send = []

        counter = 0

        for protocol_id in protocol_ids:
            protocol = db.session.query(Protocol).filter(
                Protocol.id == protocol_id).first()
            strain = db.session.query(Strain).filter(
                Strain.id == strain_id).first()
            protocol.steps = protocol.steps.replace("'", '"')

            steps = json.loads(protocol.steps)
            fields = json.loads(strain.fields)
            metadata = json.loads(strain.strain_metadata)

            files = {}

            if processes_wrkdir[counter] != "false" \
                    and processes_to_run[counter] == "true":

                wdirs = processes_wrkdir[counter].split(";")

                # Remove nextflow dirs
                for wd in wdirs:
                    if wd == "":
                        continue

                    workdirPath = os.path.join(
                        current_user.homedir, "jobs",
                        args.project_id + "-" + args.pipeline_id, "work", wd)

                    try:
                        shutil.rmtree(workdirPath)
                    except OSError:
                        print "No such directory", workdirPath

                # Remove reports from process id
                reports = db.session.query(Report).filter(
                    Report.project_id == args.project_id,
                    Report.pipeline_id == args.pipeline_id,
                    cast(Report.process_position, Integer)
                    >= int(process_ids[counter])).all()

                if reports:
                    for report in reports:
                        print "has report"
                        db.session.delete(report)
                    db.session.commit()

            for x in fields['metadata_fields']:
                if 'File_' in x:
                    files[x] = metadata[x]

            if 'used Parameter' in steps:
                data.append({
                    'parameters': json.dumps(steps),
                    'username': str(current_user.username),
                    'strain_submitter': args.strain_submitter,
                    'files': json.dumps(files),
                    'project_id': args.project_id,
                    'pipeline_id': args.pipeline_id,
                    'process_id': process_ids[counter],
                    'process_to_run': processes_to_run[counter]})
            else:
                to_send.append("null")
            counter += 1

        request = requests.post(JOBS_ROOT,
                                data={
                                    'data': json.dumps(data),
                                    'homedir': current_user.homedir,
                                    'current_specie': args.current_specie,
                                    'sampleName': args.sampleName,
                                    'current_user_id': str(current_user.id),
                                    'current_user_name': str(
                                        current_user.username)
                                    }
                                )

        to_send.append(request.json()['jobID'])
        return to_send, 200

    def get(self):
        """Get job status

        Get status of a process by performing a query to the NGSOnto. It
        requires:

        project_id, pipeline_id, process_id, job_id

        Returns
        -------
        dict: information regarding the current job status
        """

        args = job_get_parser.parse_args()

        job_ids = args.job_id.split(",")
        process_ids = args.process_id.split(",")
        store_jobs_in_db = []
        all_results = []
        all_std_out = []
        all_paths = []
        all_wrkdirs = []

        for k in range(0, len(job_ids)):

            job_id = job_ids[k]
            process_id = process_ids[k]

            results = [[],[]]
            store_in_db = False

            final_status = ""
            file2Path = []

            try:
                procStr = localNSpace + "projects/" + str(args.project_id) + \
                          "/pipelines/" + str(args.pipeline_id) + "/processes/"\
                          + str(process_id)

                queryString = "SELECT (str(?typelabel) as ?label) (str(?file1)"\
                              " as ?file_1) (str(?file2) as ?file_2) " \
                              "(str(?file3) as ?file_3) (str(?file4) as " \
                              "?file_4) (str(?status) as ?statusStr) " \
                              "WHERE{<"+procStr+"> obo:RO_0002234 ?in. ?in a " \
                              "?type.?type rdfs:label ?typelabel. OPTIONAL { " \
                              "?in obo:NGS_0000092 ?file1; obo:NGS_0000093 " \
                              "?file2; obo:NGS_0000096 ?file4; obo:NGS_0000094"\
                              " ?file3. } OPTIONAL {?in obo:NGS_0000097 " \
                              "?status.} }"

                tupleQuery = dbconAg.prepareTupleQuery(QueryLanguage.SPARQL,
                                                       queryString)
                result = tupleQuery.evaluate()

                jsonResult = parseAgraphQueryRes(
                    result, ["statusStr", "file_2", "file_4"])

                result.close()

                if "pass" in jsonResult[0]["statusStr"]:
                    final_status = "COMPLETED"
                elif "None" in jsonResult[0]["statusStr"]:
                    final_status = "PD"
                elif "running" in jsonResult[0]["statusStr"]:
                    final_status = "R"
                elif "pending" in jsonResult[0]["statusStr"]:
                    final_status = "PD"
                elif "warning" in jsonResult[0]["statusStr"]:
                    final_status = "WARNING"
                elif "fail" in jsonResult[0]["statusStr"]:
                    final_status = "FAILED"
                elif "error" in jsonResult[0]["statusStr"]:
                    final_status = "FAILED"

                try:
                    for r in jsonResult:
                        file2Path.append(
                            '/'.join(r["file_4"].split("/")[-3:-1]))
                except Exception as p:
                    file2Path = []

            except Exception as e:
                final_status = "NEUTRAL"

            stdout = [job_id, final_status]

            all_std_out.append(stdout)
            store_jobs_in_db.append(store_in_db)
            all_results.append(results[0])
            all_paths.append(results[1])
            all_wrkdirs.append(file2Path)

        results = {
            'stdout': all_std_out,
            'store_in_db': store_jobs_in_db,
            'results': all_results,
            'paths': all_paths,
            'job_id': job_ids,
            'all_wrkdirs': all_wrkdirs,
            'process_ids': process_ids
        }

        return results, 200


# Load job results to display on graphical interface
class Job_results(Resource):
    """
    Class to get the report data of a given job
    """

    @login_required
    def get(self):
        """Get report data

        Get the report data of a given job id

        (DEPRECATED)

        Returns
        -------
        dict: report data
        """

        args = job_results_get_parser.parse_args()
        report = db.session.query(Report).filter(
            Report.job_id == args.job_id).first()

        return report.report_data


# Load job results and classify it
class Job_classify_chewbbaca(Resource):
    """
    Class to classify chewbbaca
    """

    def get(self):
        """Classify profile

        Classify a profile by giving its job_id

        (DEPRECATED)

        Returns
        -------

        """

        args = job_classify_chewbbaca_post_parser.parse_args()
        database_processor.classify_profile(args.job_id,
                                            args.database_to_include)


# Load job results to display on graphical interface
class Job_Result_Download(Resource):

    """
    Class to download result files
    """

    # @login_required
    def get(self):
        """Get files

        Get files obtained from the procedures.

        (DEPRECATED)

        Returns
        -------
        File with results
        """

        args = job_download_results_get_parser.parse_args()
        local_filename = 'app/results/'+''.join(
            random.choice(
                string.ascii_uppercase + string.digits) for _ in range(5))+\
                         '.txt'

        response = requests.get(JOBS_ROOT + 'results/download/',
                                params={
                                    'file_path': args.file_path
                                }, stream=True)

        with open(local_filename, 'wb') as f:
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:
                    f.write(chunk)

        return local_filename


# Load job results to display on graphical interface
class Job_Result_Download_click(Resource):

    def get(self):
        """Force file download

        Force a file download of a given path

        Returns
        -------

        """

        args = job_download_results_get_parser.parse_args()
        try:
            local_filename = '/'.join(args.file_path.split('/')[-2:])
            response = send_file(local_filename, as_attachment=True)
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Content-Type', 'application/force-download')
            return response
        except Exception as e:
            print e
            return 404


# Load job results to display on graphical interface
class Job_Report_Download_click(Resource):

    def get(self):
        """Force file download on click

        Force a file download of a given path

        Returns
        -------
        File of the reports
        """

        args = job_download_results_get_parser.parse_args()
        try:
            local_filename = args.file_path
            response = send_file(local_filename, as_attachment=True)
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Content-Type', 'application/force-download')
            return response
        except Exception as e:
            print e
            return 404


class NextflowLogs(Resource):
    """
    Class to get the nextflow logs
    """

    @login_required
    def get(self):
        """Get nextflow logs

        Searches for nextflow logs on a given set of directories based on the
        current user homedir

        Returns
        -------
        dict: Content of the file to be displayed in the UI.
        """

        args = nextflow_logs_get_parser.parse_args()

        til_storage = "/".join(current_user.homedir.split("/")[0:-3])
        content = ""

        project = db.session.query(Project).filter(
            Project.id == args.project_id).first()

        if not project:
            content = "file not found"
        else:
            user_of_project = db.session.query(User).filter(
                User.id == project.user_id).first()

            if not user_of_project:
                content = "file not found"
            else:
                username = user_of_project.username

                for x in USER_STORAGES:
                    file_location = os.path.join(
                        til_storage, x, username, "jobs",
                        args.project_id+"-"+args.pipeline_id, args.filename)

                    try:
                        with open(file_location, "r") as file_r:
                            content = file_r.read()
                        break
                    except IOError:
                        content = "file not found"

        return {"content": content}, 200
