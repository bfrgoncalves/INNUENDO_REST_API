from app import dbconAg
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with
from app.utils.queryParse2Json import parseAgraphStatementsRes
from flask_security import current_user, login_required, roles_required
from config import obo,localNSpace,protocolsTypes,processTypes,processMessages
from franz.openrdf.vocabulary.rdf import RDF

# Defining post arguments parser
project_post_parser = reqparse.RequestParser()
project_post_parser.add_argument('strain_id', dest='strain_id', type=str,
                                 required=True, help="The strain id")


class NGSOnto_StrainsListUserResource(Resource):
    """
    Class of the ngsonto strains resource
    """

    @login_required
    def get(self):
        """Get strains

        Get strains available o+in the NGSOnto database

        Returns
        -------
        list: list of the available strains
        """

        strainType = dbconAg.createURI(namespace=obo, localname="OBI_0000747")
        statements = dbconAg.getStatements(None, RDF.TYPE, strainType)
        strainsAg = parseAgraphStatementsRes(statements)
        statements.close()

        return strainsAg, 200

    @login_required
    def post(self):
        """Add new strain

        This method adds a new strain to the NGSOnto database.
        Requires the strain identifier

        Returns
        -------
        code: 201 if added successfully.
        """

        args = project_post_parser.parse_args()

        newstrainid = args.strain_id

        # Agraph
        strainURI = dbconAg.createURI(namespace=localNSpace+"strains/",
                                      localname=str(newstrainid))
        strainType = dbconAg.createURI(namespace=obo, localname="OBI_0000747")
        dbconAg.add(strainURI, RDF.TYPE, strainType)
        return 201
