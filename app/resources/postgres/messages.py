from app import db, mail
from app.models.models import Message, User
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with
from flask_security import current_user, login_required, roles_required
from sqlalchemy import desc
import datetime

config1 = {}
execfile("config.py", config1)

message_post_parser = reqparse.RequestParser()
message_post_parser.add_argument('recipients', dest='recipients', type=str,
                                 required=True, help="recipients")
message_post_parser.add_argument('template', dest='template', type=str,
                                 required=False, help="template")
message_post_parser.add_argument('information', dest='information', type=str,
                                 required=False, help="information")

message_post_parser.add_argument('body', dest='body', type=str,
                                 required=False, help="body")
message_post_parser.add_argument('title', dest='title', type=str,
                                 required=False, help="title")


messaging_get_parser = reqparse.RequestParser()
messaging_get_parser.add_argument('numberofmessages', dest='numberofmessages', type=str,
                                 required=True, help="numberofmessages")

messaging_post_parser = reqparse.RequestParser()
messaging_post_parser.add_argument('messageTo', dest='messageTo', type=str,
                                 required=True, help="from")
messaging_post_parser.add_argument('title', dest='title', type=str,
                                 required=True, help="title")
messaging_post_parser.add_argument('body', dest='body', type=str,
                                 required=True, help="body")

messaging_delete_parser = reqparse.RequestParser()
messaging_delete_parser.add_argument('messageid', dest='messageid', type=str,
                                 required=True, help="messageid")

messaging_put_parser = reqparse.RequestParser()
messaging_put_parser.add_argument('messageid', dest='messageid', type=str,
                                 required=True, help="messageid")
messaging_put_parser.add_argument('status', dest='status', type=str,
                                 required=True, help="status")


def getTemplates():
    """Templates for messages to be sent

    This function aggregates all possible templates for specific actions in
    the platform

    Parameters
    ----------
    msg: str
        message key to sent
    info: str
        Information to be added to the message

    Returns
    -------
    str: Content of the message
    """

    templates = {
        "Send Tree": ["Tree", "Hey! Check out this PHYLOViZ "
                              "Online "
                              "Tree: {add link here}"],
    }

    return templates


class MessageTemplatesResource(Resource):

    @login_required
    def get(self):
        return getTemplates()


class MessageResource(Resource):
    """
    Class for messaging resource
    """

    @login_required
    def post(self):
        """Add message to the user inbox

        This method adds a message to the user inbox
        Returns
        -------

        """
        args = messaging_post_parser.parse_args()

        if args.messageTo == "All":
            users = db.session.query(User).all()

            for user in users:
                message = Message(title=args.title, message=args.body,
                                  messageFrom=current_user.username,
                                  messageTo=user.username, status="unread",
                                  timestamp=datetime.datetime.utcnow())
        else:
            message = Message(title=args.title, message=args.body,
                              messageFrom=current_user.username,
                              messageTo=args.messageTo, status="unread",
                              timestamp=datetime.datetime.utcnow())

        if not message:
            abort(404, message="An error as occurried")
        db.session.add(message)
        db.session.commit()

        return 201, 201

    @login_required
    def get(self):
        """Gets up to x diferences

        This method gets the available messages with a number that the user
        wants

        Returns
        -------
        dict: messages

        """
        args = messaging_get_parser.parse_args()

        if not current_user.is_authenticated:
            abort(403, message="No permissions")

        messages = db.session.query(Message)\
            .filter(Message.messageTo == current_user.username)\
            .order_by(desc(Message.timestamp))\
            .limit(int(args.numberofmessages))

        if not messages:
            abort(404, message="No messages available")

        tosend = []

        for message in messages:

            tosend.append({
                "id": message.id,
                "title": message.title,
                "messageFrom": message.messageFrom,
                "status": message.status,
                "message": message.message,
                "timestamp": message.timestamp.strftime('%d %b %Y, %H')
            })

        unread = db.session.query(Message) \
            .filter(Message.status == "unread",
                    Message.messageTo == current_user.username)\
            .count()

        all_messages = db.session.query(Message) \
            .filter(Message.messageTo == current_user.username) \
            .count()

        return [tosend, unread, all_messages], 200

    @login_required
    def delete(self):
        """Delete a message

        This method deletes a message based on the message id.

        Returns
        -------
        dict: deleted message
        """
        args = messaging_delete_parser.parse_args()

        message = db.session.query(Message) \
            .filter(Message.id == args.messageid).first()

        db.session.delete(message)
        db.session.commit()

        return 204, 204

    @login_required
    def put(self):
        """Change message status

        This method changes the message status based on the message id.

        Returns
        -------
        int: request status
        """
        args = messaging_put_parser.parse_args()

        message = db.session.query(Message) \
            .filter(Message.id == args.messageid).first()

        message.status = args.status
        db.session.commit()

        return 200


class MailResource(Resource):
    """
    Class of the Mail resource
    """

    @login_required
    def post(self):
        """Sends messages to users

        This method sends emails to users based on the templates. Case there
        is info, it send the information.

        Returns
        -------
        bool: True case the message is sent
        """
        args = message_post_parser.parse_args()

        recipients = []

        try:

            r_temp = args.recipients.split(",")

            for x in r_temp:
                recipients.append(x.split(":")[1])

            if not args.body:
                msg = Message(msgTemplates(args.template, args.information)[0],
                              sender=config1["MAIL_USERNAME"],
                              recipients=recipients)
            else:
                msg = Message(args.title,
                              sender=config1["MAIL_USERNAME"],
                              recipients=recipients)
            msg.body = args.body
            mail.send(msg)

        except Exception as e:
            return False

        return True
