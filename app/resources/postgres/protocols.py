from app import db
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields

import json
from app.models.models import Protocol
from flask_security import current_user, login_required, roles_required
import datetime

# Defining post arguments parser
protocol_post_parser = reqparse.RequestParser()
protocol_post_parser.add_argument('name', dest='name', type=str, required=True,
                                  help="Workflow name")
protocol_post_parser.add_argument('steps', dest='steps', type=str,
                                  required=True, help="Protocol steps")

"""
STEPS -> Parameters which define the protocol
"""

# Defining get arguments parser
protocol_get_parser = reqparse.RequestParser()
protocol_get_parser.add_argument('type', dest='type', type=str, required=False,
                                 help="Protocol Type")

# Defining get arguments parser
protocol_get_ids_parser = reqparse.RequestParser()
protocol_get_ids_parser.add_argument('protocol_ids', dest='protocol_ids',
                                     type=str, required=False,
                                     help="Protocol IDs")

# Defining response fields

protocol_fields = {
    'id': fields.Integer,
    'name': fields.String,
    'timestamp': fields.DateTime,
    'steps': fields.String
}


class ProtocolResource(Resource):
    """
    Class to get specific protocols
    """

    @login_required
    @marshal_with(protocol_fields)
    def get(self, id):
        """Get protocol

        This method allows getting a specific protocol by identifier

        Parameters
        ----------
        id: protocol identifier

        Returns
        -------
        protocol object

        """

        if not current_user.is_authenticated:
            abort(403, message="No permissions")

        protocol = db.session.query(Protocol).filter(Protocol.id == id).first()

        if not protocol:
            abort(404, message="No protocol available")
        return protocol, 200


class ProtocolByIDResource(Resource):
    """
    Class to get list of protocols
    """

    @login_required
    @marshal_with(protocol_fields)
    def get(self):
        """Get protocols

        Get the list of protocols.
        Requires a comma separated list of identifiers

        Returns
        -------
        list: protocol list
        """

        args = protocol_get_ids_parser.parse_args()
        protocol_ids = args.protocol_ids.split(',')

        to_send = []

        for protocol_id in protocol_ids:
            protocol = db.session.query(Protocol)\
                .filter(Protocol.id == protocol_id).first()

            protocol.steps = protocol.steps.replace("'", '"')

            to_send.append(protocol)

        return to_send, 200


class ProtocolListResource(Resource):
    """
    Class to get protocols by type
    """

    @login_required
    @marshal_with(protocol_fields)
    def get(self):
        """Get protocols by type

        It returns the protocols of a given type

        Returns
        -------
        list: protocol list
        """

        args = protocol_get_parser.parse_args()

        if not current_user.is_authenticated:
            abort(403, message="No permissions")

        protocols = db.session.query(Protocol).all()

        if not protocols:
            abort(404, message="No protocols available")

        if args.type:
            filteredProtocols = []

            for i in protocols:
                protocol = json.loads(i.steps.replace("u'", "'")
                                      .replace("'", '"'))
                if protocol["protocol_type"] == args.type.replace('"', ''):
                    filteredProtocols.append(i)

            return filteredProtocols

        return protocols, 200

    @login_required
    @marshal_with(protocol_fields)
    def post(self):
        """Add protocol

        This method allows adding a new protocol to the database.
        Requires the protocol name and steps (parameters)

        Returns
        -------
        new protocol
        """

        args = protocol_post_parser.parse_args()
        if not current_user.is_authenticated:
            abort(403, message="No permissions to POST")

        jsonToLoad = json.loads('"' + args.steps.replace("{u'", "{'")
                                .replace(" u'", "'").replace(" u\"", "")
                                .replace("\"", "")+'"')

        protocol = Protocol(name=args.name, steps=jsonToLoad,
                            timestamp=datetime.datetime.utcnow())

        if not protocol:
            abort(404, message="An error as occurried")

        db.session.add(protocol)
        db.session.commit()

        return protocol, 201
