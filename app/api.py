from app import app
from flask.ext.restful import Api

from resources.studies import StudyResource, StudyListResource, StudyUserResource, StudyListUserResource
from resources.users import UserResource, UserListResource
#Setup api
api = Api(app)

#Define routes

api.add_resource(UserListResource, '/api/v1.0/users/', endpoint = 'all_users')
api.add_resource(UserResource, '/api/v1.0/users/<int:id>', endpoint = 'single_user')

api.add_resource(StudyListUserResource, '/api/v1.0/users/<int:id>/studies/', endpoint = 'user_studies')
api.add_resource(StudyUserResource, '/api/v1.0/users/<int:user_id>/studies/<int:id>', endpoint = 'user_single_study')

api.add_resource(StudyListResource, '/api/v1.0/studies/', endpoint = 'all_studies')
api.add_resource(StudyResource, '/api/v1.0/studies/<int:id>', endpoint = 'study')
