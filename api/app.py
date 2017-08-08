import os
from flask import Flask, jsonify, render_template
from flask_socketio import SocketIO

# app = Flask(__name__, static_url_path=os.path.join('../', 'static').replace('\\','/'))
app = Flask(__name__)
app.debug = True
socketio = SocketIO(app)

@app.route('/authenticated')
def index():
    return jsonify({})

@app.route('/', defaults={'path': ''})
@app.route('/<path>')
def catch_all(path):
    return render_template('index.html')

if __name__ == '__main__':
    socketio.run(app, None, None, debug=True)
