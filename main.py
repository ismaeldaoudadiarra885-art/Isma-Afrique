import logging
from flask import Flask, request, jsonify

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

@app.route('/welcome', methods=['GET'])
def welcome():
    """Returns a welcome message with request logging"""
    # Log request metadata
    logger.info(f"Request received: {request.method} {request.path}")
    
    return jsonify({
        'message': 'Welcome to the Flask API Service!'
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
