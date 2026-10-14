"""MySQL persistence separated from HTTP routes."""

from datetime import date, datetime

from database import get_db
from validation import FIELDS

SELECT_COLUMNS = "id, " + ", ".join(FIELDS) + ", created_at, updated_at"


def serialize(row):
    return {
        key: value.isoformat() if isinstance(value, (date, datetime)) else value
        for key, value in row.items()
    }


def get_all():
    with get_db().cursor(dictionary=True) as cursor:
        cursor.execute(f"SELECT {SELECT_COLUMNS} FROM opportunities ORDER BY id DESC")
        return [serialize(row) for row in cursor.fetchall()]


def get_one(opportunity_id, lock=False):
    with get_db().cursor(dictionary=True) as cursor:
        cursor.execute(
            f"SELECT {SELECT_COLUMNS} FROM opportunities WHERE id = %s"
            + (" FOR UPDATE" if lock else ""),
            (opportunity_id,),
        )
        row = cursor.fetchone()
    return serialize(row) if row else None


def create(data):
    connection = get_db()
    with connection.cursor() as cursor:
        cursor.execute(
            f"INSERT INTO opportunities ({', '.join(FIELDS)}) VALUES ({', '.join(['%s'] * len(FIELDS))})",
            tuple(data[field] for field in FIELDS),
        )
        opportunity_id = cursor.lastrowid
    connection.commit()
    return get_one(opportunity_id)


def update(opportunity_id, data):
    connection = get_db()
    if get_one(opportunity_id, lock=True) is None:
        connection.rollback()
        return None
    with connection.cursor() as cursor:
        cursor.execute(
            f"UPDATE opportunities SET {', '.join(field + ' = %s' for field in FIELDS)} WHERE id = %s",
            tuple(data[field] for field in FIELDS) + (opportunity_id,),
        )
    connection.commit()
    return get_one(opportunity_id)


def delete(opportunity_id):
    connection = get_db()
    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM opportunities WHERE id = %s", (opportunity_id,))
        deleted = cursor.rowcount
    connection.commit()
    return deleted > 0
