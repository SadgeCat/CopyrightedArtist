from flask import Flask, render_template, request, session, redirect, url_for, jsonify
from .build_db import *
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = "secret"

@app.route("/", methods=['GET', 'POST'])
def index():
    if 'username' in session:
        return redirect(url_for("home"))

    return redirect(url_for("login"))
    #return "<h1 style='color:blue'>CPArtist</h1>"

@app.route("/logout")
def logout():
    session.pop('username', None)
    return redirect(url_for("login"))

@app.route("/register", methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username').strip().lower()
        password = request.form.get('password').strip()


        if not username or not password:
            return render_template("register.html", error="No username or password inputted")

        acc = get_user(username)
        if acc:
            return render_template("register.html", error="Username already exists")

        hashed_password = generate_password_hash(password)
        insert_acc(username, hashed_password)

        session['username'] = username
        return redirect(url_for("home"))
    return render_template("register.html")

@app.route("/login", methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # store username and password as a variable
        username = request.form.get('username').strip().lower()
        password = request.form.get('password').strip()

        if not username or not password:
            return render_template('login.html', error="No username or password inputted")

        acc = get_user(username)

        if insert_acc is None:
            return render_template("login.html", error="Username or password is incorrect")
        
        if acc and check_password_hash(acc["password"], password):
            session["username"] = username
            return redirect(url_for("home"))
        else:
            return render_template("login.html", error="Username or password is incorrect")

    return render_template('login.html')

@app.route("/home", methods=['GET', 'POST'])
def home():

    return render_template('home.html',
                           username = session["username"])

@app.route("/error", methods=['GET', 'POST'])
def error():
    return render_template('error.html')

if __name__ == "__main__":
    app.debug = False
    app.run(host='0.0.0.0', port=5001)
