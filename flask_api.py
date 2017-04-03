from flask import Flask, jsonify, redirect
import sqlalchemy
from db import init_db_engine
import json
from collections import OrderedDict


connect_str = "postgres://codeai:codeai@localhost:5432/codeai"
global engine
engine = init_db_engine(connect_str)

MY_API = '/api/1.0/'
app = Flask(__name__)

@app.route(MY_API + 'submission/<handle>/<type>/<verdict>')
def user_submission(handle, type, verdict):
    with engine.connect() as connection:
        results = connection.execute(sqlalchemy.text("""
            SELECT q.id,
                   u.handle,
                   verdict.name,
                   language.name as language,
                   luq.timestamp as timestamp,
                   luq.relative_time,
                   luq.participant_type
              FROM l_user_question luq
              JOIN "user" u
                ON u.id = luq.user_id
              JOIN question q
                ON q.id = luq.question_id
              JOIN verdict
                ON luq.verdict_id = verdict.id
              JOIN language
                ON language.id = luq.language
             WHERE u.handle = :handle
               AND luq.participant_type = :participant_type
               AND verdict.name = :verdict
        """), {
            "handle": handle,
            "participant_type": type,
            "verdict": verdict,
        })
        rows = results.fetchall()
        result = {"results": [(dict(row)) for row in rows]}
    return jsonify(result)


@app.route(MY_API + 'people_submission/<handles>/<type>/<verdict>')
def people_submissions(handles, type, verdict):

    exclude_handles = handles.split("%")
    if len(exclude_handles) > 1:
        exclude_handles = tuple((handles.split("%")[1], ))
    else:
        exclude_handles = tuple(('null',))
    print(exclude_handles)
    handles = tuple(handles.split(";"))
    verdicts = tuple(verdict.split(";"))
    types = tuple(type.split(";"))
    with engine.connect() as connection:
        results = connection.execute(sqlalchemy.text("""
            SELECT distinct luq.question_id,
                   q.name,
                   q.solved
              FROM l_user_question luq
              JOIN question q
                ON q.id = luq.question_id
              JOIN "user" u
                ON u.id = luq.user_id
              JOIN verdict
                ON verdict.id = luq.verdict_id
             WHERE u.handle in :handles
               AND u.handle not in :exclude_handles
               AND luq.participant_type in :participant_type
               AND verdict.name in :verdict
          ORDER BY q.solved DESC
        """), {
            "handles": handles,
            "participant_type": types,
            "verdict": verdicts,
            "exclude_handles": exclude_handles,
        })
        rows = results.fetchall()
        result = {"results": [(dict(row)) for row in rows]}
    return jsonify(result)


@app.route(MY_API + 'suggested_questions/<handle>/<type>/<verdict>')
def suggested_submissions(handle, type, verdict):
    # SELECT UPPER USERS:
    with engine.connect() as connection:
        result = connection.execute(sqlalchemy.text("""
            SELECT rating,
                   id
              FROM "user"
              WHERE "user".handle=:handle
        """), {
            "handle": handle,
        })
        row = dict(result.fetchone())
        results = connection.execute(sqlalchemy.text("""
            SELECT handle
              FROM "user"
             WHERE "user".rating > :rating
             OFFSET  :id - 101
             LIMIT 100
         """), row)
        rows = results.fetchall()
        rows = [dict(row) for row in rows]
        handles = []
        for row in rows:
            handles.extend(row.values())
        handles = ";".join(handles)
        handles = handles + "%{handle}".format(handle=handle)
    return redirect(MY_API + 'people_submission/{handles}/{type}/{verdict}'.format(handles=handles, type=type, verdict=verdict))


@app.route(MY_API + 'languages/<handle>')
def languages(handle):
    with engine.connect() as connection:
        result = connection.execute(sqlalchemy.text("""
            SELECT l.name
              FROM l_user_question luq
              JOIN language l
                ON l.id = luq.language
              JOIN "user" u
                ON u.id = luq.user_id
             WHERE u.handle = :handle
        """), {
            "handle": handle,
        })
        rows = result.fetchall()
        rows = [dict(row) for row in rows]
        result = {}
        result["results"] = rows
    return jsonify(result)

@app.route(MY_API + 'tags/<handle>/<verdict>')
def tags(handle, verdict):
    with engine.connect() as connection:
        result = connection.execute(sqlalchemy.text("""
            SELECT count(t.id),
                   t.name
              FROM l_user_question luq
              JOIN l_question_tag lqt
                ON lqt.question = luq.question_id
              JOIN tags t
                ON lqt.tag = t.id
              JOIN "user"
                ON "user".id = luq.user_id
              JOIN verdict
                ON luq.verdict_id = verdict.id
             WHERE "user".handle = :handle
               AND verdict.name = :verdict
          GROUP BY t.id
        """), {
            "handle": handle,
            "verdict": verdict,
        })
        rows = result.fetchall()
        rows = [dict(row) for row in rows]
        result = dict()
        result["result"] = rows
    return jsonify(result)

@app.route(MY_API + 'lang/<handle>')
def lang(handle):
    with engine.connect() as connection:
        result = connection.execute(sqlalchemy.text("""
            SELECT l.name,
                   count(l.id)
              FROM l_user_question luq
              JOIN language l
                ON l.id = luq.language
              JOIN "user" u
                ON u.id = luq.user_id
             WHERE u.handle = :handle
         GROUP BY l.id
        """), {
            "handle": handle,
        })
        rows = result.fetchall()
        rows = [dict(row) for row in rows]
        result = {}
        result["results"] = rows
    return jsonify(result)

@app.route(MY_API + 'weekday/<handle>/<verdict>')
def week(handle, verdict):
    with engine.connect() as connection:
        result = connection.execute(sqlalchemy.text("""
            SELECT timestamp,
                   count(luq.question_id) as count
              FROM l_user_question luq
              JOIN "user"
                ON "user".id = luq.user_id
              JOIN verdict
                ON verdict.id = luq.verdict_id
             WHERE verdict.name = :verdict
               AND "user".handle = :handle
          GROUP BY timestamp
        """), {
            "handle": handle,
            "verdict": verdict,
        })
        rows = result.fetchall()
        rows = [dict(row) for row in rows]
        results = OrderedDict()
        week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        for day in week:
            results[day] = 0
        for row in rows:
            day = row["timestamp"].weekday()
            day = week[day]
            results[day] += row["count"]
        w = list(results.values())
        results = {"count": w}
    return jsonify(results)

@app.route(MY_API + 'timeday/<handle>/<verdict>')
def timeday(handle, verdict):
    with engine.connect() as connection:
        result = connection.execute(sqlalchemy.text("""
            SELECT timestamp,
                   count(luq.question_id) as count
              FROM l_user_question luq
              JOIN "user"
                ON "user".id = luq.user_id
              JOIN verdict
                ON verdict.id = luq.verdict_id
             WHERE verdict.name = :verdict
               AND "user".handle = :handle
          GROUP BY timestamp
        """), {
            "handle": handle,
            "verdict": verdict,
        })
        rows = result.fetchall()
        rows = [dict(row) for row in rows]
        results = OrderedDict()
        results["Morning"] = 0
        results["Noon"] = 0
        results["Evening"] = 0
        results["Night"] = 0
        for row in rows:
            daytime = row["timestamp"].time()
            daytime = daytime.hour
            if(daytime > 0 and daytime < 11):
                daytime = "Morning"
            elif(daytime >= 12 and daytime <=16):
                daytime = "Noon"
            elif(daytime > 16 and daytime <= 20):
                daytime = "Evening"
            else:
                daytime = "Night"
            results[daytime] += row["count"]
        w = list(results.values())
        results = {"count": w}
    return jsonify(results)


if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
