"""HTTP layer for Hassan's Python and MySQL research portal."""

import os
from pathlib import Path

import mysql.connector
from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory, url_for
from werkzeug.exceptions import HTTPException

import repository
from database import close_db, get_db
from validation import validate_opportunity

load_dotenv(Path(__file__).with_name(".env"))
app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = 128 * 1024
app.json.ensure_ascii = False
app.teardown_appcontext(close_db)
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"


def validated_body():
    if not request.is_json:
        return {}, {"body": "Set Content-Type to application/json."}
    return validate_opportunity(request.get_json(silent=True))


def not_found():
    return jsonify(message="Research opportunity not found."), 404


@app.get("/api/health")
def health():
    with get_db().cursor() as cursor:
        cursor.execute("SELECT 1")
        cursor.fetchone()
    return jsonify(status="ok", database="connected")


@app.get("/api/opportunities")
def list_opportunities():
    return jsonify(repository.get_all()), 200


@app.get("/api/opportunities/<int:opportunity_id>")
def get_opportunity(opportunity_id):
    record = repository.get_one(opportunity_id)
    return (jsonify(record), 200) if record else not_found()


@app.post("/api/opportunities")
def create_opportunity():
    data, errors = validated_body()
    if errors:
        return jsonify(message="Please correct the invalid fields.", errors=errors), 400
    record = repository.create(data)
    response = jsonify(record)
    response.status_code = 201
    response.headers["Location"] = url_for("get_opportunity", opportunity_id=record["id"])
    return response


@app.put("/api/opportunities/<int:opportunity_id>")
def update_opportunity(opportunity_id):
    if repository.get_one(opportunity_id) is None:
        return not_found()
    data, errors = validated_body()
    if errors:
        return jsonify(message="Please correct the invalid fields.", errors=errors), 400
    record = repository.update(opportunity_id, data)
    return (jsonify(record), 200) if record else not_found()


@app.delete("/api/opportunities/<int:opportunity_id>")
def delete_opportunity(opportunity_id):
    if not repository.delete(opportunity_id):
        return not_found()
    return jsonify(message="Research opportunity deleted.", id=opportunity_id), 200


@app.errorhandler(mysql.connector.Error)
def database_error(error):
    app.logger.error("MySQL operation failed (%s).", error.__class__.__name__)
    return jsonify(message="Database operation failed. Check MySQL and the backend configuration."), 500


@app.errorhandler(HTTPException)
def http_error(error):
    response = error.get_response()
    response.data = app.json.dumps({"message": error.description})
    response.content_type = "application/json"
    return response


@app.errorhandler(Exception)
def unexpected_error(error):
    app.logger.error("Request failed (%s).", error.__class__.__name__)
    return jsonify(message="An unexpected server error occurred."), 500


@app.get("/")
def index():
    if (FRONTEND_DIST / "index.html").is_file():
        return send_from_directory(FRONTEND_DIST, "index.html")
    return jsonify(message="API is running. Start React at http://127.0.0.1:5173."), 200


@app.get("/assets/<path:filename>")
def frontend_asset(filename):
    return send_from_directory(FRONTEND_DIST / "assets", filename)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "5000")), debug=False)
