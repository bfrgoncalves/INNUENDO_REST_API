from flask_restful import Resource, reqparse
from flask import send_file

from flask_security import login_required
import os

'''File resources:
    - Get template for strain batch submission'''


class TemplateResource(Resource):

    @login_required
    def get(self):

        templates_folder = 'static/file_templates'
        file_path = os.path.join(templates_folder, "template_strain_batch_submission.tab")
        try:
            response = send_file(file_path, as_attachment=True)
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Content-Type', 'application/force-download')
            return response
        except Exception as e:
            print e
            return 404
