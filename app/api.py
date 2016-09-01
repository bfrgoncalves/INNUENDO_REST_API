from app import app
from flask.ext.restful import Api

from resources.postgres.projects import ProjectUserResource, ProjectListUserResource, ProjectListUserSpecieResource
from resources.postgres.users import UserResource, UserListResource
from resources.postgres.pipelines import PipelineResource, PipelineListResource
from resources.postgres.workflows import WorkflowResource, WorkflowListResource
from resources.postgres.protocols import ProtocolResource, ProtocolListResource
from resources.postgres.processes import ProcessResource, ProcessListResource
from resources.postgres.strains import StrainResource, StrainListResource, StrainProjectListResource
from resources.postgres.species import SpecieListResource
from resources.postgres.uploads import FileUpload, GetFile
from resources.ngs_onto.ngs_onto_users import NGSOnto_UserResource, NGSOnto_UserListResource
from resources.ngs_onto.ngs_onto_projects import NGSOnto_ProjectListResource, NGSOnto_ProjectUserResource, NGSOnto_ProjectListUserResource
from resources.ngs_onto.ngs_onto_protocols import NGSOnto_ProtocolList, NGSOnto_ProtocolPropertiesList, NGSOnto_ProtocolPropertiesFieldsList, NGSOnto_ProtocolResource
from resources.ngs_onto.ngs_onto_workflows import NGSOnto_WorkflowListPipelineResource, NGSOnto_ProtocolWorkflowResource
from resources.ngs_onto.ngs_onto_pipelines import NGSOnto_PipelineListProjectResource
from resources.ngs_onto.ngs_onto_strains import NGSOnto_StrainsListUserResource
from resources.ngs_onto.ngs_onto_processes import NGSOnto_ProcessListPipelineResource, NGSOnto_ProcessResource

#Setup API
api = Api(app)

################################ Define App routes #######################################################

api.add_resource(UserListResource, '/api/v1.0/users/', endpoint = 'all_users')
api.add_resource(UserResource, '/api/v1.0/users/<int:id>', endpoint = 'single_user')

api.add_resource(ProjectListUserResource, '/api/v1.0/projects/', endpoint = 'user_projects')
api.add_resource(ProjectListUserSpecieResource, '/api/v1.0/projects/species/<int:id>', endpoint = 'user_specie_projects')
api.add_resource(ProjectUserResource, '/api/v1.0/projects/<int:id>', endpoint = 'user_single_project')

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


################################# Defining NGSOnto routes ##############################################

api.add_resource(NGSOnto_ProjectListUserResource, '/api/v1.0/ngsonto/projects/', endpoint = 'NGSOnto_user_studies')
api.add_resource(NGSOnto_ProjectUserResource, '/api/v1.0/ngsonto/projects/<int:id>', endpoint = 'NGSOnto_user_single_study')

api.add_resource(NGSOnto_PipelineListProjectResource, '/api/v1.0/ngsonto/projects/<int:id>/pipelines/', endpoint = 'NGSOnto_pipelines_project')

api.add_resource(NGSOnto_ProtocolWorkflowResource, '/api/v1.0/ngsonto/workflows/protocols', endpoint = 'NGSOnto_workflows_protocols')
api.add_resource(NGSOnto_WorkflowListPipelineResource, '/api/v1.0/ngsonto/projects/<int:id>/pipelines/<int:id1>/workflows/', endpoint = 'NGSOnto_workflows')

api.add_resource(NGSOnto_ProtocolList, '/api/v1.0/ngsonto/protocols/types', endpoint = 'list_type_protocols')
api.add_resource(NGSOnto_ProtocolResource, '/api/v1.0/ngsonto/protocols/', endpoint = 'list_protocols')
api.add_resource(NGSOnto_ProtocolPropertiesList, '/api/v1.0/ngsonto/protocols/properties', endpoint = 'protocol_properties')
api.add_resource(NGSOnto_ProtocolPropertiesFieldsList, '/api/v1.0/ngsonto/protocols/properties/fields', endpoint = 'protocol_properties_fields')

api.add_resource(NGSOnto_ProcessListPipelineResource, '/api/v1.0/ngsonto/projects/<int:id>/pipelines/<int:id2>/processes/', endpoint = 'NGSOnto_processes')
api.add_resource(NGSOnto_ProcessResource, '/api/v1.0/ngsonto/projects/<int:id>/pipelines/<int:id2>/processes/<int:id3>', endpoint = 'NGSOnto_single_process')

api.add_resource(NGSOnto_StrainsListUserResource, '/api/v1.0/ngsonto/strains/', endpoint = 'NGSOnto_strains')


