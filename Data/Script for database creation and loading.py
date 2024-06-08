import os
import pandas as pd
import sqlite3

# Get the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# List of CSV files (assuming they are in the same directory as this script)
csv_files = [
    'ACCIDENT.csv',
    'ACCIDENT_EVENT.csv',
    'ACCIDENT_LOCATION.csv',
    'ATMOSPHERIC_COND.csv',
    'NODE.csv',
    'PERSON.csv',
    'ROAD_SURFACE_COND.csv',
    'SUB_DCA.csv',
    'VEHICLE.csv'
]

# Connect to SQLite database
conn = sqlite3.connect(os.path.join(current_dir, 'RoadCrashesVic.sqlite'))

# Iterate through CSV files and load them into SQLite tables
for csv_file in csv_files:
    # Get the absolute path to the CSV file
    csv_path = os.path.join(current_dir, csv_file)

    # Load CSV data into a pandas DataFrame
    df = pd.read_csv(csv_path)

    # Extract table name from CSV file name (convert to lowercase)
    table_name = csv_file.replace('.csv', '').lower()

    # Write DataFrame to SQLite database
    df.to_sql(table_name, conn, if_exists='replace', index=False)

# Close the connection
conn.close()

# Print success message
print("Creation of RoadCrashesVic database and tables completed successfully.")
