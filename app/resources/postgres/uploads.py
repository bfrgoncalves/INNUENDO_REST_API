from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with
from flask_security import current_user, login_required, roles_required
import requests

config1 = {}
execfile("config.py", config1)

# Defining post arguments parser
downloads_get_parser = reqparse.RequestParser()
downloads_get_parser.add_argument('accession_numbers', dest='accession_numbers',
                                  type=str, required=True,
                                  help="ENA accession numbers")


class GetFilesResource(Resource):
    """
    Class to get files
    """

    @login_required
    def get(self):
        """Get files resource

        Resource to get files

        (DEPRECATED)

        Returns
        -------

        """
        request = requests.get(config1['FILES_ROOT'],
                               params={'username': current_user.username,
                                       'homedir': current_user.homedir})
        try:
            return request.json(), 200
        except Exception as e:
            print e
            return False, 200


class DownloadFilesResource(Resource):
    """
    Class to get files
    """

    @login_required
    def post(self):
        """Get files resource

        Resource to get files

        (DEPRECATED)

        Returns
        -------

        """

        args = downloads_get_parser.parse_args()
        request = requests.post(config1['DOWNLOADS_ROOT'],
                                data={'username': current_user.username,
                                      'accession_numbers':
                                          args.accession_numbers
                                      }
                                )

        return request.json(), 200

    @login_required
    def get(self):
        """Get files resource

        Resource to get files

        (DEPRECATED)

        Returns
        -------

        """

        args = downloads_get_parser.parse_args()
        request = requests.get(config1['DOWNLOADS_ROOT'],
                               data={'username':current_user.username,
                                     'accession_numbers':
                                         args.accession_numbers
                                     }
                               )

        return request.json(), 200
