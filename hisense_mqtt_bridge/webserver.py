from flask import Flask
app = Flask(__name__)

@app.route('/')
def logs():
    try:
        with open('/app/log.txt') as f:
            return '<pre>' + f.read() + '</pre>'
    except:
        return 'log.txt not found.'

app.run(host='0.0.0.0', port=8099)