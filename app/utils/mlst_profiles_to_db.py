from app import app, db
from app.models.models import Ecoli, Yersinia, Campylobacter, Salmonella, Core_Schemas
import datetime

def populate_db(name, classifier, allelic_profile):

	ecoli = Ecoli(name = name, classifier = classifier, allelic_profile = allelic_profile, timestamp = datetime.datetime.utcnow())
	db.session.add(ecoli)
	db.session.commit()

	return 201

allelic_profile = {'coli1':{'loci':'1'}}

populate_db("coli1", "ST3", allelic_profile)