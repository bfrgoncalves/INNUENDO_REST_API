from app import db, mail
from flask_mail import Message
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with
from flask_security import current_user, login_required, roles_required

config1 = {}
execfile("config.py", config1)

message_post_parser = reqparse.RequestParser()
message_post_parser.add_argument('recipients', dest='recipients', type=str,
                                 required=True, help="recipients")
message_post_parser.add_argument('template', dest='template', type=str,
                                 required=True, help="template")
message_post_parser.add_argument('information', dest='information', type=str,
                                 required=False, help="information")


def msgTemplates(msg, info):

    templates = {
        "send_tree": "Hey! Check out this <a href='{}'>PHYLOViZ Online "
                     "Tree</a>".format(info),
        "test": "This is a test email. Test string {}".format(info)
    }

    return templates[msg]


class MailResource(Resource):

    @login_required
    def post(self):
        args = message_post_parser.parse_args()

        msg = Message(msgTemplates(args.template, args.information)[0],
                      sender=config1["MAIL_USERNAME"],recipients=args.recipients.split(","))
        msg.body = msgTemplates(args.template, args.information)[1]
        mail.send(msg)

        return "Sent"
