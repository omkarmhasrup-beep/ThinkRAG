import sqlite3

def check_sqlite():
    print("Checking local SQLite databases for the email...")
    databases = ["rag.db", "rag_global.db", "database.db"]
    for db_name in databases:
        try:
            conn = sqlite3.connect(db_name)
            cursor = conn.cursor()
            cursor.execute("SELECT id, username, email FROM users WHERE email = 'omkarmhasrup492@gmail.com' OR email = 'omkarmhasrup@gmail.com'")
            results = cursor.fetchall()
            if results:
                print(f"Found in {db_name}: {results}")
            else:
                print(f"Not found in {db_name}")
            conn.close()
        except Exception as e:
            print(f"Error checking {db_name}: {e}")

if __name__ == "__main__":
    check_sqlite()
