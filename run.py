#!flask/bin/python

from app import app

'''
Starting point of the application. 
Runs in multi-thread to prevent app from freezing and accepts requests from 
all IP addresses in order to get connections between different process 
controllers if required.
'''

app.run(threaded=True, host="0.0.0.0")
