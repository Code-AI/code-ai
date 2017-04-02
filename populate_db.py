from db import init_db_engine
import sqlalchemy
import requests
from bs4 import BeautifulSoup
from collections import OrderedDict
from datetime import datetime
import threading
import time


http_proxy = "http://172.16.24.3:3128"
https_proxy = "https://172.16.24.3:3128"
ftp_proxy = "https://172.16.28.10:3128"

languages = ['GNU C++11', 'GNU C++14', 'Java 8', 'Java 7', 'GNU C++0x', 'GNU C++', 'PHP',
            'Mysterious Language', 'MS C++', 'Delphi', 'FPC', 'Secret_171', 'Tcl',
            'Python 2', 'PyPy 2', 'GNU C', 'Mono C#', 'Befunge', 'GNU C11', 'Picat', 'Java 6',
            'Roco', 'PyPy 3', 'Python 3', 'Ada', 'Ruby', 'Haskell', 'Factor',
            'FALSE', 'Cobol', 'Io', 'Go', 'Pike', 'Rust', 'Kotlin', 'J', 'JavaScript', 'Perl', 'Ocaml', 'Scala', 'D', 'MS C#',
            'GNU C++11 ZIP','Java8 ZIP', 'F#']

verdicts = ['OK', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'SKIPPED', 'IDLENESS_LIMIT_EXCEEDED',
            'COMPILATION_ERROR', 'RUNTIME_ERROR', 'CHALLENGED', 'MEMORY_LIMIT_EXCEEDED', 'PRESENTATION_ERROR',
            'FAILED', 'CRASHED', 'PARTIAL', 'REJECTED', 'TESTING']


proxyDict = {
    "http": http_proxy,
    "https": https_proxy,
    "ftp": ftp_proxy,
}

connect_str = "postgres://codeai:codeai@localhost:5431/codeai"
global engine
engine = init_db_engine(connect_str)
RANKLIST_URL = "http://codeforces.com/ratings/page/"
API_URL = "http://codeforces.com/api/"


def populate_users():
    for i in range(1, 171):
        user_list = []
        page = requests.get(RANKLIST_URL + str(i))
        page = BeautifulSoup(page.text)
        ranklist = page.find_all(class_="ratingsDatatable")
        users = ranklist[0].find_all('td')
        for i in range(1, 800, 4):
            username = users[i].text.split()[0]
            rating = int(users[i+2].text)
            user_list.append(str(tuple((username, rating))))
        user_list = ", ".join(user_list)
        query = """
            INSERT INTO "user"(handle, rating)
                 VALUES {}
        """.format(user_list)
        with engine.connect() as connection:
            connection.execute(sqlalchemy.text(query))


def populate_questions():
    questions_data = requests.get(API_URL + "problemset.problems?")
    questions_data = dict(questions_data.json())
    problems = questions_data["result"]["problems"]
    problem_stats = questions_data["result"]["problemStatistics"]
    # Problems is a list of dict of problems
    probs = []
    tags = []
    for i in range(len(problems)):
        print(i)
        problem = problems[i]
        problemstat = problem_stats[i]
        probs.append(str(tuple((str(problem["contestId"])+problem["index"], problem["name"].replace("'", ""), int(problemstat["solvedCount"])))))

        pr_tags = list(problem["tags"])
        prob_id = str(problem["contestId"]) + problem["index"]
        for tag in pr_tags:
            if tag not in tags:
                tags.append(tag)
        inserttag = []
        for tag in pr_tags:
            tagindex = tags.index(tag)
            inserttag.append(str(tuple((tagindex+1, prob_id))))
        inserttag = ", ".join(inserttag)
        if pr_tags:
            with engine.connect() as connection:
                connection.execute("""
                    INSERT INTO l_question_tag(tag, question)
                     VALUES {}
                """.format(inserttag))
    tags = ", ".join(["('" + tag + "')" for tag in tags])
    print("DONE WITH POPULATING TAGS")
    allproblems = ", ".join(probs)

    query = """
        INSERT INTO question(id, name, solved)
         VALUES {};
    """.format(allproblems)
    print(query)

    with engine.connect() as connection:
        connection.execute(sqlalchemy.text(query))
    print("HERE")

    query = """
        INSERT INTO tags(name) VALUES {};
    """.format(tags)
    print(query)
    with engine.connect() as connection:
        connection.execute(sqlalchemy.text(query))


def populate_user_questions(start, end):
    # This function must be called after the above two functions
    # Get a list of users
    with engine.connect() as connection:
        results = connection.execute(sqlalchemy.text("""
            SELECT id, handle
              FROM "user"
        """))
        rows = results.fetchall()
        rows = [dict(row) for row in rows]
    # Scrape page for a user
    extra_lang = []
    extra_verdict = []
    for user in rows[start:end]:
        db_submissions = []
        user_submissions = requests.get(API_URL + "user.status?handle={handle}".format(handle=user["handle"]), proxies=proxyDict)
        print(user_submissions.status_code)
        if user_submissions.status_code == 200:
            if user_submissions.json():
                user_submissions = dict(user_submissions.json())
        else:
            continue
        for submission in user_submissions["result"]:
            # list of dicts
            # Make a complete db_submission and append
            db_submission = OrderedDict()
            db_submission["user_id"] = user["id"]
            db_submission["timestamp"] = datetime.fromtimestamp(submission["creationTimeSeconds"]).strftime("%c")
            db_submission["question"] = str(submission["problem"]["contestId"]) + submission["problem"]["index"]
            db_submission["type"] = 'null'
            db_submission["points"] = -1
            if "type" in submission["problem"]:
                db_submission["type"] = submission["problem"]["type"]
            if "points" in submission["problem"]:
                db_submission["points"] = submission["problem"]["points"]
            # Tags of a problem are already with us
            db_submission["participantType"] = submission["author"]["participantType"]
            db_submission["relativeTimeSeconds"] = -1
            if db_submission["participantType"]:
                if db_submission["participantType"] == "CONTESTANT":
                    db_submission["relativeTimeSeconds"] = submission["relativeTimeSeconds"]
            db_submission["language_id"] = -1
            language = submission["programmingLanguage"]
            if language not in languages:
                languages.append(language)
                extra_lang.append(language)
            language_id = languages.index(language)
            db_submission["language_id"] = language_id + 1
            db_submission["verdict_id"] = -1
            if "verdict" in submission:
                verdict = submission["verdict"]
                if verdict not in verdicts:
                    verdicts.append(verdict)
                    extra_verdict.append(verdict)
                verdict_id = verdicts.index(verdict)
                db_submission["verdict_id"] = verdict_id + 1
            db_submission = str(tuple(db_submission.values()))

            # append into db_submissions
            db_submissions.append(db_submission)
        db_submissions = ", ".join(db_submissions)
        with engine.connect() as connection:
            connection.execute(sqlalchemy.text("""
                INSERT INTO l_user_question(user_id, timestamp, question_id, type, points, participant_type, relative_time, language, verdict_id) VALUES {}""".format(db_submissions)))
        print("DONE USER {}".format(user["id"]))
    # INsert languages and verdicts



# 9915 to 13000
# 13001 to 16000
# 16001 to 19000
# 19001 to 22000
# 22001 to 25000
# 25001 to 28000
# 28001 to 31000
# 31001 to 34000
# threads = []

# t = threading.Thread(target=populate_user_questions, args=(9915, 13000, 1))
# threads.append(t)
# t.start()
# t = threading.Thread(target=populate_user_questions, args=(13001, 16000, 2))
# threads.append(t)
# t.start()
# t = threading.Thread(target=populate_user_questions, args=(16001, 19000, 3))
# threads.append(t)
# t.start()
# t = threading.Thread(target=populate_user_questions, args=(19001, 22000, 4))
# threads.append(t)
# t.start()
# t = threading.Thread(target=populate_user_questions, args=(22001, 25000, 5))
# threads.append(t)
# t.start()
# t = threading.Thread(target=populate_user_questions, args=(25001, 28000, 6))
# threads.append(t)
# t.start()
# t = threading.Thread(target=populate_user_questions, args=(28001, 31000, 7))
# threads.append(t)
# t.start()
# t = threading.Thread(target=populate_user_questions, args=(31001, 34000, 8))
# threads.append(t)
# t.start()
populate_user_questions(13619, 35000)

def populate_languge_and_verdicts():

    languages = ['GNU C++11', 'GNU C++14', 'Java 8', 'Java 7', 'GNU C++0x', 'GNU C++', 'PHP',
                'Mysterious Language', 'MS C++', 'Delphi', 'FPC', 'Secret_171', 'Tcl',
                'Python 2', 'PyPy 2', 'GNU C', 'Mono C#', 'Befunge', 'GNU C11', 'Picat', 'Java 6',
                'Roco', 'PyPy 3', 'Python 3', 'Ada', 'Ruby', 'Haskell', 'Factor',
                'FALSE', 'Cobol', 'Io', 'Go', 'Pike', 'Rust', 'Kotlin', 'J', 'JavaScript', 'Perl', 'Ocaml', 'Scala', 'D', 'MS C#',
                'GNU C++11 ZIP','Java8 ZIP', 'F#']

    verdicts = ['OK', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'SKIPPED', 'IDLENESS_LIMIT_EXCEEDED',
                'COMPILATION_ERROR', 'RUNTIME_ERROR', 'CHALLENGED', 'MEMORY_LIMIT_EXCEEDED', 'PRESENTATION_ERROR',
                'FAILED', 'CRASHED', 'PARTIAL', 'REJECTED', 'TESTING']


    verdicts = ["('" + verdict + "')" for verdict in verdicts]
    verdicts = ", ".join(verdicts)
    languages = ["('" + language + "')" for language in languages]
    languages = ", ".join(languages)
    with engine.connect() as connection:
        connection.execute(sqlalchemy.text("""
            INSERT INTO language(name) VALUES {}""".format(languages)))
        connection.execute(sqlalchemy.text("""
            INSERT INTO verdict(name) VALUES {}""".format(verdicts)))
