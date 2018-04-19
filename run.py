#!flask/bin/python
from app import app
'''
Starting point of the application. Runs in multithread to prevent app from freezing
'''

#app.run(debug=True, threaded=True)
app.run(threaded=True, host="0.0.0.0")