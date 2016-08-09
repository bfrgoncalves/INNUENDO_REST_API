from app import app
from flask.ext.restful import Api

from resources.projects import ProjectUserResource, ProjectListUserResource, ProjectListUserSpecieResource
from resources.users import UserResource, UserListResource
from resources.pipelines import PipelineResource, PipelineListResource
from resources.workflows import WorkflowResource, WorkflowListResource
from resources.protocols import ProtocolResource, ProtocolListResource
from resources.processes import ProcessResource, ProcessListResource
from resources.strains import StrainResource, StrainListResource, StrainProjectListResource
from resources.species import SpecieListResource
from resources.uploads import FileUpload, GetFile

#Setup api
api = Api(app)

#Define routes

api.add_resource(UserListResource, '/api/v1.0/users/', endpoint = 'all_users')
api.add_resource(UserResource, '/api/v1.0/users/<int:id>', endpoint = 'single_user')

api.add_resource(ProjectListUserResource, '/api/v1.0/projects/', endpoint = 'user_projects')
api.add_resource(ProjectListUserSpecieResource, '/api/v1.0/projects/species/<int:id>', endpoint = 'user_specie_projects')
api.add_resource(ProjectUserResource, '/api/v1.0/projects/<int:id>', endpoint = 'user_single_project')

#api.add_resource(StudyListResource, '/api/v1.0/studies/', endpoint = 'all_studies')
#api.add_resource(StudyResource, '/api/v1.0/studies/<int:id>', endpoint = 'study')

api.add_resource(PipelineListResource, '/api/v1.0/projects/<int:id>/pipelines/', endpoint = 'pipelines')
api.add_resource(PipelineResource, '/api/v1.0/projects/<int:project_id>/pipelines/<int:pipeline_id>/', endpoint = 'pipeline')

api.add_resource(WorkflowListResource, '/api/v1.0/workflows/', endpoint = 'workflows')
api.add_resource(WorkflowResource, '/api/v1.0/workflows/<int:id>', endpoint = 'workflow')

api.add_resource(SpecieListResource, '/api/v1.0/species/', endpoint = 'species')

api.add_resource(ProtocolListResource, '/api/v1.0/protocols/', endpoint = 'protocols')
api.add_resource(ProtocolResource, '/api/v1.0/protocols/<int:id>', endpoint = 'protocol')

api.add_resource(StrainListResource, '/api/v1.0/strains/', endpoint = 'strains')
api.add_resource(StrainProjectListResource, '/api/v1.0/projects/<int:id>/strains/', endpoint = 'project_strains')
api.add_resource(StrainResource, '/api/v1.0/strains/<int:id>', endpoint = 'strain')

api.add_resource(ProcessListResource, '/api/v1.0/users/<int:user_id>/projects/<int:project_id>/pipelines/<int:pipeline_id>/processes/', endpoint = 'processes')
api.add_resource(ProcessResource, '/api/v1.0/users/<int:user_id>/projects/<int:project_id>/pipelines/<int:pipeline_id>/processes/<int:process_id>', endpoint = 'process')

api.add_resource(FileUpload, '/api/v1.0/uploads/', endpoint = 'uploads')
api.add_resource(GetFile, '/api/v1.0/uploads/<filename>', endpoint = 'get_file')