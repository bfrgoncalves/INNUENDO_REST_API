#!flask/bin/python
from app import app

'''
Starting point of the application. 
Runs in multithread to prevent app from freezing and accepts requests from 
all IP adresses in order to get connections between different process 
controllers if required.
'''

app.run(threaded=True, host="0.0.0.0")
