from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson.json_util import dumps
import time

app = Flask(__name__)

# Connect to MongoDB (Assuming you have MongoDB running locally or use a cloud service like MongoDB Atlas)
client = MongoClient('mongodb+srv://faithmndz:vjdenfaithg@maze.b91vf.mongodb.net/?retryWrites=true&w=majority&appName=Maze')  # Replace with your MongoDB URI
db = client['maze']  # Database name
username_collection = db['username-modal']  # Collection to store user data
leaderboard_collection = db['leaderboard']  # Collection for leaderboard data

# API endpoint to store the username
@app.route('/api/username', methods=['POST'])
def save_username():
    data = request.get_json()
    username = data.get('username')
    
    if not username:
        return jsonify({"error": "Username is required!"}), 400

    # Save username to the database
    user = {'username': username, 'created_at': time.time()}
    username_collection.insert_one(user)

    return jsonify({"message": "Username saved successfully!"}), 200

# API endpoint to handle leaderboard (for both fetching and saving data)
@app.route('/api/leaderboard', methods=['GET', 'POST'])
def leaderboard():
    if request.method == 'GET':
        # Fetch leaderboard data and return sorted leaderboard
        leaderboard = leaderboard_collection.find().sort([("time", 1)])  # Sort by time ascending
        return dumps(leaderboard)

    elif request.method == 'POST':
        # Save leaderboard data
        data = request.get_json()
        username = data.get('username')
        time_taken = data.get('time')
        algorithm = data.get('algorithm')

        if not all([username, time_taken, algorithm]):
            return jsonify({"error": "All fields (username, time, algorithm) are required!"}), 400

        leaderboard_entry = {
            'username': username,
            'time': time_taken,
            'algorithm': algorithm,
            'created_at': time.time()
        }
        leaderboard_collection.insert_one(leaderboard_entry)

        return jsonify({"message": "Leaderboard entry added!"}), 200

if __name__ == '__main__':
    app.run(debug=True)
