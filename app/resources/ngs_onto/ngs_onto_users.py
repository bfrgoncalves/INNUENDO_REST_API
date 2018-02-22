from app import dbconAg,dedicateddbconAg
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with
from flask_security import current_user, login_required
from config import obo,localNSpace,dcterms
from franz.openrdf.vocabulary.rdf import RDF
from app.utils.queryParse2Json import parseAgraphStatementsRes

"""
############################################ NOT BEING USED ###################
"""

"""
Users are defined in the postgres resources
"""


class NGSOnto_UserListResource(Resource):

    @login_required
    def get(self):
        # Agraph
        userType = dbconAg.createURI(namespace=dcterms, localname="Agent")
        statements = dbconAg.getStatements(None, RDF.TYPE, userType)
        usersAg=parseAgraphStatementsRes(statements)
        statements.close()

        return usersAg

    @login_required
    def post(self):

        id=1
        UserURI = dbconAg.createURI(namespace=localNSpace, localname="users/"+str(id))
        userType = dbconAg.createURI(namespace=dcterms, localname="Agent")
        dedicateddbconAg.openSession()
        try:
            dedicateddbconAg.add(UserURI, RDF.TYPE, userType)
            dedicateddbconAg.commit()
            dedicateddbconAg.close()
            return 201
        except:
            dedicateddbconAg.rollback()
            dedicateddbconAg.close()
            return 404


class NGSOnto_UserResource(Resource):

    # @login_required
    # @marshal_with(user_fields)
    def get(self, id):
        # Agraph
        UserURI = dbconAg.createURI(namespace=localNSpace, localname="users/"+str(id))
        statements = dbconAg.getStatements(UserURI, None, None)
        usersAg=parseAgraphStatementsRes(statements)
        statements.close()

        return usersAg
