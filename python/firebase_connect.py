import firebase_admin
from firebase_admin import credentials, db


# Initialize Firebase
cred = credentials.Certificate("service-account-key.json")  # Path to your JSON key file
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://maze-56ae0-default-rtdb.firebaseio.com/'  # Replace with your database URL
})

# Reference the leaderboard node in the database
leaderboard_ref = db.reference('leaderboard')

def add_leaderboard_entry(rank, username, time, algorithm):
    # Reference the 'leaderboard' node in the database
    leaderboard_ref = db.reference('leaderboard')

    # Create a new entry
    entry = {
        'rank': rank,
        'username': username,
        'time': time,
        'algorithm': algorithm
    }

    # Push entry to Firebase
    leaderboard_ref.push(entry)
    print(f"Entry added: {entry}")

# Example usage
if __name__ == "__main__":
    add_leaderboard_entry(1, "Alice", 12.34, "BFS")


def fetch_leaderboard():
    # Reference the 'leaderboard' node
    leaderboard_ref = db.reference('leaderboard')

    # Get all entries
    entries = leaderboard_ref.order_by_child('time').get()

    # Sort and display the top 10
    sorted_entries = sorted(entries.values(), key=lambda x: x['time'])
    for idx, entry in enumerate(sorted_entries[:10], 1):
        print(f"Rank {idx}: {entry['username']} - {entry['time']}s ({entry['algorithm']})")
    return sorted_entries[:10]

# Example usage
if __name__ == "__main__":
    fetch_leaderboard()
