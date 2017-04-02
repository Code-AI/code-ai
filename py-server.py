from flask import Flask, request
import json

app = Flask(__name__)

@app.route('/codeforces_register',methods=['POST'])
def home():
    print(request.form)
    return 'fire'
@app.route('/',methods=['GET'])
def home_main():
    return 'dasfad'

app.run()
