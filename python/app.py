from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, db

# Initialize Firebase
cred = credentials.Certificate("service-account-key.json")  # Path to your Firebase service account key JSON file
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://maze-56ae0-default-rtdb.firebaseio.com/'  # Replace with your Firebase Realtime Database URL
})

# Flask App
app = Flask(__name__)

@app.route('/save_leaderboard', methods=['POST'])
def save_leaderboard():
    data = request.json
    username = data.get('username')
    time = data.get('time')
    algorithm = data.get('algorithm')

    # Add data to Firebase
    leaderboard_ref = db.reference('leaderboard')
    entries = leaderboard_ref.order_by_child('time').get()
    rank = len(entries) + 1 if entries else 1

    new_entry = {
        'rank': rank,
        'username': username,
        'time': time,
        'algorithm': algorithm
    }
    leaderboard_ref.push(new_entry)
    return jsonify({'message': 'Leaderboard entry saved!', 'entry': new_entry})

@app.route('/get_leaderboard', methods=['GET'])
def get_leaderboard():
    leaderboard_ref = db.reference('leaderboard')
    entries = leaderboard_ref.order_by_child('time').get()
    sorted_entries = sorted(entries.values(), key=lambda x: x['time'])
    return jsonify(sorted_entries[:10])

if __name__ == '__main__':
    app.run(debug=True)
