from app import db, mail
from flask_mail import Message
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with
from flask_security import current_user, login_required, roles_required


class MailResource(Resource):

    @login_required
    def get(self):
        msg = Message('Hello', sender='phylovizonline@gmail.com',
                      recipients=['brunofiliperg@gmail.com'])
        msg.body = "Test email submission"
        mail.send(msg)

        return "Sent"
