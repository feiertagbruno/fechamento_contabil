from dotenv import load_dotenv

import os
from sqlalchemy import create_engine


def get_engine():
    load_dotenv()

    SERVER = os.environ.get("SERVER")
    DB = os.environ.get("DB")
    USER = os.environ.get("USER")
    PWD = os.environ.get("PWD")
    DRIVER = "ODBC Driver 18 for SQL Server"

    connection_string = (
        f"mssql+pyodbc://{USER}:{PWD}@{SERVER}/{DB}?driver={DRIVER}&TrustServerCertificate=yes"
    )

    engine = create_engine(connection_string)

    return engine
