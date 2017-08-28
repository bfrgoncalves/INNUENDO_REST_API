from app import app, db
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask_security import current_user
from flask import jsonify

from app.models.models import Message
from flask_security import current_user, login_required, roles_required
import datetime