from app import dbconAg,dedicateddbconAg
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with
from flask_security import login_required
from config import localNSpace,dcterms
from franz.openrdf.vocabulary.rdf import RDF
from app.utils.queryParse2Json import parseAgraphStatementsRes

"""
############################################ NOT BEING USED ###################
"""

"""
Users are defined in the postgres resources
"""


class NGSOnto_UserListResource(Resource):
    """
    Class of the resource to get NGSONto users
    """

    @login_required
    def get(self):
        """Get users

        This method allows getting a list of the available users from the
        NGSOnto database

        Returns
        -------
        list: list of the available users
        """

        # Agraph
        userType = dbconAg.createURI(namespace=dcterms, localname="Agent")
        statements = dbconAg.getStatements(None, RDF.TYPE, userType)
        usersAg=parseAgraphStatementsRes(statements)
        statements.close()

        return usersAg

    @login_required
    def post(self):
        """Add user

        This method adds a user the the NGSONoo database

        Returns
        -------
        code: 201 if successfully added.
        """

        id=1
        UserURI = dbconAg.createURI(namespace=localNSpace,
                                    localname="users/"+str(id))
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
    """
    Class of the resource to get a specific user
    """

    # @login_required
    # @marshal_with(user_fields)
    def get(self, id):
        """Get user

        This method allows getting a specific user available at the NGSOnto
        database.

        Parameters
        ----------
        id: str
            user identifier

        Returns
        -------

        """

        # Agraph
        UserURI = dbconAg.createURI(namespace=localNSpace,
                                    localname="users/"+str(id))
        statements = dbconAg.getStatements(UserURI, None, None)
        usersAg=parseAgraphStatementsRes(statements)
        statements.close()

        return usersAg
