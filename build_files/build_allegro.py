from config import AG_HOST, AG_PORT, AG_USER, AG_PASSWORD
from franz.openrdf.sail.allegrographserver import AllegroGraphServer
from franz.openrdf.repository.repository import Repository
from franz.openrdf.rio.rdfformat import RDFFormat
from franz.openrdf.rio.rdfxmlwriter import RDFXMLWriter
import sys

print "mode: " + sys.argv[1]
print "file path:" + sys.argv[2]

################ CONNECTING TO ALLEGROGRAPH ############################

print("Connecting to AllegroGraph server --",
      "host:'%s' port:%s" % (AG_HOST, AG_PORT))

server = AllegroGraphServer(AG_HOST, AG_PORT,
                            AG_USER, AG_PASSWORD)

################ SHOWING CATALOGS ######################################

print("Available catalogs:")
for cat_name in server.listCatalogs():
    if cat_name is None:
        print('  - <root catalog>')
    else:
        print('  - ' + str(cat_name))

################ SHOWING REPOSITORIES ##################################

catalog = server.openCatalog('')
print("Available repositories in catalog '%s':" % catalog.getName())
for repo_name in catalog.listRepositories():
    print('  - ' + repo_name)


################ CREATING REPOSITORY ###################################

mode = Repository.ACCESS
my_repository = catalog.getRepository('innuendo', mode)
my_repository.initialize()

conn = my_repository.getConnection()

if sys.argv[1] == "backup":
    outputFile2 = sys.argv[2]
    # outputFile2 = None
    if outputFile2 == "":
        print "Please specify a valid output file"
    else:
        rdfxmlfWriter = RDFXMLWriter(outputFile2)
        conn.export(rdfxmlfWriter, 'null')

################ FILLING REPOSITORY ####################################

if sys.argv[1] == "build":
    if conn.size() == 0:
        if len(sys.argv[2]) > 0:
            path1 = sys.argv[2]
            conn.addFile(path1, None, format=RDFFormat.RDFXML)

print('Database triples: {count}'.format(count=conn.size()))

################ ADDING NAMESPACES #####################################

print("Adding Namespaces...")
conn.setNamespace("obo", "http://purl.obolibrary.org/obo/")
conn.setNamespace("edam", "http://edamontology.org#")

print(conn.getNamespaces())

print("DONE!")
